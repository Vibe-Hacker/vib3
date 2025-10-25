#!/usr/bin/env python3
"""
Quick test of the AI Dev functionality
"""

import sys
from ai_dev import chat_with_ai

# Test with a simple query that should trigger a tool call
test_query = "list the main directories in the project"

print("Testing AI Dev with query:", test_query)
print("=" * 80)

response, model, messages = chat_with_ai(test_query, [])

print("\n" + "=" * 80)
print("RESULT:")
print(f"Model used: {model}")
print(f"Response: {response}")
print("=" * 80)

if model:
    print("\nSUCCESS: AI Dev is working!")
else:
    print("\nFAILED: Could not get response from AI")
    sys.exit(1)
