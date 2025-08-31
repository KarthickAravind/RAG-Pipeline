import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

if not HF_TOKEN:
    raise RuntimeError("HUGGINGFACEHUB_API_TOKEN is not set (put in .env)")

DEFAULT_TOP_K = int(os.getenv("GEN_TOP_K", "5"))
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "12000"))

SUPPORTED_MODELS = {
    "mistral": "mistralai/Mistral-7B-Instruct-v0.3",
    "zephyr": "HuggingFaceH4/zephyr-7b-beta",
}


