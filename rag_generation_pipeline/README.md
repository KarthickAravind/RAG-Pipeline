## Person 3 — SAP iFlow RAG Generation (Free HF)

FastAPI service that retrieves context and generates SAP iFlow artifacts using Hugging Face Inference endpoints via LangChain.

### Setup
- Create and populate an `.env` file (values below):
```
HUGGINGFACEHUB_API_TOKEN=your_hf_token_here
RETRIEVER_BASE_URL=http://localhost:8000
GEN_TOP_K=5
MAX_CONTEXT_CHARS=12000
```
- Install dependencies:
```
pip install -r requirements.txt
```

### Run
```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Endpoints
- GET `/health` → `{ "ok": true }`
- POST `/generate` → body `{ query: string, top_k?: number, model_id?: string }`
  - Response: `{ query, model_used, validation_status, output_type, generated_output, context_used }`


