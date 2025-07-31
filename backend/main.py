from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from transformers import pipeline
from datetime import datetime
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def summarize_text(text: str, max_length: int = 130) -> str:
    """Summarize articles using BART model with fallback."""
    if len(text) > 1024:
        text = text[:1024]

    try:
        if len(text.split()) < 30:
            return text
        summary = summarizer(text, max_length=max_length, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    except Exception as e:
        print(f"Summarization failed: {e}")
        return text[:max_length] + "..."

async def get_or_summarize_article(url: str, title: str, content: str) -> dict:
    """
    Check if article exists in DB, otherwise summarize and store.
    Returns: {title, url, content, summary, published_at}
    """
    # Check cache first
    db_article = supabase.table("articles") \
                    .select("*") \
                    .eq("url", url) \
                    .execute()
    
    if db_article.data:
        return db_article.data[0]

    # If not cached, summarize and store
    summary = summarize_text(content)
    new_article = {
        "url": url,
        "title": title,
        "content": content,
        "summary": summary,
        "source": "newsapi",
        "published_at": datetime.now().isoformat()
    }
    
    supabase.table("articles").insert(new_article).execute()
    return new_article

@app.get("/test-news")
async def get_news():
    try:
        api_key = os.getenv("NEWS_API_KEY")
        url = f"https://newsapi.org/v2/top-headlines?category=technology&apiKey={api_key}"
        response = requests.get(url)
        response.raise_for_status()  # Raises HTTPError for bad responses
        
        articles = response.json().get("articles", [])

        if not articles:
            return {
                "articles": [{
                    "title": "No current tech news",
                    "summary": "Check back later for updates",
                    "content": "",
                    "url": "#",
                    "source": {"name": "System"}
                }],
                "info": "No articles found from API"
            }
        
        # Process articles (add summaries)
        processed_articles = []
        for article in articles:
            content = article.get("content") or article.get("description") or ""
            processed_articles.append({
                "url": article["url"],
                "title": article["title"],
                "summary": summarize_text(content),
                "content": content,
                "source": {"name": article.get("source", {}).get("name")},
                "created_at": datetime.now().isoformat()  # Add timestamp
            })
        
        return {"articles": processed_articles}  # ← Ensure this format
    
    except Exception as e:
        # Return proper error format
        return {
            "articles": [],  # Always include 'articles' field
            "error": str(e)
        }