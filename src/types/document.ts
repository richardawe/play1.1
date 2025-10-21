// Document types - aligned with ARCHITECTURE.md database schema
export interface Document {
  id: number;
  title: string;
  content: string;
  version: number;
  tags?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocument {
  title: string;
  content: string;
  tags?: string | null;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  content: string;
  version: number;
  created_at: string;
}

