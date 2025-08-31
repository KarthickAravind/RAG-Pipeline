import { useState } from 'react'
import { Zap, FileText, Code, AlertCircle, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { mockGenerateAPI } from '@/lib/api'

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

  // Get top 5 search results for context
  const contextDocuments = searchResults.slice(0, 5)
  const hasContext = contextDocuments.length > 0

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
      // TODO: Replace with real API call to /generate endpoint
      // const response = await api.generate({
      //   prompt: localPrompt,
      //   context: contextDocuments
      // })
      // setGeneratedCode(response.generated_code)

      // Using mock API for now
      const generatedCode = await mockGenerateAPI(localPrompt, contextDocuments)
      setGeneratedCode(generatedCode)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed'
      setGenerationError(errorMessage)
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
                {contextDocuments.map((doc, index) => (
                  <div key={doc.id} className="border rounded-md p-3 bg-background/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Score: {doc.scores.final.toFixed(3)}
                        </span>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-lg p-4 h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Prompt</h2>
            </div>
            
            <div className="flex-1 flex flex-col space-y-3">
              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="Enter your detailed prompt here...

Example: Using the context provided, create a Groovy script that:
1. Logs the incoming XML payload
2. Transforms the data by replacing specific values
3. Sets the processed data back to the message body

Include proper error handling and logging."
                className="flex-1 min-h-[300px] w-full px-3 py-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={generationLoading}
              />
              
              {generationError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                  <p className="text-sm font-medium">Generation Error</p>
                  <p className="text-xs">{generationError}</p>
                </div>
              )}
              
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
                  <pre className="flex-1 text-xs font-mono bg-background border rounded-md p-3 overflow-auto whitespace-pre-wrap">
                    <code>{generatedCode}</code>
                  </pre>
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedCode)}
                      className="btn-compact-sm text-xs"
                    >
                      Copy Code
                    </button>
                  </div>
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
