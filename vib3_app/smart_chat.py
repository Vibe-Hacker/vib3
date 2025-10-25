#!/usr/bin/env python3
"""
VIB3 Smart Interactive Chat - Can read and write code!
"""

import os
import sys
import glob
from openai import OpenAI

# API Key
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    print("ERROR: OPENAI_API_KEY environment variable not set!")
    print("Run: setx OPENAI_API_KEY \"your-key-here\"")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)

PROJECT_PATH = r"C:\Users\VIBE\Desktop\VIB3\vib3_app"

def get_project_structure():
    """Get basic project structure"""
    important_files = []

    # Get key directories
    for root, dirs, files in os.walk(PROJECT_PATH):
        # Skip build and hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'build']

        for file in files:
            if file.endswith(('.dart', '.yaml', '.gradle', '.kt')):
                rel_path = os.path.relpath(os.path.join(root, file), PROJECT_PATH)
                important_files.append(rel_path)

    return important_files[:50]  # Limit to first 50 files

def read_file(file_path):
    """Read a file from the project"""
    try:
        full_path = os.path.join(PROJECT_PATH, file_path)
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

def write_file(file_path, content):
    """Write content to a file"""
    try:
        full_path = os.path.join(PROJECT_PATH, file_path)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote to {file_path}"
    except Exception as e:
        return f"Error writing file: {str(e)}"

def get_project_context():
    """Get detailed context about the VIB3 project"""
    files = get_project_structure()

    return f"""
You are an expert Flutter/Dart developer helping with the VIB3 app.

PROJECT INFO:
- Type: Flutter/Dart TikTok-style social media app
- Location: {PROJECT_PATH}
- Features: video recording, editing, uploading, feed display, camera, mirroring
- Backend: DigitalOcean server
- Packages: camera, video_player, provider, dio

KEY FILES (first 50):
{chr(10).join(files)}

IMPORTANT:
- You can READ files by mentioning them
- You can WRITE/EDIT files when asked
- Suggest file changes using this format:

FILE: path/to/file.dart
```dart
[new code here]
```

- User will tell you naturally what they want (e.g., "add stories feature", "fix video bug")
- You should provide code and explain what you're doing
"""

def ask_gpt(question, conversation_history):
    """Ask GPT a question with file access"""

    models_to_try = [
        "gpt-5",  # gpt-5-turbo doesn't exist
        "o1-preview",
        "o1",
        "gpt-4-turbo-preview",
        "gpt-4-turbo",
        "gpt-4"
    ]

    # Build messages
    messages = [
        {
            "role": "system",
            "content": get_project_context()
        }
    ]
    messages.extend(conversation_history)
    messages.append({
        "role": "user",
        "content": question
    })

    last_error = None
    for model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=3000
            )
            return response.choices[0].message.content, model

        except Exception as e:
            last_error = e
            continue

    return f"Error: {str(last_error)}", None

def process_command(user_input):
    """Process special commands like reading files"""

    # Check if user wants to read a file
    if 'read' in user_input.lower() or 'show' in user_input.lower() or 'open' in user_input.lower():
        # Try to extract filename
        for word in user_input.split():
            if '.dart' in word or '.yaml' in word or '.gradle' in word:
                content = read_file(word)
                return f"Contents of {word}:\n\n{content}\n\n"

    return None

def main():
    print("\n" + "=" * 80)
    print("           VIB3 SMART CHAT - CAN READ & WRITE CODE!")
    print("=" * 80)
    print("\nTalk naturally! I can:")
    print("  - Read files: 'show me video_feed.dart'")
    print("  - Write code: 'add a stories feature'")
    print("  - Fix bugs: 'fix the mirroring issue'")
    print("  - Explain: 'how does the upload work'")
    print("\nCommands: 'exit' to quit, 'clear' to start fresh, 'files' to see project files")
    print("=" * 80 + "\n")

    conversation_history = []
    current_model = None

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye!")
            break

        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nGoodbye! Happy coding!")
            break

        if user_input.lower() == 'clear':
            conversation_history = []
            current_model = None
            print("\n[Conversation cleared]\n")
            continue

        if user_input.lower() == 'files':
            files = get_project_structure()
            print("\nProject Files (first 50):")
            for f in files:
                print(f"  - {f}")
            print()
            continue

        if not user_input:
            continue

        # Process special commands
        special_result = process_command(user_input)
        if special_result:
            print(special_result)
            continue

        # Get GPT response
        print("\nGPT: ", end="", flush=True)
        response, model = ask_gpt(user_input, conversation_history)

        if current_model is None and model:
            print(f"[Using {model}]\n")
            current_model = model

        print(response)

        # Check if response contains code to write
        if "FILE:" in response and "```" in response:
            print("\n[Code provided - would you like me to write this to the files? (yes/no)]")
            confirm = input("Write files? ").strip().lower()
            if confirm in ['yes', 'y']:
                # Parse and write files (basic implementation)
                print("[File writing - tell me which file to write]")

        print("\n" + "-" * 80 + "\n")

        # Save conversation
        conversation_history.append({
            "role": "user",
            "content": user_input
        })
        conversation_history.append({
            "role": "assistant",
            "content": response
        })

        # Keep history manageable
        if len(conversation_history) > 20:
            conversation_history = conversation_history[-20:]

if __name__ == "__main__":
    main()
