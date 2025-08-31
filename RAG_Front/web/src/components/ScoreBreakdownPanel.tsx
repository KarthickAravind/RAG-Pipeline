import { SearchResult } from '@/types/api'

interface ScoreBreakdownPanelProps {
  results: SearchResult[]
  weights?: {
    dense: number
    cross: number
    meta: number
  }
}

export function ScoreBreakdownPanel({ results, weights }: ScoreBreakdownPanelProps) {
  if (!results.length) return null

  return (
    <div className="card-compact">
      <div className="card-compact-header">
        <h3 className="card-compact-title">Score Breakdown</h3>
        <p className="text-xs text-muted-foreground">Score contribution analysis</p>
      </div>
      <div className="card-compact-content">
        <div className="space-y-4">
          {/* Weights */}
          {weights && (
            <div>
              <h4 className="text-sm font-medium mb-2">Weight Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Dense (Vector)</span>
                  <span className="text-xs font-mono">{weights.dense.toFixed(1)}</span>
                </div>
                <div className="score-bar-compact">
                  <div 
                    className="score-bar-compact-fill" 
                    style={{ width: `${weights.dense * 100}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cross-encoder</span>
                  <span className="text-xs font-mono">{weights.cross.toFixed(1)}</span>
                </div>
                <div className="score-bar-compact">
                  <div 
                    className="score-bar-compact-fill" 
                    style={{ width: `${weights.cross * 100}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Metadata</span>
                  <span className="text-xs font-mono">{weights.meta.toFixed(1)}</span>
                </div>
                <div className="score-bar-compact">
                  <div 
                    className="score-bar-compact-fill" 
                    style={{ width: `${weights.meta * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Top Results Summary */}
          <div>
            <h4 className="text-sm font-medium mb-2">Top Results</h4>
            <div className="space-y-2">
              {results.slice(0, 5).map((result, index) => (
                <div key={result.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">
                    {index + 1}. {result.title || result.metadata.file_name || 'Untitled'}
                  </span>
                  <span className="font-mono ml-2">
                    {(result.scores.final || 0).toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Ranges */}
          <div>
            <h4 className="text-sm font-medium mb-2">Score Distribution</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Highest:</span>
                <span className="font-mono">
                  {(Math.max(...results.map(r => r.scores.final || 0))).toFixed(3)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lowest:</span>
                <span className="font-mono">
                  {(Math.min(...results.map(r => r.scores.final || 0))).toFixed(3)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average:</span>
                <span className="font-mono">
                  {(results.reduce((sum, r) => sum + (r.scores.final || 0), 0) / results.length).toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
