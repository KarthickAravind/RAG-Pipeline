import { useState, useEffect } from 'react'
import { Filter, Clock, Zap } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { SearchToolbar } from '@/components/SearchToolbar'
import { SideFilters } from '@/components/SideFilters'
import { SearchResults } from '@/components/SearchResults'
import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel'

export function SearchPage() {
  const {
    searchState,
    updateSearchState,
    searchResults,
    setSearchResults,
    searchLoading,
    setSearchLoading,
    searchError,
    setSearchError,
    searchStats,

    addQueryLogEntry
  } = useAppStore()

  const [showFilters, setShowFilters] = useState(false)

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

      // Log the query
      addQueryLogEntry({
        query: searchState.query,
        parameters: searchState,
        results_count: response.results.length,
        elapsed_ms: response.elapsed_ms,
        success: true
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      setSearchError(errorMessage)
      
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Search & Retrieval</h1>
          <p className="text-sm text-muted-foreground">
            Run vector/hybrid search queries and inspect results with score breakdowns
          </p>
        </div>
        
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
      </div>

      {/* Search Toolbar */}
      <SearchToolbar
        query={searchState.query}
        onQueryChange={handleQueryChange}
        onKeyPress={handleKeyPress}
        onSearch={handleSearch}
        searchState={searchState}
        onSearchStateChange={updateSearchState}
        loading={searchLoading}
      />

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Side Filters */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <SideFilters
            filters={searchState.filters}
            onFiltersChange={(filters) => updateSearchState({ filters })}
          />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-compact-sm flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 min-w-0">
          {searchError && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm font-medium">Search Error</p>
              <p className="text-xs">{searchError}</p>
            </div>
          )}

          <SearchResults
            results={searchResults}
            loading={searchLoading}
            query={searchState.query}
            onPageChange={(page) => updateSearchState({ pagination: { ...searchState.pagination, page } })}
            currentPage={searchState.pagination.page}
            totalPages={Math.ceil((searchStats?.total || 0) / searchState.pagination.page_size)}
          />
        </div>

        {/* Score Breakdown Panel (optional on wide screens) */}
        {searchResults.length > 0 && (
          <div className="hidden xl:block w-80 flex-shrink-0">
            <ScoreBreakdownPanel
              results={searchResults}
              weights={searchState.rerank.weight_vector ? {
                dense: searchState.rerank.weight_vector.dense || 0.7,
                cross: searchState.rerank.weight_vector.cross || 0.2,
                meta: searchState.rerank.weight_vector.meta || 0.1
              } : undefined}
            />
          </div>
        )}
      </div>

      {/* Mobile Filters Overlay */}
      {showFilters && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-background border-l p-4 z-50 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="btn-compact-sm h-8 w-8 p-0"
              >
                ×
              </button>
            </div>
            <SideFilters
              filters={searchState.filters}
              onFiltersChange={(filters) => updateSearchState({ filters })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
