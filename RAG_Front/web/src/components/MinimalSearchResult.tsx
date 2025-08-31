import React, { useState } from 'react';
import { SearchResult } from '../types/api';
import { 
  FileText,
  Cpu,
  Globe,
  ExternalLink,
  X
} from 'lucide-react';

interface MinimalSearchResultProps {
  result: SearchResult;
  onViewFile?: (filePath: string) => void;
}

export function MinimalSearchResult({ result, onViewFile }: MinimalSearchResultProps) {
  const [showPopup, setShowPopup] = useState(false);

  const getSourceIcon = (hasKG: boolean, hasWeb: boolean) => {
    if (hasKG) return <Cpu className="w-4 h-4" />;
    if (hasWeb) return <Globe className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const hasKGEnhancements = (result.related_components?.length || 0) > 0 || (result.dependencies?.length || 0) > 0;
  const totalKGItems = (result.related_components?.length || 0) + (result.dependencies?.length || 0);
  const hasWebUpdates = (result.web_updates?.length || 0) > 0;

  return (
    <>
      {/* Minimal Result Card */}
      <div
        className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowPopup(true)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getSourceIcon(hasKGEnhancements, hasWebUpdates)}
              <h3 className="font-medium text-foreground line-clamp-1">
                {result.title || result.metadata.file_name || 'Untitled'}
              </h3>
              <span className="text-sm text-primary font-medium">
                {(result.scores.final * 100).toFixed(1)}%
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {result.snippet}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {result.metadata.path && (
                <span className="truncate">{result.metadata.path}</span>
              )}
              {hasKGEnhancements && (
                <div className="flex items-center gap-1 text-green-600">
                  <Cpu className="w-3 h-3" />
                  <span>{totalKGItems} KG</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Details Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {getSourceIcon(hasKGEnhancements, hasWebUpdates)}
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {result.title || result.metadata.file_name || 'Untitled'}
                  </h2>
                  <p className="text-sm text-muted-foreground">{result.metadata.path}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Score Information */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="font-medium text-primary mb-2">Relevance Score</h3>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary">
                    {(result.scores.final * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-primary/80">
                    Vector: {((result.scores.vector || 0) * 100).toFixed(1)}% |
                    Cross: {((result.scores.cross_encoder || 0) * 100).toFixed(1)}% |
                    Meta: {((result.scores.metadata_boost || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Content</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {result.snippet}
                  </pre>
                </div>
              </div>

              {/* Knowledge Graph Enhancements */}
              {hasKGEnhancements && (
                <div>
                  <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-green-600" />
                    Knowledge Graph Insights ({totalKGItems})
                  </h3>
                  
                  {/* Related Components */}
                  {result.related_components && result.related_components.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Related Components ({result.related_components.length})
                      </h4>
                      <div className="space-y-2">
                        {result.related_components.map((component, index) => (
                          <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{component.name}</span>
                                  <span className="text-xs text-muted-foreground">({component.type})</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{component.description}</p>
                              </div>
                              {component.properties?.path && (
                                <button
                                  onClick={() => onViewFile?.(component.properties.path)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:text-primary/80"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dependencies */}
                  {result.dependencies && result.dependencies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Dependencies ({result.dependencies.length})
                      </h4>
                      <div className="space-y-2">
                        {result.dependencies.map((dep, index) => (
                          <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{dep.name}</span>
                                  <span className="text-xs text-muted-foreground">({dep.type})</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{dep.description}</p>
                              </div>
                              {dep.properties?.path && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewFile?.(dep.properties.path);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 rounded transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <div>
                  <h3 className="font-medium text-foreground mb-3">Metadata</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm text-foreground">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t bg-muted/50">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
