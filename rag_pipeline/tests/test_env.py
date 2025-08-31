#!/usr/bin/env python3
"""
Environment and dependency test script
"""
from dotenv import load_dotenv
import os

def test_environment():
    load_dotenv()
    
    print("Environment Variables:")
    print(f"HF_TOKEN: {'✓' if os.getenv('HF_TOKEN') else '✗'}")
    print(f"SUPABASE_URL: {'✓' if os.getenv('SUPABASE_URL') else '✗'}")
    print(f"SUPABASE_KEY: {'✓' if os.getenv('SUPABASE_KEY') else '✗'}")
    
    print("\nTesting imports...")
    try:
        import fastapi
        print("✓ FastAPI")
    except ImportError:
        print("✗ FastAPI")
    
    try:
        import supabase
        print("✓ Supabase")
    except ImportError:
        print("✗ Supabase")
    
    try:
        import torch
        print("✓ PyTorch")
    except ImportError:
        print("✗ PyTorch")
    
    try:
        import transformers
        print("✓ Transformers")
    except ImportError:
        print("✗ Transformers")
    
    try:
        import sentence_transformers
        print("✓ Sentence Transformers")
    except ImportError:
        print("✗ Sentence Transformers")

if __name__ == "__main__":
    test_environment()
