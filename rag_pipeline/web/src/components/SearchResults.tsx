import { useState } from 'react'
import { SearchResult } from '@/types/api'
import { formatBytes, formatDate, getComponentTypeColor } from '@/lib/utils'
import { ContentDetailModal } from './ContentDetailModal'

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  query: string
  onPageChange: (page: number) => void
  currentPage: number
  totalPages: number
}

export function SearchResults({
  results,
  loading,
  query,
  onPageChange,
  currentPage,
  totalPages
}: SearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedResult(null)
  }
  if (loading) {
    return (
      <div className="card-compact">
        <div className="card-compact-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <span className="ml-3 text-sm text-muted-foreground">Searching...</span>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="card-compact">
        <div className="card-compact-content">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No results found</p>
            <p className="text-xs">Try adjusting your search query or filters</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {results.map((result, index) => (
          <ResultCard
            key={result.id}
            result={result}
            index={index}
            query={query}
            onClick={() => handleResultClick(result)}
          />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn-compact-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn-compact-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Detail Modal */}
      <ContentDetailModal
        result={selectedResult}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

interface ResultCardProps {
  result: SearchResult
  index: number
  query: string
  onClick: () => void
}

function ResultCard({ result, index, onClick }: ResultCardProps) {
  return (
    <div className="card-compact">
      <div className="card-compact-content">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
              <h4 className="text-sm font-medium truncate">
                {result.title || result.metadata.file_name || 'Untitled'}
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              {result.metadata.component_type && (
                <span className={getComponentTypeColor(result.metadata.component_type)}>
                  {result.metadata.component_type}
                </span>
              )}
              {result.metadata.source && (
                <span className="chip-compact-sm">{result.metadata.source}</span>
              )}
            </div>
          </div>
          
          {/* Score */}
          <div className="text-right ml-4">
            <div className="text-lg font-bold text-primary">
              {(result.scores.final || 0).toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground">Final Score</div>
          </div>
        </div>

        {/* Snippet - Clickable */}
        <div className="mb-3">
          <p
            className="text-sm text-foreground leading-relaxed cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
            onClick={onClick}
            title="Click to view full content"
          >
            {result.snippet}
          </p>
          <div className="text-xs text-muted-foreground mt-1">
            Click to view full content
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mb-3">
          <div className="flex items-center space-x-4 text-xs">
            {result.scores.vector && (
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Vector:</span>
                <span className="font-mono">{(result.scores.vector).toFixed(3)}</span>
              </div>
            )}
            {result.scores.cross_encoder && (
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Cross:</span>
                <span className="font-mono">{(result.scores.cross_encoder).toFixed(3)}</span>
              </div>
            )}
            {result.scores.metadata_boost && (
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Meta:</span>
                <span className="font-mono">{(result.scores.metadata_boost).toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          {result.metadata.path && (
            <div>Path: {result.metadata.path}</div>
          )}
          {result.metadata.created_at && (
            <div>Created: {formatDate(result.metadata.created_at)}</div>
          )}
          {result.metadata.size_bytes && (
            <div>Size: {formatBytes(result.metadata.size_bytes)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
