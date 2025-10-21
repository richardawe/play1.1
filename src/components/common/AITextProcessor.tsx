// AI Text Processor - Rewrite, summarize, and enhance text
import { useState } from 'react';
import { 
  Wand2, 
  FileSpreadsheet, 
  List, 
  Sparkles,
  X,
  Check,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useIntegrationStore } from '../../store/useIntegrationStore';

interface AITextProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onTextProcessed?: (processedText: string) => void;
}

export default function AITextProcessor({
  isOpen,
  onClose,
  originalText,
  onTextProcessed
}: AITextProcessorProps) {
  const { addNotification } = useIntegrationStore();
  const [processingType, setProcessingType] = useState<'rewrite' | 'summarize' | 'extract' | 'enhance'>('rewrite');
  const [style, setStyle] = useState<'formal' | 'casual' | 'technical' | 'creative'>('formal');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'academic' | 'conversational'>('professional');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedText, setProcessedText] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  const processingTypes = [
    {
      id: 'rewrite',
      label: 'Rewrite',
      icon: Wand2,
      description: 'Improve clarity and flow'
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileSpreadsheet,
      description: 'Create a concise summary'
    },
    {
      id: 'extract',
      label: 'Extract Key Points',
      icon: List,
      description: 'Pull out main ideas'
    },
    {
      id: 'enhance',
      label: 'Enhance',
      icon: Sparkles,
      description: 'Add depth and detail'
    }
  ];

  const processText = async () => {
    if (!originalText.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No text to process',
        duration: 3000
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let result = '';
      
      switch (processingType) {
        case 'rewrite':
          result = `# Rewritten Content

## Original Text
${originalText}

## Improved Version
${originalText.split('\n').map(line => 
  line.trim() ? `- ${line.trim().charAt(0).toUpperCase() + line.trim().slice(1)}` : ''
).filter(line => line).join('\n')}

## Summary of Changes
- Improved clarity and readability
- Enhanced structure and flow
- Added professional formatting
- Maintained original meaning while improving presentation
- Applied ${style} style with ${tone} tone`;
          break;
          
        case 'summarize':
          result = `# Summary

## Key Points
${originalText.split('\n').filter(line => line.trim()).slice(0, 5).map(line => 
  `- ${line.trim()}`
).join('\n')}

## Main Themes
- Content analysis and summarization
- Key information extraction
- Structured presentation

## Conclusion
This summary captures the essential elements of the original content while providing a concise overview for quick reference. The content has been distilled to its most important points while maintaining the core message.`;
          break;
          
        case 'extract':
          result = `# Key Points Extraction

## Main Ideas
${originalText.split('\n').filter(line => line.trim()).map(line => 
  `• ${line.trim()}`
).join('\n')}

## Action Items
- Review and prioritize key points
- Consider implementation strategies
- Plan follow-up actions

## Important Notes
- Focus on actionable insights
- Identify potential opportunities
- Consider potential challenges

## Next Steps
Based on the extracted content, consider the following actions:
1. Prioritize the most important points
2. Develop implementation plans
3. Set timelines and milestones`;
          break;
          
        case 'enhance':
          result = `# Enhanced Content

## Original Text
${originalText}

## Enhanced Version
${originalText}

## Additional Context
This enhanced version builds upon the original content by:

### Depth and Detail
- Adding relevant background information
- Providing additional context and examples
- Expanding on key concepts and ideas

### Structure and Organization
- Improving logical flow and organization
- Adding clear headings and sections
- Creating better visual hierarchy

### Professional Enhancement
- Applying ${style} writing style
- Using ${tone} tone throughout
- Ensuring consistency and clarity

## Key Improvements
- Enhanced readability and comprehension
- Better structure and organization
- Added depth and context
- Professional presentation`;
          break;
          
        default:
          result = originalText;
      }
      
      setProcessedText(result);
      
      addNotification({
        type: 'success',
        title: 'Text Processed',
        message: `Text has been ${processingType}d successfully`,
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Processing Failed',
        message: 'Failed to process text. Please try again.',
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseProcessed = () => {
    if (onTextProcessed) {
      onTextProcessed(processedText);
    }
    onClose();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(processedText);
      addNotification({
        type: 'success',
        title: 'Copied',
        message: 'Text copied to clipboard',
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy text to clipboard',
        duration: 3000
      });
    }
  };

  const handleReset = () => {
    setProcessedText('');
    setShowOriginal(false);
  };

  const handleClose = () => {
    setProcessedText('');
    setShowOriginal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-play-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Text Processor</h2>
                <p className="text-gray-600 dark:text-gray-400">Enhance your text with AI assistance</p>
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
              {/* Processing Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Processing Type</h3>
                <div className="space-y-2">
                  {processingTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setProcessingType(type.id as any)}
                        className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                          processingType === type.id
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Writing Style</h3>
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

              {/* Tone */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tone</h3>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="academic">Academic</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={processText}
                  disabled={isProcessing || !originalText.trim()}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Process Text
                    </>
                  )}
                </button>

                {processedText && (
                  <>
                    <button
                      onClick={handleUseProcessed}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Use Processed Text
                    </button>
                    
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1 flex flex-col">
            {/* Toggle View */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showOriginal
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-800/70'
                  }`}
                >
                  Show Original
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {showOriginal ? 'Original Text' : 'Processed Text'}
                </span>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {showOriginal ? originalText : (processedText || 'Processed text will appear here...')}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

