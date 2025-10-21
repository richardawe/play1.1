// Task Store - per ARCHITECTURE.md state management pattern
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { Task, CreateTask, UpdateTask } from '../types/task';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  createTask: (task: CreateTask) => Promise<Task>;
  updateTask: (id: number, update: UpdateTask) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  moveTask: (taskId: number, newStatus: 'todo' | 'in_progress' | 'done') => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await invoke<Task[]>('get_all_tasks');
      set({ tasks, loading: false });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ error: String(error), loading: false });
    }
  },

  createTask: async (task: CreateTask) => {
    try {
      const newTask = await invoke<Task>('create_task', { task });
      set((state) => ({ tasks: [...state.tasks, newTask] }));
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  updateTask: async (id: number, update: UpdateTask) => {
    try {
      const updated = await invoke<Task>('update_task', { id, update });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    try {
      await invoke('delete_task', { id });
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  moveTask: async (taskId: number, newStatus: 'todo' | 'in_progress' | 'done') => {
    await get().updateTask(taskId, { status: newStatus });
  },
}));

