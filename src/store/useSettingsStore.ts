import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications_enabled: boolean;
  auto_save_interval: number;
  default_module: 'chat' | 'documents' | 'tasks' | 'calendar';
}

interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await invoke<UserSettings>('get_settings');
      set({ settings, loading: false });
      
      // Apply theme to document
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ error: String(error), loading: false });
    }
  },

  updateSettings: async (newSettings: Partial<UserSettings>) => {
    const currentSettings = get().settings;
    if (!currentSettings) return;

    const updatedSettings = { ...currentSettings, ...newSettings };
    
    try {
      const settings = await invoke<UserSettings>('update_settings', {
        settings: updatedSettings,
      });
      set({ settings });
      
      // Apply theme if it changed
      if (newSettings.theme) {
        if (newSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      set({ error: String(error) });
    }
  },

  setTheme: async (theme: 'light' | 'dark') => {
    await get().updateSettings({ theme });
  },
}));

