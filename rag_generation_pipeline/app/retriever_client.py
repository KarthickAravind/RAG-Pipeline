import requests
from fastapi import HTTPException
from .models import RetrievedChunk
from .config import RETRIEVER_BASE_URL


def call_retriever(query: str, top_k: int):
    url = f"{RETRIEVER_BASE_URL.rstrip('/')}/search"
    try:
        r = requests.post(url, json={"query": query, "top_k": top_k}, timeout=30)
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Retriever error: {e}")
    data = r.json()
    return [RetrievedChunk(**it) for it in data.get("results", [])]


