import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api';

interface PromptHelperProps {
  currentPrompt: string;
  onSuggestionApply?: (improvedPrompt: string) => void;
}

export function PromptHelper({ currentPrompt, onSuggestionApply }: PromptHelperProps) {
  const [suggestion, setSuggestion] = useState<any>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const getSuggestion = async () => {
      if (currentPrompt.length > 10) {
        try {
          const response = await invoke('suggest_prompt_improvement', {
            prompt: currentPrompt,
          });
          setSuggestion(response);
          setShowSuggestion(true);
        } catch (error) {
          console.error('Failed to get suggestion:', error);
        }
      }
    };

    // Debounce the suggestion request
    const timer = setTimeout(getSuggestion, 1000);
    return () => clearTimeout(timer);
  }, [currentPrompt]);

  if (!showSuggestion || !suggestion) {
    return null;
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 mt-2">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-1">
            Suggested Improvement:
          </p>
          <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
            {suggestion.improved}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
            {suggestion.explanation}
          </p>
          {suggestion.improvements && (
            <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1 mb-2">
              {suggestion.improvements.map((improvement: string, index: number) => (
                <li key={index} className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {improvement}
                </li>
              ))}
            </ul>
          )}
          {onSuggestionApply && (
            <button
              onClick={() => {
                onSuggestionApply(suggestion.improved);
                setShowSuggestion(false);
              }}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md"
            >
              Apply Suggestion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

