from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
# Try loading from parent directory (root of project) or current directory
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from scraper import AmazonScraper
from llm import GeminiSummarizer

app = FastAPI()

# Enable CORS for the chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: str

class SummaryResponse(BaseModel):
    summary: dict
    error: str | None = None

scraper = AmazonScraper()
# We initialize GeminiSummarizer lazily or here if env var is present
summarizer = GeminiSummarizer()

@app.post("/summarize", response_model=SummaryResponse)
async def summarize_product(request: ScrapeRequest):
    print(f"Received request to summarize: {request.url}")
    try:
        # 1. Scrape Data
        product_data = scraper.scrape(request.url)
        if not product_data:
             raise HTTPException(status_code=400, detail="Failed to scrape product data")

        # 2. Generate Summary
        summary = await summarizer.summarize(product_data)
        
        return SummaryResponse(summary=summary)

    except Exception as e:
        print(f"Error: {e}")
        return SummaryResponse(summary={}, error=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
