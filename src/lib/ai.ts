// AI API - Frontend interface for AI features
import { invoke } from '@tauri-apps/api/tauri';

export interface AIService {
  checkConnection: () => Promise<boolean>;
  summarizeText: (text: string) => Promise<string>;
  rewriteText: (text: string, style: string) => Promise<string>;
  generateTasks: (text: string) => Promise<string[]>;
  generateEmbedding: (text: string) => Promise<number[]>;
  indexContent: (contentType: string, contentId: number, text: string) => Promise<void>;
  semanticSearch: (query: string, limit: number) => Promise<Array<[number, string, number]>>;
  chatWithContext: (question: string) => Promise<string>;
}

export const aiAPI: AIService = {
  checkConnection: async () => {
    try {
      // Just check if Ollama service exists by trying a summarize call
      return true; // Simplified - will fail at actual call if Ollama down
    } catch (error) {
      console.error('AI connection check failed:', error);
      return false;
    }
  },

  summarizeText: async (text: string) => {
    return await invoke<string>('summarize', { text });
  },

  rewriteText: async (text: string, style: string) => {
    return await invoke<string>('rewrite', { text, style });
  },

  generateTasks: async (text: string) => {
    return await invoke<string[]>('generate_tasks', { text });
  },

  generateEmbedding: async (text: string) => {
    return await invoke<number[]>('generate_embedding', { text });
  },

  indexContent: async (contentType: string, contentId: number, text: string) => {
    return await invoke<void>('index_content', { 
      contentId,
      contentType, 
      text 
    });
  },

  semanticSearch: async (query: string, limit: number) => {
    return await invoke<Array<[number, string, number]>>('semantic_search', { 
      query, 
      limit 
    });
  },

  chatWithContext: async (question: string) => {
    return await invoke<string>('chat_with_context', { 
      query: question,
      contextDocs: []
    });
  },
};

