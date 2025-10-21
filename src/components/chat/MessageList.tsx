// Message List - AI Chat Display
import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { User, Bot } from 'lucide-react';

export default function MessageList() {
  const { messages, loading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground max-w-md">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Welcome to AI Assistant</h3>
          <p className="text-sm mb-4">
            I'm your local AI assistant powered by Ollama. Ask me questions, get help with tasks, or just chat!
          </p>
          <div className="text-xs space-y-1 text-left bg-accent/30 p-3 rounded-lg">
            <p className="font-medium mb-2">Try asking:</p>
            <p>• "Help me plan my day"</p>
            <p>• "Summarize my tasks"</p>
            <p>• "Generate ideas for a project"</p>
            <p>• "Explain a concept"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isAI = message.user_id === 2;

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
          >
            {/* AI Avatar */}
            {isAI && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Message Content */}
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                isAI
                  ? 'bg-card border border-border'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {/* Message Text */}
              <div className={`prose prose-sm ${isAI ? 'dark:prose-invert' : 'prose-invert'} max-w-none whitespace-pre-wrap`}>
                {message.content}
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs mt-2 ${
                  isAI ? 'text-muted-foreground' : 'text-primary-foreground/70'
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* Attachments */}
              {message.attachments && (
                <div className="mt-2 text-xs opacity-70">
                  📎 {message.attachments}
                </div>
              )}
            </div>

            {/* User Avatar */}
            {!isAI && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
