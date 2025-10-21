import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface CleaningTask {
  id: number;
  file_id: number;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  input_content?: string;
  output_content?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CreateCleaningTask {
  file_id: number;
  task_type: string;
  priority?: number;
  input_content?: string;
}

export interface CleaningTaskStats {
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  average_processing_time?: number;
}

export interface OutputFileInfo {
  filename: string;
  task_type: string;
  file_path: string;
  size_bytes: number;
  created_at: number;
}

interface CleaningState {
  tasks: CleaningTask[];
  stats: CleaningTaskStats | null;
  loading: boolean;
  error: string | null;
  selectedTask: CleaningTask | null;
  // Pagination
  currentPage: number;
  pageSize: number;
  totalTasks: number;
  // Filtering
  statusFilter: string;
  taskTypeFilter: string;
  searchQuery: string;
  // Progress tracking
  processingProgress: {
    isProcessing: boolean;
    totalTasks: number;
    processed: number;
    failed: number;
    progress: number;
    estimatedRemaining: number;
    currentTaskId?: number;
  } | null;
  vectorIndexingProgress: {
    isProcessing: boolean;
    totalFiles: number;
    processed: number;
    failed: number;
    progress: number;
    estimatedRemaining: number;
    currentFile?: string;
  } | null;
}

interface CleaningActions {
  // Task management
  createTask: (task: CreateCleaningTask) => Promise<CleaningTask>;
  getTask: (id: number) => Promise<CleaningTask>;
  getAllTasks: (limit?: number) => Promise<CleaningTask[]>;
  getPendingTasks: (limit?: number) => Promise<CleaningTask[]>;
  updateTask: (id: number, updates: Partial<CleaningTask>) => Promise<CleaningTask>;
  deleteTask: (id: number) => Promise<void>;
  
  // Task operations
  processTask: (id: number) => Promise<void>;
  processPendingTasks: () => Promise<number>;
  processPendingTasksWithProgress: () => Promise<number>;
  // Progress tracking
  setProcessingProgress: (progress: CleaningState['processingProgress']) => void;
  clearProcessingProgress: () => void;
  setVectorIndexingProgress: (progress: CleaningState['vectorIndexingProgress']) => void;
  clearVectorIndexingProgress: () => void;
  createTasksForFiles: () => Promise<number>;
  getOutputDirectory: () => Promise<string>;
  listOutputFiles: () => Promise<OutputFileInfo[]>;
  deleteAllTasks: () => Promise<number>;
  
  // Vector indexing
  indexAllCleanedFiles: () => Promise<string[]>;
  indexAllCleanedFilesWithProgress: () => Promise<string[]>;
  
  // Fix tasks
  fixTasksWithoutInputContent: () => Promise<number>;
  getCleaningTaskSummary: () => Promise<any>;
  
  // Stats
  getStats: () => Promise<CleaningTaskStats>;
  
  // Pagination and filtering
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setStatusFilter: (status: string) => void;
  setTaskTypeFilter: (type: string) => void;
  setSearchQuery: (query: string) => void;
  getFilteredTasks: () => CleaningTask[];
  getPaginatedTasks: () => CleaningTask[];
  
  // UI state
  setSelectedTask: (task: CleaningTask | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Refresh data
  refreshTasks: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useCleaningStore = create<CleaningState & CleaningActions>((set, get) => ({
  // Initial state
  tasks: [],
  stats: null,
  loading: false,
  error: null,
  selectedTask: null,
  // Pagination
  currentPage: 1,
  pageSize: 20,
  totalTasks: 0,
  // Filtering
  statusFilter: 'all',
  taskTypeFilter: 'all',
  searchQuery: '',
  // Progress tracking
  processingProgress: null,
  vectorIndexingProgress: null,

  // Task management
  createTask: async (task: CreateCleaningTask) => {
    try {
      set({ loading: true, error: null });
      const newTask = await invoke<CleaningTask>('create_cleaning_task', { task });
      set(state => ({ 
        tasks: [newTask, ...state.tasks],
        loading: false 
      }));
      return newTask;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getTask: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const task = await invoke<CleaningTask>('get_cleaning_task', { id });
      set({ loading: false });
      return task;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getAllTasks: async (limit?: number) => {
    try {
      set({ loading: true, error: null });
      // Pass null to get all tasks, or the specified limit
      const tasks = await invoke<CleaningTask[]>('get_all_cleaning_tasks', { limit: limit || null });
      set({ tasks, loading: false });
      // Update total tasks count after loading
      const filteredTasks = get().getFilteredTasks();
      set({ totalTasks: filteredTasks.length });
      return tasks;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getPendingTasks: async (limit?: number) => {
    try {
      set({ loading: true, error: null });
      const tasks = await invoke<CleaningTask[]>('get_pending_cleaning_tasks', { limit });
      set({ loading: false });
      return tasks;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  updateTask: async (id: number, updates: Partial<CleaningTask>) => {
    try {
      set({ loading: true, error: null });
      const updatedTask = await invoke<CleaningTask>('update_cleaning_task', { 
        id, 
        update: updates 
      });
      set(state => ({
        tasks: state.tasks.map(task => task.id === id ? updatedTask : task),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        loading: false
      }));
      return updatedTask;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('delete_cleaning_task', { id });
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        loading: false
      }));
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Task operations
  processTask: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await invoke('process_cleaning_task', { id });
      set({ loading: false });
      // Refresh the task to get updated status
      await get().getTask(id);
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  processPendingTasks: async () => {
    try {
      set({ loading: true, error: null });
      const count = await invoke<number>('process_pending_cleaning_tasks');
      set({ loading: false });
      // Refresh tasks to get updated status
      await get().refreshTasks();
      return count;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  processPendingTasksWithProgress: async () => {
    try {
      set({ loading: true, error: null });
      const count = await invoke<number>('process_pending_cleaning_tasks_with_progress');
      set({ loading: false });
      // Refresh tasks to get updated status
      await get().refreshTasks();
      return count;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Stats
  getStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await invoke<CleaningTaskStats>('get_cleaning_stats');
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // UI state
  setSelectedTask: (task: CleaningTask | null) => set({ selectedTask: task }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  // Progress tracking
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  clearProcessingProgress: () => set({ processingProgress: null }),
  setVectorIndexingProgress: (progress) => set({ vectorIndexingProgress: progress }),
  clearVectorIndexingProgress: () => set({ vectorIndexingProgress: null }),

  // Refresh data
  refreshTasks: async () => {
    await get().getAllTasks(); // Get all tasks (no limit)
    // Update total tasks count after refreshing
    const filteredTasks = get().getFilteredTasks();
    set({ totalTasks: filteredTasks.length });
  },

  // Create cleaning tasks for existing files
  createTasksForFiles: async () => {
    try {
      set({ loading: true, error: null });
      const count = await invoke<number>('create_cleaning_tasks_for_files');
      set({ loading: false });
      await get().getAllTasks(); // Refresh the task list
      return count;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Get output directory path
  getOutputDirectory: async () => {
    try {
      set({ loading: true, error: null });
      const path = await invoke<string>('get_cleaning_output_directory');
      set({ loading: false });
      return path;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  listOutputFiles: async () => {
    try {
      set({ loading: true, error: null });
      const files = await invoke<OutputFileInfo[]>('list_cleaning_output_files');
      set({ loading: false });
      return files;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  deleteAllTasks: async () => {
    try {
      set({ loading: true, error: null });
      const count = await invoke<number>('delete_all_cleaning_tasks');
      set({ loading: false });
      await get().getAllTasks(); // Refresh the task list
      return count;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  // Vector indexing
  indexAllCleanedFiles: async () => {
    try {
      set({ loading: true, error: null });
      const files = await invoke<string[]>('index_all_cleaned_files_with_progress');
      set({ loading: false });
      return files;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  indexAllCleanedFilesWithProgress: async () => {
    try {
      set({ loading: true, error: null });
      const files = await invoke<string[]>('index_all_cleaned_files_with_progress');
      set({ loading: false });
      return files;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  fixTasksWithoutInputContent: async () => {
    try {
      set({ loading: true, error: null });
      const fixedCount = await invoke<number>('fix_tasks_without_input_content');
      set({ loading: false });
      return fixedCount;
    } catch (error) {
      set({ error: error as string, loading: false });
      throw error;
    }
  },

  getCleaningTaskSummary: async () => {
    try {
      const summary = await invoke<any>('get_cleaning_task_summary');
      return summary;
    } catch (error) {
      throw error;
    }
  },

  // Pagination and filtering
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setPageSize: (size: number) => {
    const filteredTasks = get().getFilteredTasks();
    set({ pageSize: size, currentPage: 1, totalTasks: filteredTasks.length });
  },
  setStatusFilter: (status: string) => {
    set({ statusFilter: status, currentPage: 1 });
    const filteredTasks = get().getFilteredTasks();
    set({ totalTasks: filteredTasks.length });
  },
  setTaskTypeFilter: (type: string) => {
    set({ taskTypeFilter: type, currentPage: 1 });
    const filteredTasks = get().getFilteredTasks();
    set({ totalTasks: filteredTasks.length });
  },
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 });
    const filteredTasks = get().getFilteredTasks();
    set({ totalTasks: filteredTasks.length });
  },

  getFilteredTasks: () => {
    const { tasks, statusFilter, taskTypeFilter, searchQuery } = get();
    
    return tasks.filter(task => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      
      // Task type filter
      if (taskTypeFilter !== 'all' && task.task_type !== taskTypeFilter) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.task_type.toLowerCase().includes(query) ||
          task.status.toLowerCase().includes(query) ||
          task.input_content?.toLowerCase().includes(query) ||
          task.output_content?.toLowerCase().includes(query) ||
          task.error_message?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  },

  getPaginatedTasks: () => {
    const { currentPage, pageSize } = get();
    const filteredTasks = get().getFilteredTasks();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return filteredTasks.slice(startIndex, endIndex);
  },

  refreshStats: async () => {
    await get().getStats();
  },
}));
