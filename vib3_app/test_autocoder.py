#!/usr/bin/env python3
"""Quick test to verify GPT-5 Responses API works"""

import os
from openai import OpenAI

# Set API key from environment or hardcode for test
api_key = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")

if not api_key or api_key == "":
    print("ERROR: OPENAI_API_KEY not set!")
    exit(1)

print(f"API Key: {api_key[:20]}...")
print("Creating OpenAI client...")

try:
    client = OpenAI(api_key=api_key)
    print("[OK] Client created successfully")

    print("\nTesting Responses API...")
    resp = client.responses.create(
        model="gpt-5",
        input=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'test successful' if you can read this"}
        ]
    )

    print("[OK] Responses API works!")
    print(f"Response: {resp.output_text if hasattr(resp, 'output_text') else resp}")

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
