import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Calendar, 
  Download, 
  Database, 
  Home,
  TestTube,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentModule: 'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar' | 'vector-test';
  onModuleChange: (module: 'data-operations' | 'chat' | 'documents' | 'tasks' | 'calendar' | 'vector-test') => void;
  onExportClick?: () => void;
}

// Data Operations - Primary workflow
const dataOperationsModules = [
  { id: 'data-operations' as const, name: 'Data Operations', icon: Database, description: 'Import, clean, and process data', gradient: 'from-indigo-500 to-blue-500' },
];

// Secondary workspace modules
const workspaceModules = [
  { id: 'chat' as const, name: 'Chat', icon: MessageSquare, description: 'Talk with AI or teammates', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'documents' as const, name: 'Documents', icon: FileText, description: 'Draft notes and reports', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'tasks' as const, name: 'Tasks', icon: CheckSquare, description: 'Manage actionable items', gradient: 'from-violet-500 to-purple-500' },
  { id: 'calendar' as const, name: 'Calendar', icon: Calendar, description: 'Plan work sessions', gradient: 'from-orange-500 to-red-500' },
  { id: 'vector-test' as const, name: 'Vector Test', icon: TestTube, description: 'Test vector database functionality', gradient: 'from-pink-500 to-rose-500' },
];

interface ModuleGroupProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  modules: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    gradient: string;
  }>;
  currentModule: string;
  onModuleChange: (module: any) => void;
  isCollapsed: boolean;
}

function ModuleGroup({ title, icon: GroupIcon, modules, currentModule, onModuleChange, isCollapsed }: ModuleGroupProps) {
  return (
    <div className="space-y-3">
      {!isCollapsed && (
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-teal-500/20">
            <GroupIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      
      <div className="space-y-1">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = currentModule === module.id;

          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              title={isCollapsed ? module.name : undefined}
              className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 shadow-play-glow'
                  : 'hover:bg-white/10 dark:hover:bg-white/5 hover:scale-105 active:scale-95'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {/* Gradient background for active state */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} opacity-10 rounded-xl`} />
              )}
              
              {/* Icon with gradient */}
              <div className={`relative p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-white/20 shadow-lg' 
                  : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                <Icon className={`w-4 h-4 transition-colors duration-200 ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                }`} />
              </div>
              
              {/* Content - hidden when collapsed */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className={`font-medium text-sm transition-colors duration-200 ${
                    isActive 
                      ? 'text-indigo-900 dark:text-indigo-100' 
                      : 'text-gray-900 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                  }`}>
                    {module.name}
                  </div>
                  <div className={`text-xs transition-colors duration-200 ${
                    isActive 
                      ? 'text-indigo-700/70 dark:text-indigo-300/70' 
                      : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                  }`}>
                    {module.description}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar({ currentModule, onModuleChange, onExportClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`h-full flex flex-col glass border-r border-white/10 dark:border-gray-700/20 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-80'
    }`}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10 dark:border-gray-700/20 relative">
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
          {/* Play Triangle Logo */}
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-lg flex items-center justify-center shadow-play-glow animate-triangle-float">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-lg blur-md opacity-30 animate-glow" />
          </div>
          
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="play-logo text-xl">Play</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Offline Workspace
              </p>
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-6 right-4 p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 hover:scale-110 active:scale-95"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
        {/* Data Operations - Primary */}
        <ModuleGroup
          title="Data Operations"
          icon={Database}
          modules={dataOperationsModules}
          currentModule={currentModule}
          onModuleChange={onModuleChange}
          isCollapsed={isCollapsed}
        />

        {/* Workspace - Secondary */}
        <ModuleGroup
          title="Workspace"
          icon={Home}
          modules={workspaceModules}
          currentModule={currentModule}
          onModuleChange={onModuleChange}
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Footer/Status */}
      <div className="p-4 border-t border-white/10 dark:border-gray-700/20 space-y-3">
        {/* Export Button */}
        {onExportClick && (
          <button
            onClick={onExportClick}
            title={isCollapsed ? 'Backup & Export' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl border border-white/20 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Backup & Export</span>}
          </button>
        )}
        
        {/* Offline Status */}
        <div className={`flex items-center gap-3 px-3 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Offline Mode</span>
          )}
        </div>
      </div>
    </aside>
  );
}