// Task types - aligned with ARCHITECTURE.md database schema
export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  reminder_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTask {
  title: string;
  description?: string | null;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  reminder_time?: string | null;
}

export interface UpdateTask {
  title?: string;
  description?: string | null;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  reminder_time?: string | null;
}

