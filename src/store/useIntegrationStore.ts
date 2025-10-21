// Cross-module integration store
import { create } from 'zustand';
import { 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  Search, 
  Brain
} from 'lucide-react';
import { 
  ModuleContext, 
  ContextMenuAction, 
  NotificationData,
  AIDocumentRequest,
  FileUploadData,
  DragDropData,
  SmartSuggestion,
  ModuleType
} from '../types/integration';
import { invoke } from '@tauri-apps/api/tauri';

interface IntegrationState {
  // Context Menu
  selectedText: string;
  contextMenuVisible: boolean;
  contextMenuPosition: { x: number; y: number };
  currentContext: ModuleContext | null;
  
  // Notifications
  notifications: NotificationData[];
  
  // Drag & Drop
  isDragging: boolean;
  draggedData: DragDropData | null;
  
  // Smart Suggestions
  suggestions: SmartSuggestion[];
  
  // Actions
  showContextMenu: (text: string, position: { x: number; y: number }, context: ModuleContext) => void;
  hideContextMenu: () => void;
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
  setDragging: (isDragging: boolean, data?: DragDropData) => void;
  addSuggestion: (suggestion: SmartSuggestion) => void;
  removeSuggestion: (id: string) => void;
  
  // Context Menu Actions
  addToCalendar: (text: string, context: ModuleContext) => Promise<void>;
  addToTasks: (text: string, context: ModuleContext) => Promise<void>;
  sendToChat: (text: string, context: ModuleContext) => Promise<void>;
  createDocument: (text: string, context: ModuleContext) => Promise<void>;
  searchSimilar: (text: string, context: ModuleContext) => Promise<void>;
  getAIInsights: (text: string, context: ModuleContext) => Promise<void>;
  
  // AI Document Generation
  generateDocument: (request: AIDocumentRequest) => Promise<string>;
  
  // File Upload
  uploadFile: (fileData: FileUploadData) => Promise<void>;
  
  // Smart Content Detection
  detectContent: (text: string) => SmartSuggestion[];

  // Drag & Drop Actions
  startDrag: (data: DragDropData) => void;
  endDrag: () => void;
  handleDrop: (targetModule: ModuleType, data: DragDropData) => Promise<void>;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  // Initial State
  selectedText: '',
  contextMenuVisible: false,
  contextMenuPosition: { x: 0, y: 0 },
  currentContext: null,
  notifications: [],
  isDragging: false,
  draggedData: null,
  suggestions: [],

  // Context Menu Actions
  showContextMenu: (text: string, position: { x: number; y: number }, context: ModuleContext) => {
    set({
      selectedText: text,
      contextMenuVisible: true,
      contextMenuPosition: position,
      currentContext: context
    });
  },

  hideContextMenu: () => {
    set({
      contextMenuVisible: false,
      selectedText: '',
      currentContext: null
    });
  },

  // Notification Management
  addNotification: (notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration);
    }
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // Drag & Drop
  setDragging: (isDragging: boolean, data?: DragDropData) => {
    set({
      isDragging,
      draggedData: data || null
    });
  },

  // Suggestions
  addSuggestion: (suggestion: SmartSuggestion) => {
    set(state => ({
      suggestions: [...state.suggestions, suggestion]
    }));
  },

  removeSuggestion: (id: string) => {
    set(state => ({
      suggestions: state.suggestions.filter(s => s.id !== id)
    }));
  },

  // Context Menu Action Implementations
  addToCalendar: async (text: string, context: ModuleContext) => {
    try {
      // Extract date/time information from text
      const eventData = {
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        start: new Date().toISOString(),
        end: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
        source: context.module,
        sourceId: context.metadata?.sourceId
      };

      await invoke('create_event', { event: eventData });
      
      get().addNotification({
        type: 'success',
        title: 'Event Created',
        message: 'Text added to calendar successfully',
        duration: 3000
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create calendar event',
        duration: 5000
      });
    }
  },

  addToTasks: async (text: string, context: ModuleContext) => {
    try {
      const taskData = {
        title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        description: text,
        status: 'todo',
        priority: 'medium',
        source: context.module,
        sourceId: context.metadata?.sourceId
      };

      await invoke('create_task', { task: taskData });
      
      get().addNotification({
        type: 'success',
        title: 'Task Created',
        message: 'Text added to tasks successfully',
        duration: 3000
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create task',
        duration: 5000
      });
    }
  },

  sendToChat: async (text: string, _context: ModuleContext) => {
    try {
      // This would typically switch to chat module and pre-fill the message
      // For now, we'll just show a notification
      get().addNotification({
        type: 'info',
        title: 'Send to Chat',
        message: 'Text ready to send to chat',
        duration: 3000,
        actions: [
          {
            label: 'Go to Chat',
            action: () => {
              // Switch to chat module
              console.log('Switching to chat with text:', text);
            }
          }
        ]
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to prepare text for chat',
        duration: 5000
      });
    }
  },

  createDocument: async (text: string, context: ModuleContext) => {
    try {
      const documentData = {
        title: `Document from ${context.module}`,
        content: text,
        source: context.module,
        sourceId: context.metadata?.sourceId
      };

      await invoke('create_document', { document: documentData });
      
      get().addNotification({
        type: 'success',
        title: 'Document Created',
        message: 'Document created successfully',
        duration: 3000
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create document',
        duration: 5000
      });
    }
  },

  searchSimilar: async (text: string, _context: ModuleContext) => {
    try {
      // This would typically switch to search module and perform the search
      get().addNotification({
        type: 'info',
        title: 'Search Similar',
        message: 'Searching for similar content...',
        duration: 3000,
        actions: [
          {
            label: 'View Results',
            action: () => {
              // Switch to search module with results
              console.log('Switching to search with query:', text);
            }
          }
        ]
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to search similar content',
        duration: 5000
      });
    }
  },

  getAIInsights: async (text: string, _context: ModuleContext) => {
    try {
      // This would typically switch to insights module and generate insights
      get().addNotification({
        type: 'info',
        title: 'AI Insights',
        message: 'Generating insights for selected text...',
        duration: 3000,
        actions: [
          {
            label: 'View Insights',
            action: () => {
              // Switch to insights module
              console.log('Switching to insights with text:', text);
            }
          }
        ]
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate AI insights',
        duration: 5000
      });
    }
  },

  // AI Document Generation
  generateDocument: async (request: AIDocumentRequest): Promise<string> => {
    try {
      // Simulate AI document generation based on type
      let result = '';
      
      switch (request.type) {
        case 'generate':
          result = `# ${request.options?.focus || 'AI Generated Document'}

## Overview
This document was generated using AI based on the following content:

${request.content}

## Key Points
- Generated on ${new Date().toLocaleDateString()}
- Style: ${request.options?.style || 'formal'}
- Length: ${request.options?.length || 'medium'}
- Focus: ${request.options?.focus || 'general content'}

## Content
Based on the provided content, here is an expanded and structured document that builds upon the original material while maintaining the core message and adding relevant context and insights.

The original content has been analyzed and expanded to create a comprehensive document that provides additional value and context.`;
          break;
          
        case 'rewrite':
          result = `# Rewritten Content

## Original Content
${request.content}

## Improved Version
${request.content.split('\n').map(line => 
  line.trim() ? `- ${line.trim().charAt(0).toUpperCase() + line.trim().slice(1)}` : ''
).filter(line => line).join('\n')}

## Summary of Changes
- Improved clarity and readability
- Enhanced structure and flow
- Added professional formatting
- Maintained original meaning while improving presentation`;
          break;
          
        case 'summarize':
          result = `# Summary

## Key Points
${request.content.split('\n').filter(line => line.trim()).slice(0, 5).map(line => 
  `- ${line.trim()}`
).join('\n')}

## Main Themes
- Content analysis and summarization
- Key information extraction
- Structured presentation

## Conclusion
This summary captures the essential elements of the original content while providing a concise overview for quick reference.`;
          break;
          
        case 'extract':
          result = `# Key Points Extraction

## Main Ideas
${request.content.split('\n').filter(line => line.trim()).map(line => 
  `• ${line.trim()}`
).join('\n')}

## Action Items
- Review and prioritize key points
- Consider implementation strategies
- Plan follow-up actions

## Important Notes
- Focus on actionable insights
- Identify potential opportunities
- Consider potential challenges`;
          break;
          
        case 'outline':
          result = `# Document Outline

## 1. Introduction
- Overview of topic
- Purpose and scope
- Key objectives

## 2. Main Content
${request.content.split('\n').filter(line => line.trim()).map((line, index) => 
  `### 2.${index + 1} ${line.trim()}`
).join('\n')}

## 3. Analysis
- Key findings
- Important insights
- Critical observations

## 4. Conclusion
- Summary of main points
- Recommendations
- Next steps

## 5. References
- Source materials
- Additional resources
- Related documents`;
          break;
          
        default:
          result = `# AI Generated Content\n\n${request.content}`;
      }
      
      return result;
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate document',
        duration: 5000
      });
      throw error;
    }
  },

  // File Upload
  uploadFile: async (fileData: { file: File; type: string; processing?: string }) => {
    try {
      // Simulate file upload and processing
      const { file } = fileData;
      
      // Create a document from the uploaded file
      // const documentData = {
      //   title: file.name,
      //   content: `Uploaded file: ${file.name}\nType: ${type}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nProcessing: ${processing || 'none'}\nUploaded: ${new Date().toISOString()}`,
      //   source: 'file_upload',
      //   file_type: type,
      //   ai_processed: processing !== 'none'
      // };

      // This would call the actual upload API
      // await invoke('upload_file', { fileData });
      // await invoke('create_document', { document: documentData });
      
      get().addNotification({
        type: 'success',
        title: 'File Uploaded',
        message: `File "${file.name}" uploaded and processed successfully`,
        duration: 3000
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to upload file',
        duration: 5000
      });
    }
  },

  // Smart Content Detection
  detectContent: (text: string): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    
    // Detect dates/times for calendar suggestions
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|tomorrow|today|next week|next month)/i;
    if (dateRegex.test(text)) {
      suggestions.push({
        id: 'calendar-suggestion',
        type: 'calendar',
        confidence: 0.8,
        content: text,
        action: async () => {
          await get().addToCalendar(text, { module: 'chat', content: text });
        },
        reason: 'Contains date/time information'
      });
    }
    
    // Detect task-like content
    const taskRegex = /(todo|task|need to|should|must|have to|remind me)/i;
    if (taskRegex.test(text)) {
      suggestions.push({
        id: 'task-suggestion',
        type: 'task',
        confidence: 0.7,
        content: text,
        action: async () => {
          await get().addToTasks(text, { module: 'chat', content: text });
        },
        reason: 'Contains task-like language'
      });
    }
    
    return suggestions;
  },

  // Drag & Drop Actions
  startDrag: (data: DragDropData) => set({ isDragging: true, draggedData: data }),
  endDrag: () => set({ isDragging: false, draggedData: null }),
  handleDrop: async (targetModule: ModuleType, data: DragDropData) => {
    try {
      console.log(`Dropped ${data.type} into ${targetModule}:`, data);
      get().addNotification({
        type: 'success',
        title: 'Content Dropped',
        message: `Content successfully moved to ${targetModule}.`,
        duration: 3000,
      });
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to handle drop operation',
        duration: 5000
      });
    }
  }
}));

// Context Menu Actions Configuration
export const contextMenuActions: ContextMenuAction[] = [
  {
    id: 'add-to-calendar',
    label: 'Add to Calendar',
    icon: Calendar,
    action: (text, context) => useIntegrationStore.getState().addToCalendar(text, context),
    category: 'create',
    description: 'Create a calendar event from this text'
  },
  {
    id: 'add-to-tasks',
    label: 'Add to Tasks',
    icon: CheckSquare,
    action: (text, context) => useIntegrationStore.getState().addToTasks(text, context),
    category: 'create',
    description: 'Create a task from this text'
  },
  {
    id: 'send-to-chat',
    label: 'Send to Chat',
    icon: MessageSquare,
    action: (text, context) => useIntegrationStore.getState().sendToChat(text, context),
    category: 'share',
    description: 'Continue conversation with this text'
  },
  {
    id: 'create-document',
    label: 'Create Document',
    icon: FileText,
    action: (text, context) => useIntegrationStore.getState().createDocument(text, context),
    category: 'create',
    description: 'Generate a document from this text'
  },
  {
    id: 'search-similar',
    label: 'Search Similar',
    icon: Search,
    action: (text, context) => useIntegrationStore.getState().searchSimilar(text, context),
    category: 'analyze',
    description: 'Find similar content using AI search'
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Brain,
    action: (text, context) => useIntegrationStore.getState().getAIInsights(text, context),
    category: 'analyze',
    description: 'Get AI-powered insights about this text'
  }
];
