import { useEffect, useState } from 'react';
import { X, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (isOpen && !settings) {
      loadSettings();
    }
  }, [isOpen, settings, loadSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (localSettings) {
      await updateSettings(localSettings);
      onClose();
    }
  };

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = localSettings?.theme === 'light' ? 'dark' : 'light';
    const updated = { ...localSettings!, theme: newTheme };
    setLocalSettings(updated);
    updateSettings({ theme: newTheme });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                {localSettings?.theme === 'dark' ? (
                  <>
                    <Moon className="w-5 h-5" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" />
                    Light Mode
                  </>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                {localSettings?.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </span>
            </button>
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Notifications</span>
              <input
                type="checkbox"
                checked={localSettings?.notifications_enabled ?? true}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    notifications_enabled: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
            </label>
          </div>

          {/* Auto-save Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Auto-save Interval (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={(localSettings?.auto_save_interval ?? 2000) / 1000}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings!,
                  auto_save_interval: parseInt(e.target.value) * 1000,
                })
              }
              className="w-full p-2 border border-border rounded-lg bg-background"
            />
          </div>

          {/* Default Module */}
          <div>
            <label className="block text-sm font-medium mb-2">Default Module</label>
            <select
              value={localSettings?.default_module ?? 'chat'}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings!,
                  default_module: e.target.value as any,
                })
              }
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              <option value="chat">Chat</option>
              <option value="documents">Documents</option>
              <option value="tasks">Tasks</option>
              <option value="calendar">Calendar</option>
              <option value="ai-mentor">AI Mentor</option>
            </select>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </div>

    </div>
  );
}

