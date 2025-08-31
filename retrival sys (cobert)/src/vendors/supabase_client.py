from supabase import create_client, Client
from config import settings

_supabase: Client | None = None


def get_client() -> Client:
    global _supabase
    if _supabase is None:
        if not settings.supabase_url or not settings.supabase_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
        _supabase = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase
