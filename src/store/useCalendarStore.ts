// Calendar Store - per ARCHITECTURE.md state management pattern
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { CalendarEvent, CreateEvent, UpdateEvent } from '../types/event';

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentView: 'day' | 'week' | 'month';
  currentDate: Date;
  
  // Actions
  loadEvents: (start: string, end: string) => Promise<void>;
  createEvent: (event: CreateEvent) => Promise<CalendarEvent>;
  updateEvent: (id: number, update: UpdateEvent) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  setView: (view: 'day' | 'week' | 'month') => void;
  setCurrentDate: (date: Date) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  loading: false,
  error: null,
  currentView: 'month',
  currentDate: new Date(),

  loadEvents: async (start: string, end: string) => {
    set({ loading: true, error: null });
    try {
      const events = await invoke<CalendarEvent[]>('get_events_in_range', { start, end });
      set({ events, loading: false });
    } catch (error) {
      console.error('Failed to load events:', error);
      set({ error: String(error), loading: false });
    }
  },

  createEvent: async (event: CreateEvent) => {
    try {
      const newEvent = await invoke<CalendarEvent>('create_event', { event });
      set((state) => ({ events: [...state.events, newEvent] }));
      return newEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  updateEvent: async (id: number, update: UpdateEvent) => {
    try {
      const updated = await invoke<CalendarEvent>('update_event', { id, update });
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (error) {
      console.error('Failed to update event:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  deleteEvent: async (id: number) => {
    try {
      await invoke('delete_event', { id });
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete event:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  setView: (view: 'day' | 'week' | 'month') => {
    set({ currentView: view });
  },

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },
}));

