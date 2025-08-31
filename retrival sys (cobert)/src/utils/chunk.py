from typing import List
from transformers import AutoTokenizer
from config import settings

class TokenChunker:
    def __init__(self, model_name: str | None = None, max_tokens: int | None = None, overlap: int = 0):
        self.model_name = model_name or settings.model_name
        self.max_tokens = max_tokens or settings.max_length
        self.overlap = overlap
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, use_fast=True)

    def chunk(self, text: str) -> List[str]:
        if not text:
            return []
        tokens = self.tokenizer.encode(text, add_special_tokens=False)
        if len(tokens) <= self.max_tokens:
            return [text]
        chunks: List[str] = []
        start = 0
        while start < len(tokens):
            end = min(start + self.max_tokens, len(tokens))
            piece = tokens[start:end]
            chunks.append(self.tokenizer.decode(piece, skip_special_tokens=True))
            if end == len(tokens):
                break
            start = end - self.overlap if self.overlap > 0 else end
        return chunks
