import { useEffect, useState } from 'react'
import { Info, Database, Cpu, Clock, FileText, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { StatsResponse } from '@/types/api'

export function AboutPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await api.getStats()
      setStats(response)
      setError(null)
    } catch (err) {
      setError('Failed to fetch system statistics')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">About SAP Agentic RAG Lab</h1>
        <p className="text-sm text-muted-foreground">
          A modern testing interface for RAG retrieval systems with advanced analytics
        </p>
      </div>

      {/* App Description */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Application Overview</h3>
        </div>
        <div className="card-compact-content">
          <p className="text-sm text-muted-foreground leading-relaxed">
            SAP Agentic RAG Lab is a comprehensive testing and evaluation platform designed for
            Retrieval-Augmented Generation (RAG) systems. This application provides a modern, 
            responsive web interface for testing vector search, hybrid retrieval, and re-ranking 
            algorithms against SAP iFlow documentation and components.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Key Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Vector similarity search with configurable parameters</li>
                <li>• Hybrid search combining lexical and semantic approaches</li>
                <li>• Cross-encoder re-ranking for improved relevance</li>
                <li>• Metadata-based filtering and boosting</li>
                <li>• Real-time performance analytics and dashboards</li>
                <li>• Experiment management and parameter presets</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Technical Stack</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• React 18 + TypeScript for type safety</li>
                <li>• Tailwind CSS for compact, responsive design</li>
                <li>• TanStack Query for efficient data fetching</li>
                <li>• Zustand for lightweight state management</li>
                <li>• Vite for fast development and building</li>
                <li>• Modern ES modules and CSS variables</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">System Statistics</h3>
          <p className="text-xs text-muted-foreground">Current backend system status and metrics</p>
        </div>
        <div className="card-compact-content">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <span className="ml-3 text-sm text-muted-foreground">Loading system statistics...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <Info className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <button
                onClick={fetchStats}
                className="btn-compact-sm"
              >
                Retry
              </button>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Collections</p>
                  <p className="text-lg font-semibold">{stats.collections}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Chunks</p>
                  <p className="text-lg font-semibold">{stats.chunks.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                <Cpu className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Embedding Model</p>
                  <p className="text-sm font-medium truncate">
                    {stats.embedding_model || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {stats.cross_encoder_model && (
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cross-encoder</p>
                    <p className="text-sm font-medium truncate">
                      {stats.cross_encoder_model}
                    </p>
                  </div>
                </div>
              )}
              
              {stats.pgvector_dims && (
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                  <Database className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vector Dimensions</p>
                    <p className="text-lg font-semibold">{stats.pgvector_dims}</p>
                  </div>
                </div>
              )}
              
              {stats.last_ingest_at && (
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                  <Clock className="h-5 w-5 text-cyan-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Ingest</p>
                    <p className="text-sm font-medium">
                      {new Date(stats.last_ingest_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No system statistics available</p>
            </div>
          )}
        </div>
      </div>

      {/* API Information */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">API Endpoints</h3>
          <p className="text-xs text-muted-foreground">Available backend API services</p>
        </div>
        <div className="card-compact-content">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <div>
                <p className="text-sm font-medium">POST /search</p>
                <p className="text-xs text-muted-foreground">Vector and hybrid search queries</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <div>
                <p className="text-sm font-medium">GET /facets</p>
                <p className="text-xs text-muted-foreground">Available filter options and metadata</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <div>
                <p className="text-sm font-medium">GET /stats</p>
                <p className="text-xs text-muted-foreground">System statistics and model information</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <div>
                <p className="text-sm font-medium">GET /health</p>
                <p className="text-xs text-muted-foreground">Service health check endpoint</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Version Information */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Version Information</h3>
        </div>
        <div className="card-compact-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Frontend Version:</span> 0.1.0</p>
              <p><span className="font-medium">Build Date:</span> {new Date().toLocaleDateString()}</p>
              <p><span className="font-medium">Environment:</span> {import.meta.env.MODE}</p>
            </div>
            <div>
              <p><span className="font-medium">React:</span> 18.2.0</p>
              <p><span className="font-medium">TypeScript:</span> 5.2.2</p>
              <p><span className="font-medium">Tailwind CSS:</span> 3.4.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
