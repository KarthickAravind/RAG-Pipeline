# RAG Pipeline Tests

This folder contains all test files for the RAG Pipeline project.

## Test Files

### `test_api.py`
- **Purpose**: Complete API endpoint testing
- **Usage**: `python test_api.py`
- **Tests**: /search, /generate, /feedback endpoints
- **Requirements**: Server must be running on localhost:8001

### `test_simple.py` 
- **Purpose**: Basic functionality and import testing
- **Usage**: `python test_simple.py`
- **Tests**: Environment, Supabase connection, FastAPI imports
- **Requirements**: All dependencies installed

### `test_pipeline.py`
- **Purpose**: End-to-end pipeline testing
- **Usage**: `python test_pipeline.py`
- **Tests**: Retrieval → Generation flow
- **Requirements**: Server running + dependencies

### `test_env.py`
- **Purpose**: Environment and dependency verification
- **Usage**: `python test_env.py`
- **Tests**: Environment variables, package imports
- **Requirements**: .env file configured

## Running Tests

From the main rag_pipeline directory:

```bash
# Run all tests
cd tests
python test_simple.py
python test_env.py
python test_api.py      # Requires server running
python test_pipeline.py # Requires server running
```

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured
2. **Dependencies**: Run `pip install -r requirements.txt`
3. **Server**: Start server with `python start_server.py` for API tests
4. **Database**: Supabase connection must be active

## Expected Results

- ✅ All imports successful
- ✅ Environment variables loaded
- ✅ Supabase connection (568 documents)
- ✅ API endpoints responding
- ✅ End-to-end generation working
