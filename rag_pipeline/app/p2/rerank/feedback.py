# app/p2/rerank/feedback.py

class FeedbackStore:
    """
    Simple local feedback store stub.
    Replace with real implementation later.
    """
    def __init__(self):
        self.data = []

    def add_feedback(self, query: str, chunk_id: str, rating: int):
        self.data.append({"query": query, "chunk_id": chunk_id, "rating": rating})

    def get_all(self):
        return self.data
