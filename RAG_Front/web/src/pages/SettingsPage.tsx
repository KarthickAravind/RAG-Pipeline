import { useState } from 'react'
import { TestTube, Save, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { AppSettings } from '@/types/api'

export function SettingsPage() {
  const { settings, updateSettings, darkMode, toggleDarkMode } = useAppStore()
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')

  const handleTestConnection = async () => {
    setConnectionStatus('testing')
    setConnectionMessage('Testing connection...')

    try {
      const isConnected = await api.testConnection(settings.api_base_url)
      if (isConnected) {
        setConnectionStatus('success')
        setConnectionMessage('Connection successful!')
      } else {
        setConnectionStatus('error')
        setConnectionMessage('Connection failed. Please check your API base URL.')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage('Connection error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleSaveSettings = () => {
    updateSettings(settings)
    // Show success feedback
    setConnectionStatus('success')
    setConnectionMessage('Settings saved successfully!')
    setTimeout(() => setConnectionStatus('idle'), 2000)
  }

  const handleResetDefaults = () => {
    const defaultSettings: AppSettings = {
      api_base_url: '/api',
      default_top_k: 10,
      default_weights: {
        dense: 0.7,
        cross: 0.2,
        meta: 0.1
      },
      default_toggles: {
        hybrid: false,
        reranking: false,
        chart_controls: true
      },
      dark_mode: false,
      feature_flags: {
        enable_hybrid: true,
        enable_reranking: true,
        enable_chart_controls: true
      }
    }
    updateSettings(defaultSettings)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings & Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Configure API endpoints, defaults, and application preferences
        </p>
      </div>

      {/* API Configuration */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">API Configuration</h3>
          <p className="text-xs text-muted-foreground">Backend service connection settings</p>
        </div>
        <div className="card-compact-content space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">API Base URL</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={settings.api_base_url}
                onChange={(e) => updateSettings({ api_base_url: e.target.value })}
                placeholder="https://api.example.com or /api"
                className="input-compact flex-1"
              />
              <button
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
                className="btn-compact-sm flex items-center space-x-2"
              >
                <TestTube className="h-4 w-4" />
                <span>Test</span>
              </button>
            </div>
            
            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className={`mt-2 flex items-center space-x-2 text-sm ${
                connectionStatus === 'success' ? 'text-green-600' : 
                connectionStatus === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {connectionStatus === 'testing' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />}
                {connectionStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                {connectionStatus === 'error' && <XCircle className="h-4 w-4" />}
                <span>{connectionMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Default Search Parameters */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Default Search Parameters</h3>
          <p className="text-xs text-muted-foreground">Default values for new search sessions</p>
        </div>
        <div className="card-compact-content space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default Top-K</label>
            <select
              value={settings.default_top_k}
              onChange={(e) => updateSettings({ default_top_k: parseInt(e.target.value) })}
              className="select-compact w-32"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Default Weight Distribution</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Dense (Vector)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.default_weights.dense}
                  onChange={(e) => updateSettings({
                    default_weights: {
                      ...settings.default_weights,
                      dense: parseFloat(e.target.value)
                    }
                  })}
                  className="slider-compact w-full"
                />
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {settings.default_weights.dense.toFixed(1)}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Cross-encoder</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.default_weights.cross}
                  onChange={(e) => updateSettings({
                    default_weights: {
                      ...settings.default_weights,
                      cross: parseFloat(e.target.value)
                    }
                  })}
                  className="slider-compact w-full"
                />
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {settings.default_weights.cross.toFixed(1)}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Metadata</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.default_weights.meta}
                  onChange={(e) => updateSettings({
                    default_weights: {
                      ...settings.default_weights,
                      meta: parseFloat(e.target.value)
                    }
                  })}
                  className="slider-compact w-full"
                />
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {settings.default_weights.meta.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Default Toggles</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.default_toggles.hybrid}
                  onChange={(e) => updateSettings({
                    default_toggles: {
                      ...settings.default_toggles,
                      hybrid: e.target.checked
                    }
                  })}
                  className="rounded border-input"
                />
                <span className="text-sm">Enable hybrid search by default</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.default_toggles.reranking}
                  onChange={(e) => updateSettings({
                    default_toggles: {
                      ...settings.default_toggles,
                      reranking: e.target.checked
                    }
                  })}
                  className="rounded border-input"
                />
                <span className="text-sm">Enable re-ranking by default</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.default_toggles.chart_controls}
                  onChange={(e) => updateSettings({
                    default_toggles: {
                      ...settings.default_toggles,
                      chart_controls: e.target.checked
                    }
                  })}
                  className="rounded border-input"
                />
                <span className="text-sm">Show chart controls by default</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Feature Flags</h3>
          <p className="text-xs text-muted-foreground">Enable or disable experimental features</p>
        </div>
        <div className="card-compact-content space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.feature_flags.enable_hybrid}
              onChange={(e) => updateSettings({
                feature_flags: {
                  ...settings.feature_flags,
                  enable_hybrid: e.target.checked
                }
              })}
              className="rounded border-input"
            />
            <span className="text-sm">Enable hybrid search features</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.feature_flags.enable_reranking}
              onChange={(e) => updateSettings({
                feature_flags: {
                  ...settings.feature_flags,
                  enable_reranking: e.target.checked
                }
              })}
              className="rounded border-input"
            />
            <span className="text-sm">Enable re-ranking analysis</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.feature_flags.enable_chart_controls}
              onChange={(e) => updateSettings({
                feature_flags: {
                  ...settings.feature_flags,
                  enable_chart_controls: e.target.checked
                }
              })}
              className="rounded border-input"
            />
            <span className="text-sm">Enable advanced chart controls</span>
          </label>
        </div>
      </div>

      {/* Appearance */}
      <div className="card-compact">
        <div className="card-compact-header">
          <h3 className="card-compact-title">Appearance</h3>
          <p className="text-xs text-muted-foreground">Visual preferences and theme settings</p>
        </div>
        <div className="card-compact-content">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              className="rounded border-input"
            />
            <span className="text-sm">Enable dark mode</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleResetDefaults}
          className="btn-compact-sm flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset to Defaults</span>
        </button>
        
        <button
          onClick={handleSaveSettings}
          className="btn-compact-md flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  )
}
