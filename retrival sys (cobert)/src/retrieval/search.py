from __future__ import annotations
from dataclasses import dataclass
from typing import List, Any
import numpy as np
import torch
from config import settings
from vendors.supabase_client import get_client
from retrieval.embedder import CodeBERTEmbedder
import json


def _l2_normalize(x: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(x, axis=1, keepdims=True) + 1e-12
    return x / norms


def _parse_vector(value: Any) -> List[float] | None:
    # Accept already-parsed list
    if isinstance(value, list):
        try:
            return [float(x) for x in value]
        except Exception:
            return None
    # Accept JSON/string formats like "[0.1, 0.2]" or "{0.1,0.2}"
    if isinstance(value, str):
        s = value.strip()
        try:
            # Try JSON first
            if s.startswith("[") and s.endswith("]"):
                arr = json.loads(s)
                if isinstance(arr, list):
                    return [float(x) for x in arr]
            # Try pg array style {..}
            if s.startswith("{") and s.endswith("}"):
                inner = s[1:-1]
                parts = [p for p in inner.split(",") if p]
                return [float(p) for p in parts]
        except Exception:
            return None
    return None


@dataclass
class SearchResult:
    id: Any
    content: str
    similarity: float


class Retriever:
    def __init__(self, top_k: int = 5):
        self.top_k = top_k
        self.embedder = CodeBERTEmbedder()
        self.client = get_client()

    def _fetch_documents(self) -> tuple[np.ndarray, list[dict]]:
        rows: list[dict] = []
        limit = 1000
        offset = 0
        while True:
            resp = self.client.table(settings.table_name).select(
                f"{settings.id_column},{settings.content_column},{settings.vector_column}"
            ).range(offset, offset + limit - 1).execute()
            batch = resp.data or []
            rows.extend(batch)
            if len(batch) < limit:
                break
            offset += limit
        if not rows:
            return np.zeros((0, 768), dtype=np.float32), []
        vectors: list[list[float]] = []
        metas: list[dict] = []
        for r in rows:
            vec_raw = r.get(settings.vector_column)
            content = r.get(settings.content_column, "")
            vec = _parse_vector(vec_raw)
            if vec is None or len(vec) == 0:
                continue
            vectors.append(vec)
            metas.append({
                "id": r.get(settings.id_column),
                "content": content,
            })
        if not vectors:
            # No usable vectors parsed
            return np.zeros((0, 768), dtype=np.float32), []
        mat = np.asarray(vectors, dtype=np.float32)
        mat = _l2_normalize(mat)
        return mat, metas

    def _embed_query(self, query: str) -> np.ndarray:
        embeddings: torch.Tensor = self.embedder.embed([query])
        arr = embeddings.numpy().astype(np.float32)
        arr = _l2_normalize(arr)
        return arr

    def search(self, query: str) -> List[SearchResult]:
        mat, meta = self._fetch_documents()
        if mat.shape[0] == 0:
            return []
        q = self._embed_query(query)[0]
        sims = (mat @ q)
        top_idx = np.argsort(-sims)[: self.top_k]
        results: List[SearchResult] = []
        for i in top_idx:
            m = meta[int(i)]
            results.append(SearchResult(id=m["id"], content=m["content"], similarity=float(sims[int(i)])))
        return results
