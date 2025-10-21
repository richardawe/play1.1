// Link Manager - Cross-module linking per prd.md
import { useState, useEffect } from 'react';
import { Link as LinkIcon, X, MessageSquare, FileText, CheckSquare, Calendar } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface Link {
  id: number;
  from_type: string;
  from_id: number;
  to_type: string;
  to_id: number;
  created_at: string;
}

interface LinkManagerProps {
  itemType: 'message' | 'document' | 'task' | 'event';
  itemId: number;
}

export default function LinkManager({ itemType, itemId }: LinkManagerProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLinks();
  }, [itemType, itemId]);

  const loadLinks = async () => {
    try {
      const result = await invoke<Link[]>('get_links_for_item', {
        itemType,
        itemId,
      });
      setLinks(result);
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  };

  const handleAddLink = async (targetType: string, targetId: number) => {
    setLoading(true);
    try {
      await invoke('create_link', {
        fromType: itemType,
        fromId: itemId,
        toType: targetType,
        toId: targetId,
      });
      await loadLinks();
      setShowAddLink(false);
    } catch (error) {
      console.error('Failed to create link:', error);
      alert('Failed to create link: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLink = async (linkId: number) => {
    try {
      await invoke('delete_link', { id: linkId });
      await loadLinks();
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-3 h-3" />;
      case 'document':
        return <FileText className="w-3 h-3" />;
      case 'task':
        return <CheckSquare className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      default:
        return <LinkIcon className="w-3 h-3" />;
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Linked Items ({links.length})</span>
        </div>
        <button
          onClick={() => setShowAddLink(!showAddLink)}
          className="text-xs px-2 py-1 border border-border hover:bg-accent rounded"
        >
          + Add Link
        </button>
      </div>

      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-1">
          {links.map((link) => {
            const linkedType = link.from_type === itemType && link.from_id === itemId
              ? link.to_type
              : link.from_type;
            const linkedId = link.from_type === itemType && link.from_id === itemId
              ? link.to_id
              : link.from_id;

            return (
              <div
                key={link.id}
                className="flex items-center justify-between p-2 bg-accent/50 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  {getIcon(linkedType)}
                  <span className="capitalize">{linkedType}</span>
                  <span className="text-muted-foreground">#{linkedId}</span>
                </div>
                <button
                  onClick={() => handleRemoveLink(link.id)}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Link Form */}
      {showAddLink && (
        <div className="mt-2 p-3 bg-accent/30 rounded-lg space-y-2">
          <div className="text-xs font-medium mb-2">Link to:</div>
          <div className="grid grid-cols-2 gap-2">
            {['message', 'document', 'task', 'event'].map((type) => {
              if (type === itemType) return null;
              return (
                <button
                  key={type}
                  onClick={() => {
                    const targetId = prompt(`Enter ${type} ID to link:`);
                    if (targetId) {
                      handleAddLink(type, parseInt(targetId));
                    }
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-border hover:bg-background rounded capitalize"
                >
                  {getIcon(type)}
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

