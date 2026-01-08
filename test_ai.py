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
        print(f"Meta: {data.get('meta', {})}")
    except Exception as e:
        print(f"Error: {e}")
        try:
            print(response.text)
        except:
            pass

if __name__ == "__main__":
    # Test 1: Technician Query (Relies on Ollama/SQL logic or special rules)
    test_query("Who repaired job JOB-E23E95?")

    # Test 2: Regex Query
    # test_query("How many sales today?")

    # Test 3: Standalone number (should lookup price/cost)
    # test_query("50")
