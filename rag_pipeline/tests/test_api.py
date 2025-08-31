#!/usr/bin/env python3
"""
API Test Client for RAG Pipeline
Tests all endpoints with real queries
"""
import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_health():
    """Test health endpoint"""
    print("🏥 Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_search():
    """Test search endpoint"""
    print("\n🔍 Testing /search endpoint...")
    
    payload = {
        "query": "create groovy script for data mapping",
        "top_k": 3
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/search", 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Search successful")
            print(f"   Query: {data['query']}")
            print(f"   Results: {len(data['results'])}")
            print(f"   Total candidates: {data['total_candidates']}")
            print(f"   Reranking applied: {data['reranking_applied']}")
            
            if data['results']:
                sample = data['results'][0]
                print(f"   Sample result ID: {sample['id']}")
                print(f"   Sample score: {sample['final_score']}")
                print(f"   Content preview: {sample['content'][:100]}...")
            
            return data
        else:
            print(f"❌ Search failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Search failed: {e}")
        return None

def test_generate(search_results=None):
    """Test generate endpoint"""
    print("\n🤖 Testing /generate endpoint...")
    
    if search_results and search_results['results']:
        # Use search results
        payload = {
            "query": "create groovy script for data mapping",
            "selected_ids": [r['id'] for r in search_results['results'][:2]],
            "model_key": "mistral"
        }
    else:
        # Use direct content
        payload = {
            "query": "create groovy script for data mapping",
            "selected_contents": [
                "def Message processData(Message message) { return message }",
                "<groovy>println('Hello World')</groovy>"
            ],
            "model_key": "mistral"
        }
    
    try:
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Generation successful")
            print(f"   Query: {data['query']}")
            print(f"   Model used: {data['model_used']}")
            print(f"   Validation status: {data['validation_status']}")
            print(f"   Context items: {len(data['context_used'])}")
            print(f"   Artifacts: {list(data['artifacts'].keys())}")
            
            # Show generated code preview
            for artifact_type, content in data['artifacts'].items():
                print(f"   {artifact_type.upper()} preview: {content[:150]}...")
            
            return data
        else:
            print(f"❌ Generation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Generation failed: {e}")
        return None

def test_feedback():
    """Test feedback endpoint"""
    print("\n📝 Testing /feedback endpoint...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/feedback",
            params={
                "query": "test query",
                "document_id": "test-doc-1",
                "sentiment": "positive",
                "score": 1.0
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Feedback recorded successfully")
            print(f"   Response: {data}")
            return True
        else:
            print(f"❌ Feedback failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Feedback failed: {e}")
        return False

def main():
    """Run complete API test suite"""
    print("🧪 RAG Pipeline API Test Suite")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("\n❌ Server not responding. Make sure to start the server first:")
        print("   python start_server.py")
        return
    
    # Test search
    search_results = test_search()
    
    # Test generation
    generation_results = test_generate(search_results)
    
    # Test feedback
    test_feedback()
    
    print("\n" + "=" * 50)
    
    if search_results and generation_results:
        print("✅ Complete RAG Pipeline API Test PASSED!")
        print("🎉 Your RAG system is working end-to-end:")
        print(f"   📥 Query → 🔍 Search ({len(search_results['results'])} results)")
        print(f"   🤖 Generate → 📤 Artifacts ({list(generation_results['artifacts'].keys())})")
    else:
        print("❌ Some tests failed. Check the server logs.")

if __name__ == "__main__":
    main()
