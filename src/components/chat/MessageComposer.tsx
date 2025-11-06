// Message Composer - AI Chat Input
import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { useEnhancedChatStore } from '../../store/useEnhancedChatStore';

export default function MessageComposer() {
  const [message, setMessage] = useState('');
  const { sendToAI, aiThinking } = useEnhancedChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!message.trim() || aiThinking) return;

    const messageToSend = message.trim();
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendToAI(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  return (
    <div className="p-4">
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          title="Attach file (coming soon)"
          disabled
        >
          <Paperclip className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={aiThinking ? "AI is thinking..." : "Ask me anything... (Shift+Enter for new line)"}
            disabled={aiThinking}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || aiThinking}
          className="p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message (Enter)"
        >
          {aiThinking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        {aiThinking ? (
          <span className="flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            AI is generating a response...
          </span>
        ) : (
          <span>Press Enter to send, Shift+Enter for new line</span>
        )}
      </div>
    </div>
  );
}
