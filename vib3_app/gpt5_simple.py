#!/usr/bin/env python3
"""
Simple GPT-5 Agent - Following GPT-5's own instructions
Much cleaner than our overcomplicated version!
"""
from openai import OpenAI
import os
import sys

# Get API key from environment
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def main():
    print("\n" + "=" * 80)
    print("     GPT-5 ASSISTANT FOR VIB3")
    print("=" * 80)
    print("\nAI MODEL: GPT-5 (Following GPT-5's own setup guide)")
    print("Project: C:\\Users\\VIBE\\Desktop\\VIB3\\vib3_app")
    print("\nType 'exit' to quit\n")
    print("=" * 80 + "\n")

    while True:
        try:
            task = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye!")
            break

        if task.lower() in ['exit', 'quit', 'bye']:
            print("\nGoodbye!")
            break

        if not task:
            continue

        # Call GPT-5 - THE SIMPLE WAY from GPT-5's own instructions!
        try:
            print("\nGPT-5: ", end="", flush=True)

            resp = client.responses.create(
                model="gpt-5",
                input=[
                    {
                        "role": "system",
                        "content": """You are GPT-5, a helpful AI assistant for the VIB3 project.

VIB3 is a TikTok-style social media Flutter app located at C:\\Users\\VIBE\\Desktop\\VIB3\\vib3_app.

You can help with:
- Explaining code and architecture
- Suggesting solutions to bugs
- Providing implementation ideas
- Answering questions about Flutter, Dart, Firebase, etc.

Current date: October 25, 2025
Your knowledge cutoff: October 2024"""
                    },
                    {"role": "user", "content": task}
                ]
            )

            # GPT-5's own instructions say: just use output_text!
            print(resp.output_text or "[No response]")

        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    main()
