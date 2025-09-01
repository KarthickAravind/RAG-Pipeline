from fastapi import FastAPI
from .routes import router

app = FastAPI(title="SAP iFlow RAG Generation (Free HF)")
app.include_router(router)

@app.get("/health")
def health():
    return {"ok": True}


