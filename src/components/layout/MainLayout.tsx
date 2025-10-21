import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SettingsModal from '../SettingsModal';
import GlobalSearch from '../search/GlobalSearch';
import ExportManager from '../export/ExportManager';

interface MainLayoutProps {
  children: ReactNode;
  currentModule: 'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar';
  onModuleChange: (module: 'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar') => void;
}

export default function MainLayout({ children, currentModule, onModuleChange }: MainLayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const handleNavigate = (module: 'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar') => {
    onModuleChange(module);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-play-dark dark:via-slate-900 dark:to-play-surface">
      {/* Background Pattern */}
      <div className="fixed inset-0 triangle-pattern opacity-30 pointer-events-none" />
      
      {/* Sidebar */}
      <Sidebar 
        currentModule={currentModule} 
        onModuleChange={onModuleChange}
        onExportClick={() => setIsExportOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Topbar */}
        <Topbar 
          currentModule={currentModule} 
          onSettingsClick={() => setIsSettingsOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          {/* Content Background */}
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" />
          
          {/* Content Container */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Search */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Export Manager */}
      <ExportManager
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}