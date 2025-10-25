#!/usr/bin/env python3
"""Quick test of GPT-5 API"""
import os
from openai import OpenAI

API_KEY = os.getenv('OPENAI_API_KEY') or "your-openai-api-key-here"

client = OpenAI(api_key=API_KEY)

print("Testing GPT-5 Responses API...")
print(f"API Key: {API_KEY[:20]}...{API_KEY[-10:]}")

try:
    response = client.responses.create(
        model="gpt-5",
        input=[
            {"role": "user", "content": "Say hello in 5 words"}
        ]
    )
    print(f"\n[SUCCESS]")
    print(f"Response type: {type(response)}")
    print(f"Response attributes: {dir(response)}")

    # Try to get text
    text = getattr(response, "output_text", None)
    if text:
        print(f"\nText (output_text): {text}")

    output = getattr(response, "output", None)
    if output:
        print(f"\nOutput blocks: {output}")

except Exception as e:
    print(f"\n[FAILED]")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print(f"\nFull error:")
    import traceback
    traceback.print_exc()
