import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface IngestionJob {
  id: number;
  source_path: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_files: number;
  processed_files: number;
  error_count: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface CreateIngestionJob {
  source_path: string;
  job_type: string;
}

export interface IngestionJobStats {
  total_jobs: number;
  pending_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_files_processed: number;
  total_errors: number;
}

interface IngestionState {
  jobs: IngestionJob[];
  stats: IngestionJobStats | null;
  loading: boolean;
  error: string | null;
  selectedJob: IngestionJob | null;
}

interface IngestionActions {
  // Job management
  createJob: (job: CreateIngestionJob) => Promise<IngestionJob>;
  getJob: (id: number) => Promise<IngestionJob>;
  getAllJobs: (limit?: number) => Promise<IngestionJob[]>;
  updateJob: (id: number, updates: Partial<IngestionJob>) => Promise<IngestionJob>;
  deleteJob: (id: number) => Promise<void>;
  
  // Job operations
  startJob: (id: number) => Promise<void>;
  cancelJob: (id: number) => Promise<IngestionJob>;
  
  // Stats
  getStats: () => Promise<IngestionJobStats>;
  
  // UI state
  setSelectedJob: (job: IngestionJob | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Refresh data
  refreshJobs: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useIngestionStore = create<IngestionState & IngestionActions>((set, get) => ({
  // Initial state
  jobs: [],
  stats: null,
  loading: false,
  error: null,
  selectedJob: null,

  // Job management
  createJob: async (job: CreateIngestionJob) => {
    try {
      set({ loading: true, error: null });
      const newJob = await invoke<IngestionJob>('create_ingestion_job', { job });
      set(state => ({ 
        jobs: [newJob, ...state.jobs],
        loading: false 
      }));
      return newJob;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getJob: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const job = await invoke<IngestionJob>('get_ingestion_job', { id });
      set({ loading: false });
      return job;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getAllJobs: async (limit?: number) => {
    try {
      set({ loading: true, error: null });
      const jobs = await invoke<IngestionJob[]>('get_all_ingestion_jobs', { limit });
      set({ jobs, loading: false });
      return jobs;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  updateJob: async (id: number, updates: Partial<IngestionJob>) => {
    try {
      set({ loading: true, error: null });
      const updatedJob = await invoke<IngestionJob>('update_ingestion_job', { 
        id, 
        update: updates 
      });
      set(state => ({
        jobs: state.jobs.map(job => job.id === id ? updatedJob : job),
        selectedJob: state.selectedJob?.id === id ? updatedJob : state.selectedJob,
        loading: false
      }));
      return updatedJob;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  deleteJob: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('delete_ingestion_job', { id });
      set(state => ({
        jobs: state.jobs.filter(job => job.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
        loading: false
      }));
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Job operations
  startJob: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('start_ingestion_job', { id });
      set({ loading: false });
      // Refresh the job to get updated status
      await get().getJob(id);
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  cancelJob: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const cancelledJob = await invoke<IngestionJob>('cancel_ingestion_job', { id });
      set(state => ({
        jobs: state.jobs.map(job => job.id === id ? cancelledJob : job),
        selectedJob: state.selectedJob?.id === id ? cancelledJob : state.selectedJob,
        loading: false
      }));
      return cancelledJob;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Stats
  getStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await invoke<IngestionJobStats>('get_ingestion_stats');
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // UI state
  setSelectedJob: (job: IngestionJob | null) => set({ selectedJob: job }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  // Refresh data
  refreshJobs: async () => {
    await get().getAllJobs();
  },

  refreshStats: async () => {
    await get().getStats();
  },
}));
