// Message List - AI Chat Display
import { useEffect, useRef } from 'react';
import { useEnhancedChatStore } from '../../store/useEnhancedChatStore';
import { User, Bot } from 'lucide-react';

export default function MessageList() {
  const { messages, loading } = useEnhancedChatStore();
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">Welcome to AI Assistant</h3>
          <p className="text-sm mb-6 text-slate-600 dark:text-slate-400">
            I'm your local AI assistant powered by Ollama. Ask me questions, get help with tasks, or just chat!
          </p>
          <div className="text-sm space-y-2 text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="font-semibold mb-3 text-slate-800 dark:text-slate-200">Try asking:</p>
            <div className="space-y-1">
              <p className="text-slate-700 dark:text-slate-300">• "Help me plan my day"</p>
              <p className="text-slate-700 dark:text-slate-300">• "Summarize my tasks"</p>
              <p className="text-slate-700 dark:text-slate-300">• "Generate ideas for a project"</p>
              <p className="text-slate-700 dark:text-slate-300">• "Explain a concept"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        // Determine if this is an AI message by checking if it's the second message in a pair
        // or by checking if the content looks like an AI response (contains certain keywords)
        const isAI = message.content.includes('Based on') || 
                     message.content.includes('Here\'s') || 
                     message.content.includes('I can help') ||
                     message.content.includes('According to') ||
                     (index > 0 && index % 2 === 1); // Every second message is AI

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
          >
            {/* AI Avatar */}
            {isAI && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Message Content */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                isAI
                  ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              }`}
            >
              {/* Message Text */}
              <div className={`text-sm leading-relaxed ${
                isAI 
                  ? 'text-slate-800 dark:text-slate-200' 
                  : 'text-white'
              }`}>
                {message.content.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();
                  
                  // Handle section headers (lines ending with :)
                  if (trimmedLine.endsWith(':') && !trimmedLine.includes('|') && trimmedLine.length > 3) {
                    return (
                      <div key={index} className="font-bold text-lg mb-4 mt-6 first:mt-0 text-blue-800 dark:text-blue-200 border-b border-blue-200 dark:border-blue-700 pb-2">
                        {trimmedLine}
                      </div>
                    );
                  }
                  
                  // Handle table rows (lines with |)
                  if (trimmedLine.includes('|') && trimmedLine.length > 0) {
                    const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
                    const isHeader = trimmedLine.includes('---') || cells.some(cell => cell.includes('---'));
                    
                    if (isHeader) {
                      return (
                        <div key={index} className="border-t border-b border-gray-300 dark:border-gray-600 my-2"></div>
                      );
                    }
                    
                    return (
                      <div key={index} className="grid grid-cols-5 gap-2 py-1 text-xs border-b border-gray-100 dark:border-gray-700">
                        {cells.map((cell, cellIndex) => (
                          <div key={cellIndex} className="p-1 font-medium">
                            {cell}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Handle numbered items (1., 2., etc.)
                  if (/^\d+\.$/.test(trimmedLine)) {
                    return (
                      <div key={index} className="ml-2 mb-3 mt-4">
                        <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">{trimmedLine}</span>
                      </div>
                    );
                  }
                  
                  // Handle bold company names (standalone lines with **)
                  if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
                    return (
                      <div key={index} className="ml-6 mb-3">
                        <span className="font-bold text-lg text-slate-800 dark:text-slate-200 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md">
                          {trimmedLine.replace(/\*\*/g, '')}
                        </span>
                      </div>
                    );
                  }
                  
                  // Handle inline bold text with ** (like **VitalityLife**)
                  if (trimmedLine.includes('**') && trimmedLine.length > 4) {
                    const boldText = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return (
                      <div key={index} className="ml-6 mb-2">
                        <span 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: boldText }}
                        />
                      </div>
                    );
                  }
                  
                  // Handle bullet points (•)
                  if (trimmedLine.startsWith('•')) {
                    return (
                      <div key={index} className="ml-8 mb-2 flex items-start">
                        <span className="mr-3 text-blue-600 dark:text-blue-400 font-bold text-lg">•</span>
                        <span className="text-sm leading-relaxed">{trimmedLine.substring(1).trim()}</span>
                      </div>
                    );
                  }
                  
                  // Handle bullet points (*)
                  if (trimmedLine.startsWith('*') && trimmedLine.length > 1 && !trimmedLine.startsWith('**')) {
                    return (
                      <div key={index} className="ml-8 mb-1 flex">
                        <span className="mr-3 text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span className="text-sm">{trimmedLine.substring(1).trim()}</span>
                      </div>
                    );
                  }
                  
                  // Handle regular paragraphs
                  if (trimmedLine) {
                    return (
                      <div key={index} className="mb-2 leading-relaxed text-sm">
                        {line}
                      </div>
                    );
                  }
                  
                  // Handle empty lines
                  return <div key={index} className="mb-1"></div>;
                })}
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs mt-2 ${
                  isAI ? 'text-slate-500 dark:text-slate-400' : 'text-blue-100'
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* Attachments */}
              {message.attachments && (
                <div className={`mt-2 text-xs ${
                  isAI ? 'text-slate-500' : 'text-blue-100'
                }`}>
                  📎 {message.attachments}
                </div>
              )}
            </div>

            {/* User Avatar */}
            {!isAI && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
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
