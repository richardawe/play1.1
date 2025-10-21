import { useEffect, useState } from 'react';
import { useCleaningStore, CleaningTask } from '../../store/useCleaningStore';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Activity,
  Zap,
  Brain,
  FolderOpen,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function CleaningDashboard() {
  const {
    stats,
    loading,
    error,
    selectedTask,
    processPendingTasksWithProgress,
    deleteTask,
    deleteAllTasks,
    setSelectedTask,
    refreshTasks,
    refreshStats,
    createTasksForFiles,
    getOutputDirectory,
    indexAllCleanedFiles,
    fixTasksWithoutInputContent,
    // Progress tracking
    processingProgress,
    setProcessingProgress,
    clearProcessingProgress,
    // Pagination and filtering
    currentPage,
    pageSize,
    totalTasks,
    statusFilter,
    taskTypeFilter,
    searchQuery,
    setCurrentPage,
    setPageSize,
    setStatusFilter,
    setTaskTypeFilter,
    setSearchQuery,
    // getFilteredTasks,
    getPaginatedTasks,
  } = useCleaningStore();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    refreshTasks();
    refreshStats();

    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshTasks();
        refreshStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshTasks, refreshStats]);

  const handleProcessAll = async () => {
    try {
      // Start listening for progress events
      const unlisten = await listen('cleaning-progress', (event) => {
        const progress = event.payload as any;
        if (progress.type === 'started') {
          setProcessingProgress({
            isProcessing: true,
            totalTasks: progress.total_tasks,
            processed: progress.processed,
            failed: progress.failed,
            progress: progress.progress,
            estimatedRemaining: progress.estimated_remaining,
          });
        } else if (progress.type === 'progress') {
          setProcessingProgress({
            isProcessing: true,
            totalTasks: progress.total_tasks,
            processed: progress.processed,
            failed: progress.failed,
            progress: progress.progress,
            estimatedRemaining: progress.estimated_remaining,
            currentTaskId: progress.current_task_id,
          });
        } else if (progress.type === 'completed') {
          setProcessingProgress({
            isProcessing: false,
            totalTasks: progress.total_tasks,
            processed: progress.processed,
            failed: progress.failed,
            progress: 100,
            estimatedRemaining: 0,
          });
          // Auto-clear progress after 5 seconds
          setTimeout(() => clearProcessingProgress(), 5000);
        }
      });

      await processPendingTasksWithProgress();
      await refreshTasks();
      
      // Clean up listener
      unlisten();
      
      // Show completion message
      const progress = processingProgress;
      if (progress) {
        alert(`Processing completed!\n\n✅ Successfully processed: ${progress.processed}\n❌ Failed: ${progress.failed}\n📊 Total time: ${progress.estimatedRemaining}s`);
      }
    } catch (err) {
      console.error('Error processing all tasks:', err);
      clearProcessingProgress();
    }
  };

  const handleCreateTasks = async () => {
    try {
      const count = await createTasksForFiles();
      alert(`Created ${count} cleaning tasks for existing files`);
    } catch (error) {
      console.error('Error creating tasks:', error);
    }
  };

  const handleFixTasks = async () => {
    try {
      const fixedCount = await fixTasksWithoutInputContent();
      alert(`Fixed ${fixedCount} tasks that were missing input content`);
      await refreshTasks();
      await refreshStats();
    } catch (error) {
      console.error('Error fixing tasks:', error);
    }
  };

  const handleShowOutputDirectory = async () => {
    try {
      const path = await getOutputDirectory();
      alert(`Cleaned files are saved to:\n${path}\n\nFiles are organized by task type:\n- text_cleanup/\n- metadata_extraction/\n- format_conversion/`);
    } catch (error) {
      console.error('Error getting output directory:', error);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await invoke('trigger_insight_generation');
      alert('AI insights generated successfully! Check the AI Insights tab to view them.');
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights. Please try again.');
    }
  };

  const handleIndexForVectorSearch = async () => {
    try {
      const results = await indexAllCleanedFiles();
      const successCount = results.filter(r => r.startsWith('Indexed')).length;
      const failCount = results.filter(r => r.startsWith('Failed')).length;
      
      let message = `Vector indexing completed!\n\n`;
      message += `✅ Successfully indexed: ${successCount} files\n`;
      if (failCount > 0) {
        message += `❌ Failed to index: ${failCount} files\n`;
      }
      message += `\nYou can now search for content in the Vector Search tab!`;
      
      alert(message);
    } catch (error) {
      console.error('Error indexing cleaned files:', error);
      alert('Failed to index cleaned files for vector search. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL cleaning tasks? This action cannot be undone.')) {
      try {
        const count = await deleteAllTasks();
        alert(`Successfully deleted ${count} cleaning tasks`);
      } catch (error) {
        console.error('Error deleting all tasks:', error);
        alert('Failed to delete all tasks. Please try again.');
      }
    }
  };

  const handleDeleteTask = async (task: CleaningTask) => {
    if (window.confirm('Are you sure you want to delete this cleaning task?')) {
      try {
        await deleteTask(task.id);
        await refreshTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'text_cleanup':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'metadata_extraction':
        return <Brain className="w-4 h-4 text-green-500" />;
      case 'format_conversion':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTaskTypeLabel = (taskType: string): string => {
    switch (taskType) {
      case 'text_cleanup':
        return 'Text Cleanup';
      case 'metadata_extraction':
        return 'Metadata Extraction';
      case 'format_conversion':
        return 'Format Conversion';
      default:
        return taskType;
    }
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt || !completedAt) return '0s';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="card-play border-0 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient flex items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mr-4 border border-purple-500/30">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                AI Cleaning Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                AI-powered content cleaning and normalization
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-refresh</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                    autoRefresh ? 'bg-gradient-to-r from-indigo-500 to-teal-500 shadow-play-glow' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-200 ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <button
                onClick={() => {
                  refreshTasks();
                  refreshStats();
                }}
                className="btn-primary flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card-play border-0 mb-6">
        <div className="p-6">
          <nav className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-play-glow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-play-glow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tasks ({totalTasks})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="card-play border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
            <div className="p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700 dark:text-red-400 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-play">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <button
                    onClick={handleCreateTasks}
                    disabled={loading}
                    className="group p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-3 shadow-play">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-blue-900 dark:text-blue-100">Create Tasks</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Generate cleaning tasks for imported files</p>
                  </button>

                  <button
                    onClick={handleProcessAll}
                    disabled={loading || (stats?.pending_tasks || 0) === 0}
                    className="group p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3 shadow-play">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-purple-900 dark:text-purple-100">Process All</span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{stats?.pending_tasks || 0} pending tasks</p>
                  </button>

                  <button
                    onClick={handleFixTasks}
                    disabled={loading}
                    className="group p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mr-3 shadow-play">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-orange-900 dark:text-orange-100">Fix Tasks</span>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Fix tasks missing input content</p>
                  </button>

                  {/* Progress Display */}
                  {processingProgress && processingProgress.isProcessing && (
                    <div className="col-span-2 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-3 shadow-play">
                          <Activity className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Processing Tasks</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {processingProgress.processed + processingProgress.failed} / {processingProgress.totalTasks} completed
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-2">
                          <span>Progress</span>
                          <span>{processingProgress.progress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${processingProgress.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-green-600 dark:text-green-400 font-semibold">{processingProgress.processed}</div>
                          <div className="text-blue-600 dark:text-blue-400">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-600 dark:text-red-400 font-semibold">{processingProgress.failed}</div>
                          <div className="text-blue-600 dark:text-blue-400">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-orange-600 dark:text-orange-400 font-semibold">
                            {processingProgress.estimatedRemaining > 60 
                              ? `${Math.floor(processingProgress.estimatedRemaining / 60)}m ${processingProgress.estimatedRemaining % 60}s`
                              : `${processingProgress.estimatedRemaining}s`
                            }
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">ETA</div>
                        </div>
                      </div>
                      
                      {processingProgress.currentTaskId && (
                        <div className="mt-4 text-xs text-blue-600 dark:text-blue-400">
                          Currently processing task #{processingProgress.currentTaskId}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleShowOutputDirectory}
                    className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95 text-left"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mr-3 shadow-play">
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-green-900 dark:text-green-100">Output Folder</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">View cleaned files location</p>
                  </button>

                  <button
                    onClick={handleGenerateInsights}
                    className="group p-6 bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-indigo-900/20 dark:to-teal-900/20 border border-indigo-200/50 dark:border-indigo-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95 text-left"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center mr-3 shadow-play">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-indigo-900 dark:text-indigo-100">AI Insights</span>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Generate content analysis</p>
                  </button>

                  <button
                    onClick={handleIndexForVectorSearch}
                    disabled={loading}
                    className="group p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-700/50 rounded-xl hover:shadow-play-lg transition-all duration-200 hover:scale-105 active:scale-95 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mr-3 shadow-play">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-violet-900 dark:text-violet-100">Vector Search</span>
                    </div>
                    <p className="text-sm text-violet-700 dark:text-violet-300">Index cleaned files for search</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_tasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <RefreshCw className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Running</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.running_tasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completed_tasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.failed_tasks}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {getPaginatedTasks().slice(0, 5).map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(task.status)}
                        {getTaskTypeIcon(task.task_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getTaskTypeLabel(task.task_type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            File ID: {task.file_id} • Priority: {task.priority}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatDate(task.created_at)}</p>
                        <p className="text-sm text-gray-500">
                          {formatDuration(task.started_at, task.completed_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Management Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Task Management</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                    <select
                      value={taskTypeFilter}
                      onChange={(e) => setTaskTypeFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="text_cleanup">Text Cleanup</option>
                      <option value="metadata_extraction">Metadata Extraction</option>
                      <option value="format_conversion">Format Conversion</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Pagination Info */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalTasks)} of {totalTasks}
                </span>
                
                {totalTasks > pageSize && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(totalTasks / pageSize)}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(totalTasks / pageSize), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(totalTasks / pageSize)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedTasks().map((task) => (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedTask?.id === task.id ? 'bg-purple-50' : ''
                        }`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(task.status)}
                            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                              {task.status}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTaskTypeIcon(task.task_type)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getTaskTypeLabel(task.task_type)}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {task.priority}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.file_id}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(task.created_at)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(task.started_at, task.completed_at)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {getPaginatedTasks().length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No tasks found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters or create new tasks</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Task Details Sidebar */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center">
                  {getStatusIcon(selectedTask.status)}
                  <span className="ml-2 text-sm text-gray-900 capitalize">{selectedTask.status}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                <div className="flex items-center">
                  {getTaskTypeIcon(selectedTask.task_type)}
                  <span className="ml-2 text-sm text-gray-900">{getTaskTypeLabel(selectedTask.task_type)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <span className="text-sm text-gray-900">{selectedTask.priority}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File ID</label>
                <span className="text-sm text-gray-900">{selectedTask.file_id}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <span className="text-sm text-gray-900">{formatDate(selectedTask.created_at)}</span>
              </div>
              
              {selectedTask.started_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Started</label>
                  <span className="text-sm text-gray-900">{formatDate(selectedTask.started_at)}</span>
                </div>
              )}
              
              {selectedTask.completed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
                  <span className="text-sm text-gray-900">{formatDate(selectedTask.completed_at)}</span>
                </div>
              )}
              
              {selectedTask.input_content && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Input Content</label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTask.input_content.substring(0, 500)}
                      {selectedTask.input_content.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedTask.output_content && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Content</label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTask.output_content.substring(0, 500)}
                      {selectedTask.output_content.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedTask.error_message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{selectedTask.error_message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}