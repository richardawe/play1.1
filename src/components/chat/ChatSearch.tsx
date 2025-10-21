// Chat Search - per prd.md §3️⃣.B and test-spec.md TC-P2.5.x
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface ChatSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSearch({ isOpen, onClose }: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const { messages } = useChatStore();
  const [filteredMessages, setFilteredMessages] = useState(messages);

  // Filter messages based on search query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredMessages(messages);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = messages.filter((message) =>
      message.content.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredMessages(filtered);
  }, [query, messages]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-10 p-4 flex flex-col">
      {/* Search Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <p>No messages found</p>
            {query && <p className="text-sm mt-2">Try a different search term</p>}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </p>
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(message.created_at).toLocaleString()}
                </div>
                <div className="text-sm">
                  {highlightText(message.content, query)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to highlight search terms
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

