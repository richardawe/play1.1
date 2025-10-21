// File Upload Modal - Upload and process files
import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Wand2,
  FileSpreadsheet,
  List
} from 'lucide-react';
import { useIntegrationStore } from '../../store/useIntegrationStore';
import { FileUploadData } from '../../types/integration';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileProcessed?: (fileId: string) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  type: 'document' | 'image' | 'data';
  processing?: 'none' | 'ai-rewrite' | 'ai-summarize' | 'ai-extract';
  status: 'uploading' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onFileProcessed
}: FileUploadModalProps) {
  const { uploadFile } = useIntegrationStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = {
    document: ['.txt', '.md', '.docx', '.pdf', '.rtf'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
    data: ['.csv', '.json', '.xml', '.xlsx']
  };

  const getFileType = (fileName: string): 'document' | 'image' | 'data' => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (supportedTypes.document.includes(extension)) return 'document';
    if (supportedTypes.image.includes(extension)) return 'image';
    if (supportedTypes.data.includes(extension)) return 'data';
    
    return 'document'; // Default fallback
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'image': return Image;
      case 'data': return File;
      default: return File;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      type: getFileType(file.name),
      processing: 'none',
      status: 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (const uploadedFile of newFiles) {
      try {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
        ));

        const fileData: FileUploadData = {
          file: uploadedFile.file,
          type: uploadedFile.type,
          processing: uploadedFile.processing
        };

        await uploadFile(fileData);

        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'completed',
            result: `File "${uploadedFile.file.name}" uploaded successfully`
          } : f
        ));

        if (onFileProcessed) {
          onFileProcessed(uploadedFile.id);
        }
      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));
      }
    }
  };

  const handleProcessingChange = (fileId: string, processing: 'none' | 'ai-rewrite' | 'ai-summarize' | 'ai-extract') => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, processing } : f
    ));
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleClose = () => {
    setUploadedFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-play-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Files</h2>
                <p className="text-gray-600 dark:text-gray-400">Upload and process files with AI assistance</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.docx,.pdf,.rtf,.jpg,.jpeg,.png,.gif,.svg,.csv,.json,.xml,.xlsx"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Support for documents, images, and data files
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {Object.entries(supportedTypes).map(([type, extensions]) => (
                  <span key={type} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {extensions.join(', ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Uploaded Files</h3>
              <div className="space-y-3">
                {uploadedFiles.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div
                      key={file.id}
                      className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {file.file.name}
                            </h4>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-lg">
                              {file.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {file.status === 'uploading' && (
                            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                          )}
                          {file.status === 'processing' && (
                            <div className="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                          )}
                          {file.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Processing Options */}
                      {file.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">AI Processing Options</h5>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'none', label: 'No Processing', icon: File },
                              { id: 'ai-rewrite', label: 'AI Rewrite', icon: Wand2 },
                              { id: 'ai-summarize', label: 'AI Summarize', icon: FileSpreadsheet },
                              { id: 'ai-extract', label: 'Extract Key Points', icon: List }
                            ].map((option) => {
                              const OptionIcon = option.icon;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => handleProcessingChange(file.id, option.id as any)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    file.processing === option.id
                                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-purple-700 dark:text-purple-300'
                                      : 'bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-800/70'
                                  }`}
                                >
                                  <OptionIcon className="w-4 h-4" />
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Result/Error */}
                      {file.result && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300">{file.result}</p>
                        </div>
                      )}
                      {file.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-300">{file.error}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

