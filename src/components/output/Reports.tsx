import { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, FileText, RefreshCw, Eye, Database, AlertCircle } from 'lucide-react';
import { useCleaningStore } from '../../store/useCleaningStore';
import { invoke } from '@tauri-apps/api/tauri';

export default function Reports() {
  const { listOutputFiles, getCleaningTaskSummary } = useCleaningStore();
  const [reportFiles, setReportFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportFiles();
  }, []);

  const fetchReportFiles = async () => {
    try {
      setLoading(true);
      
      // Fetch both output files and task summary
      const [files, summary] = await Promise.all([
        listOutputFiles(),
        getCleaningTaskSummary()
      ]);
      
      console.log('All output files:', files);
      console.log('Task summary:', summary);
      
      // Store debug info
      setDebugInfo({
        totalFiles: files.length,
        allFiles: files,
        timestamp: new Date().toISOString()
      });
      
      // Store task summary
      setTaskSummary(summary);
      
      // Filter for metadata extraction and format conversion files
      const reportFiles = files.filter(file => 
        file.task_type === 'metadata_extraction' || file.task_type === 'format_conversion'
      );
      console.log('Filtered report files:', reportFiles);
      setReportFiles(reportFiles);
    } catch (err) {
      console.error('Error fetching report files:', err);
      setDebugInfo({ error: (err as Error).toString() });
    } finally {
      setLoading(false);
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
      case 'metadata_extraction':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'format_conversion':
        return <FileText className="w-4 h-4 text-green-500" />;
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
                <FileSpreadsheet className="w-8 h-8 mr-3 text-blue-600" />
                Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Generate and view comprehensive reports from your data
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {reportFiles.length === 0 ? (
          /* Coming Soon Card */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h2>
              <p className="text-gray-600 mb-6">
                Reports will appear here after you process files in the Cleanse module. 
                Metadata extraction and format conversion results are displayed as reports.
              </p>
              
              {/* Debug Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                  Debug Information:
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  • Check the browser console for detailed file information
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  • Make sure you have processed files in the Cleanse module
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  • Reports are generated for metadata_extraction and format_conversion tasks
                </p>
                
                {(debugInfo || taskSummary) && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Total files found:</strong> {debugInfo?.totalFiles || 0}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Last checked:</strong> {debugInfo?.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'Never'}
                    </p>
                    
                    {taskSummary && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-900 mb-2">Task Summary:</p>
                        <p className="text-xs text-blue-700 mb-1">
                          <strong>Output directory exists:</strong> {taskSummary.output_directory_exists ? 'Yes' : 'No'}
                        </p>
                        <p className="text-xs text-blue-700 mb-1">
                          <strong>Output directory path:</strong> {taskSummary.output_directory_path}
                        </p>
                        <p className="text-xs text-blue-700 mb-1">
                          <strong>Total output files:</strong> {taskSummary.output_file_count}
                        </p>
                        {taskSummary.output_files_by_type && Object.keys(taskSummary.output_files_by_type).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-blue-700 mb-1"><strong>Files by type:</strong></p>
                            {Object.entries(taskSummary.output_files_by_type).map(([type, count]) => (
                              <div key={type} className="text-xs text-blue-600 ml-2">
                                {type}: {String(count)} files
                              </div>
                            ))}
                          </div>
                        )}
                        {taskSummary.task_summary && Object.keys(taskSummary.task_summary).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-blue-700 mb-1"><strong>Task counts:</strong></p>
                            {Object.entries(taskSummary.task_summary).map(([type, statuses]) => (
                              <div key={type} className="text-xs text-blue-600 ml-2">
                                {type}: {Object.entries(statuses as any).map(([status, count]) => `${status}: ${count}`).join(', ')}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {debugInfo?.allFiles && debugInfo.allFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700 mb-1"><strong>All files:</strong></p>
                        <div className="max-h-32 overflow-y-auto text-xs">
                          {debugInfo.allFiles.map((file: any, index: number) => (
                            <div key={index} className="text-gray-600 mb-1">
                              {file.task_type}: {file.filename}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {debugInfo?.error && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Error:</strong> {debugInfo.error}
                      </p>
                    )}
                  </div>
                )}
                
                <button
                  onClick={fetchReportFiles}
                  disabled={loading}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Checking...' : 'Check Files Again'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <Database className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Metadata Reports</h3>
                    <p className="text-sm text-gray-600">File analysis and statistics</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Format Reports</h3>
                    <p className="text-sm text-gray-600">Conversion and normalization</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Workflow:</strong> Import files → Cleanse data → View reports here
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Reports List */
          <div className="space-y-6">
            {/* Reports Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
                <button
                  onClick={fetchReportFiles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportFiles.map((file) => (
                  <div key={file.filename} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTaskTypeIcon(file.task_type)}
                        <span className="font-medium text-gray-900">{getTaskTypeLabel(file.task_type)}</span>
                      </div>
                      <button
                        onClick={() => viewFile(file)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
