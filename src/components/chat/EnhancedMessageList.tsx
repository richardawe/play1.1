// Enhanced Message List with Vector Search Context
import { useEffect, useRef } from 'react';
import { useEnhancedChatStore } from '../../store/useEnhancedChatStore';
import { User, Bot, Brain, Loader2 } from 'lucide-react';

export default function EnhancedMessageList() {
  const { 
    messages, 
    loading, 
    aiThinking, 
    contextResults, 
    contextLoading,
    clearContext 
  } = useEnhancedChatStore();
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
        <div className="text-center max-w-md">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome to AI Assistant</h3>
          <p className="text-sm mb-4 text-foreground">
            I'm your intelligent AI assistant with access to your documents, tasks, and calendar. 
            I can search through your content to provide context-aware responses!
          </p>
          <div className="text-sm space-y-1 text-left bg-accent/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-foreground">Try asking:</p>
            <p className="text-foreground">• "What documents do I have about AI?"</p>
            <p className="text-foreground">• "Summarize my recent tasks"</p>
            <p className="text-foreground">• "What's on my calendar this week?"</p>
            <p className="text-foreground">• "Find information about machine learning"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Context Results Panel */}
      {contextResults.length > 0 && (
        <div className="border-b border-border bg-accent/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Context Found ({contextResults.length})</span>
            </div>
            <button
              onClick={clearContext}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {contextResults.slice(0, 3).map((result, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                <span className="px-1 py-0.5 bg-primary/20 text-primary rounded text-xs">
                  {result.content_type}
                </span>
                <span className="ml-2">
                  {(result.similarity_score * 100).toFixed(0)}% match
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {/* AI Thinking Indicator */}
        {aiThinking && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {contextLoading ? 'Searching your content...' : 'AI is thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}


