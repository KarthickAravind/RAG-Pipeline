# Quick Start Guide

Get the SAP iFlow RAG Pipeline running in minutes with this step-by-step guide.

## 🚀 One-Command Startup

The fastest way to get started is using Docker Compose:

```bash
docker-compose up -d
```

This single command will:
- Start ChromaDB vector database
- Launch the FastAPI backend
- Start the React frontend
- Set up all networking between services

## 🌐 Access Your Application

Once all services are running, access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **ChromaDB**: http://localhost:8000

## 📝 First Steps

### 1. Check System Status
Navigate to the **Home** tab to see system overview and statistics.

### 2. Ingest Your First Document
1. Go to the **Ingest** tab
2. Choose **Text Input** for a quick test
3. Enter some SAP iFlow content
4. Add a title and tags
5. Click **Ingest Document**

### 3. Start Chatting
1. Go to the **Chat** tab
2. Ask a question about your ingested content
3. View the AI-generated response with source citations

## 🔧 Troubleshooting

### Service Not Starting?
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Port Conflicts?
If ports 3000, 8000, or 8001 are already in use:

```bash
# Stop conflicting services
docker-compose down

# Or modify ports in docker-compose.yml
```

### Frontend Not Loading?
```bash
# Check if frontend is building
docker-compose logs web

# Rebuild if needed
docker-compose build web
docker-compose up web
```

## 📊 Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "chroma_ready": true,
  "embeddings_ready": true,
  "collections": ["documents"],
  "total_documents": 0
}
```

### Frontend Status
Open http://localhost:3000 in your browser. You should see:
- Clean, professional interface
- Navigation sidebar with 4 tabs
- System status indicators
- Quick action cards

## 🎯 Next Steps

1. **Ingest Documents**: Add your SAP iFlow documentation
2. **Configure Settings**: Adjust chunk sizes and retrieval parameters
3. **Test Queries**: Ask questions about your content
4. **Explore API**: Check out the interactive API documentation

## 🆘 Need Help?

- Check the [main README](../README.md) for detailed documentation
- Review API docs at http://localhost:8001/docs
- Check service logs: `docker-compose logs -f [service-name]`

---

**You're all set! 🎉** Your SAP iFlow RAG Pipeline is now running and ready to use.
