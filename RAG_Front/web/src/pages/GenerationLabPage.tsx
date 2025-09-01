import { useState } from 'react'
import { Zap, FileText, Code, AlertCircle, Loader2, MousePointer, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { mockGenerateAPI } from '@/lib/api'
import { SearchResult } from '@/types/api'

export function GenerationLabPage() {
  const {
    searchResults,
    generationPrompt,
    setGenerationPrompt,
    generatedCode,
    setGeneratedCode,
    generationLoading,
    setGenerationLoading,
    generationError,
    setGenerationError
  } = useAppStore()

  const [localPrompt, setLocalPrompt] = useState(generationPrompt)
  const [selectedDocuments, setSelectedDocuments] = useState<SearchResult[]>([])
  const [selectedModel, setSelectedModel] = useState('mistral')

  // Get top 5 search results for context
  const contextDocuments = searchResults.slice(0, 5)
  const hasContext = contextDocuments.length > 0

  // Handle document click to add to prompt
  const handleDocumentClick = (doc: SearchResult) => {
    // Check if document is already selected
    const isSelected = selectedDocuments.some(selected => selected.id === doc.id)

    if (isSelected) {
      // Remove from selection
      setSelectedDocuments(prev => prev.filter(selected => selected.id !== doc.id))
      return
    }

    // Add to selection
    setSelectedDocuments(prev => [...prev, doc])

    // Generate context-aware prompt based on the document
    const contextPrompt = generateContextPrompt(doc)

    // Append to existing prompt or replace if empty
    if (localPrompt.trim()) {
      setLocalPrompt(prev => prev + '\n\n' + contextPrompt)
    } else {
      setLocalPrompt(contextPrompt)
    }
  }

  // Generate a context-aware prompt based on document content
  const generateContextPrompt = (doc: SearchResult): string => {
    const docType = doc.metadata?.component_type || 'component'
    const fileName = doc.metadata?.file_name || 'file'

    // Detect the type of code generation needed based on content
    if (doc.snippet.toLowerCase().includes('groovy')) {
      return `Using the context from "${doc.title || fileName}", create a Groovy script that:

1. Implements the functionality described in the document
2. Includes proper error handling and logging
3. Follows SAP Integration Suite best practices
4. Uses the patterns and approaches shown in the context

Context: ${doc.snippet.substring(0, 200)}...

Please generate the complete Groovy script with comments explaining each section.`
    } else if (doc.snippet.toLowerCase().includes('mapping') || doc.snippet.toLowerCase().includes('transformation')) {
      return `Based on the mapping context from "${doc.title || fileName}", create an integration flow that:

1. Handles the data transformation described
2. Implements proper message processing
3. Includes error handling and monitoring
4. Follows the patterns shown in the context

Context: ${doc.snippet.substring(0, 200)}...

Please generate the complete integration flow code with detailed comments.`
    } else if (doc.snippet.toLowerCase().includes('adapter') || doc.snippet.toLowerCase().includes('connection')) {
      return `Using the adapter configuration from "${doc.title || fileName}", create an integration solution that:

1. Configures the adapter as described
2. Handles connection parameters and authentication
3. Implements proper error handling
4. Includes monitoring and logging

Context: ${doc.snippet.substring(0, 200)}...

Please generate the complete adapter configuration and integration code.`
    } else {
      return `Based on the context from "${doc.title || fileName}", create an SAP integration solution that:

1. Implements the functionality described in the document
2. Follows SAP Integration Suite best practices
3. Includes proper error handling and logging
4. Uses appropriate integration patterns

Context: ${doc.snippet.substring(0, 200)}...

Please generate the complete integration code with detailed explanations.`
    }
  }

  const handleGenerate = async () => {
    if (!localPrompt.trim()) {
      setGenerationError('Please enter a prompt')
      return
    }

    if (!hasContext) {
      setGenerationError('Please run a search in the Search tab first to retrieve context')
      return
    }

    setGenerationLoading(true)
    setGenerationError(null)
    setGenerationPrompt(localPrompt)

    try {
      // Use selected documents if available, otherwise use all context documents
      const documentsToUse = selectedDocuments.length > 0 ? selectedDocuments : contextDocuments

      // Call the real generation API
      const response = await fetch(`${import.meta.env.VITE_UI_API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: localPrompt,
          selected_contents: documentsToUse.map(doc =>
            `Title: ${doc.title || doc.metadata?.file_name || 'Untitled'}\n` +
            `Content: ${doc.snippet}\n` +
            `Score: ${doc.scores?.final || 0}\n` +
            `File: ${doc.metadata?.file_name || 'N/A'}\n` +
            `---`
          ),
          model_key: selectedModel, // Use selected model
          top_k: documentsToUse.length
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Generation API error:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { detail: errorText }
        }
        throw new Error(errorData.detail || `Generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Generation API response:', data)

      // Extract generated code from various possible response formats
      let generatedCode = ''
      if (data.artifacts && Object.keys(data.artifacts).length > 0) {
        // Get the first artifact value
        generatedCode = Object.values(data.artifacts)[0] as string
      } else if (data.generated_code) {
        generatedCode = data.generated_code
      } else {
        generatedCode = 'No code generated'
      }

      setGeneratedCode(generatedCode)
    } catch (error) {
      console.error('Generation error:', error)

      // Fallback to mock API if real API fails
      try {
        const documentsToUse = selectedDocuments.length > 0 ? selectedDocuments : contextDocuments
        const generatedCode = await mockGenerateAPI(localPrompt, documentsToUse)
        setGeneratedCode(generatedCode)
        setGenerationError('Using mock generation (API unavailable)')
      } catch (mockError) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed'
        setGenerationError(errorMessage)
      }
    } finally {
      setGenerationLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Generation Lab</h1>
          <p className="text-sm text-muted-foreground">
            Use retrieved context to generate iFlow code with AI assistance
          </p>
        </div>
        
        {/* Context Status */}
        <div className="flex items-center space-x-2 text-sm">
          {hasContext ? (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <FileText className="h-4 w-4" />
              <span>{contextDocuments.length} context documents loaded</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>No context available</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout - Three Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        
        {/* Context Display Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Context Documents</h2>
            </div>
            
            {!hasContext ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Please run a search in the 'Search' tab first to retrieve context.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MousePointer className="h-3 w-3" />
                  Click documents to add context to your prompt
                </div>
                {contextDocuments.map((doc, index) => {
                  const isSelected = selectedDocuments.some(selected => selected.id === doc.id)
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc)}
                      className={`border rounded-md p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                          : 'bg-background/50 hover:bg-background/80'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Score: {doc.scores.final.toFixed(3)}
                          </span>
                          {isSelected && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              Selected
                            </span>
                          )}
                        </div>
                        {doc.metadata.component_type && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {doc.metadata.component_type}
                          </span>
                        )}
                      </div>

                      {doc.title && (
                        <h4 className="text-sm font-medium mb-1 truncate">{doc.title}</h4>
                      )}

                      <p className="text-xs text-muted-foreground overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {doc.snippet}
                      </p>

                      {doc.metadata.file_name && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {doc.metadata.file_name}
                        </p>
                      )}

                      {/* Click hint */}
                      <div className="mt-2 text-xs text-primary/60 flex items-center gap-1">
                        <MousePointer className="h-3 w-3" />
                        {isSelected ? 'Click to remove from prompt' : 'Click to add to prompt'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-lg p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Prompt</h2>
              </div>
              {selectedDocuments.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-muted-foreground">
                    {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => {
                      setSelectedDocuments([])
                      setLocalPrompt('')
                    }}
                    className="text-primary hover:text-primary/80 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Selected Documents Summary */}
            {selectedDocuments.length > 0 && (
              <div className="mb-3 p-2 bg-primary/5 border border-primary/20 rounded-md">
                <div className="text-xs text-primary font-medium mb-1">Context from selected documents:</div>
                <div className="space-y-1">
                  {selectedDocuments.map((doc, index) => (
                    <div key={doc.id} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-mono">#{index + 1}</span>
                      <span className="truncate">{doc.title || doc.metadata?.file_name || 'Untitled'}</span>
                      <button
                        onClick={() => handleDocumentClick(doc)}
                        className="text-primary hover:text-primary/80 ml-auto"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex-1 flex flex-col space-y-3">
              {/* Quick Prompt Templates */}
              {!localPrompt.trim() && selectedDocuments.length === 0 && (
                <div className="mb-2">
                  <div className="text-xs text-muted-foreground mb-2">Quick templates:</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'Create Groovy script',
                      'Build mapping flow',
                      'Configure adapter',
                      'Handle errors'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => setLocalPrompt(`Using the context provided, ${template.toLowerCase()} that:\n\n1. \n2. \n3. \n\nInclude proper error handling and logging.`)}
                        className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder={selectedDocuments.length > 0
                  ? "Your context-aware prompt has been generated. You can edit it or add more details..."
                  : `Enter your detailed prompt here...

Example: Using the context provided, create a Groovy script that:
1. Logs the incoming XML payload
2. Transforms the data by replacing specific values
3. Sets the processed data back to the message body

Include proper error handling and logging.`}
                className="flex-1 min-h-[300px] w-full px-3 py-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={generationLoading}
              />
              
              {generationError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                  <p className="text-sm font-medium">Generation Error</p>
                  <p className="text-xs">{generationError}</p>
                </div>
              )}

              {/* Model Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-muted-foreground">Model:</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={generationLoading}
                    className="px-2 py-1 text-sm border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="mistral">Mistral 7B (Recommended)</option>
                    <option value="zephyr">Zephyr 7B</option>
                  </select>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedDocuments.length > 0 ? `${selectedDocuments.length} documents selected` : 'No documents selected'}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generationLoading || !localPrompt.trim() || !hasContext}
                className="btn-primary flex items-center justify-center space-x-2 py-3"
              >
                {generationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Generate iFlow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Output Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-lg p-4 h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <Code className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Generated Code</h2>
            </div>
            
            <div className="flex-1 flex flex-col">
              {generationLoading ? (
                <div className="flex-1 flex items-center justify-center bg-background/50 border rounded-md">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">Generating iFlow code...</p>
                  </div>
                </div>
              ) : generatedCode ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground">
                      Generated using {selectedDocuments.length || contextDocuments.length} context document(s)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedCode)}
                        className="btn-compact-sm text-xs"
                      >
                        Copy Code
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([generatedCode], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'generated-iflow-code.txt'
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="btn-compact-sm text-xs"
                      >
                        Download
                      </button>
                    </div>
                  </div>

                  <pre className="flex-1 text-xs font-mono bg-background border rounded-md p-3 overflow-auto whitespace-pre-wrap">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-background/50 border rounded-md">
                  <div className="text-center text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Generated code will appear here</p>
                    <p className="text-xs mt-1">Enter a prompt and click "Generate iFlow"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
