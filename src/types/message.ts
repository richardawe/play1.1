// Message types - aligned with Rust backend (ARCHITECTURE.md)
export interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  attachments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMessage {
  channel_id: number;
  user_id: number;
  content: string;
  attachments?: string | null;
}

export interface Channel {
  id: number;
  name: string;
  description?: string;
  unread_count?: number;
}

