// Document Store - per ARCHITECTURE.md state management pattern
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { Document, CreateDocument } from '../types/document';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Actions
  loadDocuments: (limit?: number) => Promise<void>;
  loadDocument: (id: number) => Promise<void>;
  createDocument: (doc: CreateDocument) => Promise<Document>;
  updateDocument: (id: number, content: string, title?: string) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  setCurrentDocument: (doc: Document | null) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  saving: false,
  error: null,

  loadDocuments: async (limit?: number) => {
    set({ loading: true, error: null });
    try {
      const documents = await invoke<Document[]>('get_all_documents', { limit: limit || 100 });
      set({ documents, loading: false });
    } catch (error) {
      console.error('Failed to load documents:', error);
      set({ error: String(error), loading: false });
    }
  },

  loadDocument: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const document = await invoke<Document>('get_document', { id });
      set({ currentDocument: document, loading: false });
    } catch (error) {
      console.error('Failed to load document:', error);
      set({ error: String(error), loading: false });
    }
  },

  createDocument: async (doc: CreateDocument) => {
    set({ loading: true, error: null });
    try {
      const document = await invoke<Document>('create_document', { document: doc });
      set((state) => ({
        documents: [document, ...state.documents],
        currentDocument: document,
        loading: false,
      }));
      return document;
    } catch (error) {
      console.error('Failed to create document:', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateDocument: async (id: number, content: string, title?: string) => {
    set({ saving: true, error: null });
    try {
      const update = {
        content: content,
        title: title || undefined,
        tags: undefined,
      };
      
      const updated = await invoke<Document>('update_document', { id, update });
      
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? updated : d)),
        currentDocument: state.currentDocument?.id === id ? updated : state.currentDocument,
        saving: false,
      }));
    } catch (error) {
      console.error('Failed to update document:', error);
      set({ error: String(error), saving: false });
      throw error;
    }
  },

  deleteDocument: async (id: number) => {
    try {
      await invoke('delete_document', { id });
      
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
      }));
    } catch (error) {
      console.error('Failed to delete document:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  setCurrentDocument: (doc: Document | null) => {
    set({ currentDocument: doc });
  },
}));

