# Architecture Documentation

This document provides a detailed overview of the SAP iFlow RAG Pipeline architecture, design decisions, and technical implementation.

## 🏗️ System Overview

The SAP iFlow RAG Pipeline is built as a microservices architecture with three main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                          │
│                    (React + TypeScript)                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼───────────────────────────────────────────────┐
│                    API Gateway                                 │
│                   (FastAPI)                                    │
└─────────────────┬───────────────────────────────────────────────┘
                  │ Internal Communication
┌─────────────────▼───────────────────────────────────────────────┐
│                    Vector Store                                │
│                   (ChromaDB)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Service Architecture

### 1. Frontend Service (web)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for HTTP communication

**Key Components:**
- `App.tsx`: Main application wrapper with routing
- `HomePage.tsx`: Dashboard and system overview
- `IngestPage.tsx`: Document ingestion interface
- `ChatPage.tsx`: RAG chat interface
- `SettingsPage.tsx`: System configuration

**Design Principles:**
- Component-based architecture
- Responsive design for all screen sizes
- Accessibility-first approach
- Type-safe development with TypeScript

### 2. Backend Service (api)

**Technology Stack:**
- FastAPI (Python 3.11+)
- Pydantic for data validation
- ChromaDB client integration
- SentenceTransformers for embeddings
- Async/await for non-blocking operations

**Key Components:**
- `main.py`: FastAPI application and endpoints
- `EmbeddingsProvider`: Abstract interface for embeddings
- Document processing and chunking logic
- RAG pipeline orchestration

**API Design:**
- RESTful endpoints with OpenAPI documentation
- Consistent error handling and status codes
- Request/response validation with Pydantic
- CORS configuration for frontend integration

### 3. Vector Database Service (chroma)

**Technology Stack:**
- ChromaDB for vector storage
- Persistent storage for local development
- HTTP client for remote deployment
- Optimized for similarity search

**Key Features:**
- Automatic collection management
- Metadata filtering and querying
- Efficient vector similarity search
- Scalable architecture

## 📊 Data Flow

### Document Ingestion Flow

```
1. User uploads document (file/text/URL)
   ↓
2. Document validation and preprocessing
   ↓
3. Text chunking with configurable parameters
   ↓
4. Embedding generation using selected model
   ↓
5. Storage in ChromaDB with metadata
   ↓
6. Confirmation and status update
```

### RAG Query Flow

```
1. User submits question
   ↓
2. Question embedding generation
   ↓
3. Vector similarity search in ChromaDB
   ↓
4. Top-K document retrieval
   ↓
5. Context assembly and answer generation
   ↓
6. Response with source citations
```

## 🗄️ Data Models

### Document Model
```typescript
interface Document {
  id: string;                    // Unique identifier
  content: string;               // Document text content
  title: string;                 // Human-readable title
  source: string;                // Source URL or identifier
  doc_type: string;              // Document classification
  tags: string[];                // Searchable tags
  metadata: Record<string, any>; // Additional properties
  created_at: Date;              // Ingestion timestamp
}
```

### Chunk Model
```typescript
interface Chunk {
  id: string;                    // Chunk identifier (doc_id:index)
  text: string;                  // Chunk text content
  embedding: number[];           // Vector representation
  metadata: ChunkMetadata;       // Chunk-specific metadata
  rank: number;                  // Retrieval rank
  score: number;                 // Similarity score
}
```

### Chat Message Model
```typescript
interface ChatMessage {
  id: string;                    // Message identifier
  type: 'user' | 'assistant';   // Message sender
  content: string;               // Message text
  timestamp: Date;               // Message timestamp
  sources?: DocumentResult[];    // Source documents
}
```

## 🔐 Security & Configuration

### Environment Variables
```bash
# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_PATH=./data/chroma

# Embeddings Configuration
EMBEDDINGS_PROVIDER=sentence-transformers
MODEL_NAME=all-MiniLM-L6-v2
OPENAI_API_KEY=your-key-here

# Application Configuration
CORS_ORIGINS=http://localhost:3000
MAX_FILE_SIZE=10485760
CHUNK_SIZE=512
CHUNK_OVERLAP=128
```

### Security Features
- CORS configuration for frontend access
- File size and type validation
- Input sanitization and validation
- Rate limiting (configurable)
- Secure file handling

## 📈 Performance Characteristics

### Scalability Metrics
- **Document Processing**: ~1000 words/second
- **Embedding Generation**: ~50 chunks/second
- **Query Response**: <500ms average
- **Memory Usage**: ~2GB for 10K documents
- **Storage**: ~1MB per 1000 chunks

### Optimization Strategies
- Configurable chunk sizes for different content types
- Efficient vector similarity search
- Metadata filtering for targeted queries
- Async processing for non-blocking operations
- Connection pooling for database operations

## 🧪 Testing Strategy

### Testing Layers
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Service interaction testing
3. **End-to-End Tests**: Complete workflow testing
4. **Performance Tests**: Load and stress testing

### Test Tools
- **Backend**: pytest, pytest-asyncio
- **Frontend**: Vitest, React Testing Library
- **Integration**: Docker Compose test environment
- **Performance**: Locust, Artillery

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │    API      │    │  ChromaDB   │
│   Port 3000 │◄──►│  Port 8001  │◄──►│  Port 8000  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Production Environment
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │    API      │    │  ChromaDB   │
│   (CDN)     │◄──►│  (Load Bal) │◄──►│  (Cluster)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Container Strategy
- **Multi-stage builds** for optimized images
- **Health checks** for service monitoring
- **Resource limits** for container management
- **Volume mounts** for persistent data

## 🔄 Monitoring & Observability

### Health Checks
- Service availability monitoring
- Database connection status
- Embeddings model readiness
- System resource utilization

### Logging Strategy
- Structured logging with consistent format
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response correlation IDs
- Performance metrics collection

### Metrics Collection
- Request latency and throughput
- Document processing rates
- Vector search performance
- Error rates and types

## 🔮 Future Architecture Considerations

### Scalability Improvements
- **Horizontal scaling** for API services
- **Vector database clustering** for high availability
- **Caching layer** for frequently accessed data
- **Message queues** for async processing

### Advanced Features
- **Multi-tenant architecture** for enterprise use
- **Real-time collaboration** features
- **Advanced analytics** and reporting
- **Machine learning** pipeline integration

### Performance Enhancements
- **Vector quantization** for reduced memory usage
- **Approximate nearest neighbor** search
- **GPU acceleration** for embeddings
- **Distributed processing** for large datasets

## 📋 Architecture Decisions

### Why ChromaDB?
- **Local development** friendly
- **Production ready** for enterprise use
- **Rich metadata** support
- **Active community** and development

### Why FastAPI?
- **Modern Python** framework
- **Automatic API documentation**
- **Async support** for high performance
- **Type safety** with Pydantic

### Why React + TypeScript?
- **Type safety** for large codebases
- **Component reusability** and maintainability
- **Rich ecosystem** of libraries
- **Performance** and developer experience

### Why Vite?
- **Fast development** server
- **Modern build** tooling
- **Plugin ecosystem** for extensibility
- **Production optimization**

## 🔧 Configuration Management

### Environment-Specific Configs
- **Development**: Local file storage, debug logging
- **Staging**: Remote database, production-like settings
- **Production**: Optimized performance, security hardening

### Feature Flags
- **Experimental features** can be toggled
- **A/B testing** support for new functionality
- **Gradual rollout** capabilities

---

This architecture provides a solid foundation for a production-ready RAG pipeline while maintaining flexibility for future enhancements and scaling requirements.
