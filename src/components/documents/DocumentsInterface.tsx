// Documents Interface - per prd.md §3️⃣.C
import { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Upload } from 'lucide-react';
import { useDocumentStore } from '../../store/useDocumentStore';
import DocumentList from './DocumentList';
import DocumentEditor from './DocumentEditor';
// import ClearWorkspaceButton from '../common/ClearWorkspaceButton';
import { useTextSelection } from '../../hooks/useTextSelection';
import CrossModuleActions from '../common/CrossModuleActions';
import FileUploadModal from '../common/FileUploadModal';
import { invoke } from '@tauri-apps/api/tauri';

export default function DocumentsInterface() {
  const { currentDocument, loadDocuments, setCurrentDocument } = useDocumentStore();
  const [fileUploadOpen, setFileUploadOpen] = useState(false);

  // Enable text selection for cross-module actions
  useTextSelection({
    module: 'documents',
    sourceType: 'documents-interface',
    sourceId: currentDocument?.id?.toString()
  });

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleClearAll = async () => {
    await invoke('clear_all_documents');
    setCurrentDocument(null);
    await loadDocuments();
  };

  return (
    <div className="flex h-full gap-6">
      {/* Document List Sidebar */}
      <div className="w-80">
        <div className="card-play h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Documents
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFileUploadOpen(true)}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95" 
                  title="Upload file"
                >
                  <Upload className="w-4 h-4 text-white" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95" title="Create new document">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <DocumentList />
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1">
        <div className="card-play h-full relative">
          {/* Clear All Button */}
          {currentDocument && (
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={handleClearAll}
                className="group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Clear all documents"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Clear All</span>
              </button>
            </div>
          )}
          
          {currentDocument ? (
            <div className="p-6 h-full">
              <div className="mb-4">
                <CrossModuleActions
                  content={currentDocument.content || ''}
                  module="documents"
                  sourceId={currentDocument.id?.toString()}
                  sourceType="document"
                  variant="compact"
                />
              </div>
              <DocumentEditor documentId={currentDocument.id} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                  <FileText className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No document selected</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create or select a document to start editing</p>
                <button className="btn-primary flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create New Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={fileUploadOpen}
        onClose={() => setFileUploadOpen(false)}
        onFileProcessed={(fileId) => {
          console.log('File processed:', fileId);
          setFileUploadOpen(false);
          // Refresh documents list
          loadDocuments();
        }}
      />
    </div>
  );
}