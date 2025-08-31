#!/usr/bin/env python3
"""
Debug script to test frontend-backend connection issues
"""
import requests
import json
import subprocess
import sys
import time


def check_backend_health():
    """Check if backend is running and healthy"""
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running (connection refused)")
        return False
    except requests.exceptions.Timeout:
        print("❌ Backend is not responding (timeout)")
        return False
    except Exception as e:
        print(f"❌ Backend check failed: {e}")
        return False


def check_cors():
    """Check CORS configuration"""
    try:
        # Simulate a CORS preflight request
        response = requests.options(
            "http://localhost:8001/search",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=5
        )
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
        }
        
        print("🔍 CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                print(f"  ✅ {header}: {value}")
            else:
                print(f"  ❌ {header}: Not set")
        
        return True
    except Exception as e:
        print(f"❌ CORS check failed: {e}")
        return False


def test_search_endpoint():
    """Test the search endpoint directly"""
    try:
        search_data = {
            "query": "test search",
            "top_k": 5,
            "rerank": {"enabled": True},
            "pagination": {"page": 1, "page_size": 10}
        }
        
        response = requests.post(
            "http://localhost:8001/search",
            json=search_data,
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:5173"
            },
            timeout=10
        )
        
        print(f"🔍 Search endpoint test:")
        print(f"  Status: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"  ✅ Search successful - {len(result.get('results', []))} results")
            return True
        else:
            print(f"  ❌ Search failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Search endpoint test failed: {e}")
        return False


def check_frontend_process():
    """Check if frontend development server is running"""
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend development server is running")
            return True
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend development server is not running")
        return False
    except Exception as e:
        print(f"❌ Frontend check failed: {e}")
        return False


def main():
    print("🔍 Frontend-Backend Connection Diagnostic")
    print("=" * 50)
    
    # Check backend
    backend_ok = check_backend_health()
    print()
    
    # Check CORS
    if backend_ok:
        cors_ok = check_cors()
        print()
    else:
        cors_ok = False
    
    # Test search endpoint
    if backend_ok:
        search_ok = test_search_endpoint()
        print()
    else:
        search_ok = False
    
    # Check frontend
    frontend_ok = check_frontend_process()
    print()
    
    # Summary
    print("=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print(f"Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"CORS Setup: {'✅' if cors_ok else '❌'}")
    print(f"Search Endpoint: {'✅' if search_ok else '❌'}")
    print(f"Frontend Server: {'✅' if frontend_ok else '❌'}")
    
    if all([backend_ok, cors_ok, search_ok, frontend_ok]):
        print("\n🎉 All checks passed! The connection should work.")
        print("\n💡 If you're still seeing 'Failed to fetch', try:")
        print("1. Hard refresh the browser (Ctrl+F5)")
        print("2. Clear browser cache")
        print("3. Check browser console for detailed errors")
    else:
        print("\n⚠️  Issues found. Recommendations:")
        if not backend_ok:
            print("- Start the backend: cd rag_pipeline && python start_server.py")
        if not cors_ok:
            print("- CORS headers are missing - check backend CORS configuration")
        if not search_ok:
            print("- Search endpoint has issues - check backend logs")
        if not frontend_ok:
            print("- Start the frontend: cd RAG_Front/web && npm run dev")


if __name__ == "__main__":
    main()
