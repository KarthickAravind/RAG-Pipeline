"""
Agentic RAG Service - Sequential Enhancement Implementation
Orchestrates Vector DB + Knowledge Graph + Web Search for comprehensive results
"""
import time
from typing import List, Dict, Any, Optional
from .retriever_service import search_query
from .knowledge_graph_service import get_knowledge_graph_service
from .models import (
    SearchResultItem, EnhancedSearchResult, KnowledgeGraphResult, 
    WebSearchResult, SearchRequest
)


class AgenticRAGOrchestrator:
    """
    Orchestrates the Sequential Enhancement approach:
    1. Vector DB Search (foundation)
    2. Knowledge Graph Enhancement (relationships)
    3. Web Search Augmentation (latest info)
    4. Intelligent Fusion (combine all sources)
    """
    
    def __init__(self):
        self.kg_service = get_knowledge_graph_service()
        
    def search(self, request: SearchRequest) -> Dict[str, Any]:
        """
        Main search method implementing Sequential Enhancement
        """
        start_time = time.time()
        
        # Step 1: Vector DB Foundation
        print(f"🔍 Step 1: Vector search for '{request.query}'")
        vector_results = self._vector_search(request)
        
        # Step 2: Knowledge Graph Enhancement
        print(f"🕸️ Step 2: Enhancing with Knowledge Graph")
        enhanced_results = self._enhance_with_knowledge_graph(vector_results, request.query)
        
        # Step 3: Web Search Augmentation (placeholder for now)
        print(f"🌐 Step 3: Web search augmentation")
        final_results = self._augment_with_web_search(enhanced_results, request.query)
        
        # Step 4: Intelligent Fusion and Ranking
        print(f"🎯 Step 4: Final fusion and ranking")
        fused_results = self._intelligent_fusion(final_results, request.query)
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        return {
            "results": fused_results,
            "total": len(fused_results),
            "vector_results_count": len(vector_results),
            "kg_enhancements_count": sum(1 for r in fused_results if r.related_components),
            "web_results_count": sum(1 for r in fused_results if r.web_updates),
            "elapsed_ms": elapsed_ms,
            "sources_used": ["vector_db", "knowledge_graph"]  # web_search when implemented
        }
    
    def _vector_search(self, request: SearchRequest) -> List[SearchResultItem]:
        """Step 1: Get foundation results from Vector DB"""
        try:
            result = search_query(request.query, top_k=request.top_k or 10)
            return result.get("results", [])
        except Exception as e:
            print(f"❌ Vector search failed: {e}")
            return []
    
    def _enhance_with_knowledge_graph(self, vector_results: List[SearchResultItem], query: str) -> List[EnhancedSearchResult]:
        """Step 2: Enhance vector results with Knowledge Graph relationships"""
        enhanced_results = []
        
        for vector_result in vector_results:
            # Convert to enhanced result
            enhanced = EnhancedSearchResult(
                id=vector_result.id,
                title=self._generate_title(vector_result),
                snippet=vector_result.content,
                content_preview=vector_result.content,
                metadata=vector_result.metadata or {},
                scores={
                    "vector": vector_result.similarity_score or 0,
                    "cross_encoder": vector_result.cross_encoder_score or 0,
                    "final": vector_result.final_score or 0
                },
                final_relevance_score=vector_result.final_score or 0,
                source_breakdown={"vector": 1.0, "kg": 0.0, "web": 0.0}
            )
            
            # Content-Aware KG Enhancement
            try:
                # Extract keywords from the actual content
                content_keywords = self._extract_content_keywords(vector_result.content, query)
                print(f"🔍 Content keywords: {content_keywords}")

                # Strategy 1: Find business process steps related to content
                business_keywords = self._extract_business_keywords(vector_result.content, query)
                if business_keywords:
                    related_steps = self.kg_service.find_business_process_steps(business_keywords)
                    enhanced.related_components = [
                        KnowledgeGraphResult(**step) for step in related_steps
                    ]

                # Strategy 2: Find any relevant SAP iFlow components
                if not enhanced.related_components:
                    fallback_components = self.kg_service.find_any_relevant_components(content_keywords)
                    enhanced.related_components = [
                        KnowledgeGraphResult(**comp) for comp in fallback_components
                    ]

                # Strategy 3: Find file-based relationships (since your KG has File nodes)
                file_relationships = self.kg_service.find_related_files(content_keywords)
                if file_relationships:
                    enhanced.dependencies = [
                        KnowledgeGraphResult(**file_rel) for file_rel in file_relationships
                    ]

                # Update scoring based on content relevance
                if enhanced.related_components or enhanced.dependencies:
                    # Higher boost for content-aware matches
                    content_relevance = len(content_keywords) * 0.01
                    kg_boost = min(0.15, len(enhanced.related_components) * 0.02 + content_relevance)
                    enhanced.final_relevance_score += kg_boost
                    enhanced.source_breakdown["kg"] = kg_boost

            except Exception as e:
                print(f"⚠️ Content-aware KG enhancement failed for {vector_result.id}: {e}")
            
            enhanced_results.append(enhanced)
        
        return enhanced_results
    
    def _augment_with_web_search(self, enhanced_results: List[EnhancedSearchResult], query: str) -> List[EnhancedSearchResult]:
        """Step 3: Augment with web search (placeholder implementation)"""
        # TODO: Implement web search integration
        # For now, just return the enhanced results as-is
        
        # Placeholder logic to identify queries that would benefit from web search
        if self._needs_web_search(query):
            print("🌐 Query identified as needing web search (not implemented yet)")
            # Future: Add web search results to enhanced_results[].web_updates
        
        return enhanced_results
    
    def _intelligent_fusion(self, results: List[EnhancedSearchResult], query: str) -> List[EnhancedSearchResult]:
        """Step 4: Final fusion and intelligent ranking"""
        
        # Re-rank based on combined signals
        for result in results:
            # Calculate final relevance score
            vector_score = result.scores.get("final", 0)
            kg_boost = len(result.related_components) * 0.02 + len(result.dependencies) * 0.03
            web_boost = len(result.web_updates) * 0.05  # Future web search boost
            
            result.final_relevance_score = vector_score + kg_boost + web_boost
            result.source_breakdown = {
                "vector": vector_score / (vector_score + kg_boost + web_boost) if (vector_score + kg_boost + web_boost) > 0 else 1.0,
                "kg": kg_boost / (vector_score + kg_boost + web_boost) if (vector_score + kg_boost + web_boost) > 0 else 0.0,
                "web": web_boost / (vector_score + kg_boost + web_boost) if (vector_score + kg_boost + web_boost) > 0 else 0.0
            }
        
        # Sort by final relevance score
        results.sort(key=lambda x: x.final_relevance_score, reverse=True)
        
        return results
    
    def _generate_title(self, vector_result: SearchResultItem) -> str:
        """Generate title from vector result"""
        if vector_result.metadata and vector_result.metadata.get('file_name'):
            return vector_result.metadata['file_name']
        
        # Generate from first line of content
        first_line = vector_result.content.split('\n')[0][:50]
        return first_line + "..." if len(first_line) == 50 else first_line
    
    def _is_component_query(self, query: str) -> bool:
        """Check if query is asking about specific components"""
        component_keywords = ["adapter", "connector", "script", "mapping", "flow", "component"]
        return any(keyword in query.lower() for keyword in component_keywords)
    
    def _is_integration_query(self, query: str) -> bool:
        """Check if query is asking about integration patterns"""
        integration_keywords = ["integrate", "connect", "flow", "process", "pattern"]
        return any(keyword in query.lower() for keyword in integration_keywords)

    def _is_adapter_query(self, query: str) -> bool:
        """Check if query is asking about adapters"""
        adapter_keywords = ["adapter", "https", "http", "soap", "rest", "sftp", "certificate", "ssl", "tls"]
        return any(keyword in query.lower() for keyword in adapter_keywords)

    def _extract_adapter_type(self, query: str) -> Optional[str]:
        """Extract adapter type from query"""
        query_lower = query.lower()
        if "https" in query_lower or "ssl" in query_lower or "certificate" in query_lower:
            return "HTTPS"
        elif "http" in query_lower:
            return "HTTP"
        elif "soap" in query_lower:
            return "SOAP"
        elif "rest" in query_lower:
            return "REST"
        elif "sftp" in query_lower:
            return "SFTP"
        return "adapter"  # Generic fallback
    
    def _extract_component_name(self, content: str) -> Optional[str]:
        """Extract component name from content (simple heuristic)"""
        # Simple extraction - can be enhanced with NLP
        lines = content.split('\n')[:5]  # Check first 5 lines
        for line in lines:
            if 'class' in line or 'function' in line or 'adapter' in line.lower():
                # Extract potential component name
                words = line.split()
                for word in words:
                    if len(word) > 3 and word.isalnum():
                        return word
        return None
    
    def _find_integration_patterns(self, query: str, vector_result: SearchResultItem) -> List[Dict[str, Any]]:
        """Find integration patterns relevant to the query"""
        try:
            # Extract system names from query (simple approach)
            systems = self._extract_system_names(query)
            if len(systems) >= 2:
                return self.kg_service.find_integration_patterns(systems[0], systems[1])
        except Exception as e:
            print(f"⚠️ Integration pattern search failed: {e}")
        return []
    
    def _extract_system_names(self, query: str) -> List[str]:
        """Extract system names from query"""
        # Simple keyword matching - can be enhanced
        known_systems = ["SAP", "S4HANA", "ERP", "CPI", "SOAP", "REST", "HTTP", "SFTP"]
        found_systems = []
        query_upper = query.upper()
        
        for system in known_systems:
            if system in query_upper:
                found_systems.append(system)
        
        return found_systems[:2]  # Return max 2 systems
    
    def _needs_web_search(self, query: str) -> bool:
        """Determine if query needs web search augmentation"""
        web_keywords = ["latest", "new", "update", "2024", "recent", "current"]
        return any(keyword in query.lower() for keyword in web_keywords)

    def _extract_content_keywords(self, content: str, query: str) -> List[str]:
        """Extract relevant keywords from content for KG enhancement"""
        # Combine query and content keywords
        all_text = f"{query} {content}".lower()

        # SAP iFlow specific keywords
        sap_keywords = [
            "certificate", "ssl", "tls", "https", "http", "soap", "rest", "sftp",
            "adapter", "mapping", "groovy", "xslt", "xml", "json",
            "authentication", "oauth", "basic", "keystore", "truststore",
            "s4hana", "erp", "crm", "successfactors", "ariba", "concur",
            "integration", "iflow", "process", "message", "payload",
            "transformation", "routing", "splitter", "aggregator",
            "error", "exception", "retry", "timeout", "connection"
        ]

        # Find keywords that appear in the content
        found_keywords = []
        for keyword in sap_keywords:
            if keyword in all_text:
                found_keywords.append(keyword)

        return found_keywords[:8]  # Limit to top 8 keywords

    def _extract_config_keywords(self, content: str) -> List[str]:
        """Extract configuration-related keywords from content"""
        config_keywords = [
            "timeout", "connection", "port", "host", "url", "endpoint",
            "username", "password", "token", "key", "secret",
            "certificate", "keystore", "truststore", "alias",
            "property", "parameter", "configuration", "setting",
            "authentication", "authorization", "security"
        ]

        content_lower = content.lower()
        found_config = []
        for keyword in config_keywords:
            if keyword in content_lower:
                found_config.append(keyword)

        return found_config[:5]  # Limit to top 5 config keywords

    def _extract_adapter_mentions(self, content: str) -> List[str]:
        """Extract adapter types mentioned in content"""
        content_lower = content.lower()
        adapter_types = []

        # Check for specific adapter mentions
        if "https" in content_lower or "ssl" in content_lower or "certificate" in content_lower:
            adapter_types.append("HTTPS")
        if "http" in content_lower and "https" not in content_lower:
            adapter_types.append("HTTP")
        if "soap" in content_lower:
            adapter_types.append("SOAP")
        if "rest" in content_lower:
            adapter_types.append("REST")
        if "sftp" in content_lower or "ftp" in content_lower:
            adapter_types.append("SFTP")
        if "mail" in content_lower or "email" in content_lower:
            adapter_types.append("Mail")
        if "jdbc" in content_lower or "database" in content_lower:
            adapter_types.append("JDBC")

        return adapter_types

    def _extract_business_keywords(self, content: str, query: str) -> List[str]:
        """Extract business process keywords from content"""
        all_text = f"{query} {content}".lower()

        # Business process keywords that might be in your KG
        business_keywords = [
            "required", "properties", "present", "roles", "customer", "cache", "response",
            "validation", "check", "verify", "process", "workflow", "approval",
            "authentication", "authorization", "security", "certificate", "ssl",
            "configuration", "setup", "parameter", "property"
        ]

        found_keywords = []
        for keyword in business_keywords:
            if keyword in all_text:
                found_keywords.append(keyword)

        return found_keywords[:6]  # Limit to top 6 keywords


# Global instance
_agentic_rag = None

def get_agentic_rag_service() -> AgenticRAGOrchestrator:
    """Get or create Agentic RAG service instance"""
    global _agentic_rag
    if _agentic_rag is None:
        _agentic_rag = AgenticRAGOrchestrator()
    return _agentic_rag
