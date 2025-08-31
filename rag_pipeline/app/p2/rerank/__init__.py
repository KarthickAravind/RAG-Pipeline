import os, sys

_here = os.path.dirname(__file__)
_repo_src = os.path.normpath(os.path.join(_here, "../../../retrival sys (cobert)/src"))
if _repo_src not in sys.path:
    sys.path.insert(0, _repo_src)

try:
    from rerank.feedback import FeedbackStore
except ImportError:
    # fallback stub
    class FeedbackStore:
        def __init__(self): self.store = []
        def add_feedback(self, query, chunk_id, rating): self.store.append((query, chunk_id, rating))
        def get_all(self): return self.store

from .feedback import FeedbackStore

__all__ = ["FeedbackStore"]