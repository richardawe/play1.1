import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export interface DataProcessingJob {
  id: number;
  name: string;
  status: string;
  progress: number;
  total_files: number;
  processed_files: number;
  error_count: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface ProcessedFile {
  id: number;
  job_id: number;
  original_path: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  chunks_count: number;
  has_embeddings: boolean;
  is_duplicate: boolean;
  duplicate_of?: number;
  metadata?: string;
  created_at: string;
  processed_at?: string;
}

export interface DataChunk {
  id: number;
  file_id: number;
  chunk_index: number;
  content: string;
  token_count: number;
  has_embedding: boolean;
  created_at: string;
}

export interface ProcessingStats {
  total_jobs: number;
  pending_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_files_processed: number;
  total_chunks_created: number;
  total_embeddings_generated: number;
  total_duplicates_found: number;
}

export const useDataOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProcessingJob = useCallback(async (name: string): Promise<DataProcessingJob> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('create_data_processing_job', { name });
      return result as DataProcessingJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create processing job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProcessingJob = useCallback(async (id: number): Promise<DataProcessingJob> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('get_data_processing_job', { id });
      return result as DataProcessingJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get processing job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllProcessingJobs = useCallback(async (limit?: number): Promise<DataProcessingJob[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('get_all_data_processing_jobs', { limit });
      return result as DataProcessingJob[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get processing jobs';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProcessingJob = useCallback(async (
    id: number,
    updates: {
      status?: string;
      progress?: number;
      total_files?: number;
      processed_files?: number;
      error_count?: number;
      started_at?: string;
      completed_at?: string;
      error_message?: string;
    }
  ): Promise<DataProcessingJob> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('update_data_processing_job', { 
        id,
        ...updates
      });
      return result as DataProcessingJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update processing job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const processFiles = useCallback(async (jobId: number, filePaths: string[]): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      console.log('Calling process_files_for_job with:', { jobId, filePaths });
      const result = await invoke('process_files_for_job', { 
        jobId: jobId,
        filePaths: filePaths
      });
      console.log('process_files_for_job result:', result);
    } catch (err) {
      console.error('process_files_for_job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process files';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProcessingStats = useCallback(async (): Promise<ProcessingStats> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('get_processing_stats');
      return result as ProcessingStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get processing stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProcessedFiles = useCallback(async (jobId: number): Promise<ProcessedFile[]> => {
    console.log('getProcessedFiles called with jobId:', jobId);
    setLoading(true);
    setError(null);
    try {
      console.log('Invoking get_processed_files command with params:', { jobId: jobId });
      const result = await invoke('get_processed_files', { jobId: jobId });
      console.log('get_processed_files command result:', result);
      return result as ProcessedFile[];
    } catch (err) {
      console.error('Error in getProcessedFiles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get processed files';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDataChunks = useCallback(async (fileId: number): Promise<DataChunk[]> => {
    console.log('getDataChunks hook called with fileId:', fileId);
    setLoading(true);
    setError(null);
    try {
      console.log('Invoking get_data_chunks command with params:', { fileId: fileId });
      const result = await invoke('get_data_chunks', { fileId: fileId });
      console.log('get_data_chunks command result:', result);
      return result as DataChunk[];
    } catch (err) {
      console.error('Error in getDataChunks hook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get data chunks';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportProcessedData = useCallback(async (jobId: number, format: 'jsonl' | 'csv' | 'md'): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('export_processed_data', { 
        jobId: jobId,
        format
      });
      return result as string;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export processed data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createProcessingJob,
    getProcessingJob,
    getAllProcessingJobs,
    updateProcessingJob,
    processFiles,
    getProcessingStats,
    getProcessedFiles,
    getDataChunks,
    exportProcessedData,
  };
};
