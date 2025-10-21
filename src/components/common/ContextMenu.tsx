// Universal context menu for text selection
import { useEffect, useRef, useState } from 'react';
import { useIntegrationStore, contextMenuActions } from '../../store/useIntegrationStore';
import { 
  MessageSquare, 
  FileText, 
  Search, 
  Brain,
  ChevronRight
} from 'lucide-react';

export default function ContextMenu() {
  const {
    contextMenuVisible,
    contextMenuPosition,
    selectedText,
    currentContext,
    hideContextMenu
  } = useIntegrationStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };

    if (contextMenuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenuVisible, hideContextMenu]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideContextMenu();
      }
    };

    if (contextMenuVisible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenuVisible, hideContextMenu]);

  if (!contextMenuVisible || !isVisible) {
    return null;
  }

  const handleAction = async (action: any) => {
    if (currentContext && selectedText) {
      try {
        await action.action(selectedText, currentContext);
        hideContextMenu();
      } catch (error) {
        console.error('Context menu action failed:', error);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'create': return <FileText className="w-4 h-4" />;
      case 'analyze': return <Brain className="w-4 h-4" />;
      case 'share': return <MessageSquare className="w-4 h-4" />;
      case 'transform': return <Search className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'create': return 'text-green-600 dark:text-green-400';
      case 'analyze': return 'text-purple-600 dark:text-purple-400';
      case 'share': return 'text-blue-600 dark:text-blue-400';
      case 'transform': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Group actions by category
  const groupedActions = contextMenuActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, typeof contextMenuActions>);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-play-lg"
      style={{
        left: contextMenuPosition.x,
        top: contextMenuPosition.y,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Actions</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {selectedText.length > 50 ? `${selectedText.substring(0, 50)}...` : selectedText}
            </p>
          </div>
        </div>
      </div>

      {/* Actions by Category */}
      <div className="p-2">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category} className="mb-2 last:mb-0">
            {/* Category Header */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <span className={getCategoryColor(category)}>
                {getCategoryIcon(category)}
              </span>
              {category}
            </div>
            
            {/* Category Actions */}
            <div className="space-y-1">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 hover:scale-[1.02] group"
                    title={action.description}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center group-hover:shadow-play transition-all duration-200">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{action.label}</div>
                      {action.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Press Esc to close</span>
          <span>{selectedText.length} characters</span>
        </div>
      </div>
    </div>
  );
}
