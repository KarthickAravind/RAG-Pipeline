from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional
import re


def _fingerprint(text: str) -> str:
    t = text.lower()
    t = re.sub(r"\s+", " ", t).strip()
    return t[:200]


@dataclass
class FeedbackStore:
    # key: (user_id, document_id) -> score
    id_scores: Dict[Tuple[str, str], float] = field(default_factory=dict)
    # key: (user_id, content_fp) -> score
    content_scores: Dict[Tuple[str, str], float] = field(default_factory=dict)

    def set_feedback(self, user_id: str, document_id: Optional[str], score: float, content: Optional[str] = None) -> None:
        if document_id is not None:
            self.id_scores[(user_id, document_id)] = float(score)
        if content is not None and content.strip():
            fp = _fingerprint(content)
            self.content_scores[(user_id, fp)] = float(score)

    def get_score(self, user_id: str, document_id: str, content: Optional[str]) -> float:
        by_id = float(self.id_scores.get((user_id, document_id), 0.0))
        by_fp = 0.0
        if content is not None and content.strip():
            fp = _fingerprint(content)
            by_fp = float(self.content_scores.get((user_id, fp), 0.0))
        # Prefer non-zero; if both non-zero, average
        if by_id != 0.0 and by_fp != 0.0:
            return (by_id + by_fp) / 2.0
        return by_id if by_id != 0.0 else by_fp
