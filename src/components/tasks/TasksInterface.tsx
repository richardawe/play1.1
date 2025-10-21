// Tasks Interface - per prd.md §3️⃣.D
import { useState, useEffect } from 'react';
import { Plus, Brain, Trash2, Filter } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';
import AITaskGenerator from '../ai/AITaskGenerator';
import TaskFilters from './TaskFilters';
// import ClearWorkspaceButton from '../common/ClearWorkspaceButton';
import { useTaskStore } from '../../store/useTaskStore';
import { useTextSelection } from '../../hooks/useTextSelection';
import CrossModuleActions from '../common/CrossModuleActions';
import { invoke } from '@tauri-apps/api/tauri';

export default function TasksInterface() {
  const { loadTasks } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [filters, setFilters] = useState<{
    status: 'all' | 'todo' | 'in_progress' | 'done';
    priority: 'all' | 'low' | 'medium' | 'high';
  }>({
    status: 'all',
    priority: 'all',
  });

  // Enable text selection for cross-module actions
  useTextSelection({
    module: 'tasks',
    sourceType: 'tasks-interface'
  });

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleClearAll = async () => {
    await invoke('clear_all_tasks');
    await loadTasks();
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient flex items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mr-4 border border-violet-500/30">
                  <Plus className="w-5 h-5 text-violet-600" />
                </div>
                Task Board
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Organize your work with a kanban board
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Clear all tasks"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Clear All</span>
              </button>
              
              <button
                onClick={() => setShowAIGenerator(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 shadow-play">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-purple-900 dark:text-purple-100">AI Generate</span>
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>
            <TaskFilters currentFilter={filters} onFilterChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="card-play border-0 h-full">
          <div className="p-6 h-full">
            <div className="mb-4">
              <CrossModuleActions
                content=""
                module="tasks"
                variant="compact"
              />
            </div>
            <KanbanBoard filters={filters} />
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => setIsModalOpen(false)}
      />

      {/* AI Task Generator */}
      {showAIGenerator && (
        <AITaskGenerator onClose={() => setShowAIGenerator(false)} />
      )}
    </div>
  );
}