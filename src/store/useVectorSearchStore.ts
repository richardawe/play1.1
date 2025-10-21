import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface VectorIndexEntry {
  id: number;
  content_id: number;
  content_type: string;
  embedding_vector: number[];
  model_name: string;
  chunk_index: number;
  metadata?: string;
  created_at: string;
}

export interface CreateVectorIndexEntry {
  content_id: number;
  content_type: string;
  embedding_vector: number[];
  model_name: string;
  chunk_index?: number;
  metadata?: string;
}

export interface SimilaritySearchResult {
  content_id: number;
  content_type: string;
  content: string;
  similarity_score: number;
  metadata?: string;
}

export interface VectorIndexStats {
  total_vectors: number;
  models_used: string[];
  average_vector_dimension: number | null;
  last_updated: string | null;
}

interface VectorSearchState {
  entries: VectorIndexEntry[];
  searchResults: SimilaritySearchResult[];
  stats: VectorIndexStats | null;
  loading: boolean;
  error: string | null;
  selectedEntry: VectorIndexEntry | null;
}

interface VectorSearchActions {
  // Entry management
  createEntry: (entry: CreateVectorIndexEntry) => Promise<VectorIndexEntry>;
  getEntry: (id: number) => Promise<VectorIndexEntry>;
  getEntriesForContent: (contentId: number, contentType: string) => Promise<VectorIndexEntry[]>;
  deleteEntry: (id: number) => Promise<void>;
  deleteContentVectors: (contentId: number, contentType: string) => Promise<void>;
  
  // Search operations
  similaritySearch: (queryVector: number[], limit: number, threshold: number) => Promise<SimilaritySearchResult[]>;
  searchSimilarContent: (query: string, limit: number, threshold: number, model?: string) => Promise<SimilaritySearchResult[]>;
  generateEmbedding: (text: string, model?: string) => Promise<number[]>;
  
  // Content indexing
  indexContent: (contentId: number, contentType: string, content: string, model?: string) => Promise<VectorIndexEntry[]>;
  
  // Stats
  getStats: () => Promise<VectorIndexStats>;
  
  // Ollama connection
  checkOllamaConnection: () => Promise<boolean>;
  
  // Database viewer
  getAllEntries: () => Promise<VectorIndexEntry[]>;
  clearVectorDatabase: () => Promise<number>;
  
  // Ollama models
  listOllamaModels: () => Promise<string[]>;
  
  // UI state
  setSelectedEntry: (entry: VectorIndexEntry | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Refresh data
  refreshEntries: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useVectorSearchStore = create<VectorSearchState & VectorSearchActions>((set, get) => ({
  // Initial state
  entries: [],
  searchResults: [],
  stats: null,
  loading: false,
  error: null,
  selectedEntry: null,

  // Entry management
  createEntry: async (entry: CreateVectorIndexEntry) => {
    try {
      set({ loading: true, error: null });
      const newEntry = await invoke<VectorIndexEntry>('create_vector_entry', { entry });
      set(state => ({ 
        entries: [newEntry, ...state.entries],
        loading: false 
      }));
      return newEntry;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getEntry: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const entry = await invoke<VectorIndexEntry>('get_vector_entry', { id });
      set({ loading: false });
      return entry;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getEntriesForContent: async (contentId: number, contentType: string) => {
    try {
      set({ loading: true, error: null });
      const entries = await invoke<VectorIndexEntry[]>('get_entries_for_content', { 
        contentId, 
        contentType 
      });
      set({ loading: false });
      return entries;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  deleteEntry: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('delete_vector_entry', { id });
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
        selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
        loading: false
      }));
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  deleteContentVectors: async (contentId: number, contentType: string) => {
    try {
      set({ loading: true, error: null });
      await invoke('delete_content_vectors', { contentId, contentType });
      set(state => ({
        entries: state.entries.filter(entry => 
          !(entry.content_id === contentId && entry.content_type === contentType)
        ),
        selectedEntry: state.selectedEntry?.content_id === contentId && 
                      state.selectedEntry?.content_type === contentType ? null : state.selectedEntry,
        loading: false
      }));
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Search operations
  similaritySearch: async (queryVector: number[], limit: number, threshold: number) => {
    try {
      set({ loading: true, error: null });
      const results = await invoke<SimilaritySearchResult[]>('similarity_search', { 
        queryVector, 
        limit, 
        threshold 
      });
      set({ searchResults: results, loading: false });
      return results;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  searchSimilarContent: async (query: string, limit: number, threshold: number, model?: string) => {
    try {
      console.log('Store: Starting search with params:', { query, limit, threshold, model });
      set({ loading: true, error: null });
      const results = await invoke<SimilaritySearchResult[]>('search_similar_content', { 
        query, 
        limit, 
        threshold, 
        model 
      });
      console.log('Store: Received search results:', results);
      set({ searchResults: results, loading: false });
      return results;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  generateEmbedding: async (text: string, model?: string) => {
    try {
      set({ loading: true, error: null });
      const embedding = await invoke<number[]>('generate_embedding', { text, model });
      set({ loading: false });
      return embedding;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Content indexing
  indexContent: async (contentId: number, contentType: string, content: string, model?: string) => {
    try {
      set({ loading: true, error: null });
      const entries = await invoke<VectorIndexEntry[]>('index_content', { 
        contentId, 
        contentType, 
        content, 
        model 
      });
      set(state => ({ 
        entries: [...entries, ...state.entries],
        loading: false 
      }));
      return entries;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Stats
  getStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await invoke<VectorIndexStats>('get_vector_stats');
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Ollama connection
  checkOllamaConnection: async () => {
    try {
      const isConnected = await invoke<boolean>('check_ollama_connection');
      return isConnected;
    } catch (error) {
      console.error('Error checking Ollama connection:', error);
      return false;
    }
  },

  // Database viewer
  getAllEntries: async () => {
    try {
      set({ loading: true, error: null });
      const entries = await invoke<VectorIndexEntry[]>('get_all_vector_entries');
      set({ loading: false });
      return entries;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // UI state
  setSelectedEntry: (entry: VectorIndexEntry | null) => set({ selectedEntry: entry }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  // Database management
  clearVectorDatabase: async () => {
    try {
      set({ loading: true, error: null });
      const deletedCount = await invoke<number>('clear_vector_database');
      set({ entries: [], searchResults: [], loading: false });
      return deletedCount;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Ollama models
  listOllamaModels: async () => {
    try {
      set({ loading: true, error: null });
      const models = await invoke<string[]>('list_ollama_models');
      set({ loading: false });
      return models;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Refresh data
  refreshEntries: async () => {
    // This would need to be implemented based on how you want to fetch all entries
    // For now, we'll just clear the current entries
    set({ entries: [] });
  },

  refreshStats: async () => {
    await get().getStats();
  },
}));
