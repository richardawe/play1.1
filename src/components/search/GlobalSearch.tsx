// Global Search - per prd.md §7️⃣ Phase 7
import { useState, useEffect } from 'react';
import { Search, X, MessageSquare, FileText, CheckSquare, Calendar, Loader2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { Message } from '../../types/message';
import { Document } from '../../types/document';
import { Task } from '../../types/task';
import { CalendarEvent } from '../../types/event';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: 'chat' | 'documents' | 'tasks' | 'calendar', itemId: number) => void;
}

type SearchResult = {
  type: 'message' | 'document' | 'task' | 'event';
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search all modules in parallel
      const [messages, documents, tasks, events] = await Promise.all([
        invoke<Message[]>('get_messages', { channelId: '' }).catch(() => []),
        invoke<Document[]>('get_all_documents').catch(() => []),
        invoke<Task[]>('get_all_tasks').catch(() => []),
        invoke<CalendarEvent[]>('get_events_in_range', { 
          start: '2020-01-01T00:00:00Z', 
          end: '2030-12-31T23:59:59Z' 
        }).catch(() => []),
      ]);

      const lowerQuery = searchQuery.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search messages
      messages.forEach((msg) => {
        if (msg.content.toLowerCase().includes(lowerQuery)) {
          allResults.push({
            type: 'message',
            id: msg.id,
            title: `Message in ${msg.channel_id || 'chat'}`,
            content: msg.content,
            created_at: msg.created_at,
          });
        }
      });

      // Search documents
      documents.forEach((doc) => {
        if (
          doc.title.toLowerCase().includes(lowerQuery) ||
          doc.content.toLowerCase().includes(lowerQuery)
        ) {
          allResults.push({
            type: 'document',
            id: doc.id,
            title: doc.title,
            content: doc.content.substring(0, 200),
            created_at: doc.created_at,
          });
        }
      });

      // Search tasks
      tasks.forEach((task) => {
        if (
          task.title.toLowerCase().includes(lowerQuery) ||
          (task.description && task.description.toLowerCase().includes(lowerQuery))
        ) {
          allResults.push({
            type: 'task',
            id: task.id,
            title: task.title,
            content: task.description || '',
            created_at: task.created_at,
          });
        }
      });

      // Search events
      events.forEach((event) => {
        if (
          event.title.toLowerCase().includes(lowerQuery) ||
          (event.description && event.description.toLowerCase().includes(lowerQuery))
        ) {
          allResults.push({
            type: 'event',
            id: event.id,
            title: event.title,
            content: event.description || '',
            created_at: event.created_at,
          });
        }
      });

      // Sort by relevance (title matches first, then by date)
      allResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(lowerQuery);
        const bTitle = b.title.toLowerCase().includes(lowerQuery);
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setResults(allResults);
    } catch (error) {
      console.error('Global search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-orange-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getModuleName = (type: string): 'chat' | 'documents' | 'tasks' | 'calendar' => {
    switch (type) {
      case 'message':
        return 'chat';
      case 'document':
        return 'documents';
      case 'task':
        return 'tasks';
      case 'event':
        return 'calendar';
      default:
        return 'chat';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl shadow-2xl">
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everywhere... (Cmd+K)"
              className="flex-1 bg-transparent border-none focus:outline-none text-lg"
              autoFocus
            />
            {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            <button onClick={onClose} className="p-1 hover:bg-accent rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto p-2">
          {results.length === 0 && query && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length === 0 && !query && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Search across all your chats, documents, tasks, and events</p>
              <p className="text-xs mt-2">Press Cmd+K to open search anytime</p>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}-${index}`}
              onClick={() => {
                onNavigate(getModuleName(result.type), result.id);
                onClose();
              }}
              className="w-full p-3 hover:bg-accent rounded-lg text-left transition-colors"
            >
              <div className="flex items-start gap-3">
                {getIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{result.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {result.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {result.content}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''} across all modules
          </div>
        )}
      </div>
    </div>
  );
}

