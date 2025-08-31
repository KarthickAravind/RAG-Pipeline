import argparse
from typing import Optional
from retrieval.search import Retriever
from rerank.feedback import FeedbackStore
from rerank.rerank import rerank_with_feedback, CrossEncoderScorer
from config import settings
import os
import glob


def print_banner():
    docs = [p for p in glob.glob(os.path.join(settings.docs_path, "**", "*.*"), recursive=True) if os.path.isfile(p)]
    print(f"\U0001F4DA Found {len(docs)} sample documents")
    print(f" \u2705 Sample data is loaded from local files under '{settings.docs_path}'\n")
    print(" Ready! Ask your questions about your documents.\n")


def print_stage_search(query: str):
    print(f" Searching for: '{query}'")
    print("\U0001F4DA Against local documents")
    print(" Please wait...")


def print_results_verbose(query: str, results, title: str = "Search Results") -> None:
    print(f"\n\U0001F50D {title} for: '{query}'")
    print("-" * 50)
    print("\U0001F3F7\uFE0F  Query Type: N/A")
    print(f"\U0001F4CA Initial Similarity Search: {len(results)} candidates")
    print(f"\U0001F4CA After Re-ranking: {min(5, len(results))} final results (showing top {min(5, len(results))}):\n")
    for i, r in enumerate(results[:5], 1):
        content = r.result.content.replace("\n", " ")
        content = (content[:180] + "...") if len(content) > 183 else content
        ce_score = r.cross_encoder_score
        print(f" Rank {i} (Re-ranked):")
        print(f"   \U0001F4C4 Content: {content}")
        print(f"   \U0001F3AF Final Score: {r.rerank_score:.3f}")
        print(f"   \U0001F50D Similarity: {r.result.similarity:.3f}")
        if ce_score is not None:
            print(f"   \U0001F9E0 Cross-Encoder: {ce_score:.3f}")
        print(f"   \U0001F194 Output Type: N/A")
        print(f"   \U0001F3F7\uFE0F  Data Type: N/A")
        print(f"   \U0001F522 Chunk ID: {r.result.id}")
        print("")


def main():
    parser = argparse.ArgumentParser(description="Retrieve and rerank using CodeBERT (local store)")
    parser.add_argument("query", type=str, help="User query text")
    parser.add_argument("--user", dest="user_id", type=str, default="user1", help="User id for feedback-aware rerank")
    parser.add_argument("--topk", dest="top_k", type=int, default=5, help="Top K matches")
    args = parser.parse_args()

    print_banner()

    retriever = Retriever(top_k=args.top_k)
    feedback = FeedbackStore()
    cross_encoder = CrossEncoderScorer()

    print_stage_search(args.query)
    initial = retriever.search(args.query)
    reranked = rerank_with_feedback(initial, args.user_id, feedback, query_text=args.query, cross_encoder=cross_encoder)

    print_results_verbose(args.query, reranked, title="Search Results")

    # Simple helpfulness feedback like the sample: y/n/skip
    try:
        raw = input(" Was this helpful? (y/n/skip): ")
    except EOFError:
        raw = "skip"
    choice = (raw or "skip").strip().lower()

    if choice in ("y", "yes") and reranked:
        # reward top-1
        feedback.set_feedback(args.user_id, str(reranked[0].result.id), 1.0)
    elif choice in ("n", "no") and reranked:
        # penalize top-1
        feedback.set_feedback(args.user_id, str(reranked[0].result.id), -1.0)

    if choice in ("y", "yes", "n", "no"):
        print("\nRe-ranking with feedback...\n")
        reranked2 = rerank_with_feedback(initial, args.user_id, feedback, query_text=args.query, cross_encoder=cross_encoder)
        print_results_verbose(args.query, reranked2, title="Re-ranked Results")


if __name__ == "__main__":
    main()
