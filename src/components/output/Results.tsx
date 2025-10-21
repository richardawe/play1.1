import { useEffect, useState } from 'react';
import { Lightbulb, Brain, FileText, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { useCleaningStore } from '../../store/useCleaningStore';
import { invoke } from '@tauri-apps/api/tauri';

export default function Results() {
  const { listOutputFiles } = useCleaningStore();
  const [resultFiles, setResultFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    fetchResultFiles();
  }, []);

  const fetchResultFiles = async () => {
    try {
      const files = await listOutputFiles();
      // Filter for text cleanup files (cleaned text results)
      const resultFiles = files.filter(file => file.task_type === 'text_cleanup');
      setResultFiles(resultFiles);
    } catch (err) {
      console.error('Error fetching result files:', err);
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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Lightbulb className="w-8 h-8 mr-3 text-yellow-600" />
                Results
              </h1>
              <p className="text-gray-600 mt-1">
                View AI analysis results and recommendations
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Generate Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {resultFiles.length === 0 ? (
          /* Coming Soon Card */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Yet</h2>
              <p className="text-gray-600 mb-6">
                Cleaned text results will appear here after you process files in the Cleanse module. 
                These are the AI-processed, cleaned versions of your original files.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Cleaned Text</h3>
                    <p className="text-sm text-gray-600">AI-processed content</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Normalized Format</h3>
                    <p className="text-sm text-gray-600">Consistent structure</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Workflow:</strong> Import files → Cleanse data → View cleaned results here
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Results List */
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Cleaned Text Results</h2>
                <button
                  onClick={fetchResultFiles}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultFiles.map((file) => (
                  <div key={file.filename} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900">Cleaned Text</span>
                      </div>
                      <button
                        onClick={() => viewFile(file)}
                        className="text-yellow-600 hover:text-yellow-800"
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
                      Cleaned Text - {selectedFile.filename}
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
