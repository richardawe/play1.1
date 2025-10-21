import { useEffect, useState } from 'react';
import { FolderOpen, Download, FileText, Database, Archive, Cloud, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { useCleaningStore } from '../../store/useCleaningStore';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/shell';
// import { showInFolder } from '@tauri-apps/api/shell';

export default function Exports() {
  const { listOutputFiles } = useCleaningStore();
  const [exportFiles, setExportFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    fetchExportFiles();
  }, []);

  const fetchExportFiles = async () => {
    try {
      const files = await listOutputFiles();
      // Show all output files as exports
      setExportFiles(files);
    } catch (err) {
      console.error('Error fetching export files:', err);
    }
  };

  const viewFile = async (file: any) => {
    try {
      setSelectedFile(file);
      const content = await invoke<string>('read_cleaning_output_file', { filePath: file.file_path });
      setFileContent(content);
    } catch (err) {
      setFileContent(`Error reading file: ${err}`);
    }
  };

  const openFileLocation = async (filePath: string) => {
    try {
      // Use open to open the file location in the system file manager
      await open(filePath);
    } catch (err) {
      console.error('Error opening file location:', err);
      alert(`Failed to open file location: ${err}`);
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

  const getTaskTypeLabel = (taskType: string): string => {
    switch (taskType) {
      case 'text_cleanup':
        return 'Cleaned Text';
      case 'metadata_extraction':
        return 'Metadata Report';
      case 'format_conversion':
        return 'Format Report';
      default:
        return taskType;
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'text_cleanup':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'metadata_extraction':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'format_conversion':
        return <Archive className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FolderOpen className="w-8 h-8 mr-3 text-green-600" />
                Exports
              </h1>
              <p className="text-gray-600 mt-1">
                Export your data and files in various formats
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Bulk Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {exportFiles.length === 0 ? (
          /* Coming Soon Card */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Exports Yet</h2>
              <p className="text-gray-600 mb-6">
                All processed output files will appear here. These are the files generated 
                from your data cleaning and processing operations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Cleaned Text Files</h3>
                    <p className="text-sm text-gray-600">AI-processed content</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Database className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Metadata Reports</h3>
                    <p className="text-sm text-gray-600">File analysis data</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Archive className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Format Reports</h3>
                    <p className="text-sm text-gray-600">Conversion results</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Cloud className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">All Output Files</h3>
                    <p className="text-sm text-gray-600">Complete file collection</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Workflow:</strong> Import files → Cleanse data → View all output files here
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Exports List */
          <div className="space-y-6">
            {/* Exports Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">All Output Files</h2>
                <button
                  onClick={fetchExportFiles}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exportFiles.map((file) => (
                  <div key={file.filename} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTaskTypeIcon(file.task_type)}
                        <span className="font-medium text-gray-900">{getTaskTypeLabel(file.task_type)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => viewFile(file)}
                          className="text-green-600 hover:text-green-800"
                          title="View File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openFileLocation(file.file_path)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Open Location"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>File:</strong> {file.filename}</p>
                      <p><strong>Size:</strong> {formatFileSize(file.size_bytes)}</p>
                      <p><strong>Created:</strong> {formatDate(file.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getTaskTypeLabel(selectedFile.task_type)} - {selectedFile.filename}
                    </h3>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {fileContent || 'Loading...'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
