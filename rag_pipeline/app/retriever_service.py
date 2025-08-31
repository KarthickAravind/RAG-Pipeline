from typing import List, Dict, Any
from .models import SearchResultItem
from .config import DEFAULT_TOP_K

# Import Person-2 retrieval system
from .p2.application.app import RetrievalSystem


_retriever = None


def get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = RetrievalSystem()
    return _retriever


def search_query(query: str, top_k: int = None) -> Dict[str, Any]:
    rs = get_retriever()
    top_k = top_k or DEFAULT_TOP_K
    res = rs.search(query, top_k=top_k, apply_reranking=True)
    items = []
    for d in res.get("results", []):
        items.append(SearchResultItem(
            id=str(d.get("id")),
            content=d.get("content", ""),
            similarity_score=d.get("similarity_score"),
            cross_encoder_score=d.get("cross_encoder_score"),
            final_score=d.get("final_score"),
            metadata=d.get("metadata", {})
        ))
    return {
        "query": query,
        "results": items,
        "total_candidates": res.get("total_candidates", 0),
        "reranking_applied": res.get("reranking_applied", False)
    }


def fetch_by_ids(ids: List[str]) -> List[SearchResultItem]:
    from .p2.vendors.supabase_client import get_client
    from .p2.config import settings as p2_settings

    client = get_client()
    items: List[SearchResultItem] = []
    if not ids:
        return items
    try:
        resp = client.table(p2_settings.table_name).select(f"{p2_settings.id_column},{p2_settings.content_column}").in_(p2_settings.id_column, ids).execute()
        rows = resp.data or []
    except Exception:
        rows = []
    for r in rows:
        items.append(SearchResultItem(
            id=str(r.get(p2_settings.id_column)),
            content=r.get(p2_settings.content_column, ""),
            similarity_score=None,
            cross_encoder_score=None,
            final_score=None,
            metadata={}
        ))
    return items


