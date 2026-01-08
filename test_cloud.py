from ollama import Client
import os

key = "d048b9322f674102aa003cfc4d4bab4e.TFXEXYm7ob8NAOqwRJAuKlG6"
print(f"Testing Key: {key[:5]}...")

try:
    client = Client(
        host="https://ollama.com",
        headers={'Authorization': f'Bearer {key}'}
    )
    
    print("Attempting to List Models...")
    # Some providers disable list(), but worth a shot
    try:
        models = client.list()
        print("Models Available:", models)
    except Exception as e:
        print(f"List Error: {e}")

    print("Attempting Chat with 'gpt-oss:120b'...")
    res = client.chat(model='gpt-oss:120b', messages=[{'role': 'user', 'content': 'Hi'}])
    print("Response:", res['message']['content'])

except Exception as e:
    print(f"FATAL ERROR: {e}")
