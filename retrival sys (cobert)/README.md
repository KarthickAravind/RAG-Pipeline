### Retrieval + Reranking (Supabase client-side cosine)

- **Embeddings**: `microsoft/codebert-base` mean-pooled for queries
- **Store**: Supabase Postgres table `documents` containing precomputed embeddings in a column
- **Search**: fetch embeddings from Supabase, compute cosine similarity client-side (no SQL/RPC)
- **Rerank**: Cross-Encoder + feedback-aware

### Setup

1) Install
```
pip install -e .
```

2) Environment `.env`
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
HF_TOKEN=your_hf_token
TABLE_NAME=documents
VECTOR_COLUMN=embedding
CONTENT_COLUMN=content
ID_COLUMN=id
EMBEDDING_MODEL=microsoft/codebert-base
MAX_LENGTH=256
```

3) Data in Supabase
- Ensure table `documents` has columns: `id`, `content`, and `embedding` (array of floats).
- Precompute and store embeddings for your documents in `embedding`.

### Usage

CLI:
```
python -m src.cli "your query here" --user user123 --topk 5
```
- It prints top results with Final Score, Similarity, Cross-Encoder, and Chunk ID (row id).
- Then it prompts for helpfulness: y/n/skip.
- It re-ranks and prints again.

### Notes
- No SQL functions or RPC are required. The app only reads rows and calculates cosine similarity locally.
