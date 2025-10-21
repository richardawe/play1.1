// AI Semantic Search - per prd.md AI features
import { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { aiAPI } from '../../lib/ai';

interface AISemanticSearchProps {
  onClose: () => void;
}

export default function AISemanticSearch({ onClose }: AISemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<[number, string, number]>>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await aiAPI.semanticSearch(query, 10);
      setResults(searchResults);
    } catch (error) {
      console.error('Semantic search failed:', error);
      alert('Semantic search failed. Make sure Ollama is running with nomic-embed-text model.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold">AI Semantic Search</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by meaning... (e.g., 'project deadlines')"
              className="flex-1 p-3 border border-border rounded-lg bg-background"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">
                Results ({results.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map(([id, text, score], index) => (
                  <div
                    key={`${id}-${index}`}
                    className="p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs text-muted-foreground">ID: {id}</span>
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        {(score * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No results found. Try a different search term.</p>
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-300">
              <strong>💡 Semantic Search:</strong> Finds content by meaning, not just keywords. 
              Example: "budget concerns" will also find "financial worries".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

