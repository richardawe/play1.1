// Event types - aligned with ARCHITECTURE.md database schema
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  reminder_time?: string | null;
  recurrence?: string | null;
  created_at: string;
}

export interface CreateEvent {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  reminder_time?: string | null;
  recurrence?: string | null;
}

export interface UpdateEvent {
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  reminder_time?: string | null;
  recurrence?: string | null;
}

