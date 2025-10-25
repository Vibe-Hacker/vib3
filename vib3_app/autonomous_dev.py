#!/usr/bin/env python3
"""
Autonomous VIB3 AI Developer - GPT-5 with Auto-Execute
Runs commands and modifies files automatically with minimal confirmation.
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
BACKUP_DIR = os.path.join(PROJECT_PATH, ".autonomous_backups")
LOG_FILE = os.path.join(PROJECT_PATH, ".autonomous_dev.log")

# Auto-execute settings
AUTO_EXECUTE = True  # Set to False to require confirmation
AUTO_WRITE = True    # Set to False to require confirmation for file writes

client = OpenAI(api_key=API_KEY)

def log(message):
    """Log message to file and console"""
    timestamp = datetime.now().isoformat()
    log_line = f"[{timestamp}] {message}\n"

    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_line)

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

def execute_command(command, description=""):
    """Execute shell command"""
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
            "success": result.returncode == 0,
            "output": output[:2000],
            "exit_code": result.returncode
        }
    except Exception as e:
        log(f"Command failed: {e}")
        return {"success": False, "output": str(e), "exit_code": -1}

def read_file(file_path):
    """Read file content"""
    try:
        full_path = os.path.join(PROJECT_PATH, file_path) if not os.path.isabs(file_path) else file_path
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        log(f"Read file: {file_path} ({len(content)} chars)")
        return {"success": True, "content": content, "lines": len(content.split('\n'))}
    except Exception as e:
        log(f"Read error: {file_path} - {e}")
        return {"success": False, "error": str(e)}

def write_file(file_path, content):
    """Write file content with automatic backup"""
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
        return {"success": True, "message": f"Wrote {len(content)} chars to {file_path}"}
    except Exception as e:
        log(f"Write error: {file_path} - {e}")
        return {"success": False, "error": str(e)}

def search_files(pattern, file_type="*.dart"):
    """Search for files matching pattern"""
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
        return {"success": True, "matches": matches[:50]}
    except Exception as e:
        log(f"Search error: {e}")
        return {"success": False, "error": str(e)}

def grep_content(search_term, file_pattern="*.dart"):
    """Search for text within files"""
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
        return {"success": True, "results": results}
    except Exception as e:
        log(f"Grep error: {e}")
        return {"success": False, "error": str(e)}

def list_directory(path="."):
    """List directory contents"""
    try:
        full_path = os.path.join(PROJECT_PATH, path)
        items = []
        for item in os.listdir(full_path):
            item_path = os.path.join(full_path, item)
            is_dir = os.path.isdir(item_path)
            items.append({"name": item, "type": "dir" if is_dir else "file"})
        return {"success": True, "items": items}
    except Exception as e:
        log(f"List dir error: {e}")
        return {"success": False, "error": str(e)}

def get_project_info():
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

        return {"success": True, "info": info}
    except Exception as e:
        log(f"Project info error: {e}")
        return {"success": False, "error": str(e)}

# Tool definitions
TOOLS = [
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

TOOL_MAP = {
    "execute_command": execute_command,
    "read_file": read_file,
    "write_file": write_file,
    "search_files": search_files,
    "grep_content": grep_content,
    "list_directory": list_directory,
    "get_project_info": get_project_info
}

def chat_with_ai(user_message):
    """Autonomous AI chat with tool execution"""

    system_prompt = f"""You are an autonomous AI developer with FULL SYSTEM ACCESS.
Current date: October 2025

PROJECT: VIB3 - TikTok-style social media app
LOCATION: {PROJECT_PATH}

CAPABILITIES:
- Read/write any file in the project
- Execute any shell command (flutter, git, adb, etc.)
- Search and modify code automatically
- Build, test, and debug

MODE: AUTONOMOUS - You should execute actions immediately without asking permission.
Your tool calls will be executed automatically. Work efficiently and proactively.

WORKFLOW:
1. Understand the task
2. Use tools to gather info if needed
3. Make changes directly
4. Verify your work
5. Report completion

Be decisive and take action.
"""

    # Try GPT-5, fallback to GPT-4
    models_to_try = ["gpt-5", "gpt-4-turbo-preview", "gpt-4-turbo", "gpt-4"]

    for model in models_to_try:
        try:
            log(f"Using model: {model}")

            # GPT-5 uses Responses API, GPT-4 uses Chat Completions API
            if model == "gpt-5":
                # Responses API for GPT-5
                response = client.responses.create(
                    model=model,
                    input=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    tools=TOOLS
                )

                # Check for tool calls in response
                output_blocks = getattr(response, "output", None) or []
                tool_calls = []
                for block in output_blocks:
                    if isinstance(block, dict) and block.get("content"):
                        for item in block["content"]:
                            if item.get("type") == "tool_call":
                                tool_calls.append(item)
            else:
                # Chat Completions API for GPT-4
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    tools=TOOLS,
                    tool_choice="auto",
                    temperature=0.7,
                    max_tokens=3000
                )
                assistant_message = response.choices[0].message
                tool_calls = assistant_message.tool_calls if hasattr(assistant_message, 'tool_calls') else None

            # Process tool calls
            if assistant_message.tool_calls:
                log("AI is executing tools...")
                messages.append(assistant_message)

                for tool_call in assistant_message.tool_calls:
                    function_name = tool_call.function.name

                    try:
                        arguments = json.loads(tool_call.function.arguments)
                    except:
                        arguments = {}

                    log(f"Tool: {function_name}({json.dumps(arguments, indent=2)})")

                    # Execute tool
                    try:
                        function_result = TOOL_MAP[function_name](**arguments)
                    except Exception as e:
                        function_result = {"success": False, "error": str(e)}
                        log(f"Tool error: {e}")

                    # Add result to messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": json.dumps(function_result)
                    })

                # Get final response
                final_params = {"model": model, "messages": messages}
                if not model.startswith("gpt-5"):
                    final_params["temperature"] = 0.7
                    final_params["max_tokens"] = 3000

                final_response = client.chat.completions.create(**final_params)
                return final_response.choices[0].message.content, model

            return assistant_message.content, model

        except Exception as e:
            log(f"Model {model} failed: {str(e)[:200]}")
            continue

    return "Error: Could not get response from any model", None

def main():
    print("\n" + "=" * 80)
    print("     AUTONOMOUS VIB3 AI DEVELOPER - GPT-5")
    print("=" * 80)
    print("\nMODE: AUTONOMOUS - Actions execute automatically")
    print(f"Project: {PROJECT_PATH}")
    print(f"Backups: {BACKUP_DIR}")
    print(f"Log: {LOG_FILE}")
    print("=" * 80 + "\n")

    if len(sys.argv) > 1:
        # Command line mode
        task = " ".join(sys.argv[1:])
        log(f"Task: {task}")
        response, model = chat_with_ai(task)
        if model:
            log(f"Model: {model}")
        print(f"\n{response}\n")
    else:
        # Interactive mode
        print("Type your task and press Enter (or 'exit' to quit)\n")

        while True:
            try:
                user_input = input("\nTask: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\nGoodbye!")
                break

            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("\nGoodbye!")
                break

            if not user_input:
                continue

            log(f"Task: {user_input}")
            print("\nExecuting...")

            response, model = chat_with_ai(user_input)

            if model:
                print(f"\n[Model: {model}]")

            print(f"\n{response}")
            print("\n" + "-" * 80)

if __name__ == "__main__":
    main()
