import { useState } from 'react';
import { GraduationCap, Lightbulb, MessageSquare, BookOpen, HelpCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api';

export function AIMentorChat() {
  const [activeMode, setActiveMode] = useState<'explain' | 'improve' | 'learn'>('explain');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'mentor'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const modes = [
    { id: 'explain' as const, name: 'Explain', icon: HelpCircle, description: 'Ask AI to explain concepts' },
    { id: 'improve' as const, name: 'Improve', icon: Lightbulb, description: 'Get prompt suggestions' },
    { id: 'learn' as const, name: 'Learn', icon: BookOpen, description: 'Learn about AI' },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Mentor'}: ${m.content}`)
        .join('\n');

      // Call AI mentor with Ollama
      const response = await invoke<string>('chat_with_mentor', {
        userMessage: input.trim(),
        mode: activeMode,
        conversationHistory,
      });

      const mentorResponse = {
        role: 'mentor' as const,
        content: response,
      };
      
      setMessages((prev) => [...prev, mentorResponse]);
      
      // Track usage
      await invoke('track_ai_feature_usage', {
        feature: `mentor_${activeMode}`,
      });
    } catch (error) {
      console.error('Failed to get AI mentor response:', error);
      const errorResponse = {
        role: 'mentor' as const,
        content: 'Sorry, I encountered an error. Please make sure Ollama is running and try again.',
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Learning Modes */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Mentor</h3>
        </div>

        <div className="space-y-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  activeMode === mode.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeMode === mode.id ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${activeMode === mode.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                    {mode.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Learning Progress */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
            Your Progress
          </h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-800 dark:text-blue-300">AI Literacy</span>
                <span className="text-blue-800 dark:text-blue-300">60%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {modes.find((m) => m.id === activeMode)?.name} Mode
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {modes.find((m) => m.id === activeMode)?.description}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <GraduationCap className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Ask the AI Mentor anything!</p>
                <p className="text-sm mt-1">Learn about AI, improve your prompts, or get explanations</p>
                <div className="mt-4 text-xs space-y-1 text-left max-w-md mx-auto">
                  <p className="text-gray-600 dark:text-gray-400">Try asking:</p>
                  <p className="text-gray-500 dark:text-gray-500">• "Explain how AI works"</p>
                  <p className="text-gray-500 dark:text-gray-500">• "How can I write better prompts?"</p>
                  <p className="text-gray-500 dark:text-gray-500">• "What is machine learning?"</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {message.role === 'mentor' && (
                    <div className="flex items-center gap-2 mb-2 opacity-75">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-xs font-medium">AI Mentor</span>
                    </div>
                  )}
                  <p className="break-words">{message.content}</p>
                </div>
              </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeMode === 'explain'
                  ? 'Ask me to explain something...'
                  : activeMode === 'improve'
                  ? 'Paste a prompt to improve...'
                  : 'What do you want to learn?'
              }
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Thinking...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Ask
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

