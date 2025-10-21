import { Search, Settings, Command } from 'lucide-react';

interface TopbarProps {
  currentModule: 'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar';
  onSettingsClick: () => void;
  onSearchClick: () => void;
}

const moduleNames = {
  'data-operations': 'Data Operations',
  chat: 'Chat',
  documents: 'Documents',
  tasks: 'Tasks',
  calendar: 'Calendar',
};

const moduleDescriptions = {
  'data-operations': 'Import, clean, and process data',
  chat: 'Talk with AI or teammates',
  documents: 'Draft notes and reports',
  tasks: 'Manage actionable items',
  calendar: 'Plan work sessions',
};

export default function Topbar({ currentModule, onSettingsClick, onSearchClick }: TopbarProps) {
  return (
    <header className="h-20 border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md px-6 flex items-center justify-between relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-teal-500/5" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Module Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Module Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 flex items-center justify-center border border-indigo-500/30">
              <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-sm" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {moduleNames[currentModule]}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {moduleDescriptions[currentModule]}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <button 
            onClick={onSearchClick}
            className="group flex items-center gap-3 px-4 py-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
            title="Global Search (Cmd+K)"
          >
            <Search className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</span>
            <kbd className="flex items-center gap-1 text-xs bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-md border border-white/30 dark:border-gray-700/30">
              <Command className="w-3 h-3" />
              K
            </kbd>
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="group p-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}