import os
import google.generativeai as genai
import json
import asyncio

class GeminiSummarizer:
    def __init__(self):
        # Placeholder key handling. User needs to set this.
        # Ideally this comes from environment variables
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
             print("Warning: GEMINI_API_KEY not found in environment variables.")
        else:
             print("Detected GEMINI_API_KEY!")
             genai.configure(api_key=self.api_key)

    async def summarize(self, product_data: dict) -> dict:
        if not self.api_key:
            return {
                "product_name": product_data.get("name"),
                "price": product_data.get("price"),
                "summary": "Gemini API Key missing. Please set GEMINI_API_KEY in server environment.",
                "pros_cons": {"pros": [], "cons": []}
            }

        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        prompt = f"""
        You are a helpful shopping assistant. Summarize the following Amazon product details into a concise JSON format.
        
        Product Name: {product_data.get('name')}
        Price: {product_data.get('price')}
        Features: {json.dumps(product_data.get('features'))}
        Reviews: {json.dumps(product_data.get('reviews'))}

        Return ONLY a raw JSON object (no markdown formatting) with the following structure:
        {{
            "product_name": "Shortened Name",
            "price": "Price",
            "summary": "A concise 2-3 sentence summary of the product and its key features.",
            "pros_cons": {{
                "pros": ["Pro 1", "Pro 2"],
                "cons": ["Con 1", "Con 2"]
            }},
            "review_summary": "A concise summary of user sentiment and common feedback from the reviews provided.",
            "verdict": "A one sentence buying recommendation."
        }}
        """

        try:
            # Run in executor to not block async loop if using synchronous SDK
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, model.generate_content, prompt)
            
            text = response.text
            # Clean possible markdown code blocks
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            result = json.loads(text.strip())
            # Inject images back into response so frontend can use them
            result['images'] = product_data.get('images', [])
            return result

        except Exception as e:
            print(f"Gemini Error: {e}")
            return {
                "product_name": product_data.get("name"),
                "price": product_data.get("price"),
                "summary": "Error generating summary.",
                "error": str(e)  
            }
