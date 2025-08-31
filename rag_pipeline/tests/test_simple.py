#!/usr/bin/env python3
"""
Simple test to verify basic functionality
"""
import sys
import os
from pathlib import Path

# Add paths
current_dir = Path(__file__).parent
retrieval_src = current_dir.parent.parent / "retrival sys (cobert)" / "src"
sys.path.insert(0, str(retrieval_src))

def test_basic_imports():
    print("Testing basic imports...")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✓ Environment loaded")
        
        # Test environment variables
        hf_token = os.getenv("HF_TOKEN")
        supabase_url = os.getenv("SUPABASE_URL") 
        supabase_key = os.getenv("SUPABASE_KEY")
        
        print(f"✓ HF_TOKEN: {'Present' if hf_token else 'Missing'}")
        print(f"✓ SUPABASE_URL: {'Present' if supabase_url else 'Missing'}")
        print(f"✓ SUPABASE_KEY: {'Present' if supabase_key else 'Missing'}")
        
    except Exception as e:
        print(f"✗ Environment error: {e}")
        return False
    
    try:
        from vendors.supabase_client import get_client
        client = get_client()
        print("✓ Supabase client created")
        
        # Test table access
        from config import settings
        resp = client.table(settings.table_name).select("*", count="exact").limit(1).execute()
        print(f"✓ Database has {resp.count} documents")
        
    except Exception as e:
        print(f"✗ Supabase error: {e}")
        return False
    
    try:
        from application.app import RetrievalSystem
        rs = RetrievalSystem()
        print("✓ RetrievalSystem initialized")
        
        # Test search
        result = rs.search("groovy script", top_k=2)
        print(f"✓ Search returned {len(result['results'])} results")
        
        if result['results']:
            sample = result['results'][0]
            print(f"✓ Sample result ID: {sample['id']}")
            print(f"✓ Sample content: {sample['content'][:50]}...")
        
    except Exception as e:
        print(f"✗ Retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def test_fastapi_app():
    print("\nTesting FastAPI app...")
    
    try:
        # Add parent directory to path for app imports
        sys.path.insert(0, str(current_dir.parent))
        
        from app.main import app
        print("✓ FastAPI app imported")
        
        from app.models import SearchRequest
        print("✓ Models imported")
        
        from app.routes import router
        print("✓ Routes imported")
        
        return True
        
    except Exception as e:
        print(f"✗ FastAPI error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Running Simple RAG Pipeline Tests")
    print("=" * 40)
    
    success = True
    success &= test_basic_imports()
    success &= test_fastapi_app()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ All tests passed! Pipeline is ready.")
    else:
        print("❌ Some tests failed. Check errors above.")
