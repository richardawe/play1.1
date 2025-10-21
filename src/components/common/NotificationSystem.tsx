// Notification system for cross-module actions
import { useEffect, useState } from 'react';
import { useIntegrationStore } from '../../store/useIntegrationStore';
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle, 
  X,
  ExternalLink
} from 'lucide-react';

export default function NotificationSystem() {
  const { notifications, removeNotification } = useIntegrationStore();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Update visible notifications based on current notifications
    setVisibleNotifications(prev => {
      const currentIds = notifications.map(n => n.id);
      const newVisibleIds = [...new Set([...prev, ...currentIds])];
      return newVisibleIds.filter(id => notifications.some(n => n.id === id));
    });
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const handleRemove = (id: string) => {
    setVisibleNotifications(prev => prev.filter(notificationId => notificationId !== id));
    removeNotification(id);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`card-play border-0 ${getNotificationColor(notification.type)} transform transition-all duration-300 ease-in-out ${
            visibleNotifications.includes(notification.id)
              ? 'translate-x-0 opacity-100 scale-100'
              : 'translate-x-full opacity-0 scale-95'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {notification.message}
                </p>
                
                {/* Action Buttons */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleRemove(notification.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
