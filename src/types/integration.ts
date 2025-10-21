// Cross-module integration types
import { LucideIcon } from 'lucide-react';

export type ModuleType = 'chat' | 'documents' | 'tasks' | 'calendar' | 'search' | 'insights' | 'reports' | 'exports' | 'results';

export interface ModuleContext {
  module: ModuleType;
  content: string;
  metadata?: {
    sourceId?: string;
    sourceType?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  action: (text: string, context: ModuleContext) => Promise<void>;
  requiresAI?: boolean;
  category: 'create' | 'analyze' | 'share' | 'transform';
  description?: string;
}

export interface CrossModuleAction {
  id: string;
  label: string;
  icon: LucideIcon;
  action: (content: string, context: ModuleContext) => Promise<void>;
  targetModule: ModuleType;
  description?: string;
}

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface AIDocumentRequest {
  content: string;
  type: 'generate' | 'rewrite' | 'summarize' | 'extract' | 'outline';
  context?: ModuleContext;
  options?: {
    style?: 'formal' | 'casual' | 'technical' | 'creative';
    length?: 'short' | 'medium' | 'long';
    focus?: string;
  };
}

export interface FileUploadData {
  file: File;
  type: 'document' | 'image' | 'data';
  processing?: 'none' | 'ai-rewrite' | 'ai-summarize' | 'ai-extract';
}

export interface DragDropData {
  type: 'text' | 'file' | 'task' | 'event' | 'document';
  data: string | File | { id: string; content: string };
  sourceContext: ModuleContext;
}

export interface SmartSuggestion {
  id: string;
  type: 'calendar' | 'task' | 'document' | 'chat' | 'search';
  confidence: number;
  content: string;
  action: () => Promise<void>;
  reason: string;
}

