import { useState, useEffect } from 'react'
import { Filter, Clock, Zap, Cpu } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { SearchToolbar } from '@/components/SearchToolbar'
import { SideFilters } from '@/components/SideFilters'
import { EnhancedSearchResult } from '@/components/EnhancedSearchResult'
import { CodeGenerationPanel } from '@/components/CodeGenerationPanel'
import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel'
import { SearchResult, CodeTemplateType } from '@/types/api'

export function AgenticSearchPage() {
  const {
    searchState,
    updateSearchState,
    searchResults,
    setSearchResults,
    searchLoading,
    setSearchLoading,
    searchError,
    setSearchError,
    addQueryLogEntry
  } = useAppStore()

  const [showFilters, setShowFilters] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [codeGeneration, setCodeGeneration] = useState<{
    result: SearchResult;
    template: CodeTemplateType;
  } | null>(null)
  const [agenticResults, setAgenticResults] = useState<SearchResult[]>([])
  const [agenticInfo, setAgenticInfo] = useState<any>(null)

  // Debounced search function
  const debouncedSearch = debounce(() => {
    if (searchState.query.trim()) {
      performAgenticSearch()
    }
  }, 400)

  // Effect for live search
  useEffect(() => {
    if (searchState.live_search && searchState.query.trim()) {
      debouncedSearch()
    }
  }, [searchState.query, searchState.live_search, searchState.filters, searchState.rerank, searchState.hybrid])

  const performAgenticSearch = async () => {
    if (!searchState.query.trim()) return

    setSearchLoading(true)
    setSearchError(null)

    try {
      // Call the agentic search endpoint
      const response = await fetch(`${import.meta.env.VITE_UI_API_BASE}/search/agentic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchState.query,
          top_k: searchState.top_k,
          filters: searchState.filters,
          rerank: searchState.rerank,
          hybrid: searchState.hybrid,
          pagination: searchState.pagination
        }),
      })

      if (!response.ok) {
        throw new Error(`Agentic search failed: ${response.statusText}`)
      }

      const data = await response.json()
      setAgenticResults(data.results || [])
      setAgenticInfo(data.agentic_info || null)

      // Also update the store for compatibility
      setSearchResults(data.results || [], {
        total: data.results?.length || 0,
        elapsed_ms: data.agentic_info?.enhancement_time_ms || 0
      })

      // Log the query
      addQueryLogEntry({
        query: searchState.query,
        parameters: searchState,
        results_count: data.results?.length || 0,
        elapsed_ms: data.agentic_info?.enhancement_time_ms || 0,
        success: true
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Agentic search failed'
      setSearchError(errorMessage)
      
      // Fallback to regular search
      try {
        const fallbackResponse = await api.search({
          query: searchState.query,
          top_k: searchState.top_k,
          filters: searchState.filters,
          rerank: searchState.rerank,
          hybrid: searchState.hybrid,
          pagination: searchState.pagination
        })
        
        setAgenticResults(fallbackResponse.results)
        setSearchResults(fallbackResponse.results, {
          total: fallbackResponse.total,
          elapsed_ms: fallbackResponse.elapsed_ms
        })
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError)
      }
      
      // Log the failed query
      addQueryLogEntry({
        query: searchState.query,
        parameters: searchState,
        results_count: 0,
        elapsed_ms: 0,
        success: false
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchState.query.trim()) {
      performAgenticSearch()
    }
  }

  const handleQueryChange = (query: string) => {
    updateSearchState({ query })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleGenerateCode = (result: SearchResult, template: CodeTemplateType) => {
    setCodeGeneration({ result, template })
  }

  const handleViewFile = (filePath: string) => {
    // Open file in new tab or show file viewer
    console.log('View file:', filePath)
    // You could implement a file viewer modal here
  }

  const totalKGEnhancements = agenticResults.reduce((total, result) => {
    return total + (result.related_components?.length || 0) + (result.dependencies?.length || 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Cpu className="w-8 h-8 text-blue-600" />
                SAP Agentic RAG Lab
              </h1>
              <p className="text-gray-600">
                Intelligent search with Knowledge Graph enhancement and SAP iFlow code generation
              </p>
            </div>
            <div className="flex items-center gap-4">
              {agenticInfo && (
                <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>{totalKGEnhancements} KG enhancements</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchState.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search SAP iFlow components, configurations, and patterns..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading || !searchState.query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Agentic Search
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <Clock className="w-4 h-4" />
              Score Breakdown
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <SideFilters
                filters={searchState.filters}
                onFiltersChange={(filters) =>
                  updateSearchState({
                    filters,
                    pagination: { ...searchState.pagination, page: 1 }
                  })
                }
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {searchError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{searchError}</p>
              </div>
            )}

            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Enhancing search with Knowledge Graph...</p>
                </div>
              </div>
            ) : agenticResults.length > 0 ? (
              <div className="space-y-6">
                {agenticResults.map((result) => (
                  <EnhancedSearchResult
                    key={result.id}
                    result={result}
                    onGenerateCode={handleGenerateCode}
                    onViewFile={handleViewFile}
                  />
                ))}
              </div>
            ) : searchState.query ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No results found for "{searchState.query}"</p>
                <p className="text-sm text-gray-400 mt-2">Try different keywords or check your spelling</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">SAP Agentic RAG Lab</h3>
                <p className="text-gray-500 mb-4">Enter a search query to get started with intelligent SAP iFlow assistance</p>
                <div className="text-sm text-gray-400">
                  <p>Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {['certificate configuration', 'HTTPS adapter', 'groovy script', 'error handling', 'message mapping'].map((example) => (
                      <button
                        key={example}
                        onClick={() => {
                          handleQueryChange(example)
                          setTimeout(handleSearch, 100)
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Score Breakdown Sidebar */}
          {showScoreBreakdown && agenticResults.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <ScoreBreakdownPanel results={agenticResults} />
            </div>
          )}
        </div>
      </div>

      {/* Code Generation Modal */}
      {codeGeneration && (
        <CodeGenerationPanel
          result={codeGeneration.result}
          templateType={codeGeneration.template}
          onClose={() => setCodeGeneration(null)}
        />
      )}
    </div>
  )
}
