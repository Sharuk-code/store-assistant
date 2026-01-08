from ai_service import GoodVibeAI

print("Initializing AI...")
ai = GoodVibeAI()

queries = [
    "which product has low stock?",
    "low stock items",
    "what is low in stock"
]

print("\n--- Testing Regex Matcher ---")
for q in queries:
    print(f"Query: '{q}'")
    # Test internal regex matcher directly
    res = ai._regex_matcher(q.lower())
    print(f"Result: {res}")
