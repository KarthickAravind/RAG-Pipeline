import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { SearchResult } from '@/types/api'
import { formatBytes, formatDate, getComponentTypeColor } from '@/lib/utils'

interface ContentDetailModalProps {
  result: SearchResult | null
  isOpen: boolean
  onClose: () => void
}

export function ContentDetailModal({ result, isOpen, onClose }: ContentDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !result) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content_preview || result.snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-xl border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-lg font-semibold truncate">
                {result.title || result.metadata.file_name || 'Content Detail'}
              </h2>
              {result.metadata.component_type && (
                <span className={getComponentTypeColor(result.metadata.component_type)}>
                  {result.metadata.component_type}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div>Score: {(result.scores.final || 0).toFixed(3)}</div>
              {result.metadata.size_bytes && (
                <div>Size: {formatBytes(result.metadata.size_bytes)}</div>
              )}
              {result.metadata.created_at && (
                <div>Created: {formatDate(result.metadata.created_at)}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleCopy}
              className="btn-compact-sm bg-secondary hover:bg-secondary/80"
              title="Copy content"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="btn-compact-sm bg-secondary hover:bg-secondary/80"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4">
            {/* Full Content */}
            <div>
              <h3 className="text-sm font-medium mb-2">Full Content</h3>
              <div className="bg-muted/50 rounded-lg p-4 border">
                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {result.content_preview || result.snippet}
                </pre>
              </div>
            </div>

            {/* Score Breakdown */}
            <div>
              <h3 className="text-sm font-medium mb-2">Score Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {result.scores.vector && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Vector Score</div>
                    <div className="text-lg font-mono font-bold">
                      {(result.scores.vector).toFixed(3)}
                    </div>
                  </div>
                )}
                {result.scores.cross_encoder && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Cross-Encoder</div>
                    <div className="text-lg font-mono font-bold">
                      {(result.scores.cross_encoder).toFixed(3)}
                    </div>
                  </div>
                )}
                {result.scores.metadata_boost && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Metadata Boost</div>
                    <div className="text-lg font-mono font-bold">
                      {(result.scores.metadata_boost).toFixed(3)}
                    </div>
                  </div>
                )}
                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <div className="text-xs text-muted-foreground">Final Score</div>
                  <div className="text-lg font-mono font-bold text-primary">
                    {(result.scores.final || 0).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="text-sm font-medium mb-2">Metadata</h3>
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Document ID:</span>
                    <span className="ml-2 font-mono">{result.id}</span>
                  </div>
                  {result.metadata.path && (
                    <div>
                      <span className="text-muted-foreground">Path:</span>
                      <span className="ml-2 font-mono text-xs">{result.metadata.path}</span>
                    </div>
                  )}
                  {result.metadata.source && (
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <span className="ml-2">{result.metadata.source}</span>
                    </div>
                  )}
                  {result.metadata.tags && result.metadata.tags.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Tags:</span>
                      <div className="ml-2 flex flex-wrap gap-1 mt-1">
                        {result.metadata.tags.map((tag, index) => (
                          <span key={index} className="chip-compact-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
