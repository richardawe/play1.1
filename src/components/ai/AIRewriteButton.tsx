// AI Rewrite Button - per prd.md AI features
import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { aiAPI } from '../../lib/ai';

interface AIRewriteButtonProps {
  text: string;
  onRewrite: (rewritten: string) => void;
}

export default function AIRewriteButton({ text, onRewrite }: AIRewriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showStyles, setShowStyles] = useState(false);

  const styles = ['professional', 'casual', 'concise', 'detailed', 'friendly'];

  const handleRewrite = async (style: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setShowStyles(false);
    try {
      const rewritten = await aiAPI.rewriteText(text, style);
      onRewrite(rewritten);
    } catch (error) {
      console.error('Rewrite failed:', error);
      alert('AI rewrite failed. Make sure Ollama is running: ollama serve');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowStyles(!showStyles)}
        disabled={loading || !text.trim()}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Rewrite with AI"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {loading ? 'Rewriting...' : 'AI Rewrite'}
      </button>

      {showStyles && (
        <div className="absolute top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[150px]">
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => handleRewrite(style)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg capitalize"
            >
              {style}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

