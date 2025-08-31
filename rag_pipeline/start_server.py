#!/usr/bin/env python3
"""
Simple server startup script to test the RAG pipeline
"""
import uvicorn
import sys
import os
from pathlib import Path

# Ensure we can import the app
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    print("🚀 Starting RAG Pipeline Server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📖 API docs at: http://localhost:8001/docs")
    print("🔍 Health check: http://localhost:8001/health")
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)
