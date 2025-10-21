import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FolderOpen, 
  Archive, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  Sparkles,
  Search,
  Download,
  Trash2,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useDataOperations, DataProcessingJob, ProcessedFile, DataChunk } from '../../hooks/useDataOperations';
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile, exists, createDir } from '@tauri-apps/api/fs';
import { appDataDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/tauri';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  metadata?: {
    author?: string;
    created?: string;
    modified?: string;
    pages?: number;
    language?: string;
  };
  chunks?: number;
  embeddings?: boolean;
  duplicates?: string[];
}

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number;
}

const DataOperationsInterface: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'clean' | 'process' | 'results'>('upload');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentJob, setCurrentJob] = useState<DataProcessingJob | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [viewingFile, setViewingFile] = useState<ProcessedFile | null>(null);
  const [fileChunks, setFileChunks] = useState<DataChunk[]>([]);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'upload', name: 'Import', description: 'Upload files and folders', status: 'active', progress: 0 },
    { id: 'review', name: 'Review', description: 'Review uploaded files', status: 'pending', progress: 0 },
    { id: 'clean', name: 'Clean', description: 'AI-powered data cleaning', status: 'pending', progress: 0 },
    { id: 'process', name: 'Process', description: 'Chunk and embed data', status: 'pending', progress: 0 },
    { id: 'results', name: 'Results', description: 'View processed data', status: 'pending', progress: 0 },
  ]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const {
    loading,
    error,
    createProcessingJob,
    processFiles,
    getProcessedFiles,
    exportProcessedData,
  } = useDataOperations();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = async (fileList: File[]) => {
    try {
      // Get app data directory
      const appDataPath = await appDataDir();
      const uploadDir = `${appDataPath}uploads`;
      
      // Create upload directory
      const uploadDirExists = await exists(uploadDir);
      if (!uploadDirExists) {
        await createDir(uploadDir, { recursive: true });
      }

      const newFiles: FileItem[] = [];
      
      for (const file of fileList) {
        try {
          // Read file content
          const fileContent = await file.arrayBuffer();
          const filePath = `${uploadDir}/${file.name}`;
          
          // Write file to disk
          await writeBinaryFile(filePath, fileContent);
          
          const fileItem: FileItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type || 'unknown',
            status: 'pending',
            progress: 0,
          };
          
          newFiles.push(fileItem);
          console.log(`Uploaded file: ${file.name} to ${filePath}`);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
        }
      }

      setFiles(prev => [...prev, ...newFiles]);
      setCurrentStep('review');
      updateStepStatus('upload', 'completed', 100);
      updateStepStatus('review', 'active', 0);
    } catch (error) {
      console.error('Error setting up upload directory:', error);
    }
  };

  const updateStepStatus = (stepId: string, status: ProcessingStep['status'], progress: number) => {
    setProcessingSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, status, progress }
          : step
      )
    );
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFolderUpload = () => {
    folderInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const startCleaning = async () => {
    setCurrentStep('clean');
    updateStepStatus('review', 'completed', 100);
    updateStepStatus('clean', 'active', 0);
    
    // Create processing job
    try {
      const job = await createProcessingJob(`Data Processing - ${new Date().toLocaleString()}`);
      setCurrentJob(job);
      
      // Start processing files with actual file paths
      const appDataPath = await appDataDir();
      const filePaths = files.map(file => `${appDataPath}uploads/${file.name}`);
      await processFiles(job.id, filePaths);
      
      // Update to process step
      setCurrentStep('process');
      updateStepStatus('clean', 'completed', 100);
      updateStepStatus('process', 'active', 0);
      
      // Get processed files
      console.log('About to call getProcessedFiles with job.id:', job.id);
      console.log('Current processed files state:', processedFiles);
      const processed = await getProcessedFiles(job.id);
      console.log('getProcessedFiles result:', processed);
      console.log('Setting processed files to:', processed);
      setProcessedFiles(processed);
      console.log('Processed files set, current state should be:', processed);
      
      // Complete processing
      setCurrentStep('results');
      updateStepStatus('process', 'completed', 100);
      updateStepStatus('results', 'active', 100);
      
    } catch (err) {
      console.error('Error processing files:', err);
      updateStepStatus('clean', 'error', 0);
    }
  };


  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const resetProcess = () => {
    setCurrentStep('upload');
    setFiles([]);
    setCurrentJob(null);
    setProcessedFiles([]);
    setViewingFile(null);
    setFileChunks([]);
    setProcessingSteps(prev => 
      prev.map(step => ({ ...step, status: step.id === 'upload' ? 'active' : 'pending', progress: 0 }))
    );
  };

  const handleViewFile = async (file: ProcessedFile) => {
    try {
      console.log('Viewing file:', file.filename, 'with ID:', file.id);
      setViewingFile(file);
      
      // Get the chunks for this file
      console.log('Calling getDataChunks with file ID:', file.id);
      
      // Test if the command exists by trying to call it directly
      try {
        const result = await invoke('get_data_chunks', { fileId: file.id });
        console.log('Direct invoke result:', result);
        setFileChunks(result as DataChunk[]);
        console.log('Loaded chunks:', (result as DataChunk[]).length);
      } catch (directError) {
        console.error('Direct invoke error:', directError);
        throw directError;
      }
    } catch (error) {
      console.error('Error loading file chunks:', error);
      alert('Failed to load file content: ' + (error as Error).message);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Import Your Data
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload files, folders, or zip archives to begin the data processing workflow. 
          We support DOCX, PDF, HTML, TXT, XLSX, PPTX and more.
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Drag & Drop Files Here
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Or click the buttons below to select files or folders
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleFileUpload}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              Select Files
            </button>
            
            <button
              onClick={handleFolderUpload}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
              Select Folder
            </button>
            
            <button
              onClick={handleFileUpload}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Archive className="w-5 h-5" />
              Upload ZIP
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.html,.xlsx,.xls,.pptx,.ppt"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <input
          ref={folderInputRef}
          type="file"
          multiple
          {...({ webkitdirectory: "" } as any)}
          onChange={handleFolderInputChange}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Review Uploaded Files
        </h2>
        <button
          onClick={startCleaning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Start Cleaning
        </button>
      </div>

      <div className="grid gap-4">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{file.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeFile(file.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCleaningStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          AI-Powered Data Cleaning
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Processing files to extract clean, structured text and metadata...
        </p>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{file.name}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {file.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Processing Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Chunking text, generating embeddings, and detecting duplicates...
        </p>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{file.name}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {file.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResultsStep = () => {
    console.log('renderResultsStep called, processedFiles:', processedFiles);
    console.log('processedFiles length:', processedFiles.length);
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Processing Complete
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                console.log('=== EXPORT JSONL BUTTON CLICKED ===');
                console.log('Current job ID:', currentJob?.id);
                
                const result = await exportProcessedData(currentJob?.id || 0, 'jsonl');
                console.log('Export result length:', result.length);
                console.log('Export result preview:', result.substring(0, 200));
                
                // Use Tauri's save dialog
                const filePath = await save({
                  title: 'Save Processed Data',
                  defaultPath: `processed_data_${currentJob?.id || 'unknown'}.jsonl`,
                  filters: [
                    { name: 'JSONL Files', extensions: ['jsonl'] },
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                  ]
                });
                
                if (filePath) {
                  console.log('Save dialog returned path:', filePath);
                  await writeBinaryFile(filePath, new TextEncoder().encode(result));
                  console.log('File saved successfully to:', filePath);
                  alert(`Export saved to: ${filePath}`);
                } else {
                  console.log('Save dialog cancelled');
                }
              } catch (error) {
                console.error('Export JSONL error:', error);
                alert('Export failed: ' + (error as Error).message);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSONL
          </button>
          <button
            onClick={resetProcess}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Process New Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Files Processed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{processedFiles.length}</p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Chunks Created</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {processedFiles.reduce((sum, file) => sum + file.chunks_count, 0)}
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Embeddings</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {processedFiles.filter(f => f.has_embeddings).length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Processed Files</h3>
        {processedFiles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No processed files found</p>
        ) : (
          processedFiles.map((file) => (
              <div key={file.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{file.filename}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.chunks_count} chunks • {file.has_embeddings ? 'Embedded' : 'Not embedded'} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewFile(file)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                      <button 
                        onClick={async () => {
                          try {
                            console.log('=== INDIVIDUAL FILE EXPORT CLICKED ===');
                            console.log('File:', file.filename, 'Job ID:', currentJob?.id);
                            const result = await exportProcessedData(currentJob?.id || 0, 'csv');
                            console.log('Export result length:', result.length);
                            
                            // Use Tauri's save dialog
                            const filePath = await save({
                              title: 'Save CSV Export',
                              defaultPath: `${file.filename}_${currentJob?.id || 'unknown'}.csv`,
                              filters: [
                                { name: 'CSV Files', extensions: ['csv'] },
                                { name: 'All Files', extensions: ['*'] }
                              ]
                            });
                            
                            if (filePath) {
                              console.log('Save dialog returned path:', filePath);
                              await writeBinaryFile(filePath, new TextEncoder().encode(result));
                              console.log('File saved successfully to:', filePath);
                              alert(`Export saved to: ${filePath}`);
                            } else {
                              console.log('Save dialog cancelled');
                            }
                          } catch (error) {
                            console.error('Export error:', error);
                            alert('Export failed: ' + (error as Error).message);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'review':
        return renderReviewStep();
      case 'clean':
        return renderCleaningStep();
      case 'process':
        return renderProcessingStep();
      case 'results':
        return renderResultsStep();
      default:
        return renderUploadStep();
    }
  };

  console.log('Main render - currentStep:', currentStep, 'loading:', loading, 'processedFiles:', processedFiles.length);
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-gray-900 dark:text-white">Processing...</span>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {processingSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  step.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : step.status === 'active'
                    ? 'bg-indigo-500 text-white'
                    : step.status === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : step.status === 'active' ? (
                    <Clock className="w-5 h-5" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{step.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
              {index < processingSteps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      {renderCurrentStep()}

      {/* File View Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingFile.filename}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {fileChunks.length} chunks • {viewingFile.has_embeddings ? 'Embedded' : 'Not embedded'} • {(viewingFile.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingFile(null);
                  setFileChunks([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {fileChunks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Loading file content...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fileChunks.map((chunk) => (
                    <div key={chunk.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Chunk {chunk.chunk_index + 1}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{chunk.token_count} tokens</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            chunk.has_embedding 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {chunk.has_embedding ? 'Embedded' : 'No embedding'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {chunk.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataOperationsInterface;
