// Link types - for cross-module linking per prd.md §3️⃣.C
export interface Link {
  id: number;
  source_type: 'message' | 'document' | 'task' | 'event';
  source_id: number;
  target_type: 'message' | 'document' | 'task' | 'event';
  target_id: number;
  created_at: string;
}

export interface CreateLink {
  source_type: 'message' | 'document' | 'task' | 'event';
  source_id: number;
  target_type: 'message' | 'document' | 'task' | 'event';
  target_id: number;
}

export interface LinkedItem {
  type: 'message' | 'document' | 'task' | 'event';
  id: number;
  title?: string;
  preview?: string;
}

