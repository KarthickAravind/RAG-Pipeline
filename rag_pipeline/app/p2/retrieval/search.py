from typing import List, Dict


class Retriever:
    """
    Stub Retriever for Person 2.
    Later this will connect to Supabase or any vector DB.
    """

    def __init__(self, client=None):
        self.client = client

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Dummy implementation for now.
        Returns mock chunks that look like real retriever output.
        """
        return [
            {
                "id": "chunk-1",
                "content": f"<IntegrationFlow>Mocked XML for query: {query}</IntegrationFlow>",
                "component_type": "xml",
                "vector_score": 0.95,
                "cross_encoder_score": 0.93,
                "metadata_boost": 0.1,
                "final_score": 0.98,
            },
            {
                "id": "chunk-2",
                "content": f"println('Mocked Groovy for query: {query}')",
                "component_type": "groovy",
                "vector_score": 0.91,
                "cross_encoder_score": 0.90,
                "metadata_boost": 0.05,
                "final_score": 0.96,
            },
        ][:top_k]
