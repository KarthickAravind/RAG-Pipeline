#!/usr/bin/env python3
"""
Interactive iFlow Retrieval System Demo
Ask queries and see search results with re-ranking!
"""

import sys
import os
from pathlib import Path

project_root = Path(__file__).parent / "src"
sys.path.insert(0, str(project_root))

from application.app import RetrievalSystem  # type: ignore


def print_header():
    print("=" * 60)
    print("\U0001F680 iFlow Retrieval System - Interactive Demo")
    print("=" * 60)
    print("Ask questions about iFlow components and see smart search results!")
    print("Type 'quit' to exit, 'help' for commands, 'status' for system info")
    print("=" * 60)


def print_help():
    print("\n\U0001F4DA Available Commands:")
    print("  help     - Show this help message")
    print("  status   - Show system status")
    print("  tables   - Show available database tables")
    print("  load     - Load sample data")
    print("  quit     - Exit the demo")
    print("  [query]  - Ask a question about iFlow components")


def print_search_results(results, query):
    print(f"\n\U0001F50D Search Results for: '{query}'")
    print("-" * 50)
    if 'error' in results:
        print(f"\u274C Error: {results['error']}")
        return
    if not results.get('results'):
        print("\U0001F4ED No results found. Try a different query.")
        return
    total_candidates = results.get('total_candidates', 0)
    total_results = len(results['results'])
    if results.get('reranking_applied'):
        print(f"\U0001F4CA Initial Similarity Search: {total_candidates} candidates")
        print(f"\U0001F4CA After Re-ranking: {total_results} final results (showing top 5):\n")
        for i, doc in enumerate(results['results'][:5], 1):
            print(f" Rank {i} (Re-ranked):")
            content = doc.get('content', 'No content')
            snippet = content[:150] + "..." if len(content) > 150 else content
            print(f"   \U0001F4C4 Content: {snippet}")
            fs = doc.get('final_score', 'N/A')
            sim = doc.get('similarity_score', 'N/A')
            ce = doc.get('cross_encoder_score', 'N/A')
            print(f"   \U0001F3AF Final Score: {fs if isinstance(fs, str) else f'{fs:.3f}'}")
            print(f"   \U0001F50D Similarity: {sim if isinstance(sim, str) else f'{sim:.3f}'}")
            if ce != 'N/A':
                print(f"   \U0001F9E0 Cross-Encoder: {ce if isinstance(ce, str) else f'{ce:.3f}'}")
            meta = doc.get('metadata', {})
            if 'chunk_id' in meta:
                print(f"   \U0001F522 Chunk ID: {meta['chunk_id']}")
            print("")
    else:
        print(f"\U0001F4CA Found {total_results} results (no re-ranking applied):\n")
        for i, doc in enumerate(results['results'][:5], 1):
            print(f" Rank {i} (Similarity):")
            content = doc.get('content', 'No content')
            snippet = content[:150] + "..." if len(content) > 150 else content
            print(f"   \U0001F4C4 Content: {snippet}")
            sim = doc.get('similarity_score', 'N/A')
            print(f"   \U0001F50D Similarity: {sim if isinstance(sim, str) else f'{sim:.3f}'}")
            print("")


def print_system_status(system):
    print("\n System Status:")
    print("-" * 30)
    info = system.get_table_info()
    if 'row_count' in info:
        print(f" Documents in Table: {info['row_count']}")
    if 'error' in info:
        print(f" Table Status: \u274C {info['error']}")
    else:
        print(f" Table Status: \u2705 Accessible")
    print(f" Re-ranker: Available")


def load_sample_data(system):
    print("\n Loading sample data...")
    result = system.load_sample_data()
    if result.get('success'):
        print(f"Successfully loaded {result.get('documents_added', 0)} sample documents!")
    else:
        print(f" Failed to load sample data: {result.get('error', 'Unknown error')}")


def interactive_demo():
    print_header()
    print(" Initializing retrieval system...")
    system = RetrievalSystem()
    print("System initialized successfully!")
    print("\n Loading sample data...")
    load_sample_data(system)
    print("\n Ready! Ask your questions about iFlow components.")
    while True:
        try:
            user_input = input("\n Your query (or command): ").strip()
            if not user_input:
                continue
            if user_input.lower() == 'quit':
                print("Goodbye! Thanks for trying the iFlow Retrieval System!")
                break
            if user_input.lower() == 'help':
                print_help()
                continue
            if user_input.lower() == 'status':
                print_system_status(system)
                continue
            if user_input.lower() == 'load':
                load_sample_data(system)
                continue
            print(f"\n Searching for: '{user_input}'")
            print("\U0001F4DA Against database documents")
            print(" Please wait...")
            results = system.search(user_input, top_k=5, apply_reranking=True)
            print_search_results(results, user_input)
            if results.get('results'):
                print(" Enter feedback per-rank (e.g., '1 y, 2 n, 3 skip'). Press Enter to skip:")
                fb_line = input(" Feedback: ").strip()
                if fb_line:
                    # Parse entries like "1 y" separated by commas
                    entries = [e.strip() for e in fb_line.split(',') if e.strip()]
                    for entry in entries:
                        parts = entry.split()
                        if len(parts) < 2:
                            continue
                        try:
                            rank = int(parts[0])
                        except ValueError:
                            continue
                        label = parts[1].lower()
                        if not (1 <= rank <= len(results['results'])):
                            continue
                        doc = results['results'][rank - 1]
                        if label in ['y', 'yes', '+1', 'pos', 'positive']:
                            system.record_feedback(user_input, doc.get('id', 'unknown'), 'positive', 1.0)
                        elif label in ['n', 'no', '-1', 'neg', 'negative']:
                            system.record_feedback(user_input, doc.get('id', 'unknown'), 'negative', -1.0)
                        # else skip
                    # Re-rank and show again
                    print("\n Re-ranking with feedback... Please wait...\n")
                    results2 = system.search(user_input, top_k=5, apply_reranking=True)
                    print_search_results(results2, user_input)
        except KeyboardInterrupt:
            print("\n\nGoodbye! Thanks for trying the iFlow Retrieval System!")
            break
        except Exception as e:
            print(f" Error: {e}")
            print(" Try a different query or type 'help' for commands.")


if __name__ == "__main__":
    interactive_demo()
