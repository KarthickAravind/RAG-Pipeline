// API Response Types
export interface SearchFilters {
  component_types?: string[];
  tags?: string[];
  sources?: string[];
  date_from?: string;
  date_to?: string;
  min_score?: number;
}

export interface RerankConfig {
  enabled: boolean;
  model?: string;
  weight_vector?: {
    dense?: number;
    cross?: number;
    meta?: number;
  };
}

export interface HybridConfig {
  lexical: boolean;
  alpha?: number;
}

export interface PaginationConfig {
  page: number;
  page_size: number;
}

export interface SearchRequest {
  query: string;
  top_k: number;
  filters?: SearchFilters;
  rerank?: RerankConfig;
  hybrid?: HybridConfig;
  pagination?: PaginationConfig;
}

// Enhanced Agentic RAG Types
export interface KnowledgeGraphResult {
  name: string;
  type: string;
  description: string;
  relationship_type: string;
  distance: number;
  properties?: Record<string, any>;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  published_date?: string;
  relevance_score: number;
}

export interface SearchResult {
  id: string;
  title?: string;
  snippet: string;
  content_preview?: string;
  metadata: {
    doc_id?: string;
    file_name?: string;
    path?: string;
    component_type?: ComponentType;
    tags?: string[];
    created_at?: string;
    size_bytes?: number;
    source?: string;
    chunk_id?: string;
  };
  scores: {
    vector?: number;
    cross_encoder?: number;
    metadata_boost?: number;
    hybrid?: number;
    final: number;
  };
  // Enhanced Agentic RAG fields
  related_components?: KnowledgeGraphResult[];
  dependencies?: KnowledgeGraphResult[];
  integration_patterns?: KnowledgeGraphResult[];
  web_updates?: WebSearchResult[];
  latest_info?: string;
  final_relevance_score?: number;
  source_breakdown?: {
    vector: number;
    kg: number;
    web: number;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  page_size: number;
  elapsed_ms: number;
  // Enhanced for agentic search
  agentic_info?: {
    kg_enhancements_count: number;
    web_enhancements_count: number;
    total_sources_used: number;
    enhancement_time_ms: number;
  };
}

export interface FacetsResponse {
  component_types: string[];
  tags: string[];
  sources: string[];
  date_range: {
    min: string;
    max: string;
  };
}

export interface StatsResponse {
  collections: number;
  chunks: number;
  last_ingest_at?: string;
  embedding_model?: string;
  cross_encoder_model?: string;
  pgvector_dims?: number;
}

export interface HealthResponse {
  status: "ok";
}

// Component Types
export type ComponentType = 
  | "Groovy" 
  | "WSDL" 
  | "XSLT" 
  | "BPMN" 
  | "Properties" 
  | "XML" 
  | "Other";

// UI State Types
export interface SearchState {
  query: string;
  top_k: number;
  filters: SearchFilters;
  rerank: RerankConfig;
  hybrid: HybridConfig;
  pagination: PaginationConfig;
  sort_by: SortOption;
  live_search: boolean;
}

export type SortOption = 
  | "final_score_desc" 
  | "vector_score_desc" 
  | "cross_encoder_score_desc" 
  | "metadata_boost_desc" 
  | "created_at_desc" 
  | "size_bytes_desc";

// Chart and Visualization Types
export interface ScoreBreakdown {
  vector: number;
  cross_encoder: number;
  metadata_boost: number;
  final: number;
  weights: {
    dense: number;
    cross: number;
    meta: number;
  };
}

export interface RerankComparison {
  before: SearchResult[];
  after: SearchResult[];
  movements: Array<{
    id: string;
    before_position: number;
    after_position: number;
    before_score: number;
    after_score: number;
    delta_position: number;
    delta_score: number;
  }>;
}

// Dashboard Types
export interface SessionMetrics {
  precision_at_5: number;
  mean_top_5_score: number;
  median_latency: number;
  error_rate: number;
  total_queries: number;
}

export interface QueryLogEntry {
  id?: string;
  timestamp?: string;
  query: string;
  parameters: SearchState;
  results_count: number;
  elapsed_ms: number;
  success: boolean;
}

export interface ExperimentPreset {
  id: string;
  name: string;
  description?: string;
  parameters: SearchState;
  created_at: string;
  last_used?: string;
}

// Enhanced Generation Types
export interface CodeGenerationRequest {
  search_result: SearchResult;
  template_type: CodeTemplateType;
  include_validation?: boolean;
  include_error_handling?: boolean;
  custom_parameters?: Record<string, any>;
}

export interface CodeGenerationResponse {
  generated_code: string;
  template_used: CodeTemplateType;
  sources_used: {
    vector_content: boolean;
    business_steps: number;
    file_references: number;
  };
  code_sections: {
    imports: string;
    configuration: string;
    validation: string;
    main_logic: string;
    error_handling: string;
  };
  elapsed_ms: number;
}

export type CodeTemplateType =
  | "groovy_script"
  | "xslt_mapping"
  | "xml_configuration"
  | "properties_file"
  | "complete_iflow";

// Legacy generation types (for backward compatibility)
export interface GenerationRequest {
  prompt: string;
  context: SearchResult[];
}

export interface GenerationResponse {
  generated_code: string;
  elapsed_ms: number;
}

// Settings Types
export interface AppSettings {
  api_base_url: string;
  default_top_k: number;
  default_weights: {
    dense: number;
    cross: number;
    meta: number;
  };
  default_toggles: {
    hybrid: boolean;
    reranking: boolean;
    chart_controls: boolean;
  };
  dark_mode: boolean;
  feature_flags: {
    enable_hybrid: boolean;
    enable_reranking: boolean;
    enable_chart_controls: boolean;
  };
}
