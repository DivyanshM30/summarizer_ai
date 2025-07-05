import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash")

def summarise_text(text):
    prompt = f"Summarise the following text:\n\n{text}"
    response = model.generate_content(prompt)
    return response.text