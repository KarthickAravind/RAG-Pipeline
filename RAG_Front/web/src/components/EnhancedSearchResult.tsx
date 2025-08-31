import React, { useState } from 'react';
import { SearchResult, KnowledgeGraphResult, CodeTemplateType } from '../types/api';
import {
  ChevronDown,
  ChevronRight,
  Code,
  FileText,
  Cpu,
  Globe,
  Clipboard,
  ExternalLink
} from 'lucide-react';

interface EnhancedSearchResultProps {
  result: SearchResult;
  onGenerateCode?: (result: SearchResult, template: CodeTemplateType) => void;
  onViewFile?: (filePath: string) => void;
}

export const EnhancedSearchResult: React.FC<EnhancedSearchResultProps> = ({
  result,
  onGenerateCode,
  onViewFile
}) => {
  const [showKGDetails, setShowKGDetails] = useState(false);
  const [showCodeOptions, setShowCodeOptions] = useState(false);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'vector': return <FileText className="w-4 h-4" />;
      case 'kg': return <Cpu className="w-4 h-4" />;
      case 'web': return <Globe className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'BUSINESS_PROCESS': return 'bg-blue-100 text-blue-800';
      case 'CONTENT_RELATED': return 'bg-green-100 text-green-800';
      case 'RELATED_FILE': return 'bg-purple-100 text-purple-800';
      case 'CONFIG_PROPERTY': return 'bg-orange-100 text-orange-800';
      case 'ADAPTER_CONFIG': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  const hasKGEnhancements = result.related_components?.length || result.dependencies?.length;
  const totalKGItems = (result.related_components?.length || 0) + (result.dependencies?.length || 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4 hover:shadow-lg transition-shadow">
      {/* Header with Title and Score */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {result.title || 'SAP iFlow Component'}
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Relevance:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatScore(result.final_relevance_score || result.scores.final)}
              </span>
              {result.final_relevance_score && result.final_relevance_score > result.scores.final && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  +{formatScore(result.final_relevance_score - result.scores.final)} KG Boost
                </span>
              )}
            </div>
            {hasKGEnhancements && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Cpu className="w-4 h-4" />
                <span>{totalKGItems} KG enhancements</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCodeOptions(!showCodeOptions)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Code className="w-4 h-4" />
            Generate Code
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(result.snippet)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <Clipboard className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>

      {/* Source Breakdown */}
      {result.source_breakdown && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Sources:</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              {getSourceIcon('vector')}
              <span className="text-sm">Vector: {formatScore(result.source_breakdown.vector)}</span>
            </div>
            <div className="flex items-center gap-1">
              {getSourceIcon('kg')}
              <span className="text-sm">KG: {formatScore(result.source_breakdown.kg)}</span>
            </div>
            <div className="flex items-center gap-1">
              {getSourceIcon('web')}
              <span className="text-sm">Web: {formatScore(result.source_breakdown.web)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {result.content_preview || result.snippet}
        </p>
      </div>

      {/* Code Generation Options */}
      {showCodeOptions && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Generate SAP iFlow Code:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(['groovy_script', 'xslt_mapping', 'xml_configuration', 'properties_file', 'complete_iflow'] as CodeTemplateType[]).map((template) => (
              <button
                key={template}
                onClick={() => onGenerateCode?.(result, template)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {template.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Graph Enhancements */}
      {hasKGEnhancements && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowKGDetails(!showKGDetails)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
          >
            {showKGDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Knowledge Graph Insights ({totalKGItems})
          </button>
          
          {showKGDetails && (
            <div className="space-y-4">
              {/* Business Process Steps */}
              {result.related_components && result.related_components.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Related Components:</h5>
                  <div className="space-y-2">
                    {result.related_components.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{component.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getRelationshipColor(component.relationship_type)}`}>
                              {component.relationship_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{component.description}</p>
                          {component.properties?.step_type && (
                            <span className="text-xs text-gray-500">Type: {component.properties.step_type}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies/Files */}
              {result.dependencies && result.dependencies.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Implementation Files:</h5>
                  <div className="space-y-2">
                    {result.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{dep.name}</span>
                            <span className="text-xs text-gray-500">({dep.type})</span>
                          </div>
                          <p className="text-sm text-gray-600">{dep.description}</p>
                        </div>
                        {dep.properties?.path && (
                          <button
                            onClick={() => onViewFile?.(dep.properties.path)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchResult;
