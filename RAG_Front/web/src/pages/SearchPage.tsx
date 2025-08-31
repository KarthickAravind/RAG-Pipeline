import { useState, useEffect } from 'react'
import { Filter, Clock, Zap, Cpu } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { SearchToolbar } from '@/components/SearchToolbar'
import { SideFilters } from '@/components/SideFilters'
import { SearchResults } from '@/components/SearchResults'
import { MinimalSearchResult } from '@/components/MinimalSearchResult'
import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel'
import { SearchResult, CodeTemplateType } from '@/types/api'

export function SearchPage() {
  const {
    searchState,
    updateSearchState,
    searchResults,
    setSearchResults,
    agenticResults,
    agenticInfo,
    setAgenticResults,
    searchLoading,
    setSearchLoading,
    searchError,
    setSearchError,
    searchStats,
    addQueryLogEntry
  } = useAppStore()

  // Removed showFilters state
  // Use persistent state from store instead of local state
  const [useAgenticSearch, setUseAgenticSearch] = useState(true)

  // Debounced search function
  const debouncedSearch = debounce(() => {
    if (searchState.query.trim()) {
      performSearch()
    }
  }, 400)

  // Effect for live search
  useEffect(() => {
    if (searchState.live_search && searchState.query.trim()) {
      debouncedSearch()
    }
  }, [searchState.query, searchState.live_search, searchState.filters, searchState.rerank, searchState.hybrid])

  const performSearch = async () => {
    if (!searchState.query.trim()) return

    setSearchLoading(true)
    setSearchError(null)

    try {
      console.log('🔍 Starting search with:', {
        query: searchState.query,
        useAgenticSearch,
        apiBase: import.meta.env.VITE_UI_API_BASE
      });

      if (useAgenticSearch) {
        // Use agentic search endpoint
        const apiUrl = `${import.meta.env.VITE_UI_API_BASE}/search/agentic`;
        console.log('📡 Calling agentic search:', apiUrl);

        const response = await fetch(apiUrl, {
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

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Agentic search error:', errorText);
          throw new Error(`Agentic search failed: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        setAgenticResults(data.results || [], data.agentic_info || null)

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
      } else {
        // Use regular search
        const response = await api.search({
          query: searchState.query,
          top_k: searchState.top_k,
          filters: searchState.filters,
          rerank: searchState.rerank,
          hybrid: searchState.hybrid,
          pagination: searchState.pagination
        })

        setSearchResults(response.results, {
          total: response.total,
          elapsed_ms: response.elapsed_ms
        })
        setAgenticResults(response.results, null)

        // Log the query
        addQueryLogEntry({
          query: searchState.query,
          parameters: searchState,
          results_count: response.results.length,
          elapsed_ms: response.elapsed_ms,
          success: true
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      setSearchError(errorMessage)

      // Fallback to regular search if agentic fails
      if (useAgenticSearch) {
        try {
          const fallbackResponse = await api.search({
            query: searchState.query,
            top_k: searchState.top_k,
            filters: searchState.filters,
            rerank: searchState.rerank,
            hybrid: searchState.hybrid,
            pagination: searchState.pagination
          })

          setAgenticResults(fallbackResponse.results, null)
          setSearchResults(fallbackResponse.results, {
            total: fallbackResponse.total,
            elapsed_ms: fallbackResponse.elapsed_ms
          })
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError)
        }
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
      performSearch()
    }
  }

  const handleQueryChange = (query: string) => {
    updateSearchState({ query })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searchState.live_search) {
      handleSearch()
    }
  }

  // Removed code generation handler

  const handleViewFile = (filePath: string) => {
    console.log('View file:', filePath)

    // Try to open the file in a new tab/window
    if (filePath) {
      // If it's a web URL, open directly
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        window.open(filePath, '_blank')
      } else {
        // For local files, try to construct a viewable URL
        // This assumes your backend serves files or you have a file viewer endpoint
        const fileViewerUrl = `${import.meta.env.VITE_UI_API_BASE}/files/view?path=${encodeURIComponent(filePath)}`
        window.open(fileViewerUrl, '_blank')
      }
    } else {
      alert('File path not available for viewing')
    }
  }

  const totalKGEnhancements = agenticResults.reduce((total, result) => {
    return total + (result.related_components?.length || 0) + (result.dependencies?.length || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-3">
            {useAgenticSearch && <Cpu className="w-6 h-6 text-blue-600" />}
            SAP {useAgenticSearch ? 'Agentic' : 'iFlow'} RAG {useAgenticSearch ? 'Lab' : 'Search'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {useAgenticSearch
              ? 'Intelligent search with Knowledge Graph enhancement and code generation'
              : 'Run vector/hybrid search queries and inspect results with score breakdowns'
            }
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* KG Enhancement Stats with Explanation */}
          {useAgenticSearch && agenticInfo && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>{totalKGEnhancements} KG enhancements</span>
                <div className="group relative">
                  <span className="cursor-help text-green-500">ⓘ</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    KG = Knowledge Graph enhancements from your Neo4j database.<br/>
                    Shows related components, dependencies, and business process steps.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Stats */}
          {searchStats && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span>{searchStats.total} results</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{searchStats.elapsed_ms}ms</span>
              </div>
            </div>
          )}

          {/* Agentic Mode Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useAgenticSearch}
              onChange={(e) => setUseAgenticSearch(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-muted-foreground">Agentic Mode</span>
          </label>
        </div>
      </div>

      {/* Simple Search Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchState.query}
              onChange={(e) => updateSearchState({ query: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Search SAP iFlow components, configurations, and patterns..."
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <select
            value={searchState.top_k}
            onChange={(e) => updateSearchState({ top_k: parseInt(e.target.value) })}
            className="px-3 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value={5}>5 results</option>
            <option value={10}>10 results</option>
            <option value={15}>15 results</option>
            <option value={20}>20 results</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={searchLoading || !searchState.query.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searchLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Search Results */}
        <div className="w-full">
          {searchError && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm font-medium">Search Error</p>
              <p className="text-xs">{searchError}</p>
            </div>
          )}

          {/* Unified Minimal Results Display */}
          <div className="space-y-4">
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    {useAgenticSearch ? 'Enhancing search with Knowledge Graph...' : 'Searching...'}
                  </p>
                </div>
              </div>
            ) : (useAgenticSearch ? agenticResults : searchResults).length > 0 ? (
              (useAgenticSearch ? agenticResults : searchResults).map((result) => (
                <MinimalSearchResult
                  key={result.id}
                  result={result}
                  onViewFile={handleViewFile}
                />
              ))
            ) : searchState.query ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No results found for "{searchState.query}"</p>
                <p className="text-sm text-muted-foreground mt-2">Try different keywords or check your spelling</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">SAP Agentic RAG Lab</h3>
                <p className="text-muted-foreground mb-4">Enter a search query to get started with intelligent SAP iFlow assistance</p>
                <div className="text-sm text-muted-foreground">
                  <p>Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {['certificate configuration', 'HTTPS adapter', 'groovy script', 'error handling', 'message mapping'].map((example) => (
                      <button
                        key={example}
                        onClick={() => {
                          updateSearchState({ query: example })
                          setTimeout(handleSearch, 100)
                        }}
                        className="px-3 py-1 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
