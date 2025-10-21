// Cross-module action buttons
import { useState } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Search, 
  Brain,
  MoreHorizontal
} from 'lucide-react';
import { useIntegrationStore } from '../../store/useIntegrationStore';
import { ModuleType, ModuleContext } from '../../types/integration';

interface CrossModuleActionsProps {
  content: string;
  module: ModuleType;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, any>;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

export default function CrossModuleActions({
  content,
  module,
  sourceId,
  sourceType,
  metadata,
  className = '',
  variant = 'default'
}: CrossModuleActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { addToCalendar, addToTasks, sendToChat, createDocument, searchSimilar, getAIInsights } = useIntegrationStore();

  const context: ModuleContext = {
    module,
    content,
    metadata: {
      sourceId,
      sourceType,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };

  const actions = [
    {
      id: 'send-to-chat',
      label: 'Send to Chat',
      icon: MessageSquare,
      action: () => sendToChat(content, context),
      color: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      description: 'Continue conversation with this content'
    },
    {
      id: 'add-to-calendar',
      label: 'Add to Calendar',
      icon: Calendar,
      action: () => addToCalendar(content, context),
      color: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
      description: 'Create a calendar event'
    },
    {
      id: 'add-to-tasks',
      label: 'Add to Tasks',
      icon: CheckSquare,
      action: () => addToTasks(content, context),
      color: 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
      description: 'Create a task'
    },
    {
      id: 'create-document',
      label: 'Create Document',
      icon: FileText,
      action: () => createDocument(content, context),
      color: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
      description: 'Generate a document'
    },
    {
      id: 'search-similar',
      label: 'Search Similar',
      icon: Search,
      action: () => searchSimilar(content, context),
      color: 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
      description: 'Find similar content'
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: Brain,
      action: () => getAIInsights(content, context),
      color: 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
      description: 'Get AI-powered insights'
    }
  ];

  // Filter out actions that don't make sense for the current module
  const filteredActions = actions.filter(action => {
    if (action.id === 'send-to-chat' && module === 'chat') return false;
    if (action.id === 'add-to-calendar' && module === 'calendar') return false;
    if (action.id === 'add-to-tasks' && module === 'tasks') return false;
    if (action.id === 'create-document' && module === 'documents') return false;
    if (action.id === 'search-similar' && module === 'search') return false;
    if (action.id === 'ai-insights' && module === 'insights') return false;
    return true;
  });

  const handleAction = async (action: any) => {
    try {
      await action.action();
    } catch (error) {
      console.error('Cross-module action failed:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {filteredActions.slice(0, 3).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${action.color}`}
              title={action.description}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
        {filteredActions.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-play-lg p-2">
          <div className="flex flex-col gap-2">
            {filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${action.color}`}
                  title={action.description}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {filteredActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${action.color}`}
            title={action.description}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
