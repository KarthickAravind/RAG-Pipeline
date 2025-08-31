import { useState } from 'react'
import { Download, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { SearchResult } from '@/types/api'
import { cn } from '@/lib/utils'

export function RerankPage() {
  const { searchResults } = useAppStore()
  const [showCrossEncoder, setShowCrossEncoder] = useState(true)
  const [showMetadata, setShowMetadata] = useState(true)

  // For demo purposes, we'll simulate before/after results
  // In a real app, this would come from separate API calls
  const beforeResults = searchResults.map((result) => ({
    ...result,
    scores: {
      ...result.scores,
      final: result.scores.vector || 0 // Use vector score as "before" score
    }
  }))

  const afterResults = searchResults // Current results with final scores

  const movements = beforeResults.map((before, index) => {
    const after = afterResults[index]
    const beforePosition = index + 1
    const afterPosition = afterResults.findIndex(r => r.id === before.id) + 1
    
    return {
      id: before.id,
      before_position: beforePosition,
      after_position: afterPosition,
      before_score: before.scores.final,
      after_score: after.scores.final,
      delta_position: beforePosition - afterPosition,
      delta_score: (after.scores.final || 0) - (before.scores.final || 0)
    }
  })

  const exportCSV = () => {
    const csvContent = [
      'ID,Title,Before Position,After Position,Before Score,After Score,Delta Position,Delta Score',
      ...movements.map(m => 
        `${m.id},"${beforeResults.find(r => r.id === m.id)?.title || ''}",${m.before_position},${m.after_position},${m.before_score},${m.after_score},${m.delta_position},${m.delta_score}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rerank-comparison.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Re-ranking Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Visualize before/after ranking and movement with score contributions
          </p>
        </div>
        
        <button
          onClick={exportCSV}
          className="btn-compact-sm flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Visualization Controls */}
      <div className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCrossEncoder(!showCrossEncoder)}
            className={cn(
              "btn-compact-sm",
              showCrossEncoder ? "bg-primary text-primary-foreground" : "bg-background"
            )}
          >
            {showCrossEncoder ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="ml-2">Cross-encoder</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={cn(
              "btn-compact-sm",
              showMetadata ? "bg-primary text-primary-foreground" : "bg-background"
            )}
          >
            {showMetadata ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="ml-2">Metadata</span>
          </button>
        </div>
      </div>

      {/* Comparison Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Before Re-ranking */}
        <div className="card-compact">
          <div className="card-compact-header">
            <h3 className="card-compact-title">Pre-rerank (Vector Score)</h3>
            <p className="text-xs text-muted-foreground">Results ranked by vector similarity only</p>
          </div>
          <div className="card-compact-content">
            <ComparisonTable
              results={beforeResults}
              showCrossEncoder={showCrossEncoder}
              showMetadata={showMetadata}
              type="before"
            />
          </div>
        </div>

        {/* After Re-ranking */}
        <div className="card-compact">
          <div className="card-compact-header">
            <h3 className="card-compact-title">Post-rerank (Final Score)</h3>
            <p className="text-xs text-muted-foreground">Results with cross-encoder and metadata boost</p>
          </div>
          <div className="card-compact-content">
            <ComparisonTable
              results={afterResults}
              showCrossEncoder={showCrossEncoder}
              showMetadata={showMetadata}
              type="after"
            />
          </div>
        </div>
      </div>

      {/* Movement Visualization */}
      {movements.length > 0 && (
        <div className="card-compact">
          <div className="card-compact-header">
            <h3 className="card-compact-title">Position Movement</h3>
            <p className="text-xs text-muted-foreground">Visual representation of ranking changes</p>
          </div>
          <div className="card-compact-content">
            <MovementChart movements={movements} />
          </div>
        </div>
      )}
    </div>
  )
}

interface ComparisonTableProps {
  results: SearchResult[]
  showCrossEncoder: boolean
  showMetadata: boolean
  type: 'before' | 'after'
}

function ComparisonTable({ results, showCrossEncoder, showMetadata, type }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table-compact">
        <thead className="table-compact-header">
          <tr>
            <th className="table-compact-header-cell">Pos</th>
            <th className="table-compact-header-cell">Title/File</th>
            <th className="table-compact-header-cell">Type</th>
            <th className="table-compact-header-cell">Vector</th>
            {showCrossEncoder && <th className="table-compact-header-cell">Cross</th>}
            {showMetadata && <th className="table-compact-header-cell">Meta</th>}
            <th className="table-compact-header-cell">Final</th>
            {type === 'after' && <th className="table-compact-header-cell">ΔPos</th>}
            {type === 'after' && <th className="table-compact-header-cell">ΔScore</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={result.id} className="table-compact-row">
              <td className="table-compact-cell font-mono text-xs">
                {index + 1}
              </td>
              <td className="table-compact-cell">
                <div className="max-w-xs truncate">
                  {result.title || result.metadata.file_name || 'Untitled'}
                </div>
              </td>
              <td className="table-compact-cell">
                <span className={cn(
                  "chip-compact-sm text-xs",
                  result.metadata.component_type ? getComponentTypeColor(result.metadata.component_type) : ""
                )}>
                  {result.metadata.component_type || 'Unknown'}
                </span>
              </td>
              <td className="table-compact-cell font-mono text-xs">
                {result.scores.vector?.toFixed(3) || '-'}
              </td>
              {showCrossEncoder && (
                <td className="table-compact-cell font-mono text-xs">
                  {result.scores.cross_encoder?.toFixed(3) || '-'}
                </td>
              )}
              {showMetadata && (
                <td className="table-compact-cell font-mono text-xs">
                  {result.scores.metadata_boost?.toFixed(3) || '-'}
                </td>
              )}
              <td className="table-compact-cell font-mono text-xs font-semibold">
                {result.scores.final?.toFixed(3) || '-'}
              </td>
              {type === 'after' && (
                <td className="table-compact-cell font-mono text-xs">
                  {/* Delta position would be calculated here */}
                  -
                </td>
              )}
              {type === 'after' && (
                <td className="table-compact-cell font-mono text-xs">
                  {/* Delta score would be calculated here */}
                  -
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface MovementChartProps {
  movements: Array<{
    id: string
    before_position: number
    after_position: number
    delta_position: number
    delta_score: number
  }>
}

function MovementChart({ movements }: MovementChartProps) {
  return (
    <div className="h-48 flex items-end justify-center space-x-1">
      {movements.slice(0, 20).map((movement) => (
        <div key={movement.id} className="flex flex-col items-center space-y-1">
          <div className="text-xs text-muted-foreground">
            {movement.before_position}
          </div>
          <div className="w-4 bg-muted rounded-t-sm" style={{ height: `${Math.abs(movement.delta_position) * 2}px` }} />
          <div className="text-xs text-muted-foreground">
            {movement.after_position}
          </div>
        </div>
      ))}
    </div>
  )
}

function getComponentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Groovy': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'WSDL': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'XSLT': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'BPMN': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Properties': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'XML': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Other': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
  }
  return colors[type] || colors['Other']
}
