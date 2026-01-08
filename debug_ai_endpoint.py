import requests
import json

url = "http://localhost:8000/api/ai/chat"

def test_query(msg, history=[]):
    print(f"\nSending: '{msg}'")
    try:
        res = requests.post(url, json={"message": msg, "history": history})
        print(f"Status: {res.status_code}")
        try:
            print(f"Response: {json.dumps(res.json(), indent=2)}")
        except:
            print(f"Raw: {res.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

# Test 1: Numeric Context
test_query("25000 what phone")
