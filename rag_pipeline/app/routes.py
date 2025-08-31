from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse, FileResponse
from typing import List
import time
import os
from pathlib import Path
from .models import (
    SearchRequest, SearchResponse, GenerateRequest, GenerateResponse,
    SearchResultItem, FacetsResponse, StatsResponse, HealthResponse,
    GenerationRequest, GenerationResponse, LegacySearchResponse, SearchFilters,
    EnhancedSearchResult
)
from .retriever_service import search_query, fetch_by_ids, get_retriever
from .generator_service import generate_from_selected
from .response_transformer import (
    transform_search_results, get_real_facets, get_real_stats,
    transform_generation_response
)
from .agentic_rag_service import get_agentic_rag_service


router = APIRouter()


def apply_filters(results: List[SearchResultItem], filters: SearchFilters) -> List[SearchResultItem]:
    """
    Apply client-side filtering to search results
    """
    filtered_results = results

    # Skip component type filtering since real data doesn't have component types
    # (Component type filters are cleared in the main route)

    # Filter by minimum score
    if filters.min_score is not None and filters.min_score > 0:
        filtered_results = [
            result for result in filtered_results
            if (result.final_score or result.similarity_score or 0) >= filters.min_score
        ]

    # Filter by tags (if provided)
    if filters.tags and len(filters.tags) > 0:
        filtered_results = [
            result for result in filtered_results
            if result.metadata and any(
                tag in (result.metadata.get('tags', []) or [])
                for tag in filters.tags
            )
        ]

    # Filter by sources (if provided)
    if filters.sources and len(filters.sources) > 0:
        filtered_results = [
            result for result in filtered_results
            if result.metadata and result.metadata.get('source') in filters.sources
        ]

    return filtered_results


@router.post("/search", response_model=SearchResponse)
def api_search(payload: SearchRequest):
    """
    Enhanced search endpoint supporting filters, pagination, and frontend format
    """
    start_time = time.time()

    # Extract parameters
    top_k = payload.top_k or 10
    page = payload.pagination.page if payload.pagination else 1
    page_size = payload.pagination.page_size if payload.pagination else 10

    # Apply reranking based on frontend config
    apply_reranking = True
    if payload.rerank:
        apply_reranking = payload.rerank.enabled

    # Clear component type filters since real data doesn't have them
    if payload.filters and payload.filters.component_types:
        payload.filters.component_types = []

    try:
        # Call backend search
        res = search_query(payload.query, top_k=top_k)

        # Apply client-side filtering if filters are provided
        filtered_results = res["results"]
        if payload.filters:
            filtered_results = apply_filters(filtered_results, payload.filters)

        # Transform to frontend format
        frontend_response = transform_search_results(
            backend_results=filtered_results,
            query=payload.query,
            total_candidates=len(filtered_results),
            reranking_applied=res["reranking_applied"],
            page=page,
            page_size=page_size,
            start_time=start_time
        )

        return frontend_response

    except Exception as e:
        print(f"❌ Search failed: {e}")
        # Return empty results instead of crashing
        return SearchResponse(
            results=[],
            total=0,
            page=page,
            page_size=page_size,
            elapsed_ms=int((time.time() - start_time) * 1000)
        )


@router.post("/search/agentic")
def api_agentic_search(payload: SearchRequest):
    """
    Agentic RAG search endpoint with Sequential Enhancement
    Combines Vector DB + Knowledge Graph + Web Search
    """
    start_time = time.time()

    # Clear component type filters since real data doesn't have them
    if payload.filters and payload.filters.component_types:
        payload.filters.component_types = []

    try:
        # Use Agentic RAG orchestrator
        agentic_service = get_agentic_rag_service()
        result = agentic_service.search(payload)

        print(f"✅ Agentic search completed: {result['total']} results")
        print(f"📊 Sources: Vector({result['vector_results_count']}) + KG({result['kg_enhancements_count']}) + Web({result['web_results_count']})")

        return {
            "results": result["results"],
            "total": result["total"],
            "page": payload.pagination.page if payload.pagination else 1,
            "page_size": payload.pagination.page_size if payload.pagination else 10,
            "elapsed_ms": result["elapsed_ms"],
            "agentic_info": {
                "vector_results_count": result["vector_results_count"],
                "kg_enhancements_count": result["kg_enhancements_count"],
                "web_results_count": result["web_results_count"],
                "sources_used": result["sources_used"]
            }
        }

    except Exception as e:
        print(f"❌ Agentic search failed: {e}")
        # Fallback to regular search
        return api_search(payload)


@router.post("/search/legacy", response_model=LegacySearchResponse)
def api_search_legacy(payload: SearchRequest):
    """
    Legacy search endpoint for backward compatibility
    """
    top_k = payload.top_k or None
    res = search_query(payload.query, top_k=top_k)
    return LegacySearchResponse(
        query=res["query"],
        results=res["results"],
        total_candidates=res["total_candidates"],
        reranking_applied=res["reranking_applied"]
    )


@router.post("/generate/legacy", response_model=GenerateResponse)
def api_generate_legacy(payload: GenerateRequest):
    """
    Legacy generation endpoint for backward compatibility
    """
    selected_items: List[SearchResultItem] = []
    if payload.selected_contents:
        for i, c in enumerate(payload.selected_contents):
            selected_items.append(SearchResultItem(id=f"input-{i}", content=c))
    elif payload.selected_ids:
        selected_items = fetch_by_ids(payload.selected_ids)
    else:
        raise HTTPException(status_code=400, detail="Provide selected_ids or selected_contents")

    out = generate_from_selected(payload.query, selected_items, model_key=payload.model_key)
    return GenerateResponse(query=out["query"], model_used=out["model_used"], validation_status=out["validation_status"], artifacts=out["artifacts"], context_used=out["context_used"])


@router.post("/feedback")
def api_feedback(query: str, document_id: str, sentiment: str, score: float = 1.0):
    rs = get_retriever()
    try:
        rs.record_feedback(query, document_id, sentiment, score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}


@router.get("/facets", response_model=FacetsResponse)
def api_get_facets():
    """
    Get available filter options for the frontend
    """
    facets_data = get_real_facets()
    return FacetsResponse(**facets_data)


@router.get("/stats", response_model=StatsResponse)
def api_get_stats():
    """
    Get system statistics for the dashboard
    """
    stats_data = get_real_stats()
    return StatsResponse(**stats_data)


@router.get("/health", response_model=HealthResponse)
def api_health():
    """
    Health check endpoint (enhanced version)
    """
    return HealthResponse(status="ok")


@router.post("/generate", response_model=GenerationResponse)
def api_generate_enhanced(payload: GenerationRequest):
    """
    Enhanced generation endpoint compatible with frontend
    """
    # Convert to legacy format for backend compatibility
    legacy_request = GenerateRequest(
        query=payload.query,
        selected_ids=payload.selected_ids,
        selected_contents=payload.selected_contents,
        model_key=payload.model_key,
        top_k=payload.top_k
    )

    # Call existing generation logic
    selected_items: List[SearchResultItem] = []
    if legacy_request.selected_contents:
        for i, c in enumerate(legacy_request.selected_contents):
            selected_items.append(SearchResultItem(id=f"input-{i}", content=c))
    elif legacy_request.selected_ids:
        selected_items = fetch_by_ids(legacy_request.selected_ids)
    else:
        raise HTTPException(status_code=400, detail="Provide selected_ids or selected_contents")

    backend_response = generate_from_selected(
        legacy_request.query,
        selected_items,
        model_key=legacy_request.model_key
    )

    # Transform to frontend format
    frontend_response = transform_generation_response(backend_response)
    return GenerationResponse(**frontend_response)


@router.get("/files/view")
async def view_file(path: str = Query(..., description="File path to view")):
    """
    View a file by its path. Returns file content as plain text or serves the file directly.
    """
    try:
        # Security: Only allow viewing files within the project directory
        project_root = Path(__file__).parent.parent.parent
        file_path = Path(path)

        # If path is relative, make it relative to project root
        if not file_path.is_absolute():
            file_path = project_root / file_path

        # Resolve to absolute path and check if it's within project
        file_path = file_path.resolve()

        # Security check: ensure file is within project directory
        try:
            file_path.relative_to(project_root.resolve())
        except ValueError:
            raise HTTPException(status_code=403, detail="Access denied: File outside project directory")

        # Check if file exists
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {path}")

        if not file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {path}")

        # For text files, return content as plain text
        text_extensions = {'.txt', '.md', '.py', '.js', '.ts', '.json', '.xml', '.html', '.css', '.yml', '.yaml', '.properties', '.groovy', '.java', '.xslt', '.wsdl'}

        if file_path.suffix.lower() in text_extensions:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return PlainTextResponse(content, media_type="text/plain; charset=utf-8")
            except UnicodeDecodeError:
                # If UTF-8 fails, try with different encoding
                try:
                    with open(file_path, 'r', encoding='latin-1') as f:
                        content = f.read()
                    return PlainTextResponse(content, media_type="text/plain; charset=latin-1")
                except Exception:
                    # If all text reading fails, serve as binary file
                    return FileResponse(file_path)
        else:
            # For binary files, serve directly
            return FileResponse(file_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
