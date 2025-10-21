// AI Summarize Button - per prd.md AI features
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiAPI } from '../../lib/ai';

interface AISummarizeButtonProps {
  text: string;
  onSummary: (summary: string) => void;
}

export default function AISummarizeButton({ text, onSummary }: AISummarizeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const summary = await aiAPI.summarizeText(text);
      onSummary(summary);
    } catch (error) {
      console.error('Summarization failed:', error);
      alert('AI summarization failed. Make sure Ollama is running: ollama serve');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSummarize}
      disabled={loading || !text.trim()}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Summarize with AI"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {loading ? 'Summarizing...' : 'AI Summary'}
    </button>
  );
}

