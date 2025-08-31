import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Settings:
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    hf_token: str = os.getenv("HF_TOKEN", "")
    # embeddings
    model_name: str = os.getenv("EMBEDDING_MODEL", "microsoft/codebert-base")
    max_length: int = int(os.getenv("MAX_LENGTH", "256"))
    device: str = os.getenv("DEVICE", "cuda" if os.getenv("CUDA", "1") == "1" else "cpu")
    # Supabase table config (read-only)
    table_name: str = os.getenv("TABLE_NAME", "documents")
    vector_column: str = os.getenv("VECTOR_COLUMN", "embedding")
    content_column: str = os.getenv("CONTENT_COLUMN", "content")
    id_column: str = os.getenv("ID_COLUMN", "id")
    # local docs mode (unused in Supabase mode but kept for flexibility)
    docs_path: str = os.getenv("DOCS_PATH", "data/docs")
    embed_cache: str = os.getenv("EMBED_CACHE", "data/cache/embeddings.npy")
    meta_cache: str = os.getenv("META_CACHE", "data/cache/meta.jsonl")

settings = Settings()
