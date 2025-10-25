#!/usr/bin/env python3
"""Test what version GPT-5 reports"""
import os
from openai import OpenAI

API_KEY = os.getenv('OPENAI_API_KEY') or "your-openai-api-key-here"

client = OpenAI(api_key=API_KEY)

print("Testing GPT-5 version information...\n")

try:
    response = client.responses.create(
        model="gpt-5",
        input=[
            {"role": "system", "content": "Current date: October 25, 2025"},
            {"role": "user", "content": "What GPT version are you? What is your knowledge cutoff date? What is today's date?"}
        ]
    )

    text = getattr(response, "output_text", None)
    if text:
        print(f"GPT-5 Response:\n{text}\n")

    # Also show which model was actually used
    print(f"Model used: {response.model}")

except Exception as e:
    print(f"Error: {e}")
