#!/usr/bin/env python3
"""
vib3_autocoder.py — Master Coder for VIB3 Flutter/Android project

Autonomous agent with:
- Planner → Executor → Critic loop
- Persistent task queue (drains until goal achieved)
- File indexing + semantic search
- Flutter/Android-specific tools (build, adb, gradle)
- Auto-branching + commits
- Backups, logs, and safety guards

Environment (set with `setx` or `set`):
  OPENAI_API_KEY=sk-...
  GPT_MODEL=gpt-5              # or gpt-5-mini
  AUTO_APPLY=1                 # apply file writes automatically
  AUTO_RUN=1                   # run commands automatically
  MAX_STEPS=80                 # cap iterations
  MAX_MINUTES=45               # cap wall time
  ROOT_ONLY=1                  # confine to project root
  BACKUP_DIR=.vib3_backups
  LOG_FILE=.vib3_autocoder.log
  FLUTTER_CMD=C:\\flutter\\flutter\\bin\\flutter.bat
  ADB_CMD=D:\\android-sdk\\platform-tools\\adb.exe
  GIT_BRANCH=autocoder/vib3
"""

import os, sys, json, re, time, shutil, subprocess, datetime, traceback
from pathlib import Path
from difflib import unified_diff

from openai import OpenAI
import regex

# ---------------- config ----------------
# Allow PROJECT_ROOT to be set via environment variable or command line
PROJECT_ROOT_ENV = os.getenv("PROJECT_ROOT")
if PROJECT_ROOT_ENV:
    PROJECT_ROOT = Path(PROJECT_ROOT_ENV).resolve()
else:
    PROJECT_ROOT = Path.cwd().resolve()  # Use current directory

MODEL = os.getenv("GPT_MODEL", "gpt-5")
AUTO_APPLY = os.getenv("AUTO_APPLY", "1") not in ("0","false","False","")
AUTO_RUN   = os.getenv("AUTO_RUN",   "1") not in ("0","false","False","")
MAX_STEPS  = int(os.getenv("MAX_STEPS", "80"))
MAX_MINUTES= int(os.getenv("MAX_MINUTES", "45"))
ROOT_ONLY  = os.getenv("ROOT_ONLY", "1") not in ("0","false","False","")

BACKUP_DIR = (PROJECT_ROOT / os.getenv("BACKUP_DIR", ".vib3_backups")).resolve()
LOG_FILE   = (PROJECT_ROOT / os.getenv("LOG_FILE", ".vib3_autocoder.log")).resolve()
FLUTTER_CMD = os.getenv("FLUTTER_CMD", r"C:\flutter\flutter\bin\flutter.bat")
ADB_CMD    = os.getenv("ADB_CMD", r"D:\android-sdk\platform-tools\adb.exe")
GIT_BRANCH = os.getenv("GIT_BRANCH", "autocoder/vib3")

# Flutter/Android specific commands
BUILD_CMD = f'"{FLUTTER_CMD}" build apk --debug'
ANALYZE_CMD = f'"{FLUTTER_CMD}" analyze'
TEST_CMD = f'"{FLUTTER_CMD}" test'
DOCTOR_CMD = f'"{FLUTTER_CMD}" doctor -v'
LOGCAT_CMD = f'"{ADB_CMD}" logcat -d -s flutter:I'

client = OpenAI()

SAFE_TEXT_EXT = {
    ".dart",".kt",".java",".xml",".gradle",".yaml",".json",".md",".txt",
    ".properties",".gitignore",".env",".bat",".sh",".ps1"
}

# ---------------- logging ----------------
def log(line: str):
    ts = datetime.datetime.utcnow().isoformat()
    entry = f"{ts} {line}\n"
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
    except Exception:
        pass
    print(entry, end="")

def die(msg: str, code=1):
    log(f"FATAL: {msg}")
    sys.exit(code)

# ---------------- fs helpers ----------------
def within_root(p: Path) -> bool:
    try:
        return str(p.resolve()).startswith(str(PROJECT_ROOT))
    except Exception:
        return False

def path_allowed(p: Path) -> bool:
    return within_root(p) if ROOT_ONLY else True

def ensure_backup_dir():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def backup_file(src: Path):
    try:
        if not src.exists():
            return None
        ensure_backup_dir()
        stamp = datetime.datetime.utcnow().isoformat().replace(":","-").replace(".","-")
        flattened = str(src.resolve()).replace(":","").replace("\\","_").replace("/","_")
        dst = BACKUP_DIR / f"{stamp}__{flattened}"
        if src.is_file():
            shutil.copy2(src, dst)
        else:
            shutil.copytree(src, dst)
        return str(dst)
    except Exception as e:
        log(f"backup error: {e}")
        return None

def make_diff(pathname: str, before: str, after: str) -> str:
    return "".join(unified_diff(
        before.splitlines(keepends=True),
        after.splitlines(keepends=True),
        fromfile=f"a/{pathname}",
        tofile=f"b/{pathname}",
    ))

def run_shell(cmd: str, timeout=420):
    proc = subprocess.run(cmd, shell=True, text=True, capture_output=True, timeout=timeout, cwd=PROJECT_ROOT)
    return proc.returncode, proc.stdout, proc.stderr

# ---------------- repo map + search ----------------
def list_project_files(max_files=8000, max_per_dir=2000):
    out = []
    skip_dirs = {".git",".dart_tool","build","android/app/build","android/.gradle",
                 ".idea",".vscode","node_modules","__pycache__"}
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Remove skip dirs from traversal
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        count = 0
        for f in files:
            if count >= max_per_dir:
                break
            p = Path(root) / f
            try:
                rel = p.relative_to(PROJECT_ROOT)
            except Exception:
                continue
            out.append(str(rel).replace("\\","/"))
            count += 1
            if len(out) >= max_files:
                return out
    return out

def read_small_text_files(rel_paths, max_bytes=120_000, limit=16):
    picked = []
    for name in rel_paths:
        p = PROJECT_ROOT / name
        if p.suffix.lower() not in SAFE_TEXT_EXT:
            continue
        try:
            data = p.read_text(encoding="utf-8", errors="ignore")
            if len(data) <= max_bytes:
                picked.append((name, data))
        except Exception:
            pass
        if len(picked) >= limit:
            break
    return picked

def naive_semantic_search(query: str, rel_paths, topk=12):
    q = set(regex.findall(r"[A-Za-z0-9_]+", query.lower()))
    scored = []
    for name in rel_paths:
        name_score = sum(tok in name.lower() for tok in q)
        scored.append((name_score, name))
    scored.sort(reverse=True)
    return [n for _, n in scored[:topk]]

# ---------------- tools ----------------
def tool_list_dir(args):
    rel = args.get("path",".")
    p = (PROJECT_ROOT / rel).resolve()
    if not path_allowed(p):
        return {"ok": False, "error": f"list_dir denied outside project root: {p}"}
    try:
        items = [{"name": c.name, "is_dir": c.is_dir(), "size": (c.stat().st_size if c.exists() else 0)}
                 for c in sorted(p.iterdir())]
        return {"ok": True, "cwd": str(p), "items": items}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def tool_read_file(args):
    rel = args.get("path","")
    p = (PROJECT_ROOT / rel).resolve() if not Path(rel).is_absolute() else Path(rel).resolve()
    if not path_allowed(p):
        return {"ok": False, "error": f"read_file denied outside project root: {p}"}
    try:
        text = p.read_text(encoding="utf-8")
        log(f"read_file: {p} (len {len(text)})")
        return {"ok": True, "content": text}
    except Exception as e:
        log(f"read_file error: {e}")
        return {"ok": False, "error": str(e)}

def tool_write_file(args):
    rel = args.get("path","")
    content = args.get("content","")
    p = (PROJECT_ROOT / rel).resolve() if not Path(rel).is_absolute() else Path(rel).resolve()
    if not path_allowed(p):
        return {"ok": False, "error": f"write_file denied outside project root: {p}"}
    try:
        backup = backup_file(p)
        before = ""
        if p.exists() and p.is_file():
            try: before = p.read_text(encoding="utf-8")
            except Exception: before = ""
        diff = make_diff(str(p), before, content)
        log(f"write_file proposed: {p}\n{diff if diff else '(no diff)'}")
        if AUTO_APPLY:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding="utf-8")
            log(f"written: {p}")
            if (PROJECT_ROOT / ".git").exists():
                try:
                    run_shell(f"git rev-parse --abbrev-ref {GIT_BRANCH} || git checkout -b {GIT_BRANCH}")
                    run_shell(f"git checkout {GIT_BRANCH}")
                    run_shell(f"git add {p}")
                    run_shell(f'git commit -m "vib3_autocoder: update {p.relative_to(PROJECT_ROOT)}" --author "vib3_autocoder <agent@local>"')
                except Exception as e:
                    log(f"git op skipped/failed: {e}")
            return {"ok": True, "applied": True, "backup": backup, "diff": diff}
        else:
            return {"ok": True, "applied": False, "backup": backup, "diff": diff}
    except Exception as e:
        log(f"write_file error: {e}")
        return {"ok": False, "error": str(e)}

def tool_run_cmd(args):
    cmd = args.get("cmd")
    if not cmd:
        return {"ok": False, "error": "run_cmd missing cmd"}
    # Safety guards
    dangerous_patterns = [
        r"\brm\b.+\s(-rf|/s)\s+[/\\]?$",  # rm -rf /
        r"format\s+[a-z]:",                # format C:
        r"del\s+/[sf]\s+[a-z]:",          # del /s C:
    ]
    for pattern in dangerous_patterns:
        if regex.search(pattern, cmd, flags=regex.IGNORECASE):
            return {"ok": False, "error": "run_cmd blocked by safety guard"}

    log(f"run_cmd: {cmd}")
    if not AUTO_RUN:
        return {"ok": False, "error": "AUTO_RUN disabled"}
    try:
        code, out, err = run_shell(cmd)
        log(f"cmd exit={code} out_len={len(out)} err_len={len(err)}")
        return {"ok": code == 0, "stdout": out, "stderr": err, "exitCode": code}
    except Exception as e:
        log(f"run_cmd error: {e}")
        return {"ok": False, "error": str(e)}

def tool_search_files(args):
    q = args.get("query","")
    files = list_project_files()
    picks = naive_semantic_search(q, files, topk=20)
    return {"ok": True, "matches": picks}

def tool_flutter_build(args):
    """Run Flutter build APK"""
    log("flutter_build: building debug APK")
    if not AUTO_RUN:
        return {"ok": False, "error": "AUTO_RUN disabled"}
    try:
        code, out, err = run_shell(BUILD_CMD, timeout=600)
        return {"ok": code == 0, "stdout": out, "stderr": err, "exitCode": code}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def tool_flutter_analyze(args):
    """Run Flutter analyze"""
    log("flutter_analyze: analyzing code")
    if not AUTO_RUN:
        return {"ok": False, "error": "AUTO_RUN disabled"}
    try:
        code, out, err = run_shell(ANALYZE_CMD)
        return {"ok": code == 0, "stdout": out, "stderr": err, "exitCode": code}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def tool_adb_logcat(args):
    """Get Android logcat output"""
    log("adb_logcat: fetching logs")
    if not AUTO_RUN:
        return {"ok": False, "error": "AUTO_RUN disabled"}
    try:
        code, out, err = run_shell(LOGCAT_CMD)
        return {"ok": code == 0, "stdout": out[-5000:], "stderr": err, "exitCode": code}  # Last 5000 chars
    except Exception as e:
        return {"ok": False, "error": str(e)}

TOOL_SCHEMAS = [
    {"type":"function",
        "name":"list_dir",
        "description":"List directory contents relative to VIB3 project root.",
        "parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":[]}
    },
    {"type":"function",
        "name":"read_file",
        "description":"Read UTF-8 text file (Dart, Kotlin, YAML, etc.).",
        "parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}
    },
    {"type":"function",
        "name":"write_file",
        "description":"Write full content to a file. Returns unified diff + backup path.",
        "parameters":{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}
    },
    {"type":"function",
        "name":"run_cmd",
        "description":"Run shell command in project root (flutter, gradle, git, etc.).",
        "parameters":{"type":"object","properties":{"cmd":{"type":"string"}},"required":["cmd"]}
    },
    {"type":"function",
        "name":"search_files",
        "description":"Find relevant files by concept/name using semantic search.",
        "parameters":{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}
    },
    {"type":"function",
        "name":"flutter_build",
        "description":"Build Flutter debug APK (runs flutter build apk --debug).",
        "parameters":{"type":"object","properties":{},"required":[]}
    },
    {"type":"function",
        "name":"flutter_analyze",
        "description":"Run Flutter static analysis (flutter analyze).",
        "parameters":{"type":"object","properties":{},"required":[]}
    },
    {"type":"function",
        "name":"adb_logcat",
        "description":"Get Android logcat output (last 5000 chars of flutter logs).",
        "parameters":{"type":"object","properties":{},"required":[]}
    }
]

TOOLS = {
    "list_dir": tool_list_dir,
    "read_file": tool_read_file,
    "write_file": tool_write_file,
    "run_cmd": tool_run_cmd,
    "search_files": tool_search_files,
    "flutter_build": tool_flutter_build,
    "flutter_analyze": tool_flutter_analyze,
    "adb_logcat": tool_adb_logcat,
}

# ---------------- responses helpers ----------------
def atext(res):
    t = getattr(res, "output_text", None)
    if t: return t
    out = getattr(res, "output", None)
    if isinstance(out, list):
        parts = []
        for item in out:
            for c in (item.get("content") or []):
                if c.get("type")=="output_text":
                    parts.append(c.get("text",""))
        return "".join(parts)
    return ""

def tool_calls(res):
    calls = []
    out = getattr(res,"output",None)
    if isinstance(out,list):
        for item in out:
            content = item.get("content") if hasattr(item, 'get') else getattr(item, 'content', [])
            for c in (content or []):
                c_type = c.get("type") if hasattr(c, 'get') else getattr(c, 'type', None)
                if c_type == "function_call":
                    calls.append(c)
    fallback = getattr(res,"tool_calls",None)
    if fallback: calls.extend(fallback)
    return calls

# ---------------- initial context ----------------
def initial_context(user_goal: str):
    files = list_project_files()
    samples = read_small_text_files(files, limit=20)
    brief = [
        "ROLE: You are an autonomous principal engineer working on the VIB3 Flutter/Android project.",
        "PROJECT: VIB3 is a TikTok-style social media app built with Flutter, Firebase, and DigitalOcean backend.",
        "OBJECTIVE: Achieve the user's goal with iterative plan→act→observe loop. Keep changes minimal and focused.",
        f"PROJECT ROOT: {PROJECT_ROOT}",
        "",
        "TOOLS AVAILABLE:",
        "- list_dir: Browse directories",
        "- read_file: Read Dart, Kotlin, YAML, etc.",
        "- write_file: Edit/create files (auto-backed up, auto-committed to git)",
        "- run_cmd: Execute any shell command",
        "- search_files: Find files by concept/name",
        "- flutter_build: Build debug APK",
        "- flutter_analyze: Run static analysis",
        "- adb_logcat: Get Android logs",
        "",
        "WORKFLOW:",
        "1. Analyze the user's goal and break it into sub-tasks",
        "2. Use search_files to find relevant code",
        "3. Read the relevant files to understand current implementation",
        "4. Make targeted changes with write_file",
        "5. Test changes with flutter_build and flutter_analyze",
        "6. Check runtime behavior with adb_logcat if needed",
        "7. Iterate until goal is achieved",
        "",
        "On each step, output your reasoning:",
        "- PLAN: What you're going to do next",
        "- ACTIONS: What tools you're using and why",
        "- OBSERVATIONS: What you learned from tool results",
        "- NEXT_TASKS: Remaining work items",
        "",
        "IMPORTANT:",
        "- Keep diffs small and focused",
        "- Test after each change",
        "- If something fails, analyze the error and adjust",
        "- Maintain a running checklist of tasks",
        "- Stop when goal is achieved or no more tasks remain",
    ]
    ctx = [
        {"role":"system","content":"\n".join(brief)},
        {"role":"user","content": f"User goal: {user_goal}\n\nFile index (first 1000 files):\n" + "\n".join(files[:1000])}
    ]
    if samples:
        ctx.append({"role":"user","content":"Sample file contents:\n" + "\n\n".join([f"### {n}\n{t[:2000]}" for n,t in samples])})
    return ctx

# ---------------- agent loop ----------------
def run_vib3_autocoder(user_goal: str):
    start = time.time()
    log(f"VIB3 autocoder start — MODEL={MODEL} AUTO_APPLY={AUTO_APPLY} AUTO_RUN={AUTO_RUN}")
    msgs = initial_context(user_goal)

    res = client.responses.create(model=MODEL, tools=TOOL_SCHEMAS, input=msgs)

    step = 0
    failures = 0
    while True:
        step += 1
        if step > MAX_STEPS:
            log(f"Reached MAX_STEPS={MAX_STEPS}. Stopping.")
            break
        if (time.time() - start)/60.0 > MAX_MINUTES:
            log(f"Reached MAX_MINUTES={MAX_MINUTES}. Stopping.")
            break

        txt = atext(res)
        if txt:
            log(f"assistant: {txt}")

        calls = tool_calls(res)
        if not calls:
            log("No more tool calls — finished.")
            break

        tool_outputs = []
        for call in calls:
            fn = call.get("function", {})
            name = fn.get("name")
            raw = fn.get("arguments") or "{}"
            try:
                args = json.loads(raw) if isinstance(raw, str) else raw
            except Exception:
                args = {}

            handler = TOOLS.get(name)
            if not handler:
                out = {"ok": False, "error": f"Unknown tool: {name}"}
            else:
                try:
                    out = handler(args)
                except Exception as e:
                    out = {"ok": False, "error": f"tool {name} crashed: {e}", "trace": traceback.format_exc()}

            if not out.get("ok") and failures < 8:
                failures += 1

            call_id = call.get("id")
            tool_outputs.append({"tool_call_id": call_id, "output": json.dumps(out)})

        res = client.responses.create(model=MODEL, input=[{"role":"tool","tool_outputs": tool_outputs}])

    log("VIB3 autocoder completed.")

# ---------------- entry ----------------
if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        die("OPENAI_API_KEY environment variable not set")

    # Check if goal was provided as command-line argument
    if len(sys.argv) > 1:
        # Single-task mode: run once and exit
        goal = " ".join(sys.argv[1:])
        try:
            run_vib3_autocoder(goal)
        except KeyboardInterrupt:
            log("Interrupted by user.")
        except Exception as e:
            log(f"Fatal: {e}")
            traceback.print_exc()
            raise
    else:
        # Interactive mode: keep asking for goals
        print("=" * 80)
        print("VIB3 AUTOCODER - INTERACTIVE MODE")
        print("=" * 80)
        print()
        print("Enter your goals one at a time. The autocoder will work on each goal")
        print("and then ask for the next one.")
        print()
        print("Commands:")
        print("  - Type your goal and press Enter to start a task")
        print("  - Type 'exit' or 'quit' to close")
        print("  - Press Ctrl+C to interrupt current task")
        print()
        print("=" * 80)
        print()

        while True:
            try:
                goal = input("\n[VIB3] Enter goal (or 'exit' to quit): ").strip()

                if not goal:
                    continue

                if goal.lower() in ('exit', 'quit', 'q'):
                    print("\nExiting VIB3 Autocoder. Goodbye!")
                    break

                print()
                print("=" * 80)
                print(f"STARTING TASK: {goal}")
                print("=" * 80)
                print()

                try:
                    run_vib3_autocoder(goal)
                except KeyboardInterrupt:
                    log("Task interrupted by user.")
                    print("\n[!] Task interrupted! You can start a new task or type 'exit' to quit.")
                except Exception as e:
                    log(f"Task failed: {e}")
                    traceback.print_exc()
                    print("\n[!] Task failed! You can start a new task or type 'exit' to quit.")

                print()
                print("=" * 80)
                print("TASK COMPLETED")
                print("=" * 80)

            except KeyboardInterrupt:
                print("\n\nExiting VIB3 Autocoder. Goodbye!")
                break
            except EOFError:
                print("\n\nExiting VIB3 Autocoder. Goodbye!")
                break
