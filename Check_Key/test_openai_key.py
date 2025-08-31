from openai import OpenAI
import os

# set your API key here or in environment variable OPENAI_API_KEY
api_key = os.getenv("OPENAI_API_KEY")  # safer way if already set
if not api_key:
    api_key = "your_openai_api_key_here"   # Replace with your actual API key

client = OpenAI(api_key=api_key)

try:
    # just a simple test request
    response = client.chat.completions.create(
        model="gpt-4o-mini", 
        messages=[{"role": "user", "content": "Hello, can you hear me?"}],
        max_tokens=10
    )
    print("✅ API key is working!")
    print("Response:", response.choices[0].message.content)
except Exception as e:
    print("❌ API key is not working or invalid.")
    print("Error:", e)
