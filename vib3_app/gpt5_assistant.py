#!/usr/bin/env python3
"""
GPT-5 Assistant for VIB3 - Works like Claude Code
Conversational interface with full project access
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
LOG_FILE = os.path.join(PROJECT_PATH, ".gpt5_assistant.log")

client = OpenAI(api_key=API_KEY)

def log(message):
    """Log message to file only"""
    timestamp = datetime.now().isoformat()
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {message}\n")
    except:
        pass

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
        return backup_path
    except Exception as e:
        return None

def tool_execute_command(args):
    """Execute shell command"""
    command = args.get("command")
    log(f"Executing: {command}")

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
        return {
            "ok": result.returncode == 0,
            "output": output[:2000] if len(output) > 2000 else output,
            "exit_code": result.returncode
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

def tool_read_file(args):
    """Read file content"""
    file_path = args.get("file_path")
    try:
        full_path = os.path.join(PROJECT_PATH, file_path) if not os.path.isabs(file_path) else file_path
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        log(f"Read: {file_path}")
        return {"ok": True, "content": content}
    except Exception as e:
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

        log(f"Wrote: {file_path}")
        return {"ok": True, "message": f"Wrote {len(content)} chars to {file_path}"}
    except Exception as e:
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
        return {"ok": True, "matches": matches[:50]}
    except Exception as e:
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
        return {"ok": True, "results": results}
    except Exception as e:
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
        return {"ok": False, "error": str(e)}

# Tool map
TOOL_MAP = {
    "execute_command": tool_execute_command,
    "read_file": tool_read_file,
    "write_file": tool_write_file,
    "search_files": tool_search_files,
    "grep_content": tool_grep_content,
    "list_directory": tool_list_directory,
    "get_project_info": tool_get_project_info
}

# Tool schemas for GPT-5 Responses API
TOOL_SCHEMAS = [
    {
        "type": "function",
        "name": "execute_command",
        "description": "Execute shell commands (flutter build, git, adb, etc.)",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to run"},
                "description": {"type": "string", "description": "What this command does"}
            },
            "required": ["command"]
        }
    },
    {
        "type": "function",
        "name": "read_file",
        "description": "Read file contents from the project",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Relative or absolute file path"}
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
                "file_path": {"type": "string", "description": "File path"},
                "content": {"type": "string", "description": "File content"}
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
                "pattern": {"type": "string", "description": "Search pattern"},
                "file_type": {"type": "string", "description": "File extension filter (e.g., *.dart)"}
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
                "search_term": {"type": "string", "description": "Text to search for"},
                "file_pattern": {"type": "string", "description": "File pattern (e.g., *.dart)"}
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
                "path": {"type": "string", "description": "Directory path"}
            }
        }
    },
    {
        "type": "function",
        "name": "get_project_info",
        "description": "Get overview of project structure",
        "parameters": {"type": "object", "properties": {}}
    }
]

def main():
    print("\n" + "=" * 80)
    print("     GPT-5 ASSISTANT FOR VIB3")
    print("=" * 80)
    print("\nAI MODEL: GPT-5 (like Claude Code)")
    print(f"Project: {PROJECT_PATH}")
    print("\nI can read files, edit code, run commands, and help with your VIB3 app!")
    print("Type 'exit' to quit\n")
    print("=" * 80 + "\n")

    # Conversation history for context
    conversation = []

    system_prompt = f"""You are GPT-5, a helpful AI assistant for the VIB3 project, working like Claude Code.

PROJECT: VIB3 - TikTok-style social media Flutter app
LOCATION: {PROJECT_PATH}

YOUR CAPABILITIES:
You have tools to:
- Read files from the project
- Write/edit files (they're auto-backed up)
- Execute shell commands (flutter build, adb, git, etc.)
- Search for files and code
- List directories and explore the project

CONVERSATION STYLE (like Claude Code):
- Be friendly, conversational, and helpful
- Explain what you're doing and why
- When you use tools, tell the user what you're looking at
- Show relevant results and explain what you found
- Ask clarifying questions if needed
- Provide context and suggestions
- Be thorough but concise

IMPORTANT:
- Current date: October 25, 2025
- Your knowledge cutoff: October 2024
- You're GPT-5, released August 2025
- Be conversational, not robotic or task-focused
- Use tools to help answer questions about the project
- When asked to fix something, explain your approach first

Example interaction:
User: "Can you see my vib3 project?"
You: "Yes! I have access to your VIB3 project at {PROJECT_PATH}. Let me check what's in there."
[calls list_directory or get_project_info]
You: "I can see your Flutter app with [describe what you found]. What would you like help with?"

Be helpful, conversational, and use your tools to actually access and work with the project files!"""

    conversation.append({"role": "system", "content": system_prompt})

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye!")
            break

        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        conversation.append({"role": "user", "content": user_input})
        log(f"User: {user_input}")

        try:
            # Call GPT-5
            response = client.responses.create(
                model="gpt-5",
                input=conversation,
                tools=TOOL_SCHEMAS
            )

            # Process response in a loop (for tool calling)
            while True:
                # Extract text response
                text = None

                # Try output_text first
                text = getattr(response, "output_text", None)
                if text:
                    text = text.strip() if text else None

                # Try output blocks
                if not text and hasattr(response, "output"):
                    for block in response.output:
                        if hasattr(block, 'type') and block.type == 'reasoning':
                            continue
                        if hasattr(block, 'type') and block.type == 'message':
                            if hasattr(block, 'content') and block.content:
                                for item in block.content:
                                    if hasattr(item, 'type') and item.type == 'output_text':
                                        if hasattr(item, 'text') and item.text:
                                            text = item.text
                                            break
                        if text:
                            break

                # Display response
                if text:
                    print(f"\nGPT-5: {text}\n")
                    log(f"GPT-5: {text}")

                # Check for tool calls
                output_blocks = getattr(response, "output", None) or []
                tool_calls = []

                for block in output_blocks:
                    content = block.content if hasattr(block, 'content') and block.content else []
                    for item in content:
                        item_type = getattr(item, "type", None) if hasattr(item, "type") else None
                        if item_type == "function_call":
                            tool_calls.append(item)

                if not tool_calls:
                    # No more tool calls, done with this turn
                    break

                # Execute tools
                tool_outputs = []

                for call in tool_calls:
                    fn = call.function if hasattr(call, 'function') else {}
                    name = fn.name if hasattr(fn, 'name') else fn.get("name")
                    raw_args = fn.arguments if hasattr(fn, 'arguments') else fn.get("arguments", "{}")

                    try:
                        args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    except:
                        args = {}

                    handler = TOOL_MAP.get(name)
                    if not handler:
                        out = {"ok": False, "error": f"Unknown tool: {name}"}
                    else:
                        try:
                            out = handler(args)
                        except Exception as e:
                            out = {"ok": False, "error": f"Tool error: {e}"}

                    call_id = call.id if hasattr(call, 'id') else call.get("id")
                    tool_outputs.append({
                        "tool_call_id": call_id,
                        "output": json.dumps(out)
                    })

                # Send tool results back to GPT-5
                response = client.responses.create(
                    model="gpt-5",
                    input=[{"role": "tool", "tool_outputs": tool_outputs}]
                )

        except Exception as e:
            print(f"\nError: {e}\n")
            log(f"Error: {e}")

if __name__ == "__main__":
    main()
