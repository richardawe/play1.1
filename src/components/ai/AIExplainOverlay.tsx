import { useState } from 'react';
import { HelpCircle, X, Lightbulb } from 'lucide-react';
import { invoke } from '@tauri-apps/api';

interface AIExplainOverlayProps {
  context: string;
  output: string;
  onClose?: () => void;
}

export function AIExplainOverlay({ context, output, onClose }: AIExplainOverlayProps) {
  const [explanation, setExplanation] = useState<string>('');

  const getExplanation = async () => {
    try {
      const response = await invoke('explain_ai_output', {
        context,
        output,
      });
      setExplanation((response as any).explanation);
    } catch (error) {
      console.error('Failed to get explanation:', error);
      setExplanation('Unable to generate explanation at this time.');
    }
  };

  useState(() => {
    getExplanation();
  });

  return (
    <div className="absolute top-0 right-0 mt-2 mr-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Explanation</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Why this result?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {explanation || 'Generating explanation...'}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> More specific prompts lead to better results. Try adding context or examples.
          </p>
        </div>
      </div>
    </div>
  );
}

// Floating help button that triggers the overlay
export function AIExplainButton({ context, output }: { context: string; output: string }) {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowOverlay(!showOverlay)}
        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        title="Explain this AI output"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {showOverlay && (
        <AIExplainOverlay
          context={context}
          output={output}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </div>
  );
}

