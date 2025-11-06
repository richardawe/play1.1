// Enhanced Chat Interface with Vector Search Context
import { useEffect, useState } from 'react';
import { Bot, Search as SearchIcon, Trash2, FileText, Database } from 'lucide-react';
import { useEnhancedChatStore } from '../../store/useEnhancedChatStore';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChatSearch from './ChatSearch';
import { useTextSelection } from '../../hooks/useTextSelection';
import AIDocumentGenerator from '../common/AIDocumentGenerator';
import { useDragDrop } from '../../hooks/useDragDrop';
import AdvancedVectorDatabaseSelector from './AdvancedVectorDatabaseSelector';
import VectorDebugPanel from './VectorDebugPanel';

export default function EnhancedChatInterface() {
  const { 
    loadMessages, 
    clearMessages, 
    contextResults, 
    clearContext,
    selectedDatabase,
    setSelectedDatabase
  } = useEnhancedChatStore();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiDocGeneratorOpen, setAiDocGeneratorOpen] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Enable text selection for cross-module actions
  useTextSelection({
    module: 'chat',
    sourceType: 'chat-interface'
  });

  // Enable drag and drop
  useDragDrop({
    module: 'chat',
    onDrop: (data) => {
      console.log('Dropped in chat:', data);
      // Handle dropped content in chat
    }
  });

  // Load messages on mount (wait for Tauri to be ready)
  useEffect(() => {
    const loadWhenReady = async () => {
      if (window.__TAURI__) {
        await loadMessages();
      } else {
        setTimeout(loadWhenReady, 100);
      }
    };
    loadWhenReady();
  }, [loadMessages]);

  const handleClearAll = async () => {
    await clearMessages();
    clearContext();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-play-dark dark:via-slate-900 dark:to-play-surface">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhanced with vector search context
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Vector Database Selector */}
            <AdvancedVectorDatabaseSelector
              onDatabaseSelect={(db) => setSelectedDatabase(db)}
              selectedDatabase={selectedDatabase ?? undefined}
            />
            
            {/* Context Toggle */}
            <button
              onClick={() => setShowContext(!showContext)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showContext
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Database className="w-4 h-4 mr-1.5 inline" />
              Context ({contextResults.length})
            </button>
            
            {/* Debug Toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showDebug
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Debug
            </button>
            
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
            
            {/* Clear Button */}
            <button
              onClick={handleClearAll}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-orange-50/50 dark:bg-orange-900/20">
          <div className="p-4">
            <VectorDebugPanel />
          </div>
        </div>
      )}

      {/* Context Panel */}
      {showContext && contextResults.length > 0 && (
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Relevant Context ({contextResults.length})
              </h3>
              <button
                onClick={clearContext}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {contextResults.map((result, index) => (
                <div
                  key={index}
                  className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {result.content_type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(result.similarity_score * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList />
        </div>

        {/* Message Composer */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <MessageComposer />
        </div>
      </div>

      {/* Modals */}
      <ChatSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      
      <AIDocumentGenerator
        isOpen={aiDocGeneratorOpen}
        onClose={() => setAiDocGeneratorOpen(false)}
      />
    </div>
  );
}
