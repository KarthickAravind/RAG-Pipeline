# SAP iFlow RAG Pipeline Setup Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Neo4j Database (cloud or local)
- Supabase Account
- Hugging Face Account

### 1. Clone Repository
```bash
git clone https://github.com/KarthickAravind/RAG-Pipeline.git
cd RAG-Pipeline
```

### 2. Backend Setup (rag_pipeline)
```bash
cd rag_pipeline

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Frontend Setup (RAG_Front)
```bash
cd RAG_Front/web

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API endpoint
```

### 4. Environment Configuration

#### Backend (.env)
Fill in these required values in `rag_pipeline/.env`:
- `HUGGINGFACEHUB_API_TOKEN`: Your Hugging Face API token
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `NEO4J_URI`: Your Neo4j database URI
- `NEO4J_USERNAME`: Your Neo4j username
- `NEO4J_PASSWORD`: Your Neo4j password

#### Frontend (.env)
Adjust these values in `RAG_Front/web/.env`:
- `VITE_UI_API_BASE`: Backend API URL (default: http://localhost:8001)

### 5. Run the Application

#### Start Backend
```bash
cd rag_pipeline
python start_server.py
```

#### Start Frontend
```bash
cd RAG_Front/web
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

## 🔧 Configuration Details

### Hugging Face Setup
1. Create account at https://huggingface.co
2. Go to Settings → Access Tokens
3. Create a new token with read permissions
4. Add to `HUGGINGFACEHUB_API_TOKEN` in .env

### Supabase Setup
1. Create project at https://supabase.com
2. Go to Settings → API
3. Copy Project URL and anon public key
4. Add to `SUPABASE_URL` and `SUPABASE_KEY` in .env

### Neo4j Setup
1. Create database at https://neo4j.com/cloud/aura/
2. Note the connection URI, username, and password
3. Add to Neo4j variables in .env

## 🎯 Features

- **Agentic RAG**: Multi-source intelligent search
- **Knowledge Graph Enhancement**: Business process context
- **Content-Aware Matching**: Contextually relevant results
- **Code Generation**: SAP iFlow code from search results
- **File Discovery**: Implementation examples and templates

## 🔍 Troubleshooting

### Common Issues
1. **Connection Errors**: Check your .env file credentials
2. **Port Conflicts**: Ensure ports 8001 and 5173 are available
3. **Module Not Found**: Ensure virtual environment is activated
4. **CORS Issues**: Check VITE_UI_API_BASE matches backend URL

### Getting Help
- Check the logs in terminal for error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed

## 📚 Documentation
- [Architecture Guide](rag_pipeline/docs/architecture.md)
- [API Documentation](http://localhost:8001/docs) (when running)
- [Frontend Components](RAG_Front/docs/)

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
