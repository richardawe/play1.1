import { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import ChatInterface from './components/chat/ChatInterface';
import EnhancedChatInterface from './components/chat/EnhancedChatInterface';
import DocumentsInterface from './components/documents/DocumentsInterface';
import TasksInterface from './components/tasks/TasksInterface';
import CalendarView from './components/calendar/CalendarView';
import DataOperationsInterface from './components/data-operations/DataOperationsInterface';
import VectorTestPage from './components/vector/VectorTestPage';
import FirstRunSetup from './components/setup/FirstRunSetup';
import { useSettingsStore } from './store/useSettingsStore';
import ContextMenu from './components/common/ContextMenu';
import NotificationSystem from './components/common/NotificationSystem';
import DragDropOverlay from './components/common/DragDropOverlay';

function App() {
  const { settings, loadSettings } = useSettingsStore();
  const [currentModule, setCurrentModule] = useState<'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar' | 'vector-test'>(
    'data-operations'
  );
  // Always check setup status on app start
  const [setupComplete, setSetupComplete] = useState(true); // Temporarily set to true for testing
  const [checkingSetup, setCheckingSetup] = useState(false); // Temporarily set to false for testing

  // Load settings and check setup on mount
  useEffect(() => {
    loadSettings();
    
    // Check if Ollama + models are ready
    const checkSetup = async () => {
      // In dev mode, skip setup check if localStorage says so
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDev && localStorage.getItem('play_skip_setup') === 'true') {
        setSetupComplete(true);
        setCheckingSetup(false);
        return;
      }

      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        const status: any = await invoke('check_setup_status');
        
        console.log('🔍 Setup check:', status);
        
        // Check if we have everything we need
        const ollamaReady = status.ollama_running;
        const hasLlama = status.models_installed.some((m: string) => 
          m.includes('llama3.2') || m.includes('llama3') || m.includes('llama')
        );
        const hasEmbed = status.models_installed.some((m: string) => 
          m.includes('nomic-embed') || m.includes('embed')
        );
        
        // If Ollama is running and we have at least one usable model, we're good
        const setupReady = ollamaReady && (hasLlama || status.models_installed.length > 0);
        
        console.log('✅ Setup ready:', setupReady, {
          ollamaReady,
          hasLlama,
          hasEmbed,
          modelCount: status.models_installed.length
        });
        
        setSetupComplete(setupReady);
      } catch (error) {
        console.error('Setup check failed:', error);
        // If check fails in dev mode, assume ready (don't block developer)
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setSetupComplete(isDev);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, [loadSettings]);

  // Set default module from settings
  useEffect(() => {
    if (settings?.default_module) {
      setCurrentModule(settings.default_module);
    }
  }, [settings]);

  // Show loading screen while checking setup
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">▶️ Play</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show first-run setup if Ollama not ready
  if (!setupComplete) {
    return <FirstRunSetup onComplete={() => setSetupComplete(true)} />;
  }

  // Render module content based on selection
  const renderModuleContent = () => {
    switch (currentModule) {
      case 'data-operations':
        return <DataOperationsInterface />;
      case 'chat':
        return <EnhancedChatInterface />;
      case 'documents':
        return <DocumentsInterface />;
      case 'tasks':
        return <TasksInterface />;
      case 'calendar':
        return <CalendarView />;
      case 'vector-test':
        return <VectorTestPage />;
      default:
        return null;
    }
  };

  return (
    <>
      <MainLayout currentModule={currentModule} onModuleChange={setCurrentModule}>
        {renderModuleContent()}
      </MainLayout>
      
        {/* Global Components */}
        <ContextMenu />
        <NotificationSystem />
        <DragDropOverlay />
      </>
    );
}

export default App;

