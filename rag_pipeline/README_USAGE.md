# RAG Pipeline - Usage Guide

## 🚀 Quick Start

Your integrated RAG pipeline is now ready! Here's how to use it:

### 1. Start the Server
```bash
cd "e:\A RAG Pipeline\Program\rag_pipeline"
python start_server.py
```

The server will be available at:
- **API**: http://localhost:8001
- **Docs**: http://localhost:8001/docs
- **Health**: http://localhost:8001/health

### 2. Test the Pipeline
```bash
# Test all endpoints
python test_api.py

# Test basic functionality
python test_simple.py
```

## 📡 API Endpoints

### POST /search
Retrieve relevant SAP iFlow chunks using vector similarity + reranking.

```json
{
  "query": "create groovy script for data mapping",
  "top_k": 5
}
```

**Response:**
```json
{
  "query": "create groovy script for data mapping",
  "results": [
    {
      "id": "chunk-123",
      "content": "def Message processData(Message message) { ... }",
      "similarity_score": 0.95,
      "cross_encoder_score": 0.93,
      "final_score": 0.98,
      "metadata": {"component_type": "groovy"}
    }
  ],
  "total_candidates": 50,
  "reranking_applied": true
}
```

### POST /generate
Generate SAP iFlow artifacts using retrieved context.

```json
{
  "query": "create groovy script for data mapping",
  "selected_ids": ["chunk-123", "chunk-456"],
  "model_key": "mistral"
}
```

**Response:**
```json
{
  "query": "create groovy script for data mapping",
  "model_used": "mistralai/Mistral-7B-Instruct-v0.3",
  "validation_status": "valid",
  "artifacts": {
    "groovy": "def Message processData(Message message) {\n  // Generated code\n  return message\n}"
  },
  "context_used": ["chunk-123", "chunk-456"]
}
```

### POST /feedback
Record user feedback to improve retrieval quality.

```
POST /feedback?query=test&document_id=chunk-123&sentiment=positive&score=1.0
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required
HUGGINGFACEHUB_API_TOKEN=hf_xxx
HF_TOKEN=hf_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# Optional
GEN_TOP_K=5
MAX_CONTEXT_CHARS=12000
TABLE_NAME=documents
EMBEDDING_MODEL=microsoft/codebert-base
```

### Supported Artifact Types
- **groovy**: Groovy scripts for data processing
- **xml**: SAP iFlow XML configurations  
- **properties**: Configuration properties files
- **xslt**: XSLT transformation mappings

### Supported Models
- **mistral**: Mistral-7B-Instruct (default for groovy)
- **zephyr**: Zephyr-7b-beta (for properties/xslt)

## 🎯 Usage Examples

### Example 1: Generate Groovy Script
```python
import requests

# Search for relevant chunks
search_response = requests.post("http://localhost:8001/search", json={
    "query": "create groovy script for XML parsing",
    "top_k": 3
})

# Generate code using top results
generate_response = requests.post("http://localhost:8001/generate", json={
    "query": "create groovy script for XML parsing", 
    "selected_ids": [r["id"] for r in search_response.json()["results"]],
    "model_key": "mistral"
})

print(generate_response.json()["artifacts"]["groovy"])
```

### Example 2: Generate XML Configuration
```python
generate_response = requests.post("http://localhost:8001/generate", json={
    "query": "create XML configuration for HTTP adapter",
    "selected_contents": [
        "<adapter>HTTP configuration example</adapter>",
        "<connection>Sample connection settings</connection>"
    ]
})

print(generate_response.json()["artifacts"]["xml"])
```

## 🔍 Data Flow

1. **Query Input** → User provides natural language query
2. **Embedding** → Query embedded using CodeBERT
3. **Vector Search** → Similarity search in Supabase (568 documents)
4. **Reranking** → Cross-encoder + feedback-based reranking  
5. **Context Building** → Top chunks assembled with metadata
6. **LLM Generation** → Mistral/Zephyr generates artifacts
7. **Validation** → XML/properties syntax validation
8. **Response** → Structured artifacts returned

## 🐛 Troubleshooting

### Server Won't Start
- Check dependencies: `pip install -r requirements.txt`
- Verify environment variables in `.env`
- Check port 8001 availability

### Search Returns No Results
- Verify Supabase connection
- Check if documents are loaded in database
- Try broader search queries

### Generation Fails
- Check HuggingFace token validity
- Verify model availability
- Try different model_key (mistral/zephyr)

### Import Errors
- Ensure Python path includes retrieval system
- Check all dependencies installed
- Verify file paths in p2 module

## 📊 Performance

- **Database**: 568 SAP iFlow documents indexed
- **Embedding Model**: microsoft/codebert-base (768 dimensions)
- **Response Time**: ~2-5 seconds for search + generation
- **Context Limit**: 12,000 characters max
- **Concurrent Users**: Supported via FastAPI async

## 🎉 Success!

Your RAG pipeline successfully integrates:
- ✅ Person 2's retrieval system (vector search + reranking)
- ✅ Person 3's generation pipeline (LLM + validation)
- ✅ Unified FastAPI interface
- ✅ Real Supabase vector database
- ✅ SAP iFlow-specific optimizations
