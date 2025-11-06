import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Database, Search, BarChart3, Plus, Trash2, TestTube } from 'lucide-react';

interface VectorStats {
  total_vectors: number;
  models_used: string[];
  average_vector_dimension?: number;
  last_updated?: string;
}

interface SimilarityResult {
  content_id: number;
  content_type: string;
  content: string;
  similarity_score: number;
  metadata?: string;
}

export default function VectorTestPage() {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimilarityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testContent, setTestContent] = useState('');
  const [testContentType, setTestContentType] = useState('document');
  const [indexing, setIndexing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await invoke<VectorStats>('lancedb_get_stats');
      setStats(stats);
    } catch (error) {
      console.error('Failed to load LanceDB stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await invoke<SimilarityResult[]>('lancedb_search_similar_content', {
        query: searchQuery,
        limit: 10,
        threshold: 0.7,
        model: 'nomic-embed-text'
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIndexContent = async () => {
    if (!testContent.trim()) return;

    setIndexing(true);
    try {
      const results = await invoke<any[]>('lancedb_index_content', {
        contentId: Date.now(), // Use timestamp as content ID
        contentType: testContentType,
        content: testContent,
        model: 'nomic-embed-text'
      });
      
      console.log('Indexed content:', results);
      await loadStats(); // Refresh stats
      setTestContent(''); // Clear input
    } catch (error) {
      console.error('Indexing failed:', error);
    } finally {
      setIndexing(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all vector data? This cannot be undone.')) {
      return;
    }

    try {
      // This would need to be implemented in the backend
      await invoke('lancedb_clear_database');
      await loadStats();
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to clear database:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Vector Database Test</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearDatabase}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
            title="Clear all vector data"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Database</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Total Vectors</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.total_vectors || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Models Used</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats?.models_used?.join(', ') || 'None'}
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Vector Dimensions</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.average_vector_dimension || 384}</p>
        </div>
      </div>

      {/* Index Content Section */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Index Test Content</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={testContentType}
                onChange={(e) => setTestContentType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="document">Document</option>
                <option value="task">Task</option>
                <option value="event">Event</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleIndexContent}
                disabled={!testContent.trim() || indexing}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {indexing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Index Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Enter some content to index and search..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Semantic Search</h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your content semantically..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Search Results ({searchResults.length})</h4>
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 bg-accent/30 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                      {result.content_type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Score: {(result.similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground line-clamp-3">
                  {result.content}
                </p>
                {result.metadata && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.metadata}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
