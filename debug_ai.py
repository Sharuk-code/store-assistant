from ai_service import GoodVibeAI
import time

print("Initializing AI...")
ai = GoodVibeAI()

print("\n--- Test 1: Regex ---")
print(ai.process_query("sales today"))

print("\n--- Test 2: Cloud (via Ollama Client) ---")
try:
    print(ai.process_query("who is the best customer?"))
except Exception as e:
    print(f"CRASH: {e}")
