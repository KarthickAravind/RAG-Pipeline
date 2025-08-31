from __future__ import annotations
from typing import List, Optional
from dataclasses import dataclass
from sentence_transformers import CrossEncoder
from retrieval.search import SearchResult
from rerank.feedback import FeedbackStore


@dataclass
class RerankedResult:
    result: SearchResult
    rerank_score: float
    cross_encoder_score: float | None = None


class CrossEncoderScorer:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model_name)

    def score(self, query: str, texts: List[str]) -> List[float]:
        pairs = [(query, t) for t in texts]
        scores = self.model.predict(pairs, convert_to_numpy=True)
        return scores.tolist()


def _min_max_scale(values: List[float]) -> List[float]:
    if not values:
        return []
    vmin = min(values)
    vmax = max(values)
    if vmax <= vmin:
        return [0.5 for _ in values]
    return [(v - vmin) / (vmax - vmin) for v in values]


def rerank_with_feedback(
    results: List[SearchResult],
    user_id: Optional[str],
    feedback: FeedbackStore,
    query_text: Optional[str] = None,
    cross_encoder: Optional[CrossEncoderScorer] = None,
) -> List[RerankedResult]:
    if not results:
        return []

    cross_scores: List[float] | None = None
    if cross_encoder is not None and query_text is not None:
        raw = cross_encoder.score(query_text, [r.content for r in results])
        cross_scores = _min_max_scale(raw)

    # If no user_id provided, apply only cross-encoder if present
    if not user_id:
        reranked = []
        for idx, r in enumerate(results):
            ce = cross_scores[idx] if cross_scores is not None else None
            base = r.similarity  # already ~[0,1]
            blended = base if ce is None else 0.5 * base + 0.5 * ce
            reranked.append(RerankedResult(r, blended, cross_encoder_score=ce))
        reranked.sort(key=lambda x: x.rerank_score, reverse=True)
        return reranked

    positives: List[RerankedResult] = []
    neutrals: List[RerankedResult] = []
    negatives: List[RerankedResult] = []

    for idx, r in enumerate(results):
        ce = cross_scores[idx] if cross_scores is not None else None
        base = r.similarity
        blended = base if ce is None else (0.5 * base + 0.5 * ce)
        user_score = feedback.get_score(user_id, str(r.id), r.content)

        if user_score > 0:
            # Boost positives
            score = 0.8 * blended + 0.2 * 1.0
            positives.append(RerankedResult(r, score, cross_encoder_score=ce))
        elif user_score < 0:
            # Push negatives to the end regardless of blended score
            score = blended
            negatives.append(RerankedResult(r, score, cross_encoder_score=ce))
        else:
            neutrals.append(RerankedResult(r, blended, cross_encoder_score=ce))

    positives.sort(key=lambda x: x.rerank_score, reverse=True)
    neutrals.sort(key=lambda x: x.rerank_score, reverse=True)
    negatives.sort(key=lambda x: x.rerank_score, reverse=True)

    return positives + neutrals + negatives
