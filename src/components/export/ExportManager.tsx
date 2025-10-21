// Export Manager - per prd.md §7️⃣ Backup system
import { useState } from 'react';
import { Download, Upload, Loader2, X, FileJson } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';

interface ExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportManager({ isOpen, onClose }: ExportManagerProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setStatus('Exporting data...');
    try {
      // Get all data from database
      const [messages, documents, tasks, events, settings] = await Promise.all([
        invoke('get_messages', { channelId: '' }),
        invoke('get_all_documents'),
        invoke('get_all_tasks'),
        invoke('get_events_in_range', { 
          start: '2020-01-01T00:00:00Z', 
          end: '2030-12-31T23:59:59Z' 
        }),
        invoke('get_settings'),
      ]);

      const exportData = {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        data: {
          messages,
          documents,
          tasks,
          events,
          settings,
        },
      };

      // Save to file
      const filePath = await save({
        defaultPath: `play-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
        setStatus('✅ Export successful!');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setStatus('❌ Export failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setStatus('Importing data...');
    try {
      // Select file
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (!filePath || Array.isArray(filePath)) {
        setLoading(false);
        return;
      }

      // Read and parse file
      const fileContent = await readTextFile(filePath);
      const importData = JSON.parse(fileContent);

      if (!importData.version || !importData.data) {
        throw new Error('Invalid backup file format');
      }

      // TODO: Import data back to database
      // For MVP, we'll show a message that this requires additional implementation
      setStatus('⚠️ Import feature coming soon - manual SQL import required');
      
    } catch (error) {
      console.error('Import failed:', error);
      setStatus('❌ Import failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileJson className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Backup & Export</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <div className="text-left">
              <div className="font-medium">Export All Data</div>
              <div className="text-xs opacity-75">Save backup as JSON file</div>
            </div>
          </button>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-border hover:bg-accent rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <div className="text-left">
              <div className="font-medium">Import Data</div>
              <div className="text-xs text-muted-foreground">Restore from backup</div>
            </div>
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="mt-4 p-3 bg-accent rounded-lg text-sm text-center">
            {status}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
          <p className="text-blue-700 dark:text-blue-300">
            <strong>💡 Backup includes:</strong> All messages, documents, tasks, events, and settings
          </p>
        </div>
      </div>
    </div>
  );
}

