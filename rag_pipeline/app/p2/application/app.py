import os
import sys

# Calculate correct path to the real retrieval system
_here = os.path.dirname(__file__)
_repo_root = os.path.normpath(os.path.join(_here, "../../../.."))
_retrieval_src = os.path.join(_repo_root, "retrival sys (cobert)", "src")

if _retrieval_src not in sys.path:
    sys.path.insert(0, _retrieval_src)

print(f"🚀 Connecting to REAL retrieval system at: {_retrieval_src}")
print(f"🔍 Path exists: {os.path.exists(_retrieval_src)}")

# Import the real retrieval system (no fallback)
from application.app import RetrievalSystem as RealRetrievalSystem
print("✅ Successfully imported Retrieval system!")


class RetrievalSystem:
    """
    Wrapper around the real Person 2's RetrievalSystem.
    """

    def __init__(self):
        print("🚀 Initializing REAL Retrieval System...")
        self.real_system = RealRetrievalSystem()
        print("✅ Real retrieval system initialized successfully!")

    def search(self, query: str, top_k: int = 5, apply_reranking: bool = True):
        """
        Search using the real Person 2's retrieval system
        """
        print(f"🔍 Search: '{query}' (top_k={top_k})")
        result = self.real_system.search(query, top_k=top_k, apply_reranking=apply_reranking)

        # Log basic result info
        if isinstance(result, dict):
            results_count = len(result.get("results", []))
            print(f"✅ Found {results_count} results")

        return result

    def record_feedback(self, query: str, document_id: str, sentiment: str, score: float = 1.0):
        """
        Record feedback using the real Person 2's retrieval system
        """
        print(f"� Feedback recorded: {sentiment} (score: {score})")
        return self.real_system.record_feedback(query, document_id, sentiment, score)


__all__ = ["RetrievalSystem"]