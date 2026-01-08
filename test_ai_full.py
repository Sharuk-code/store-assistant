import requests
import json

BASE_URL = "http://localhost:8000/api/ai/chat"

def test_query(question):
    print(f"\n--- Testing: {question} ---")
    try:
        payload = {"message": question, "history": []}
        response = requests.post(BASE_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        print(f"Response: {data.get('response', 'No response field')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test 1: Purchase Query (Requires New Schema)
    test_query("How much did we spend on purchases?")

    # Test 2: Tech Query (Regression Check)
    test_query("Who repaired job JOB-E23E95?")
