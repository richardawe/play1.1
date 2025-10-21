// Drag and Drop Overlay - Visual feedback for drag operations
import { useIntegrationStore } from '../../store/useIntegrationStore';
import { Upload, FileText, MessageSquare, CheckSquare, Calendar } from 'lucide-react';

export default function DragDropOverlay() {
  const { isDragging, draggedData } = useIntegrationStore();

  if (!isDragging || !draggedData) return null;

  const getIcon = () => {
    switch (draggedData.type) {
      case 'file':
        return <Upload className="w-8 h-8 text-blue-600" />;
      case 'text':
        return <MessageSquare className="w-8 h-8 text-green-600" />;
      case 'task':
        return <CheckSquare className="w-8 h-8 text-orange-600" />;
      case 'event':
        return <Calendar className="w-8 h-8 text-purple-600" />;
      case 'document':
        return <FileText className="w-8 h-8 text-indigo-600" />;
      default:
        return <FileText className="w-8 h-8 text-gray-600" />;
    }
  };

  const getLabel = () => {
    switch (draggedData.type) {
      case 'file':
        return 'File';
      case 'text':
        return 'Text';
      case 'task':
        return 'Task';
      case 'event':
        return 'Event';
      case 'document':
        return 'Document';
      default:
        return 'Content';
    }
  };

  const getPreview = () => {
    if (draggedData.type === 'text' && typeof draggedData.data === 'string') {
      return draggedData.data.length > 50 
        ? draggedData.data.substring(0, 50) + '...'
        : draggedData.data;
    }
    if (draggedData.type === 'file' && draggedData.data instanceof File) {
      return draggedData.data.name;
    }
    return `${draggedData.type} content`;
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm" />
      
      {/* Drop Zones */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-8 max-w-4xl w-full p-8">
          {/* Chat Drop Zone */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-8 text-center">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Send to chat</p>
          </div>

          {/* Documents Drop Zone */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-dashed border-green-300 dark:border-green-600 rounded-2xl p-8 text-center">
            <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Documents</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create document</p>
          </div>

          {/* Tasks Drop Zone */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-dashed border-orange-300 dark:border-orange-600 rounded-2xl p-8 text-center">
            <CheckSquare className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tasks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add to tasks</p>
          </div>

          {/* Calendar Drop Zone */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-2xl p-8 text-center">
            <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Calendar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Schedule event</p>
          </div>
        </div>
      </div>

      {/* Dragged Item Preview */}
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 shadow-play-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
            {getIcon()}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{getLabel()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
              {getPreview()}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 shadow-play-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Drop on any module to transfer content
        </p>
      </div>
    </div>
  );
}

