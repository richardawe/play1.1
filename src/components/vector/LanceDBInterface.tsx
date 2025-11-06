import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Database, Search, BarChart3, Trash2, Download } from 'lucide-react';

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

export default function LanceDBInterface() {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimilarityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationCount, setMigrationCount] = useState(0);

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

  const handleMigration = async () => {
    setMigrating(true);
    try {
      const count = await invoke<number>('lancedb_migrate_from_sqlite');
      setMigrationCount(count);
      await loadStats(); // Refresh stats after migration
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">LanceDB Vector Database</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMigration}
            disabled={migrating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {migrating ? 'Migrating...' : 'Migrate from SQLite'}
          </button>
          <button
            onClick={clearDatabase}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
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

      {/* Search Section */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Semantic Search</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your content semantically..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
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

      {/* Migration Status */}
      {migrationCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Migration Complete</h3>
          </div>
          <p className="text-green-700">
            Successfully migrated {migrationCount} vectors from SQLite to LanceDB.
          </p>
        </div>
      )}
    </div>
  );
}


