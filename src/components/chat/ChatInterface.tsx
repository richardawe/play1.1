// AI Chat Interface - Interactive AI Assistant
import { useEffect, useState } from 'react';
import { Bot, Search as SearchIcon, Trash2 } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChatSearch from './ChatSearch';
// import ClearWorkspaceButton from '../common/ClearWorkspaceButton';
import { useTextSelection } from '../../hooks/useTextSelection';
import CrossModuleActions from '../common/CrossModuleActions';
import AIDocumentGenerator from '../common/AIDocumentGenerator';
import { useDragDrop } from '../../hooks/useDragDrop';

export default function ChatInterface() {
  const { loadMessages, clearMessages, aiThinking } = useChatStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiDocGeneratorOpen, setAiDocGeneratorOpen] = useState(false);
  
  // Enable text selection for cross-module actions
  useTextSelection({
    module: 'chat',
    sourceType: 'chat-interface'
  });

  // Enable drag and drop
  const { isDragOver } = useDragDrop({
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
  };

  return (
    <div className={`flex h-full flex-col transition-all duration-200 ${isDragOver ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
      {/* Header */}
      <div className="card-play border-0 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {aiThinking ? 'AI is thinking...' : 'Ask me anything'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Clear All</span>
              </button>
              
              <button
                onClick={() => setSearchOpen(true)}
                className="group p-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
                title="Search chat history"
              >
                <SearchIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <ChatSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <div className="card-play border-0 h-full">
          <div className="p-6 h-full">
            <MessageList />
          </div>
        </div>
      </div>

      {/* Cross-Module Actions */}
      <div className="card-play border-0 mt-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select text in messages to use cross-module actions</p>
            </div>
            <div className="flex items-center gap-3">
              <CrossModuleActions
                content=""
                module="chat"
                variant="compact"
              />
              <button
                onClick={() => setAiDocGeneratorOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 shadow-play">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-purple-900 dark:text-purple-100">AI Document</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Composer */}
      <div className="card-play border-0 mt-6">
        <div className="p-6">
          <MessageComposer />
        </div>
      </div>

      {/* AI Document Generator Modal */}
      <AIDocumentGenerator
        isOpen={aiDocGeneratorOpen}
        onClose={() => setAiDocGeneratorOpen(false)}
        sourceModule="chat"
        onDocumentCreated={(documentId) => {
          console.log('Document created:', documentId);
          setAiDocGeneratorOpen(false);
        }}
      />
    </div>
  );
}