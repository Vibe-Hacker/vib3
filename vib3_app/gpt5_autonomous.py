#!/usr/bin/env python3
"""
Autonomous VIB3 AI Developer - GPT-5 with Responses API
Based on the correct Responses API implementation
"""

import os
import sys
import subprocess
import json
import shutil
from pathlib import Path
from datetime import datetime
from openai import OpenAI

# Configuration
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    print("ERROR: OPENAI_API_KEY environment variable not set!")
    print("Run: setx OPENAI_API_KEY \"your-key-here\"")
    sys.exit(1)

PROJECT_PATH = r"C:\Users\VIBE\Desktop\VIB3\vib3_app"
BACKUP_DIR = os.path.join(PROJECT_PATH, ".gpt5_backups")
LOG_FILE = os.path.join(PROJECT_PATH, ".gpt5_agent.log")

client = OpenAI(api_key=API_KEY)

def log(message):
    """Log message to file and console"""
    timestamp = datetime.now().isoformat()
    log_line = f"[{timestamp}] {message}\n"

    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_line)
    except:
        pass

    print(message)

def backup_file(filepath):
    """Create backup of file before modifying"""
    try:
        if not os.path.exists(filepath):
            return None

        os.makedirs(BACKUP_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(filepath)
        backup_path = os.path.join(BACKUP_DIR, f"{timestamp}_{filename}")
        shutil.copy2(filepath, backup_path)
        log(f"Backup created: {backup_path}")
        return backup_path
    except Exception as e:
        log(f"Backup failed: {e}")
        return None

def tool_execute_command(args):
    """Execute shell command"""
    command = args.get("command")
    description = args.get("description", "")

    log(f"Executing: {command}")
    if description:
        log(f"Purpose: {description}")

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=PROJECT_PATH,
            capture_output=True,
            text=True,
            timeout=300
        )

        output = result.stdout + result.stderr
        log(f"Command completed with exit code {result.returncode}")

        return {
            "ok": result.returncode == 0,
            "output": output[:2000],
            "exit_code": result.returncode
        }
    except Exception as e:
        log(f"Command failed: {e}")
        return {"ok": False, "error": str(e)}

def tool_read_file(args):
    """Read file content"""
    file_path = args.get("file_path")
    try:
        full_path = os.path.join(PROJECT_PATH, file_path) if not os.path.isabs(file_path) else file_path
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        log(f"Read file: {file_path} ({len(content)} chars)")
        return {"ok": True, "content": content}
    except Exception as e:
        log(f"Read error: {file_path} - {e}")
        return {"ok": False, "error": str(e)}

def tool_write_file(args):
    """Write file content with automatic backup"""
    file_path = args.get("file_path")
    content = args.get("content")

    try:
        full_path = os.path.join(PROJECT_PATH, file_path) if not os.path.isabs(file_path) else file_path

        # Backup if exists
        if os.path.exists(full_path):
            backup_file(full_path)

        # Create directory if needed
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        # Write file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)

        log(f"Wrote file: {file_path} ({len(content)} chars)")
        return {"ok": True, "message": f"Wrote {len(content)} chars to {file_path}"}
    except Exception as e:
        log(f"Write error: {file_path} - {e}")
        return {"ok": False, "error": str(e)}

def tool_search_files(args):
    """Search for files matching pattern"""
    pattern = args.get("pattern")
    file_type = args.get("file_type", "*.dart")

    try:
        matches = []
        for root, dirs, files in os.walk(PROJECT_PATH):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'build']
            for file in files:
                if file.endswith(tuple(file_type.replace('*', '').split(','))):
                    rel_path = os.path.relpath(os.path.join(root, file), PROJECT_PATH)
                    if pattern.lower() in rel_path.lower():
                        matches.append(rel_path)
        log(f"Search '{pattern}': {len(matches)} matches")
        return {"ok": True, "matches": matches[:50]}
    except Exception as e:
        log(f"Search error: {e}")
        return {"ok": False, "error": str(e)}

def tool_grep_content(args):
    """Search for text within files"""
    search_term = args.get("search_term")
    file_pattern = args.get("file_pattern", "*.dart")

    try:
        results = []
        for root, dirs, files in os.walk(PROJECT_PATH):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'build']
            for file in files:
                if file.endswith(tuple(file_pattern.replace('*', '').split(','))):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            for i, line in enumerate(f, 1):
                                if search_term.lower() in line.lower():
                                    rel_path = os.path.relpath(file_path, PROJECT_PATH)
                                    results.append(f"{rel_path}:{i}: {line.strip()}")
                                    if len(results) >= 50:
                                        break
                    except:
                        pass
                if len(results) >= 50:
                    break
        log(f"Grep '{search_term}': {len(results)} matches")
        return {"ok": True, "results": results}
    except Exception as e:
        log(f"Grep error: {e}")
        return {"ok": False, "error": str(e)}

def tool_list_directory(args):
    """List directory contents"""
    path = args.get("path", ".")
    try:
        full_path = os.path.join(PROJECT_PATH, path)
        items = []
        for item in os.listdir(full_path):
            item_path = os.path.join(full_path, item)
            is_dir = os.path.isdir(item_path)
            items.append({"name": item, "type": "dir" if is_dir else "file"})
        return {"ok": True, "items": items}
    except Exception as e:
        log(f"List dir error: {e}")
        return {"ok": False, "error": str(e)}

def tool_get_project_info(args):
    """Get project overview"""
    try:
        info = {
            "dart_files": len(list(Path(PROJECT_PATH).rglob("*.dart"))),
            "yaml_files": len(list(Path(PROJECT_PATH).rglob("*.yaml"))),
            "key_dirs": [],
            "main_files": []
        }

        for item in os.listdir(PROJECT_PATH):
            if os.path.isdir(os.path.join(PROJECT_PATH, item)) and not item.startswith('.'):
                info["key_dirs"].append(item)

        for f in ['lib/main.dart', 'pubspec.yaml', 'android/build.gradle']:
            if os.path.exists(os.path.join(PROJECT_PATH, f)):
                info["main_files"].append(f)

        return {"ok": True, "info": info}
    except Exception as e:
        log(f"Project info error: {e}")
        return {"ok": False, "error": str(e)}

# Tool definitions for GPT-5 Responses API
TOOL_MAP = {
    "execute_command": tool_execute_command,
    "read_file": tool_read_file,
    "write_file": tool_write_file,
    "search_files": tool_search_files,
    "grep_content": tool_grep_content,
    "list_directory": tool_list_directory,
    "get_project_info": tool_get_project_info
}

# Tool schemas for Responses API (flatter structure)
TOOL_SCHEMAS = [
    {
        "type": "function",
        "name": "execute_command",
        "description": "Execute shell commands (flutter build, git, adb, etc.)",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command"},
                "description": {"type": "string", "description": "What this does"}
            },
            "required": ["command"]
        }
    },
    {
        "type": "function",
        "name": "read_file",
        "description": "Read file contents",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Relative or absolute path"}
            },
            "required": ["file_path"]
        }
    },
    {
        "type": "function",
        "name": "write_file",
        "description": "Write or create a file (auto-backed up)",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["file_path", "content"]
        }
    },
    {
        "type": "function",
        "name": "search_files",
        "description": "Find files by name pattern",
        "parameters": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "file_type": {"type": "string"}
            },
            "required": ["pattern"]
        }
    },
    {
        "type": "function",
        "name": "grep_content",
        "description": "Search text within files",
        "parameters": {
            "type": "object",
            "properties": {
                "search_term": {"type": "string"},
                "file_pattern": {"type": "string"}
            },
            "required": ["search_term"]
        }
    },
    {
        "type": "function",
        "name": "list_directory",
        "description": "List directory contents",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"}
            }
        }
    },
    {
        "type": "function",
        "name": "get_project_info",
        "description": "Get project overview",
        "parameters": {"type": "object", "properties": {}}
    }
]

# Tool schemas for Chat Completions API (nested structure)
TOOL_SCHEMAS_CHAT = [
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "Execute shell commands (flutter build, git, adb, etc.)",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command"},
                    "description": {"type": "string", "description": "What this does"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read file contents",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Relative or absolute path"}
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write or create a file (auto-backed up)",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["file_path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Find files by name pattern",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string"},
                    "file_type": {"type": "string"}
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "grep_content",
            "description": "Search text within files",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_term": {"type": "string"},
                    "file_pattern": {"type": "string"}
                },
                "required": ["search_term"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List directory contents",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_project_info",
            "description": "Get project overview",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

def main():
    print("\n" + "=" * 80)
    print("     AUTONOMOUS VIB3 AI DEVELOPER - GPT-5")
    print("=" * 80)
    print("\nAI MODEL: GPT-5 (gpt-5-2025-08-07)")
    print("  - Knowledge cutoff: October 2024")
    print("  - This is GPT-5, NOT GPT-4")
    print("  - Current date: October 25, 2025")
    print("\nMODE: AUTONOMOUS - Actions execute automatically")
    print(f"Project: {PROJECT_PATH}")
    print(f"Backups: {BACKUP_DIR}")
    print(f"Log: {LOG_FILE}")
    print("=" * 80 + "\n")

    if len(sys.argv) > 1:
        # Command line mode - single task
        task = " ".join(sys.argv[1:])
        run_single_task(task)
    else:
        # Interactive mode - loop for multiple tasks
        print("Type your task and press Enter (or 'exit' to quit)\n")

        while True:
            try:
                task = input("\nTask: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\nGoodbye!")
                break

            if task.lower() in ['exit', 'quit', 'bye']:
                print("\nGoodbye!")
                break

            if not task:
                continue

            run_single_task(task)
            print("\n" + "-" * 80)

def run_single_task(task):
    # Don't print the task - user already saw it in the input prompt
    # Just log to file without console output
    timestamp = datetime.now().isoformat()
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] Task: {task}\n")
    except:
        pass

    system_prompt = f"""You are GPT-5, an autonomous AI developer with FULL SYSTEM ACCESS to the VIB3 project.

IDENTITY:
- You are GPT-5 (released August 2025)
- Knowledge cutoff: October 2024
- Current date: October 25, 2025
- You have advanced reasoning and coding capabilities

PROJECT: VIB3 - TikTok-style social media app (Flutter + Firebase/DigitalOcean)
LOCATION: {PROJECT_PATH}

FULL SYSTEM ACCESS:
- Read/write ANY file in the project
- Execute ANY shell command (flutter build, git, adb, gradlew, etc.)
- Search and modify code automatically
- Build, test, and debug the app
- Install dependencies and manage packages

AUTONOMOUS MODE:
- Execute actions IMMEDIATELY without asking permission
- All tool calls are executed automatically
- Work proactively and efficiently
- Make decisions and implement solutions directly

TASK WORKFLOW:
1. Analyze the request thoroughly
2. Gather necessary information using tools (read files, search code, check status)
3. Make changes directly (write files, run commands)
4. Verify your work (run builds, check for errors)
5. Provide detailed summary of what you did

RESPONSE STYLE:
- Be detailed and thorough in explanations
- Clearly state what actions you're taking and why
- Show command outputs and results
- Explain technical decisions
- Provide helpful context and suggestions

Be decisive, thorough, and helpful. Take action confidently."""

    # Try GPT-5 (auto mode) first, fallback to GPT-4
    use_gpt5 = True
    try:
        log("Connecting to GPT-5...")
        response = client.responses.create(
            model="gpt-5",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": task}
            ],
            tools=TOOL_SCHEMAS
        )
        actual_model = getattr(response, 'model', 'unknown')
        log(f"Successfully connected to GPT-5! (model: {actual_model})")
    except Exception as e:
        log(f"GPT-5 not available: {str(e)[:500]}")
        log("Falling back to GPT-4 with Chat Completions API...")
        use_gpt5 = False

        # Use Chat Completions API for GPT-4
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": task}
        ]

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            tools=TOOL_SCHEMAS_CHAT,
            tool_choice="auto"
        )

    # Process response loop
    if use_gpt5:
        # GPT-5 Responses API loop
        while True:
            # Get assistant text - simplified approach based on successful test
            text = None

            # Method 1: Direct output_text attribute (works in simple cases)
            text = getattr(response, "output_text", None)
            if text:
                # Sometimes it's empty string, skip it
                text = text.strip() if text else None

            # Method 2: Check output blocks (works when tools are involved)
            if not text and hasattr(response, "output"):
                for block in response.output:
                    # Skip reasoning blocks
                    if hasattr(block, 'type') and block.type == 'reasoning':
                        continue

                    # Process message blocks
                    if hasattr(block, 'type') and block.type == 'message':
                        if hasattr(block, 'content') and block.content:
                            for item in block.content:
                                # Look for text content
                                if hasattr(item, 'type') and item.type == 'output_text':
                                    if hasattr(item, 'text') and item.text:
                                        text = item.text
                                        break
                    if text:
                        break

            # Display assistant response
            if text:
                print(f"\n{text}")
            else:
                # If still no text, show what we got for debugging
                print(f"\n[DEBUG] Could not extract text from response")
                print(f"[DEBUG] Has output_text: {hasattr(response, 'output_text')}")
                if hasattr(response, 'output'):
                    print(f"[DEBUG] Output blocks: {len(response.output)}")
                    for i, block in enumerate(response.output):
                        print(f"[DEBUG]   Block {i}: type={getattr(block, 'type', 'unknown')}")

            # Check for tool calls
            output_blocks = getattr(response, "output", None) or []
            tool_calls = []
            for block in output_blocks:
                # Handle both dict and object formats
                if hasattr(block, 'content'):
                    # Object format
                    content = block.content if block.content else []
                elif isinstance(block, dict) and block.get("content"):
                    # Dict format
                    content = block["content"]
                else:
                    content = []

                for item in content:
                    item_type = item.get("type") if isinstance(item, dict) else getattr(item, "type", None)
                    if item_type == "tool_call":
                        tool_calls.append(item)

            if not tool_calls:
                break

            # Execute tools
            log(f"AI is executing {len(tool_calls)} tool(s)...")
            tool_outputs = []

            for call in tool_calls:
                fn = call.get("function", {})
                name = fn.get("name")
                raw_args = fn.get("arguments") or "{}"

                try:
                    args = json.loads(raw_args)
                except:
                    args = {}

                handler = TOOL_MAP.get(name)
                if not handler:
                    out = {"ok": False, "error": f"Unknown tool: {name}"}
                else:
                    try:
                        out = handler(args)
                    except Exception as e:
                        out = {"ok": False, "error": f"Tool {name} crashed: {e}"}

                tool_outputs.append({
                    "tool_call_id": call.get("id"),
                    "output": json.dumps(out)
                })

            # Feed tool results back to GPT-5
            response = client.responses.create(
                model="gpt-5",
                input=[{"role": "tool", "tool_outputs": tool_outputs}]
            )
    else:
        # GPT-4 Chat Completions API loop
        while True:
            assistant_message = response.choices[0].message

            if assistant_message.content:
                print(f"\n{assistant_message.content}")  # Clean output to console

            # Check for tool calls
            if not assistant_message.tool_calls:
                break

            log(f"AI is executing {len(assistant_message.tool_calls)} tool(s)...")
            messages.append(assistant_message)

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name

                try:
                    arguments = json.loads(tool_call.function.arguments)
                except:
                    arguments = {}

                log(f"Tool: {function_name}({json.dumps(arguments, indent=2)})")

                # Execute tool
                handler = TOOL_MAP.get(function_name)
                if not handler:
                    function_result = {"ok": False, "error": f"Unknown tool: {function_name}"}
                else:
                    try:
                        function_result = handler(arguments)
                    except Exception as e:
                        function_result = {"ok": False, "error": f"Tool {function_name} crashed: {e}"}
                        log(f"Tool error: {e}")

                # Add result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": json.dumps(function_result)
                })

            # Get next response
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                tools=TOOL_SCHEMAS_CHAT,
                tool_choice="auto"
            )

    log("Agent run completed.")

if __name__ == "__main__":
    main()
