// Clear Workspace Button - Reset module data
import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ClearWorkspaceButtonProps {
  moduleName: string;
  onClear: () => Promise<void>;
}

export default function ClearWorkspaceButton({ moduleName, onClear }: ClearWorkspaceButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClear();
      setShowConfirm(false);
    } catch (error) {
      console.error('Clear failed:', error);
      alert('Failed to clear workspace: ' + error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-600/30 hover:bg-red-500/10 rounded-lg transition-colors"
        title={`Clear all ${moduleName}`}
      >
        <Trash2 className="w-4 h-4" />
        <span>Clear All</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">Clear {moduleName}?</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all {moduleName.toLowerCase()} data. 
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={clearing}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

