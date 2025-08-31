#!/usr/bin/env python3
"""
Quick test script to verify the integration setup
"""
import os
import sys
import subprocess
import time
import requests


def check_backend_running():
    """Check if backend is already running"""
    try:
        response = requests.get("http://localhost:8001/health", timeout=2)
        return response.status_code == 200
    except:
        return False


def main():
    print("🚀 SAP iFlow RAG Pipeline - Quick Test")
    print("=" * 40)
    
    # Check if backend is running
    if check_backend_running():
        print("✅ Backend is already running!")
        print("🧪 Running integration tests...")
        
        # Run integration tests
        result = subprocess.run([sys.executable, "test_integration.py"], 
                              capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
            
        if result.returncode == 0:
            print("\n🎉 SUCCESS! Your integration is working!")
            print("\n🚀 Next steps:")
            print("1. Frontend: cd RAG_Front/web && npm run dev")
            print("2. Open: http://localhost:5173")
        else:
            print("\n⚠️  Some tests failed. Check the output above.")
    else:
        print("❌ Backend is not running")
        print("\n🔧 To start the system:")
        print("1. Backend: cd rag_pipeline && python start_server.py")
        print("2. Frontend: cd RAG_Front/web && npm run dev")
        print("3. Test: python test_integration.py")
        
        print("\n📖 For detailed instructions, see: INTEGRATION_GUIDE.md")


if __name__ == "__main__":
    main()
