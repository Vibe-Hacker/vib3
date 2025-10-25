#!/usr/bin/env python3
"""
VIB3 AI Developer - FULL POWER CODING ASSISTANT
Can do EVERYTHING - read, write, execute, search, build, test, debug!
"""

import os
import sys
import subprocess
import json
import glob
from pathlib import Path
from openai import OpenAI

# API Key
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    print("ERROR: OPENAI_API_KEY environment variable not set!")
    print("Run: setx OPENAI_API_KEY \"your-key-here\"")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)
PROJECT_PATH = r"C:\Users\VIBE\Desktop\VIB3\vib3_app"

# ==================== TOOL FUNCTIONS ====================

def execute_command(command, description=""):
    """Execute shell command"""
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
            "success": result.returncode == 0,
            "output": output[:2000],  # Limit output
            "exit_code": result.returncode
        }
    except Exception as e:
        return {"success": False, "output": str(e), "exit_code": -1}

def read_file(file_path):
    """Read file content"""
    try:
        full_path = os.path.join(PROJECT_PATH, file_path)
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"success": True, "content": content, "lines": len(content.split('\n'))}
    except Exception as e:
        return {"success": False, "error": str(e)}

def write_file(file_path, content):
    """Write file content"""
    try:
        full_path = os.path.join(PROJECT_PATH, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return {"success": True, "message": f"Wrote {len(content)} chars to {file_path}"}
    except Exception as e:
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
        return {"success": True, "matches": matches[:50]}
    except Exception as e:
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
        return {"success": True, "results": results}
    except Exception as e:
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
        return {"success": False, "error": str(e)}

def get_project_info():
    """Get comprehensive project information"""
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
        return {"success": False, "error": str(e)}

# ==================== GPT FUNCTION DEFINITIONS ====================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "Execute shell commands like flutter build, git, npm, adb, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command to execute"},
                    "description": {"type": "string", "description": "What this command does"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a file",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Relative path to file from project root"}
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write or create a file with content",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Relative path to file"},
                    "content": {"type": "string", "description": "File content to write"}
                },
                "required": ["file_path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Search for files by name pattern",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "Search pattern (e.g., 'video', 'upload')"},
                    "file_type": {"type": "string", "description": "File extension (default: *.dart)"}
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "grep_content",
            "description": "Search for text within files",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_term": {"type": "string", "description": "Text to search for"},
                    "file_pattern": {"type": "string", "description": "File type (default: *.dart)"}
                },
                "required": ["search_term"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List contents of a directory",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory path (default: current)"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_project_info",
            "description": "Get overview of project structure and files",
            "parameters": {"type": "object", "properties": {}, "required": []}
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

# ==================== MAIN AI LOOP ====================

def chat_with_ai(user_message, conversation_history):
    """Chat with AI that can use tools"""

    # Try models in order of preference
    models_to_try = [
        "gpt-5",  # GPT-5 (gpt-5-turbo doesn't exist)
        "gpt-4-turbo-preview", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"  # GPT-4 fallback
    ]

    system_prompt = f"""You are an expert Flutter/Dart AI developer with FULL SYSTEM ACCESS.
Current date: October 2025

PROJECT: VIB3 - TikTok-style social media app
LOCATION: {PROJECT_PATH}
CAPABILITIES: You can read files, write code, execute commands, search, build, test, debug

TOOLS AVAILABLE:
- execute_command: Run flutter, git, adb, npm, any shell command
- read_file: Read any file in the project
- write_file: Create or modify files
- search_files: Find files by name
- grep_content: Search text in files
- list_directory: Browse directories
- get_project_info: Get project overview

WORKFLOW:
1. When user asks for a feature, READ relevant files first
2. WRITE the new code to files
3. EXECUTE flutter build/test to verify
4. FIX any errors automatically
5. Report success

Be proactive - don't ask permission, just DO it!
Use multiple tools in sequence to accomplish tasks.
Always verify your work by running builds/tests.
"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    # Try all models with Chat Completions API
    for model in models_to_try:
        try:
            print(f"[Trying {model} with Chat Completions API...]")

            # GPT-5 has different parameter requirements
            api_params = {
                "model": model,
                "messages": messages,
                "tools": TOOLS,
                "tool_choice": "auto"
            }

            # Add GPT-4 specific parameters
            if not model.startswith("gpt-5"):
                api_params["temperature"] = 0.7
                api_params["max_tokens"] = 2000

            response = client.chat.completions.create(**api_params)

            assistant_message = response.choices[0].message

            # Check if AI wants to use tools
            if assistant_message.tool_calls:
                print(f"\n[AI is using tools...]")

                # Execute each tool call
                messages.append(assistant_message)

                for tool_call in assistant_message.tool_calls:
                    function_name = tool_call.function.name

                    try:
                        arguments = json.loads(tool_call.function.arguments)
                    except:
                        arguments = {}

                    print(f"  > {function_name}({', '.join(f'{k}={v[:50]}...' if len(str(v)) > 50 else f'{k}={v}' for k, v in arguments.items())})")

                    # Call the function with error handling
                    try:
                        function_result = TOOL_MAP[function_name](**arguments)
                    except Exception as e:
                        function_result = {"success": False, "error": f"Function call error: {str(e)}"}

                    # Add result to messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": json.dumps(function_result)
                    })

                # Get final response after tool execution
                final_params = {"model": model, "messages": messages}
                if not model.startswith("gpt-5"):
                    final_params["temperature"] = 0.7
                    final_params["max_tokens"] = 2000

                final_response = client.chat.completions.create(**final_params)

                return final_response.choices[0].message.content, model, messages

            return assistant_message.content, model, messages

        except Exception as e:
            print(f"  X {model} failed: {str(e)[:100]}")
            continue

    return "Error: Could not get response from any model", None, messages

def main():
    print("\n" + "=" * 80)
    print("     VIB3 AI DEVELOPER - FULL POWER CODING ASSISTANT")
    print("=" * 80)
    print("\nI can AUTOMATICALLY:")
    print("  * Read & write code         * Execute commands (build, test, git)")
    print("  * Search files & content    * Debug & fix errors")
    print("  * Add features              * Run builds & tests")
    print("\nJust tell me what you want - I'll DO it!")
    print("Commands: 'exit' to quit, 'clear' for fresh start")
    print("=" * 80 + "\n")

    conversation_history = []

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye!")
            break

        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nGoodbye! Happy coding!")
            break

        if user_input.lower() == 'clear':
            conversation_history = []
            print("\n[Conversation cleared]\n")
            continue

        if not user_input:
            continue

        print("\nAI Dev: ", end="", flush=True)

        response, model, updated_messages = chat_with_ai(user_input, conversation_history)

        if model:
            print(f"[Using {model}]\n")

        print(response)
        print("\n" + "-" * 80)

        # Update conversation history
        conversation_history = updated_messages[-10:]  # Keep last 10 messages

if __name__ == "__main__":
    main()
