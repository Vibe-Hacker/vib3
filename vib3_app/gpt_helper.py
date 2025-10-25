#!/usr/bin/env python3
"""
GPT-5 Command Line Helper for VIB3 Development
Usage: python gpt_helper.py "your question about the code"
"""

import os
import sys
from openai import OpenAI
from pathlib import Path

# Get API key from environment variable
API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    print("ERROR: OPENAI_API_KEY environment variable not set!")
    print("Run: setx OPENAI_API_KEY \"your-key-here\"")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)

def get_project_context():
    """Get context about the VIB3 project"""
    return """
    VIB3 Project Context:
    - Flutter/Dart TikTok-style social media app
    - Located at: C:\\Users\\VIBE\\Desktop\\VIB3\\vib3_app
    - Features: video recording, editing, uploading, feed display
    - Current issue being worked on: Front camera video mirroring
    - Backend: DigitalOcean server
    - Using: camera, video_player, provider, dio packages
    """

def ask_gpt5(question, include_context=True):
    """Ask GPT-5 a question about VIB3 development"""

    messages = []

    if include_context:
        messages.append({
            "role": "system",
            "content": f"You are an expert Flutter/Dart developer helping with the VIB3 app. {get_project_context()}"
        })

    messages.append({
        "role": "user",
        "content": question
    })

    # Try different models in order of preference
    models_to_try = [
        "gpt-5",  # gpt-5-turbo doesn't exist
        "o1-preview",
        "o1",
        "gpt-4-turbo-preview",
        "gpt-4-turbo",
        "gpt-4"
    ]

    last_error = None
    for model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            # If successful, print which model was used
            print(f"[Using model: {model}]\n")
            return response.choices[0].message.content

        except Exception as e:
            last_error = e
            # Try next model
            continue

    # If all models failed, return the last error
    return f"Error: {str(last_error)}\n\nTried models: {', '.join(models_to_try)}\nMake sure your API key has access to these models."

def main():
    if len(sys.argv) < 2:
        print("Usage: python gpt_helper.py 'your question'")
        print("\nExamples:")
        print('  python gpt_helper.py "How do I fix video mirroring in Flutter?"')
        print('  python gpt_helper.py "Show me Transform widget example for horizontal flip"')
        print('  python gpt_helper.py "Help me debug upload_service.dart"')
        sys.exit(1)

    question = ' '.join(sys.argv[1:])

    print(f"\nAsking GPT-5: {question}\n")
    print("=" * 80)

    answer = ask_gpt5(question)

    print(answer)
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
