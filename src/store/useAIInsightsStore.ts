import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface Insight {
  id: number;
  insight_type: string;
  title: string;
  description: string;
  confidence: number;
  content_ids: string;
  metadata?: string;
  priority: number;
  is_read: boolean;
  created_at: string;
}

export interface CreateInsight {
  insight_type: string;
  title: string;
  description: string;
  confidence: number;
  content_ids: string;
  metadata?: string;
  priority?: number;
}

export interface InsightStats {
  total_insights: number;
  unread_insights: number;
  insights_by_type: Array<[string, number]>;
  average_confidence: number;
  high_priority_insights: number;
}

export interface ContentRecommendation {
  content_id: number;
  content_type: string;
  title: string;
  reason: string;
  relevance_score: number;
  recommendation_type: string;
}

interface AIInsightsState {
  insights: Insight[];
  recommendations: ContentRecommendation[];
  stats: InsightStats | null;
  loading: boolean;
  error: string | null;
  selectedInsight: Insight | null;
  contentAnalysis: any | null;
  realTimeAnalysis: any | null;
}

interface AIInsightsActions {
  // Insight management
  createInsight: (insight: CreateInsight) => Promise<Insight>;
  getInsight: (id: number) => Promise<Insight>;
  getInsights: (limit?: number, unreadOnly?: boolean) => Promise<Insight[]>;
  markInsightRead: (id: number) => Promise<void>;
  deleteInsight: (id: number) => Promise<void>;
  
  // Stats and analysis
  getStats: () => Promise<InsightStats>;
  analyzeContentPatterns: () => Promise<any>;
  generateInsights: () => Promise<Insight[]>;
  
  // Recommendations
  generateContentRecommendations: (userId?: number, limit?: number) => Promise<ContentRecommendation[]>;
  
  // Real-time analysis
  getRealTimeAnalysis: () => Promise<any>;
  
  // Clear insights
  clearAllInsights: () => Promise<number>;
  cleanCorruptedInsights: () => Promise<number>;
  
  // UI state
  setSelectedInsight: (insight: Insight | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Refresh data
  refreshInsights: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
}

export const useAIInsightsStore = create<AIInsightsState & AIInsightsActions>((set, get) => ({
  // Initial state
  insights: [],
  recommendations: [],
  stats: null,
  loading: false,
  error: null,
  selectedInsight: null,
  contentAnalysis: null,
  realTimeAnalysis: null,

  // Insight management
  createInsight: async (insight: CreateInsight) => {
    try {
      set({ loading: true, error: null });
      const newInsight = await invoke<Insight>('create_insight', { insight });
      set(state => ({ 
        insights: [newInsight, ...state.insights],
        loading: false 
      }));
      return newInsight;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getInsight: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const insight = await invoke<Insight>('get_insight', { id });
      set({ loading: false });
      return insight;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getInsights: async (limit?: number, unreadOnly?: boolean) => {
    try {
      set({ loading: true, error: null });
      const insights = await invoke<Insight[]>('get_insights', { 
        limit, 
        unreadOnly: unreadOnly || false
      });
      set({ insights, loading: false });
      return insights;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  markInsightRead: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('mark_insight_read', { id });
      set(state => ({
        insights: state.insights.map(insight => 
          insight.id === id ? { ...insight, is_read: true } : insight
        ),
        selectedInsight: state.selectedInsight?.id === id 
          ? { ...state.selectedInsight, is_read: true } 
          : state.selectedInsight,
        loading: false
      }));
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  deleteInsight: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('delete_insight', { id });
      set(state => ({
        insights: state.insights.filter(insight => insight.id !== id),
        selectedInsight: state.selectedInsight?.id === id ? null : state.selectedInsight,
        loading: false
      }));
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Stats and analysis
  getStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await invoke<InsightStats>('get_insight_stats');
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  analyzeContentPatterns: async () => {
    try {
      set({ loading: true, error: null });
      const analysis = await invoke<any>('analyze_content_patterns');
      set({ contentAnalysis: analysis, loading: false });
      return analysis;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  generateInsights: async () => {
    try {
      set({ loading: true, error: null });
      const insights = await invoke<Insight[]>('generate_insights');
      set(state => ({ 
        insights: [...insights, ...state.insights],
        loading: false 
      }));
      return insights;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },


  // Recommendations
  generateContentRecommendations: async (userId?: number, limit?: number) => {
    try {
      set({ loading: true, error: null });
      const recommendations = await invoke<ContentRecommendation[]>('generate_content_recommendations', { 
        userId, 
        limit: limit || 10 
      });
      set({ recommendations, loading: false });
      return recommendations;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getRealTimeAnalysis: async () => {
    try {
      set({ loading: true, error: null });
      const analysis = await invoke<any>('get_real_time_analysis');
      set({ realTimeAnalysis: analysis, loading: false });
      return analysis;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  clearAllInsights: async () => {
    try {
      set({ loading: true, error: null });
      const deletedCount = await invoke<number>('clear_all_insights');
      set({ insights: [], loading: false });
      return deletedCount;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  cleanCorruptedInsights: async () => {
    try {
      set({ loading: true, error: null });
      const deletedCount = await invoke<number>('clean_corrupted_insights');
      set({ loading: false });
      return deletedCount;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // UI state
  setSelectedInsight: (insight: Insight | null) => set({ selectedInsight: insight }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  // Refresh data
  refreshInsights: async () => {
    await get().getInsights(50, false);
  },

  refreshStats: async () => {
    await get().getStats();
  },

  refreshRecommendations: async () => {
    await get().generateContentRecommendations();
  },
}));
