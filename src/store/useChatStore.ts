// Chat Store - AI Chatbot (no channels)
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { Message, CreateMessage } from '../types/message';

interface ChatState {
  messages: Message[];
  loading: boolean;
  aiThinking: boolean;
  error: string | null;
  
  // Actions
  loadMessages: () => Promise<void>;
  sendMessage: (content: string, attachments?: string) => Promise<void>;
  sendToAI: (content: string) => Promise<void>;
  updateMessage: (id: number, content: string) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  clearMessages: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  aiThinking: false,
  error: null,

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
        user_id: 1, // User
        content,
        attachments: attachments || null,
      };
      
      const message = await invoke<Message>('create_message', { message: newMessage });
      
      // Add to messages list
      set((state) => ({ messages: [...state.messages, message] }));
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  sendToAI: async (content: string) => {
    try {
      // First, send user message
      await get().sendMessage(content);
      
      // Set AI thinking state
      set({ aiThinking: true });
      
      // Get conversation history for context
      const { messages } = get();
      const conversationHistory = messages.map(m => m.content).join('\n\n');
      
      // Call AI to generate response
      const aiResponse = await invoke<string>('chat_with_ai', {
        userMessage: content,
        conversationHistory: conversationHistory.slice(-2000), // Last 2000 chars for context
      });
      
      // Send AI response as a message
      const aiMessage: CreateMessage = {
        channel_id: 1,
        user_id: 2, // AI user ID
        content: aiResponse,
        attachments: null,
      };
      
      const message = await invoke<Message>('create_message', { message: aiMessage });
      
      set((state) => ({
        messages: [...state.messages, message],
        aiThinking: false,
      }));
    } catch (error) {
      console.error('AI chat failed:', error);
      set({ 
        error: 'AI chat failed: ' + String(error),
        aiThinking: false,
      });
      
      // Send error message
      const errorMessage: CreateMessage = {
        channel_id: 1,
        user_id: 2,
        content: '⚠️ Sorry, I encountered an error. Please make sure Ollama is running.',
        attachments: null,
      };
      
      try {
        const message = await invoke<Message>('create_message', { message: errorMessage });
        set((state) => ({ messages: [...state.messages, message] }));
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    }
  },

  updateMessage: async (id: number, content: string) => {
    try {
      const updated = await invoke<Message>('update_message', { id, content });
      
      set((state) => ({
        messages: state.messages.map((m) => (m.id === id ? updated : m)),
      }));
    } catch (error) {
      console.error('Failed to update message:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  deleteMessage: async (id: number) => {
    try {
      await invoke('delete_message', { id });
      
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete message:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  clearMessages: async () => {
    try {
      await invoke('clear_all_messages');
      set({ messages: [] });
    } catch (error) {
      console.error('Failed to clear messages:', error);
      set({ error: String(error) });
      throw error;
    }
  },
}));
