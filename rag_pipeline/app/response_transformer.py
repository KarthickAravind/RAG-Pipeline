"""
Response transformation service to convert backend responses to frontend-compatible format
"""
import time
from typing import List, Dict, Any
from .models import SearchResultItem, FrontendSearchResult, SearchResponse


def transform_search_results(
    backend_results: List[SearchResultItem],
    query: str,
    total_candidates: int,
    reranking_applied: bool,
    page: int = 1,
    page_size: int = 10,
    start_time: float = None
) -> SearchResponse:
    """
    Transform backend search results to frontend-compatible format
    """
    elapsed_ms = int((time.time() - start_time) * 1000) if start_time else 0
    
    frontend_results = []
    for item in backend_results:
        # Extract component type from metadata
        component_type = None
        if item.metadata:
            component_type = item.metadata.get('component_type') or item.metadata.get('type')
        
        # Show full content instead of snippet (user wants to see complete content)
        snippet = item.content
        
        # Create title from content or metadata
        title = None
        if item.metadata and 'file_name' in item.metadata:
            title = item.metadata['file_name']
        elif item.metadata and 'title' in item.metadata:
            title = item.metadata['title']
        else:
            # Generate title from first line of content
            first_line = item.content.split('\n')[0][:50]
            title = first_line + "..." if len(first_line) == 50 else first_line
        
        # Transform metadata
        transformed_metadata = {
            "doc_id": item.id,
            "component_type": component_type,
            "file_name": item.metadata.get('file_name') if item.metadata else None,
            "path": item.metadata.get('path') if item.metadata else None,
            "tags": item.metadata.get('tags', []) if item.metadata else [],
            "created_at": item.metadata.get('created_at') if item.metadata else None,
            "size_bytes": len(item.content.encode('utf-8')),
            "source": item.metadata.get('source') if item.metadata else None,
        }
        
        # Transform scores
        scores = {
            "vector": item.similarity_score,
            "cross_encoder": item.cross_encoder_score,
            "metadata_boost": None,  # Not available in current backend
            "hybrid": None,  # Not available in current backend
            "final": item.final_score or item.similarity_score or 0.0
        }
        
        frontend_result = FrontendSearchResult(
            id=item.id,
            title=title,
            snippet=snippet,
            content_preview=item.content,  # Full content for modal
            metadata=transformed_metadata,
            scores=scores
        )
        
        frontend_results.append(frontend_result)
    
    return SearchResponse(
        results=frontend_results,
        total=total_candidates,
        page=page,
        page_size=page_size,
        elapsed_ms=elapsed_ms
    )


def get_real_facets() -> Dict[str, Any]:
    """
    Get facets data from the real retrieval system
    TODO: Connect to real system to get actual facets
    """
    # For now, return basic structure - should be replaced with real data
    return {
        "component_types": [
            "Groovy",
            "WSDL",
            "XSLT",
            "BPMN",
            "Properties",
            "XML",
            "Other"
        ],
        "tags": [],  # Will be populated from real data
        "sources": [],  # Will be populated from real data
        "date_range": {
            "min": None,
            "max": None
        }
    }


def get_real_stats() -> Dict[str, Any]:
    """
    Get statistics from the real retrieval system
    TODO: Connect to real system to get actual stats
    """
    # For now, return basic structure - should be replaced with real data
    return {
        "collections": 1,
        "chunks": 0,  # Will be populated from real data
        "last_ingest_at": None,
        "embedding_model": "microsoft/codebert-base",
        "cross_encoder_model": "cross-encoder/ms-marco-MiniLM-L-6-v2",
        "pgvector_dims": 768
    }


def transform_generation_response(
    backend_response: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Transform generation response to frontend format
    """
    # Extract generated code from artifacts
    generated_code = None
    output_type = None
    
    if backend_response.get("artifacts"):
        artifacts = backend_response["artifacts"]
        if "groovy" in artifacts:
            generated_code = artifacts["groovy"]
            output_type = "groovy"
        elif "xml" in artifacts:
            generated_code = artifacts["xml"]
            output_type = "xml"
        elif "properties" in artifacts:
            generated_code = artifacts["properties"]
            output_type = "properties"
        elif "xslt" in artifacts:
            generated_code = artifacts["xslt"]
            output_type = "xslt"
    
    return {
        "query": backend_response.get("query", ""),
        "model_used": backend_response.get("model_used", "unknown"),
        "validation_status": backend_response.get("validation_status", "unchecked"),
        "artifacts": backend_response.get("artifacts", {}),
        "context_used": backend_response.get("context_used", []),
        "generated_code": generated_code,
        "output_type": output_type
    }
