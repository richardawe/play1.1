// Enhanced Chat Input with Context-Aware Search
import { useState } from 'react';
import { useEnhancedChatStore } from '../../store/useEnhancedChatStore';
import { Send, Search, Brain, Loader2 } from 'lucide-react';

export default function EnhancedChatInput() {
  const [message, setMessage] = useState('');
  const [useContext, setUseContext] = useState(true);
  const { sendToAI, sendToAIWithContext, aiThinking, contextLoading } = useEnhancedChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || aiThinking) return;

    const messageText = message.trim();
    setMessage('');

    if (useContext) {
      await sendToAIWithContext(messageText);
    } else {
      await sendToAI(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Context Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseContext(!useContext)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              useContext
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Brain className="w-4 h-4" />
            {useContext ? 'Context-Aware' : 'Basic Chat'}
          </button>
          
          {useContext && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Search className="w-3 h-3" />
              <span>Will search your content</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                useContext
                  ? "Ask me anything... I'll search through your documents, tasks, and calendar for relevant context."
                  : "Ask me anything..."
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={2}
              disabled={aiThinking}
            />
            
            {/* Loading Indicators */}
            {(aiThinking || contextLoading) && (
              <div className="absolute right-3 top-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || aiThinking}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {aiThinking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {/* Context Status */}
        {useContext && (aiThinking || contextLoading) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Search className="w-3 h-3" />
            <span>
              {contextLoading ? 'Searching your content...' : 'Using context in response...'}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}


