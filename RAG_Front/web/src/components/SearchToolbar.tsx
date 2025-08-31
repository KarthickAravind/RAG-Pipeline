import { Search, Play, Zap } from 'lucide-react'
import { SearchState } from '@/types/api'

interface SearchToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  onKeyPress: (e: React.KeyboardEvent) => void
  onSearch: () => void
  searchState: SearchState
  onSearchStateChange: (updates: Partial<SearchState>) => void
  loading: boolean
}

export function SearchToolbar({
  query,
  onQueryChange,
  onKeyPress,
  onSearch,
  searchState,
  onSearchStateChange,
  loading
}: SearchToolbarProps) {
  return (
    <div className="card-compact">
      <div className="card-compact-content">
        <div className="space-y-4">
          {/* Main Search Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Query Input */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder="Enter your search query..."
                  className="input-compact pl-10 w-full max-w-md"
                />
              </div>
            </div>

            {/* Top-K Select */}
            <select
              value={searchState.top_k}
              onChange={(e) => onSearchStateChange({ top_k: parseInt(e.target.value) })}
              className="select-compact w-20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>

            {/* Search Button */}
            <button
              onClick={onSearch}
              disabled={loading || !query.trim()}
              className="btn-compact-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Search</span>
            </button>
          </div>

          {/* Advanced Controls Row */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
            {/* Hybrid Toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={searchState.hybrid.lexical}
                  onChange={(e) => onSearchStateChange({
                    hybrid: { ...searchState.hybrid, lexical: e.target.checked }
                  })}
                  className="rounded border-input"
                />
                <span className="text-sm">Hybrid</span>
              </label>
              
              {searchState.hybrid.lexical && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">α:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={searchState.hybrid.alpha || 0.5}
                    onChange={(e) => onSearchStateChange({
                      hybrid: { ...searchState.hybrid, alpha: parseFloat(e.target.value) }
                    })}
                    className="slider-compact w-20"
                  />
                  <span className="text-xs font-mono w-8 text-right">
                    {(searchState.hybrid.alpha || 0.5).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Re-ranking Toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={searchState.rerank.enabled}
                  onChange={(e) => onSearchStateChange({
                    rerank: { ...searchState.rerank, enabled: e.target.checked }
                  })}
                  className="rounded border-input"
                />
                <span className="text-sm">Re-rank</span>
              </label>
              
              {searchState.rerank.enabled && (
                <select
                  value={searchState.rerank.model || 'cross-encoder'}
                  onChange={(e) => onSearchStateChange({
                    rerank: { ...searchState.rerank, model: e.target.value }
                  })}
                  className="select-compact w-32"
                >
                  <option value="cross-encoder">Cross-encoder</option>
                  <option value="rerank-v1">Rerank v1</option>
                </select>
              )}
            </div>

            {/* Weight Sliders */}
            {searchState.rerank.enabled && (
              <div className="flex items-center space-x-3">
                <span className="text-xs text-muted-foreground">Weights:</span>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">D</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={searchState.rerank.weight_vector?.dense || 0.7}
                    onChange={(e) => onSearchStateChange({
                      rerank: {
                        ...searchState.rerank,
                        weight_vector: {
                          dense: parseFloat(e.target.value),
                          cross: searchState.rerank.weight_vector?.cross || 0.2,
                          meta: searchState.rerank.weight_vector?.meta || 0.1
                        }
                      }
                    })}
                    className="slider-compact w-16"
                  />
                  <span className="text-xs font-mono w-6 text-right">
                    {(searchState.rerank.weight_vector?.dense || 0.7).toFixed(1)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">C</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={searchState.rerank.weight_vector?.cross || 0.2}
                    onChange={(e) => onSearchStateChange({
                      rerank: {
                        ...searchState.rerank,
                        weight_vector: {
                          dense: searchState.rerank.weight_vector?.dense || 0.7,
                          cross: parseFloat(e.target.value),
                          meta: searchState.rerank.weight_vector?.meta || 0.1
                        }
                      }
                    })}
                    className="slider-compact w-16"
                  />
                  <span className="text-xs font-mono w-6 text-right">
                    {(searchState.rerank.weight_vector?.cross || 0.2).toFixed(1)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">M</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={searchState.rerank.weight_vector?.meta || 0.1}
                    onChange={(e) => onSearchStateChange({
                      rerank: {
                        ...searchState.rerank,
                        weight_vector: {
                          dense: searchState.rerank.weight_vector?.dense || 0.7,
                          cross: searchState.rerank.weight_vector?.cross || 0.2,
                          meta: parseFloat(e.target.value)
                        }
                      }
                    })}
                    className="slider-compact w-16"
                  />
                  <span className="text-xs font-mono w-6 text-right">
                    {(searchState.rerank.weight_vector?.meta || 0.1).toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <select
                value={searchState.sort_by}
                onChange={(e) => onSearchStateChange({ sort_by: e.target.value as any })}
                className="select-compact w-32"
              >
                <option value="final_score_desc">Final Score ↓</option>
                <option value="vector_score_desc">Vector Score ↓</option>
                <option value="cross_encoder_score_desc">Cross Score ↓</option>
                <option value="metadata_boost_desc">Meta Score ↓</option>
                <option value="created_at_desc">Date ↓</option>
                <option value="size_bytes_desc">Size ↓</option>
              </select>
            </div>

            {/* Live Search Toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={searchState.live_search}
                  onChange={(e) => onSearchStateChange({ live_search: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Live</span>
              </label>
              {searchState.live_search && (
                <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
