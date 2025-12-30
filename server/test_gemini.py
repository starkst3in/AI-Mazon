import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
# Try loading from parent directory (root of project)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file.")
else:
    print(f"BINGO! API Key found")
    
    genai.configure(api_key=api_key)
    
    # You can change this prompt to test different things
    custom_prompt = "Hello Gemini! Are you working? purely output 'Yes, I am working!' if successful."
    
    print("Listing available models...")
    # for m in genai.list_models():
    #     if 'generateContent' in m.supported_generation_methods:
    #         print(m.name)

    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(custom_prompt)
        print("Response received:")
        print("-" * 30)
        print(response.text)
        print("-" * 30)
    except Exception as e:
        print(f"Error communicating with Gemini: {e}")
