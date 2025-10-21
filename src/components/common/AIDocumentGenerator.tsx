// AI Document Generator - Cross-module document creation
import { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Brain, 
  Wand2, 
  FileSpreadsheet, 
  List, 
  X,
  Save
} from 'lucide-react';
import { useIntegrationStore } from '../../store/useIntegrationStore';
import { AIDocumentRequest } from '../../types/integration';

interface AIDocumentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContent?: string;
  sourceModule?: string;
  onDocumentCreated?: (documentId: string) => void;
}

export default function AIDocumentGenerator({
  isOpen,
  onClose,
  sourceContent = '',
  sourceModule = 'chat',
  onDocumentCreated
}: AIDocumentGeneratorProps) {
  const { generateDocument, addNotification } = useIntegrationStore();
  const [content, setContent] = useState(sourceContent);
  const [documentType, setDocumentType] = useState<'generate' | 'rewrite' | 'summarize' | 'extract' | 'outline'>('generate');
  const [style, setStyle] = useState<'formal' | 'casual' | 'technical' | 'creative'>('formal');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [focus, setFocus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  const documentTypes = [
    {
      id: 'generate',
      label: 'Generate Document',
      icon: FileText,
      description: 'Create a new document from scratch'
    },
    {
      id: 'rewrite',
      label: 'Rewrite Content',
      icon: Wand2,
      description: 'Improve and rewrite existing content'
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileSpreadsheet,
      description: 'Create a summary of the content'
    },
    {
      id: 'extract',
      label: 'Extract Key Points',
      icon: List,
      description: 'Extract main points and insights'
    },
    {
      id: 'outline',
      label: 'Create Outline',
      icon: List,
      description: 'Generate a structured outline'
    }
  ];

  const handleGenerate = async () => {
    if (!content.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please provide content to work with',
        duration: 3000
      });
      return;
    }

    setIsGenerating(true);
    try {
      const request: AIDocumentRequest = {
        content,
        type: documentType,
        context: {
          module: sourceModule as any,
          content: sourceContent,
          metadata: {
            sourceModule,
            timestamp: new Date().toISOString()
          }
        },
        options: {
          style,
          length,
          focus: focus.trim() || undefined
        }
      };

      const result = await generateDocument(request);
      setGeneratedContent(result);
      
      // Auto-generate title based on content
      const title = documentType === 'generate' 
        ? `AI Generated Document - ${new Date().toLocaleDateString()}`
        : `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} - ${new Date().toLocaleDateString()}`;
      setDocumentTitle(title);

      addNotification({
        type: 'success',
        title: 'Document Generated',
        message: 'AI document has been generated successfully',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate document. Please try again.',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!generatedContent.trim() || !documentTitle.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please generate content and provide a title',
        duration: 3000
      });
      return;
    }

    try {
      // This would call the document creation API
      const { invoke } = await import('@tauri-apps/api/tauri');
      const documentData = {
        title: documentTitle,
        content: generatedContent,
        source: sourceModule,
        ai_generated: true,
        generation_type: documentType
      };

      const result = await invoke('create_document', { document: documentData });
      
      addNotification({
        type: 'success',
        title: 'Document Saved',
        message: 'Document has been saved successfully',
        duration: 3000
      });

      if (onDocumentCreated) {
        onDocumentCreated(result as string);
      }

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save document. Please try again.',
        duration: 5000
      });
    }
  };

  const handleClose = () => {
    setGeneratedContent('');
    setDocumentTitle('');
    setContent(sourceContent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-play-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Document Generator</h2>
                <p className="text-gray-600 dark:text-gray-400">Create documents with AI assistance</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Configuration */}
          <div className="w-1/3 p-6 border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto">
            <div className="space-y-6">
              {/* Document Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Document Type</h3>
                <div className="space-y-2">
                  {documentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setDocumentType(type.id as any)}
                        className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                          documentType === type.id
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-700 dark:text-purple-300'
                            : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm opacity-75">{type.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Style</h3>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className="w-full p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              {/* Length */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Length</h3>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>

              {/* Focus Area */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Focus Area (Optional)</h3>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g., technical details, user experience, business impact"
                  className="w-full p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !content.trim()}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Document
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1 flex flex-col">
            {/* Input Content */}
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Source Content</h3>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the content you want to work with..."
                className="w-full h-32 p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Generated Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Content</h3>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="Document title..."
                      className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      onClick={handleSaveDocument}
                      className="btn-primary flex items-center gap-2 px-4 py-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                )}
              </div>
              
              {generatedContent ? (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {generatedContent}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Generated content will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

