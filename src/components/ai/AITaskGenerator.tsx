// AI Task Generator - per prd.md AI features
import { useState } from 'react';
import { Brain, Loader2, X } from 'lucide-react';
import { aiAPI } from '../../lib/ai';
import { useTaskStore } from '../../store/useTaskStore';

interface AITaskGeneratorProps {
  onClose?: () => void;
}

export default function AITaskGenerator({ onClose }: AITaskGeneratorProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const { createTask } = useTaskStore();

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const tasks = await aiAPI.generateTasks(text);
      setGeneratedTasks(tasks);
    } catch (error) {
      console.error('Task generation failed:', error);
      alert('AI task generation failed. Make sure Ollama is running: ollama serve');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    for (const taskTitle of generatedTasks) {
      await createTask({
        title: taskTitle,
        description: `Generated from: ${text.substring(0, 100)}...`,
        status: 'todo',
        priority: 'medium',
        due_date: null,
        reminder_time: null,
      });
    }
    
    setGeneratedTasks([]);
    setText('');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold">AI Task Generator</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter text to extract tasks from:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste meeting notes, project description, or any text containing action items..."
              className="w-full p-3 border border-border rounded-lg bg-background resize-none"
              rows={6}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
            {loading ? 'Generating Tasks...' : 'Generate Tasks with AI'}
          </button>
        </div>

        {/* Generated Tasks */}
        {generatedTasks.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">Generated Tasks ({generatedTasks.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedTasks.map((task, index) => (
                <div key={index} className="p-3 bg-accent rounded-lg text-sm">
                  {task}
                </div>
              ))}
            </div>
            <button
              onClick={handleCreateTasks}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Add All Tasks to Board
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
          <p className="text-blue-700 dark:text-blue-300">
            <strong>💡 Tip:</strong> Make sure Ollama is running locally (<code>ollama serve</code>) and has the <code>llama3.2</code> model installed.
          </p>
        </div>
      </div>
    </div>
  );
}

