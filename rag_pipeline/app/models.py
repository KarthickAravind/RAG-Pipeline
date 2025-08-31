from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal


# Enhanced models to match frontend expectations
class SearchFilters(BaseModel):
    component_types: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    min_score: Optional[float] = None


class RerankConfig(BaseModel):
    enabled: bool = True
    model: Optional[str] = "cross-encoder"
    weight_vector: Optional[Dict[str, float]] = None


class HybridConfig(BaseModel):
    lexical: bool = False
    alpha: Optional[float] = 0.5


class PaginationConfig(BaseModel):
    page: int = 1
    page_size: int = 10


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 10
    filters: Optional[SearchFilters] = None
    rerank: Optional[RerankConfig] = None
    hybrid: Optional[HybridConfig] = None
    pagination: Optional[PaginationConfig] = None


class SearchResultItem(BaseModel):
    id: str
    content: str
    similarity_score: Optional[float] = None
    cross_encoder_score: Optional[float] = None
    final_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


# Frontend-compatible search result format
class FrontendSearchResult(BaseModel):
    id: str
    title: Optional[str] = None
    snippet: str
    content_preview: Optional[str] = None
    metadata: Dict[str, Any] = {}
    scores: Dict[str, Optional[float]] = {}


class SearchResponse(BaseModel):
    results: List[FrontendSearchResult]
    total: int
    page: int = 1
    page_size: int = 10
    elapsed_ms: int = 0


# Legacy response for backward compatibility
class LegacySearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_candidates: int
    reranking_applied: bool


class GenerateRequest(BaseModel):
    query: str
    selected_ids: Optional[List[str]] = None
    selected_contents: Optional[List[str]] = None
    model_key: Optional[str] = None
    top_k: Optional[int] = None


class GenerateResponse(BaseModel):
    query: str
    model_used: str
    validation_status: str
    artifacts: Dict[str, str]
    context_used: List[str]


# Additional models for frontend endpoints
class FacetsResponse(BaseModel):
    component_types: List[str] = []
    tags: List[str] = []
    sources: List[str] = []
    date_range: Dict[str, Optional[str]] = {"min": None, "max": None}


class StatsResponse(BaseModel):
    collections: int = 0
    chunks: int = 0
    last_ingest_at: Optional[str] = None
    embedding_model: Optional[str] = None
    cross_encoder_model: Optional[str] = None
    pgvector_dims: Optional[int] = None


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


# Generation models for frontend compatibility
class GenerationRequest(BaseModel):
    query: str
    selected_ids: Optional[List[str]] = None
    selected_contents: Optional[List[str]] = None
    model_key: Optional[str] = None
    top_k: Optional[int] = 5


class GenerationResponse(BaseModel):
    query: str
    model_used: str
    validation_status: str
    artifacts: Dict[str, str]
    context_used: List[str]
    generated_code: Optional[str] = None
    output_type: Optional[str] = None


# Enhanced models for Agentic RAG with Knowledge Graph
class KnowledgeGraphResult(BaseModel):
    """Result from Knowledge Graph query"""
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    relationship_type: Optional[str] = None
    distance: Optional[int] = None
    properties: Dict[str, Any] = {}


class WebSearchResult(BaseModel):
    """Result from web search"""
    title: str
    url: str
    snippet: str
    published_date: Optional[str] = None
    source: Optional[str] = None
    relevance_score: Optional[float] = None


class EnhancedSearchResult(BaseModel):
    """Enhanced search result combining Vector DB + KG + Web"""
    # Original vector result
    id: str
    title: Optional[str] = None
    snippet: str
    content_preview: str
    metadata: Dict[str, Any]
    scores: Dict[str, float]

    # Knowledge Graph enhancements
    related_components: List[KnowledgeGraphResult] = []
    dependencies: List[KnowledgeGraphResult] = []
    integration_patterns: List[Dict[str, Any]] = []

    # Web search enhancements
    web_updates: List[WebSearchResult] = []
    latest_info: Optional[str] = None

    # Combined scoring
    final_relevance_score: float
    source_breakdown: Dict[str, float] = {}  # vector, kg, web scores


