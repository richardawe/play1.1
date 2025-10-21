import { invoke } from '@tauri-apps/api/tauri';

export interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  attachments?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessage {
  channel_id: number;
  user_id: number;
  content: string;
  attachments?: string;
}

export const tauriAPI = {
  // Test command
  greet: (name: string): Promise<string> => {
    return invoke('greet', { name });
  },

  // Message operations
  messages: {
    getMessages: (channelId: number, limit?: number): Promise<Message[]> => {
      return invoke('get_messages', { channelId, limit });
    },

    createMessage: (message: CreateMessage): Promise<Message> => {
      return invoke('create_message', { message });
    },

    updateMessage: (id: number, content: string): Promise<Message> => {
      return invoke('update_message', { id, content });
    },

    deleteMessage: (id: number): Promise<void> => {
      return invoke('delete_message', { id });
    },
  },
};

export default tauriAPI;

