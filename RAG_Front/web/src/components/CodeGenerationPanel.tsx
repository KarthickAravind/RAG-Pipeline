import React, { useState } from 'react';
import { SearchResult, CodeGenerationResponse, CodeTemplateType } from '../types/api';
import {
  Code,
  Clipboard,
  Download,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

interface CodeGenerationPanelProps {
  result: SearchResult;
  templateType: CodeTemplateType;
  onClose: () => void;
}

export const CodeGenerationPanel: React.FC<CodeGenerationPanelProps> = ({
  result,
  templateType,
  onClose
}) => {
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [includeValidation, setIncludeValidation] = useState(true);
  const [includeErrorHandling, setIncludeErrorHandling] = useState(true);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      // Mock code generation based on the search result data
      const mockResponse: CodeGenerationResponse = {
        generated_code: generateMockCode(),
        template_used: templateType,
        sources_used: {
          vector_content: true,
          business_steps: result.related_components?.length || 0,
          file_references: result.dependencies?.length || 0
        },
        code_sections: {
          imports: generateImports(),
          configuration: generateConfiguration(),
          validation: includeValidation ? generateValidation() : '',
          main_logic: generateMainLogic(),
          error_handling: includeErrorHandling ? generateErrorHandling() : ''
        },
        elapsed_ms: 1200
      };
      
      setGeneratedCode(mockResponse);
    } catch (error) {
      console.error('Code generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockCode = (): string => {
    const businessSteps = result.related_components?.map(c => c.name) || [];
    const files = result.dependencies?.map(d => d.name) || [];
    
    return `import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.gateway.ip.core.customdev.processor.MessageImpl

/**
 * ${templateType.replace('_', ' ').toUpperCase()} - Generated from SAP Agentic RAG Lab
 * 
 * Based on search result: "${result.title || 'SAP iFlow Component'}"
 * Enhanced with Knowledge Graph insights:
${businessSteps.map(step => ` * - Business Step: ${step}`).join('\n')}
${files.map(file => ` * - Reference File: ${file}`).join('\n')}
 */
def Message processData(Message message) {
    try {
        // Configuration from search result
        ${extractConfigFromContent()}
        
        // Business process validation (from KG insights)
        ${businessSteps.map(step => `validate${step.replace(/\s+/g, '')}()`).join('\n        ')}
        
        // Main processing logic
        ${generateMainLogic()}
        
        return message
        
    } catch (Exception e) {
        ${includeErrorHandling ? 'handleError(e, message)' : 'throw e'}
    }
}

${includeValidation ? generateValidationMethods() : ''}
${includeErrorHandling ? generateErrorHandlingMethods() : ''}`;
  };

  const extractConfigFromContent = (): string => {
    const content = result.content_preview || result.snippet;
    
    // Extract configuration details from content
    if (content.includes('certificate')) {
      return `def certificateSubject = "cn=subject"
        def certificateIssuer = "cn=issuer"
        def connectionTimeout = 60000`;
    }
    
    if (content.includes('timeout')) {
      return `def connectionTimeout = 60000 // 60 seconds
        def retryAttempts = 3`;
    }
    
    return `// Configuration extracted from: ${result.title}
        def configProperties = message.getProperties()`;
  };

  const generateImports = (): string => {
    return `import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.gateway.ip.core.customdev.processor.MessageImpl`;
  };

  const generateConfiguration = (): string => {
    return extractConfigFromContent();
  };

  const generateValidation = (): string => {
    const businessSteps = result.related_components?.filter(c => 
      c.relationship_type === 'BUSINESS_PROCESS'
    ) || [];
    
    return businessSteps.map(step => 
      `// Validation for: ${step.name}
def validate${step.name.replace(/\s+/g, '')}() {
    // Implementation based on: ${step.description}
    return true
}`
    ).join('\n\n');
  };

  const generateMainLogic = (): string => {
    return `// Main processing logic
        def payload = message.getBody(String.class)
        
        // Process based on search result insights
        processPayload(payload)
        
        message.setBody(payload)`;
  };

  const generateErrorHandling = (): string => {
    return `def handleError(Exception e, Message message) {
    message.setProperty("error.message", e.getMessage())
    message.setProperty("error.timestamp", new Date().toString())
    throw new Exception("Processing failed: " + e.getMessage())
}`;
  };

  const generateValidationMethods = (): string => {
    return result.related_components?.filter(c => 
      c.relationship_type === 'BUSINESS_PROCESS'
    ).map(step => 
      `def validate${step.name.replace(/\s+/g, '')}() {
    // ${step.description}
    return true
}`
    ).join('\n\n') || '';
  };

  const generateErrorHandlingMethods = (): string => {
    return generateErrorHandling();
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode.generated_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCode = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode.generated_code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateType}_${Date.now()}.groovy`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  React.useEffect(() => {
    generateCode();
  }, [templateType, includeValidation, includeErrorHandling]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Code className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Code Generation: {templateType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h2>
              <p className="text-sm text-gray-600">
                Generated from: {result.title || 'SAP iFlow Component'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Options */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeValidation}
                onChange={(e) => setIncludeValidation(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include Validation Logic</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeErrorHandling}
                onChange={(e) => setIncludeErrorHandling(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include Error Handling</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating SAP iFlow code...</p>
              </div>
            </div>
          ) : generatedCode ? (
            <div className="h-full flex flex-col">
              {/* Source Information */}
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800">
                      Sources: Vector Content + {generatedCode.sources_used.business_steps} Business Steps + {generatedCode.sources_used.file_references} File References
                    </span>
                  </div>
                  <span className="text-blue-600">Generated in {generatedCode.elapsed_ms}ms</span>
                </div>
              </div>

              {/* Code Display */}
              <div className="flex-1 overflow-auto">
                <pre className="p-6 text-sm font-mono bg-gray-900 text-gray-100 h-full overflow-auto">
                  <code>{generatedCode.generated_code}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">Failed to generate code</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedCode && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Ready to use in your SAP iFlow integration
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={downloadCode}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeGenerationPanel;
