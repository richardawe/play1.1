// Enhanced Chat Store with Vector Search Integration
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { Message, CreateMessage } from '../types/message';

interface SimilarityResult {
  content_id: number;
  content_type: string;
  content: string;
  similarity_score: number;
  metadata?: string;
}

interface VectorDatabase {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  vectorCount: number;
  lastModified: string;
}

interface EnhancedChatState {
  messages: Message[];
  loading: boolean;
  aiThinking: boolean;
  error: string | null;
  contextResults: SimilarityResult[];
  contextLoading: boolean;
  selectedDatabase: VectorDatabase | null;
  
  // Actions
  loadMessages: () => Promise<void>;
  sendMessage: (content: string, attachments?: string) => Promise<void>;
  sendToAI: (content: string) => Promise<void>;
  updateMessage: (id: number, content: string) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  clearMessages: () => Promise<void>;
  
  // Vector search actions
  searchContext: (query: string) => Promise<void>;
  clearContext: () => void;
  setSelectedDatabase: (database: VectorDatabase | null) => void;
}

export const useEnhancedChatStore = create<EnhancedChatState>((set, get) => ({
  messages: [],
  loading: false,
  aiThinking: false,
  error: null,
  contextResults: [],
  contextLoading: false,
  selectedDatabase: null,

  loadMessages: async () => {
    set({ loading: true, error: null });
    try {
      const messages = await invoke<Message[]>('get_messages', {
        channelId: 1, // Use single default channel for AI chat
        limit: 1000,
      });
      
      // Sort by created_at ascending (oldest first)
      const sorted = messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      set({ messages: sorted, loading: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ error: String(error), loading: false });
    }
  },

  sendMessage: async (content: string, attachments?: string) => {
    try {
      const newMessage: CreateMessage = {
        channel_id: 1, // Single channel for AI chat
        user_id: 1, // Default user ID for AI chat
        content,
        attachments: attachments || null,
      };

      const createdMessage = await invoke<Message>('create_message', { message: newMessage });
      
      set((state) => ({
        messages: [...state.messages, createdMessage]
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ error: String(error) });
    }
  },

  sendToAI: async (content: string) => {
    set({ aiThinking: true, error: null });
    
    try {
      // First, search for relevant context using vector search
      const { searchContext } = get();
      await searchContext(content);
      
      // Get context results
      const { contextResults } = get();
      
      // Create user message
      const userMessage: CreateMessage = {
        channel_id: 1,
        user_id: 1, // Default user ID for AI chat
        content,
        attachments: null,
      };

      const createdUserMessage = await invoke<Message>('create_message', { message: userMessage });
      
      // Generate AI response with context
      const contextText = contextResults
        .map(result => `${result.content_type}: ${result.content}`)
        .join('\n\n');
      
      console.log('📝 Context text for AI:', contextText);
      
      const prompt = contextText 
        ? `Context from your documents:\n\n${contextText}\n\nUser question: ${content}`
        : content;
      
      console.log('🤖 Final prompt to AI:', prompt);
      
      const aiResponse = await invoke<string>('chat_with_ai', {
        userMessage: prompt,
        conversationHistory: '' // We'll build this from message history if needed
      });

      // Create AI message
      const aiMessage: CreateMessage = {
        channel_id: 1,
        user_id: 1, // Default user ID for AI chat
        content: aiResponse,
        attachments: null,
      };

      const createdAIMessage = await invoke<Message>('create_message', { message: aiMessage });
      
      set((state) => ({
        messages: [...state.messages, createdUserMessage, createdAIMessage],
        aiThinking: false
      }));
    } catch (error) {
      console.error('Failed to send to AI:', error);
      set({ error: String(error), aiThinking: false });
    }
  },

  updateMessage: async (id: number, content: string) => {
    try {
      await invoke('update_message', { id, content });
      
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, content } : msg
        )
      }));
    } catch (error) {
      console.error('Failed to update message:', error);
      set({ error: String(error) });
    }
  },

  deleteMessage: async (id: number) => {
    try {
      await invoke('delete_message', { id });
      
      set((state) => ({
        messages: state.messages.filter(msg => msg.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete message:', error);
      set({ error: String(error) });
    }
  },

  clearMessages: async () => {
    try {
      await invoke('clear_messages', { channelId: 1 });
      set({ messages: [], contextResults: [] });
    } catch (error) {
      console.error('Failed to clear messages:', error);
      set({ error: String(error) });
    }
  },

  // Vector search actions
  searchContext: async (query: string) => {
    console.log('🔍 Searching context for query:', query);
    set({ contextLoading: true, error: null });
    
    try {
      const results = await invoke<SimilarityResult[]>('lancedb_search_similar_content', {
        query,
        limit: 5,
        threshold: 0.3, // Lower threshold to find more results
        model: 'nomic-embed-text'
      });
      
      console.log('📄 Found context results:', results.length, 'documents');
      console.log('Context results:', results);
      
      set({ contextResults: results, contextLoading: false });
    } catch (error) {
      console.error('❌ Failed to search context:', error);
      console.log('⚠️ Continuing without context - Ollama embedding service may be unavailable');
      // Continue without context rather than failing completely
      set({ contextResults: [], contextLoading: false, error: null });
    }
  },

  clearContext: () => {
    set({ contextResults: [] });
  },

  setSelectedDatabase: (database) => {
    set({ selectedDatabase: database });
  }
}));