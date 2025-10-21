// Version History - per prd.md §3️⃣.C and test-spec.md TC-P3.5.x
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { History, X, RotateCcw } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';

interface DocumentVersion {
  id: number;
  version: number;
  content: string;
  created_at: string;
}

interface VersionHistoryProps {
  documentId: number;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export default function VersionHistory({ documentId, isOpen, onClose, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      loadVersions();
    }
  }, [isOpen, documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await invoke<DocumentVersion[]>('get_document_versions', {
        documentId,
        limit: 50,
      });
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: number) => {
    if (!confirm('Restore this version? Current content will be saved as a new version.')) {
      return;
    }

    try {
      await invoke('restore_document_version', {
        documentId,
        versionId,
      });
      onRestore();
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('Failed to restore version');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No version history yet</p>
              <p className="text-sm mt-2">Make some edits to create versions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-primary">
                        v{version.version}
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(version.created_at)}
                      </span>
                    </div>
                    {index > 0 && (
                      <button
                        onClick={() => handleRestore(version.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-accent hover:bg-accent/80 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {version.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            📝 Versions are created automatically when you edit the document
          </p>
        </div>
      </div>
    </div>
  );
}

