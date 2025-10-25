#!/usr/bin/env python3
"""
VIB3 Interactive GPT Chat - Just type and talk!
"""

import os
import sys
from openai import OpenAI

# API Key
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

def ask_gpt(question, conversation_history):
    """Ask GPT a question with conversation history"""

    # Try different models
    models_to_try = [
        "gpt-5",  # gpt-5-turbo doesn't exist
        "o1-preview",
        "o1",
        "gpt-4-turbo-preview",
        "gpt-4-turbo",
        "gpt-4"
    ]

    # Build messages with history
    messages = [
        {
            "role": "system",
            "content": f"You are an expert Flutter/Dart developer helping with the VIB3 app. {get_project_context()}"
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
                max_tokens=2000
            )
            return response.choices[0].message.content, model

        except Exception as e:
            last_error = e
            continue

    return f"Error: {str(last_error)}", None

def main():
    print("\n" + "=" * 80)
    print("                    VIB3 INTERACTIVE CHAT")
    print("=" * 80)
    print("\nJust type your questions naturally - no commands needed!")
    print("Type 'exit' or 'quit' to end the conversation")
    print("Type 'clear' to start a fresh conversation")
    print("\n" + "=" * 80 + "\n")

    conversation_history = []
    current_model = None

    while True:
        # Get user input
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye!")
            break

        # Handle commands
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nGoodbye! Happy coding!")
            break

        if user_input.lower() == 'clear':
            conversation_history = []
            current_model = None
            print("\n[Conversation cleared - starting fresh]\n")
            continue

        if not user_input:
            continue

        # Get response from GPT
        print("\nGPT: ", end="", flush=True)
        response, model = ask_gpt(user_input, conversation_history)

        # Show model info on first message
        if current_model is None and model:
            print(f"[Using {model}]\n")
            current_model = model

        print(response)
        print("\n" + "-" * 80 + "\n")

        # Add to conversation history
        conversation_history.append({
            "role": "user",
            "content": user_input
        })
        conversation_history.append({
            "role": "assistant",
            "content": response
        })

        # Keep conversation history reasonable (last 10 exchanges)
        if len(conversation_history) > 20:
            conversation_history = conversation_history[-20:]

if __name__ == "__main__":
    main()
