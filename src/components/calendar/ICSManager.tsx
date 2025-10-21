// ICS Manager - Calendar import/export per prd.md
import { useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';
import { useCalendarStore } from '../../store/useCalendarStore';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function ICSManager() {
  const [loading, setLoading] = useState(false);
  const { currentDate, loadEvents } = useCalendarStore();

  const handleExport = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const icsContent = await invoke<string>('export_calendar_to_ics', {
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const filePath = await save({
        defaultPath: `play-calendar-${currentDate.toISOString().split('T')[0]}.ics`,
        filters: [{ name: 'iCalendar', extensions: ['ics'] }],
      });

      if (filePath) {
        await writeTextFile(filePath, icsContent);
        alert('✅ Calendar exported successfully!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'iCalendar', extensions: ['ics'] }],
      });

      if (!filePath || Array.isArray(filePath)) {
        setLoading(false);
        return;
      }

      const icsContent = await readTextFile(filePath);
      const count = await invoke<number>('import_calendar_from_ics', { icsContent });

      alert(`✅ Imported ${count} events successfully!`);
      
      // Reload events
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      loadEvents(start.toISOString(), end.toISOString());
    } catch (error) {
      console.error('Import failed:', error);
      alert('❌ Import failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
        title="Export to .ics file"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Export ICS</span>
      </button>

      <button
        onClick={handleImport}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
        title="Import from .ics file"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>Import ICS</span>
      </button>
    </div>
  );
}

