import { useEffect, useState } from 'react';
import { useCleaningStore, OutputFileInfo } from '../../store/useCleaningStore';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  HardDrive,
  RefreshCw,
  FolderOpen,
  AlertCircle
} from 'lucide-react';

export default function OutputFilesView() {
  const { listOutputFiles, getOutputDirectory } = useCleaningStore();
  const [files, setFiles] = useState<OutputFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<OutputFileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const [filesData, directory] = await Promise.all([
        listOutputFiles(),
        getOutputDirectory()
      ]);
      setFiles(filesData);
      setOutputDirectory(directory);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const viewFile = async (file: OutputFileInfo) => {
    try {
      setSelectedFile(file);
      setLoading(true);
      
      // Read the actual file content
      const content = await invoke<string>('read_cleaning_output_file', { filePath: file.file_path });
      setFileContent(content);
    } catch (err) {
      setError(err as string);
      setFileContent(`Error reading file: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'text_cleanup':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'metadata_extraction':
        return <HardDrive className="w-4 h-4 text-green-500" />;
      case 'format_conversion':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTaskTypeLabel = (taskType: string): string => {
    switch (taskType) {
      case 'text_cleanup':
        return 'Text Cleanup';
      case 'metadata_extraction':
        return 'Metadata Extraction';
      case 'format_conversion':
        return 'Format Conversion';
      default:
        return taskType;
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading output files...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Output Files</h1>
          <p className="text-gray-600">View and manage cleaned output files</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Output Directory Info */}
      {outputDirectory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <FolderOpen className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <h3 className="font-medium text-blue-900">Output Directory</h3>
              <p className="text-blue-700 text-sm">{outputDirectory}</p>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Files List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Generated Files ({files.length})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {files.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No output files found</p>
                <p className="text-sm">Process some cleaning tasks to generate output files</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {files.map((file) => (
                  <div
                    key={file.file_path}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => viewFile(file)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getTaskTypeIcon(file.task_type)}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {file.filename}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getTaskTypeLabel(file.task_type)}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-400 flex items-center">
                              <HardDrive className="w-3 h-3 mr-1" />
                              {formatFileSize(file.size_bytes)}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(file.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewFile(file);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="View file"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File Preview */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">File Preview</h2>
          </div>
          
          <div className="p-6">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900">{selectedFile.filename}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      {getTaskTypeIcon(selectedFile.task_type)}
                      <span className="ml-2">{getTaskTypeLabel(selectedFile.task_type)}</span>
                    </span>
                    <span>{formatFileSize(selectedFile.size_bytes)}</span>
                    <span>{formatDate(selectedFile.created_at)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {fileContent}
                  </pre>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      // TODO: Implement file download
                      alert('File download not yet implemented');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement open in system
                      alert('Open in system not yet implemented');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open Location
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a file to preview its content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
