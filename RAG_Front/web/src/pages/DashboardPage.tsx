import { useState } from 'react'
import { BarChart3, Clock, Target, TrendingUp, Save, Play, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ExperimentPreset } from '@/types/api'
import { formatDate } from '@/lib/utils'

export function DashboardPage() {
  const { queryLog, experimentPresets, addExperimentPreset, removeExperimentPreset } = useAppStore()
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')

  // Calculate session metrics
  const totalQueries = queryLog.length
  const successfulQueries = queryLog.filter(q => q.success).length
  const errorRate = totalQueries > 0 ? ((totalQueries - successfulQueries) / totalQueries) * 100 : 0
  
  const recentQueries = queryLog.slice(0, 10)
  const avgLatency = recentQueries.length > 0 
    ? recentQueries.reduce((sum, q) => sum + q.elapsed_ms, 0) / recentQueries.length 
    : 0

  // Component type distribution (mock data for demo)
  const componentTypeDistribution = {
    'Groovy': 25,
    'WSDL': 20,
    'XSLT': 15,
    'BPMN': 20,
    'Properties': 10,
    'XML': 10
  }

  const handleSavePreset = () => {
    if (newPresetName.trim() && queryLog.length > 0) {
      const lastQuery = queryLog[0]
      addExperimentPreset({
        name: newPresetName,
        description: newPresetDescription,
        parameters: lastQuery.parameters
      })
      setNewPresetName('')
      setNewPresetDescription('')
    }
  }

  const handleLoadPreset = (preset: ExperimentPreset) => {
    // In a real app, this would update the search state
    console.log('Loading preset:', preset)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Testing Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Session metrics, trends, and experiment management
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-compact">
          <div className="card-compact-content">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total Queries</span>
            </div>
            <p className="text-2xl font-bold">{totalQueries}</p>
          </div>
        </div>

        <div className="card-compact">
          <div className="card-compact-content">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <p className="text-2xl font-bold">{((1 - errorRate / 100) * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div className="card-compact">
          <div className="card-compact-content">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold">{avgLatency.toFixed(0)}ms</p>
          </div>
        </div>

        <div className="card-compact">
          <div className="card-compact-content">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Experiments</span>
            </div>
            <p className="text-2xl font-bold">{experimentPresets.length}</p>
          </div>
        </div>
      </div>

      {/* Charts and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Type Distribution */}
        <div className="card-compact">
          <div className="card-compact-header">
            <h3 className="card-compact-title">Component Type Distribution</h3>
          </div>
          <div className="card-compact-content">
            <div className="space-y-3">
              {Object.entries(componentTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / 100) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-8 text-right">{count}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latency Trend */}
        <div className="card-compact">
          <div className="card-compact-header">
            <h3 className="card-compact-title">Recent Query Latency</h3>
          </div>
          <div className="card-compact-content">
            <div className="h-32 flex items-end space-x-1">
              {recentQueries.slice(0, 10).map((query) => (
                <div key={query.id} className="flex-1 bg-primary/20 rounded-t-sm" 
                     style={{ height: `${(query.elapsed_ms / 1000) * 100}%` }} />
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Last 10 queries (latency in seconds)
            </div>
          </div>
        </div>
      </div>

      {/* Query Log */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Recent Query Log</h3>
          <p className="text-xs text-muted-foreground">Last 10 queries with parameters and results</p>
        </div>
        <div className="card-compact-content">
          <div className="space-y-3">
            {recentQueries.map((query) => (
              <div key={query.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium truncate">{query.query}</span>
                    <span className={query.success ? "text-green-600" : "text-red-600"}>
                      {query.success ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {query.timestamp ? formatDate(query.timestamp) : 'Unknown'} • {query.results_count} results • {query.elapsed_ms}ms
                  </div>
                </div>
                <button
                  onClick={() => console.log('Rerun query:', query)}
                  className="btn-compact-sm flex items-center space-x-1"
                  title="Rerun this query"
                >
                  <Play className="h-3 w-3" />
                  <span>Rerun</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experiment Presets */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Experiment Presets</h3>
          <p className="text-xs text-muted-foreground">Save and load parameter configurations</p>
        </div>
        <div className="card-compact-content">
          {/* Create New Preset */}
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Preset name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="input-compact-sm"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                className="input-compact-sm"
              />
              <button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="btn-compact-sm flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Preset</span>
              </button>
            </div>
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {experimentPresets.map((preset) => (
              <div key={preset.id} className="p-3 border rounded-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{preset.name}</h4>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {formatDate(preset.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="btn-compact-xs flex items-center space-x-1"
                      title="Load this preset"
                    >
                      <Play className="h-3 w-3" />
                      <span>Load</span>
                    </button>
                    <button
                      onClick={() => removeExperimentPreset(preset.id)}
                      className="btn-compact-xs flex items-center space-x-1 text-destructive"
                      title="Delete this preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {experimentPresets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Save className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No experiment presets saved yet</p>
              <p className="text-xs">Create your first preset to save time on repeated configurations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
