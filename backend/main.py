from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
from transformers import pipeline

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(text: str, max_length: int = 130) -> str:
    """Summarize long articles using BART model."""
    
    if len(text) > 1024:
        text = text[:1024]

    try:
        if len(text.split()) < 30:
            return text
        summary = summarizer(text, max_length=max_length, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    
    except Exception as e:
        print(f"Summarization failed: {e}")
        return text[:max_length] + "..."  # Fallback: truncate


@app.get("/test-news")
async def get_news():
    api_key = os.getenv("NEWS_API_KEY")
    url = f"https://newsapi.org/v2/top-headlines?category=technology&apiKey={api_key}"
    response = requests.get(url)
    articles = response.json().get("articles", [])

    for article in articles:
        content = article.get("content", "") or article.get("description", "")
        article["summary"] = summarize_text(content)
    
    return {"articles": articles}