// Vector Debug Panel - Debug vector database content
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Database, Search, RefreshCw, AlertCircle } from 'lucide-react';

interface VectorStats {
  total_vectors: number;
  models_used: string[];
  average_vector_dimension?: number;
  last_updated?: string;
}

interface VectorEntry {
  id: number;
  content_id: number;
  content_type: string;
  content: string;
  model_name: string;
  chunk_index?: number;
  metadata?: string;
  created_at: string;
}

export default function VectorDebugPanel() {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await invoke<VectorStats>('lancedb_get_stats');
      setStats(stats);
    } catch (error) {
      console.error('Failed to load vector stats:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = await invoke<VectorEntry[]>('lancedb_get_all_entries');
      setEntries(entries);
    } catch (error) {
      console.error('Failed to load vector entries:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await invoke<any[]>('lancedb_search_similar_content', {
        query: 'test',
        limit: 5,
        threshold: 0.5,
        model: 'nomic-embed-text'
      });
      console.log('Search results:', results);
    } catch (error) {
      console.error('Search failed:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadEntries();
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Vector Database Debug
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Database Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Vectors:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{stats.total_vectors}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Models:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{stats.models_used.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Vector Entries ({entries.length})</h4>
          <button
            onClick={loadEntries}
            disabled={loading}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Refresh
          </button>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No vector entries found. Process some documents first.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {entry.content_type} #{entry.content_id}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.model_name}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                  {entry.content}
                </p>
                {entry.metadata && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {entry.metadata}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Search */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={testSearch}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Search className="w-4 h-4" />
          Test Search
        </button>
      </div>
    </div>
  );
}


