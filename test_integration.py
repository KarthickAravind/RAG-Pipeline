#!/usr/bin/env python3
"""
Integration test script to verify backend-frontend connection
"""
import requests
import json
import time
import sys
from typing import Dict, Any


def test_endpoint(url: str, method: str = "GET", data: Dict[Any, Any] = None) -> Dict[str, Any]:
    """Test a single endpoint and return results"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            return {"success": False, "error": f"Unsupported method: {method}"}
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "elapsed_ms": int(response.elapsed.total_seconds() * 1000)
        }
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Connection refused - is the backend running?"}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    print("🧪 SAP iFlow RAG Pipeline - Integration Test")
    print("=" * 50)
    
    base_url = "http://localhost:8001"
    
    # Test cases
    tests = [
        {
            "name": "Health Check",
            "url": f"{base_url}/health",
            "method": "GET",
            "expected_keys": ["status"]
        },
        {
            "name": "System Stats",
            "url": f"{base_url}/stats",
            "method": "GET",
            "expected_keys": ["chunks", "collections"]
        },
        {
            "name": "Facets Data",
            "url": f"{base_url}/facets",
            "method": "GET",
            "expected_keys": ["component_types", "tags", "sources"]
        },
        {
            "name": "Search Endpoint",
            "url": f"{base_url}/search",
            "method": "POST",
            "data": {
                "query": "create groovy script for data mapping",
                "top_k": 5,
                "rerank": {"enabled": True},
                "pagination": {"page": 1, "page_size": 10}
            },
            "expected_keys": ["results", "total", "elapsed_ms"]
        },
        {
            "name": "Generation Endpoint",
            "url": f"{base_url}/generate",
            "method": "POST",
            "data": {
                "query": "create a simple groovy script",
                "selected_contents": ["def Message processData(Message message) { return message; }"],
                "model_key": "mistral"
            },
            "expected_keys": ["query", "model_used", "artifacts"]
        }
    ]
    
    results = []
    passed = 0
    failed = 0
    
    for test in tests:
        print(f"\n🔍 Testing: {test['name']}")
        print(f"   URL: {test['url']}")
        
        result = test_endpoint(
            test['url'], 
            test.get('method', 'GET'), 
            test.get('data')
        )
        
        if result['success']:
            print(f"   ✅ SUCCESS ({result['elapsed_ms']}ms)")
            
            # Check expected keys
            if 'expected_keys' in test:
                response_data = result['response']
                missing_keys = []
                for key in test['expected_keys']:
                    if key not in response_data:
                        missing_keys.append(key)
                
                if missing_keys:
                    print(f"   ⚠️  Missing keys: {missing_keys}")
                else:
                    print(f"   ✅ All expected keys present")
            
            # Show sample response
            if isinstance(result['response'], dict):
                sample_keys = list(result['response'].keys())[:3]
                print(f"   📄 Response keys: {sample_keys}...")
            
            passed += 1
        else:
            print(f"   ❌ FAILED: {result.get('error', 'Unknown error')}")
            if 'status_code' in result:
                print(f"   📊 Status Code: {result['status_code']}")
            failed += 1
        
        results.append({
            "test": test['name'],
            "success": result['success'],
            "details": result
        })
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend-Frontend connection is ready!")
        print("\n🚀 Next Steps:")
        print("1. Start backend: cd rag_pipeline && python start_server.py")
        print("2. Start frontend: cd RAG_Front/web && npm run dev")
        print("3. Open browser: http://localhost:5173")
    else:
        print(f"\n⚠️  {failed} tests failed. Please check the backend configuration.")
        
        # Show detailed errors
        print("\n🔍 FAILED TESTS DETAILS:")
        for result in results:
            if not result['success']:
                print(f"- {result['test']}: {result['details'].get('error', 'Unknown error')}")
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
