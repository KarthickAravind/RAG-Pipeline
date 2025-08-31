#!/usr/bin/env python3
"""
Test script to verify the complete RAG pipeline functionality
"""
import sys
import os
from pathlib import Path

# Add the retrieval system to path
retrieval_src = Path(__file__).parent.parent.parent / "retrival sys (cobert)" / "src"
sys.path.insert(0, str(retrieval_src))

from application.app import RetrievalSystem
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.generator_service import generate_from_selected
from app.models import SearchResultItem

def test_retrieval():
    """Test the retrieval system"""
    print("🔍 Testing Retrieval System...")
    rs = RetrievalSystem()
    
    # Test query
    query = "create groovy script for data mapping"
    result = rs.search(query, top_k=3)
    
    print(f"✓ Retrieved {len(result['results'])} results")
    print(f"✓ Total candidates: {result['total_candidates']}")
    print(f"✓ Reranking applied: {result['reranking_applied']}")
    
    if result['results']:
        sample = result['results'][0]
        print(f"✓ Sample result ID: {sample['id']}")
        print(f"✓ Sample score: {sample['final_score']}")
        print(f"✓ Content preview: {sample['content'][:100]}...")
    
    return result

def test_generation(search_results):
    """Test the generation system"""
    print("\n🤖 Testing Generation System...")
    
    # Convert search results to SearchResultItem objects
    selected_items = []
    for result in search_results['results'][:2]:  # Use top 2 results
        item = SearchResultItem(
            id=str(result['id']),
            content=result['content'],
            similarity_score=result.get('similarity_score'),
            cross_encoder_score=result.get('cross_encoder_score'),
            final_score=result.get('final_score'),
            metadata=result.get('metadata', {})
        )
        selected_items.append(item)
    
    # Generate response
    query = "create groovy script for data mapping"
    response = generate_from_selected(query, selected_items, model_key="mistral")
    
    print(f"✓ Model used: {response['model_used']}")
    print(f"✓ Validation status: {response['validation_status']}")
    print(f"✓ Context items used: {len(response['context_used'])}")
    print(f"✓ Artifacts generated: {list(response['artifacts'].keys())}")
    
    if 'groovy' in response['artifacts']:
        print(f"✓ Generated Groovy code preview:")
        print(response['artifacts']['groovy'][:200] + "...")
    
    return response

def main():
    """Run complete pipeline test"""
    print("🚀 Testing Complete RAG Pipeline")
    print("=" * 50)
    
    try:
        # Test retrieval
        search_results = test_retrieval()
        
        # Test generation
        generation_results = test_generation(search_results)
        
        print("\n" + "=" * 50)
        print("✅ Complete RAG Pipeline Test PASSED!")
        print(f"✅ Flow: Query → {len(search_results['results'])} chunks → Generated artifacts")
        
    except Exception as e:
        print(f"\n❌ Pipeline test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
