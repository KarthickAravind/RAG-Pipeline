from typing import List, Dict


class Reranker:
    """
    Stub for re-ranking logic.
    Replace later with cross-encoder or other scoring model.
    """

    def rerank(self, chunks: List[Dict]) -> List[Dict]:
        # For now just return in the same order with final_score added
        for i, ch in enumerate(chunks):
            ch["final_score"] = ch.get("vector_score", 1.0) - (i * 0.01)
        return sorted(chunks, key=lambda x: x["final_score"], reverse=True)
