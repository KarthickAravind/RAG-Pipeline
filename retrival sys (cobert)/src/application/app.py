from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import re

from retrieval.search import Retriever, SearchResult
from rerank.feedback import FeedbackStore
from rerank.rerank import rerank_with_feedback, CrossEncoderScorer
from vendors.supabase_client import get_client
from config import settings


def _fingerprint(text: str) -> str:
    t = text.lower()
    t = re.sub(r"\s+", " ", t).strip()
    return t[:200]


@dataclass
class RetrievalSystem:
    top_k: int = 15
    neg_ids: set[str] = field(default_factory=set)
    pos_ids: set[str] = field(default_factory=set)
    neg_fps: set[str] = field(default_factory=set)
    pos_fps: set[str] = field(default_factory=set)

    def __post_init__(self) -> None:
        self.retriever = Retriever(top_k=self.top_k)
        self.feedback = FeedbackStore()
        self.cross_encoder = CrossEncoderScorer()
        self.client = get_client()
        self.table_name = settings.table_name

    @property
    def vector_search(self):
        return self

    def get_table_info(self) -> Dict[str, Any]:
        try:
            resp = self.client.table(self.table_name).select("*", count="exact").limit(0).execute()
            info: Dict[str, Any] = {"row_count": getattr(resp, "count", None)}
            return info
        except Exception as exc:
            return {"error": str(exc)}

    def list_available_tables(self) -> List[str]:
        return [self.table_name]

    def get_system_status(self) -> Dict[str, Any]:
        return {
            "feedback_stats": {"entries": len(self.feedback.id_scores) + len(self.feedback.content_scores)},
            "table": self.table_name,
        }

    def load_sample_data(self) -> Dict[str, Any]:
        try:
            info = self.get_table_info()
            if "row_count" in info and info["row_count"] is not None:
                return {"success": True, "documents_added": 0, "message": f"Table has {info['row_count']} rows"}
            return {"success": False, "error": info.get("error", "Unknown table state")}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    def search(self, query: str, document: Optional[str] = None, top_k: Optional[int] = None, apply_reranking: bool = True) -> Dict[str, Any]:
        k = top_k or self.top_k
        candidate_k = max(k * 5, 50)
        temp_retriever = Retriever(top_k=candidate_k)
        results: List[SearchResult] = temp_retriever.search(query)
        if not results:
            return {
                "results": [],
                "total_candidates": 0,
                "reranking_applied": False,
                "vector_search_available": True,
            }
        reranked = rerank_with_feedback(
            results, user_id="demo-user", feedback=self.feedback, query_text=query, cross_encoder=self.cross_encoder
        )
        dedup: Dict[str, Dict[str, Any]] = {}
        for r in reranked:
            content_text = r.result.content or ""
            key = content_text.strip()
            item = {
                "id": r.result.id,
                "content": content_text,
                "similarity_score": r.result.similarity,
                "cross_encoder_score": r.cross_encoder_score if r.cross_encoder_score is not None else "N/A",
                "final_score": r.rerank_score,
                "metadata": {"chunk_id": r.result.id},
            }
            prev = dedup.get(key)
            if prev is None or (isinstance(item["final_score"], (int, float)) and isinstance(prev["final_score"], (int, float)) and item["final_score"] > prev["final_score"]):
                dedup[key] = item
        unique_docs = list(dedup.values())
        # Apply hard ordering by user feedback sets: positives first, then neutral, negatives last
        def is_neg(d: Dict[str, Any]) -> bool:
            cid = str(d.get("id", ""))
            fp = _fingerprint(d.get("content", ""))
            return cid in self.neg_ids or fp in self.neg_fps

        def is_pos(d: Dict[str, Any]) -> bool:
            cid = str(d.get("id", ""))
            fp = _fingerprint(d.get("content", ""))
            return cid in self.pos_ids or fp in self.pos_fps

        positives = [d for d in unique_docs if is_pos(d)]
        negatives = [d for d in unique_docs if is_neg(d) and d not in positives]
        neutrals = [d for d in unique_docs if d not in positives and d not in negatives]
        # Within each bucket, sort by final_score desc
        def score_key(d: Dict[str, Any]) -> float:
            v = d.get("final_score")
            return float(v) if isinstance(v, (int, float)) else -1e9
        positives.sort(key=score_key, reverse=True)
        neutrals.sort(key=score_key, reverse=True)
        negatives.sort(key=score_key, reverse=True)
        ordered = positives + neutrals + negatives
        return {
            "results": ordered[:k],
            "total_candidates": len(results),
            "reranking_applied": apply_reranking,
            "vector_search_available": True,
        }

    def record_feedback(self, query: str, document_id: Any, sentiment: str, score: float) -> None:
        val = 1.0 if str(sentiment).lower() in ("positive", "pos", "y", "yes") else (-1.0 if str(sentiment).lower() in ("negative", "neg", "n", "no") else 0.0)
        # Fetch content best-effort for fingerprint
        try:
            data = get_client().table(self.table_name).select("id,content").eq("id", document_id).limit(1).execute().data
            content = data[0]["content"] if data else None
        except Exception:
            content = None
        self.feedback.set_feedback("demo-user", str(document_id), val if score is None else float(score), content=content)
        # Update hard-ordering sets
        try:
            fp = _fingerprint(content or "")
        except Exception:
            fp = ""
        if val > 0:
            self.pos_ids.add(str(document_id))
            if fp:
                self.pos_fps.add(fp)
            # Also remove from negative sets if present
            self.neg_ids.discard(str(document_id))
            if fp and fp in self.neg_fps:
                self.neg_fps.discard(fp)
        elif val < 0:
            self.neg_ids.add(str(document_id))
            if fp:
                self.neg_fps.add(fp)
            # Remove from positive sets if present
            self.pos_ids.discard(str(document_id))
            if fp and fp in self.pos_fps:
                self.pos_fps.discard(fp)
