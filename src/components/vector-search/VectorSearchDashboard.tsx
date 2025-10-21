import { useEffect, useState } from 'react';
import { useVectorSearchStore } from '../../store/useVectorSearchStore';
import { useCleaningStore } from '../../store/useCleaningStore';
import { listen } from '@tauri-apps/api/event';
import { 
  Search, 
  Database, 
  RefreshCw, 
  Trash2, 
  FileText, 
  TrendingUp,
  Activity,
  Zap,
  Target,
  Brain,
  Sparkles,
  X
} from 'lucide-react';

export default function VectorSearchDashboard() {
  const {
    searchResults,
    stats,
    loading,
    error,
    selectedEntry,
    searchSimilarContent,
    generateEmbedding,
    indexContent,
    deleteEntry,
    setSelectedEntry,
    refreshStats,
    checkOllamaConnection,
    getAllEntries,
    clearVectorDatabase,
    listOllamaModels,
  } = useVectorSearchStore();

  const {
    indexAllCleanedFilesWithProgress,
    vectorIndexingProgress,
    setVectorIndexingProgress,
    clearVectorIndexingProgress,
  } = useCleaningStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLimit, setSearchLimit] = useState(10);
  const [searchThreshold, setSearchThreshold] = useState(0.5);
  const [selectedModel, setSelectedModel] = useState('nomic-embed-text');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [embeddingText, setEmbeddingText] = useState('');
  const [indexContentText, setIndexContentText] = useState('');
  const [indexContentType] = useState('document');
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [showDatabaseViewer, setShowDatabaseViewer] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    // Load initial stats
    refreshStats();

    // Check Ollama connection and load models
    const checkConnectionAndLoadModels = async () => {
      try {
        const connected = await checkOllamaConnection();
        setOllamaConnected(connected);
        
        if (connected) {
          const models = await listOllamaModels();
          setAvailableModels(models);
          // Set default model to first available model or keep current
          if (models.length > 0 && !models.includes(selectedModel)) {
            setSelectedModel(models[0]);
          }
        }
      } catch (error) {
        console.error('Failed to check Ollama connection or load models:', error);
        setOllamaConnected(false);
      }
    };

    checkConnectionAndLoadModels();

    // Set up auto-refresh
    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshStats, checkOllamaConnection, listOllamaModels, selectedModel]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    console.log('Starting search with:', { searchQuery, searchLimit, searchThreshold, selectedModel });
    
    try {
      const results = await searchSimilarContent(searchQuery, searchLimit, searchThreshold, selectedModel);
      console.log('Search results received:', results);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vector entry?')) {
      try {
        await deleteEntry(id);
        await refreshStats();
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleGenerateEmbedding = async () => {
    if (!embeddingText.trim()) return;

    try {
      const embedding = await generateEmbedding(embeddingText, selectedModel);
      alert(`Generated ${embedding.length}-dimensional embedding successfully!`);
      setEmbeddingText('');
    } catch (error) {
      console.error('Error generating embedding:', error);
      alert('Failed to generate embedding. Please try again.');
    }
  };

  const handleIndexContent = async () => {
    if (!indexContentText.trim()) return;

    try {
      const entries = await indexContent(1, indexContentType, indexContentText, selectedModel);
      alert(`Successfully indexed content! Created ${entries.length} vector entries.`);
      setIndexContentText('');
      await refreshStats();
    } catch (error) {
      console.error('Error indexing content:', error);
      alert('Failed to index content. Please try again.');
    }
  };

  const handleIndexAllCleanedFiles = async () => {
    try {
      // Set up event listener for progress updates
      const unlisten = await listen('vector-indexing-progress', (event) => {
        const progress = event.payload as any;
        
        if (progress.type === 'started') {
          setVectorIndexingProgress({
            isProcessing: true,
            totalFiles: progress.total_files,
            processed: 0,
            failed: 0,
            progress: 0,
            estimatedRemaining: 0,
          });
        } else if (progress.type === 'progress') {
          setVectorIndexingProgress({
            isProcessing: true,
            totalFiles: progress.total_files,
            processed: progress.processed,
            failed: progress.failed,
            progress: progress.progress,
            estimatedRemaining: progress.estimated_remaining,
            currentFile: progress.current_file,
          });
        } else if (progress.type === 'completed') {
          setVectorIndexingProgress({
            isProcessing: false,
            totalFiles: progress.total_files,
            processed: progress.processed,
            failed: progress.failed,
            progress: 100,
            estimatedRemaining: 0,
          });
          // Auto-clear progress after 5 seconds
          setTimeout(() => clearVectorIndexingProgress(), 5000);
        }
      });

      await indexAllCleanedFilesWithProgress();
      await refreshStats();
      
      // Clean up listener
      unlisten();
      
      // Show completion message
      const progress = vectorIndexingProgress;
      if (progress) {
        alert(`Vector indexing completed!\n\n✅ Successfully indexed: ${progress.processed} files\n❌ Failed: ${progress.failed} files\n📊 Total time: ${progress.estimatedRemaining}s`);
      }
    } catch (err) {
      console.error('Error indexing all cleaned files:', err);
      clearVectorIndexingProgress();
    }
  };

  const handleCreateSampleData = async () => {
    try {
      const sampleTexts = [
        "Artificial intelligence is transforming the way we work and live. From machine learning algorithms to natural language processing, AI technologies are becoming increasingly sophisticated and integrated into our daily lives.",
        "Climate change represents one of the greatest challenges of our time. Rising global temperatures, melting ice caps, and extreme weather events are all indicators of the urgent need for environmental action and sustainable practices.",
        "The future of work is being reshaped by remote collaboration tools, automation, and digital transformation. Companies are adopting new technologies to improve productivity and enable flexible working arrangements.",
        "Space exploration continues to capture our imagination and drive scientific discovery. Recent missions to Mars, the James Webb Space Telescope, and plans for lunar bases represent humanity's ongoing quest to understand the cosmos.",
        "Renewable energy sources like solar and wind power are becoming increasingly cost-effective and widespread. This transition away from fossil fuels is essential for combating climate change and ensuring energy security."
      ];

      let totalEntries = 0;
      for (let i = 0; i < sampleTexts.length; i++) {
        try {
          const entries = await indexContent(i + 1, 'document', sampleTexts[i], selectedModel);
          totalEntries += entries.length;
        } catch (error) {
          console.error(`Error indexing sample text ${i + 1}:`, error);
        }
      }

      alert(`Successfully created ${totalEntries} sample vector entries! You can now search for content.`);
      await refreshStats();
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert('Failed to create sample data. Please try again.');
    }
  };

  const handleViewDatabase = async () => {
    try {
      const entries = await getAllEntries();
      setAllEntries(entries);
      setShowDatabaseViewer(true);
    } catch (error) {
      console.error('Error loading database entries:', error);
      alert('Failed to load database entries. Please try again.');
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('Are you sure you want to clear the entire vector database? This action cannot be undone.')) {
      try {
        const deletedCount = await clearVectorDatabase();
        alert(`Successfully cleared ${deletedCount} vector entries from the database.`);
        await refreshStats();
        setAllEntries([]);
        setShowDatabaseViewer(false);
      } catch (err) {
        console.error('Failed to clear vector database:', err);
        alert('Failed to clear vector database. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient flex items-center mb-2">
                  Vector Search Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Semantic search and content discovery using AI embeddings
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleIndexAllCleanedFiles}
                disabled={vectorIndexingProgress?.isProcessing}
                className="px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Database className="w-4 h-4 inline mr-2" />
                Index All Cleaned Files
              </button>
              
              <button
                onClick={handleClearDatabase}
                className="px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Clear Database
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  autoRefresh
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              <button
                onClick={refreshStats}
                className="group p-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
                title="Refresh stats"
              >
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </button>
              
              <button
                onClick={handleViewDatabase}
                className="group p-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
                title="View Vector Database"
              >
                <Database className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                <Database className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vectors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_vectors || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Models Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.models_used?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vector Dimension</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.average_vector_dimension || 384}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.last_updated ? new Date(stats.last_updated).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vector Indexing Progress Display */}
      {vectorIndexingProgress && (
        <div className="card-play border-0 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vector Indexing Progress
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {vectorIndexingProgress.isProcessing ? 'Processing files...' : 'Indexing completed!'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${vectorIndexingProgress.progress}%` }}
                />
              </div>
              
              {/* Progress Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{vectorIndexingProgress.progress}%</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Processed</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{vectorIndexingProgress.processed}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">{vectorIndexingProgress.failed}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">ETA</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {vectorIndexingProgress.estimatedRemaining > 0 
                      ? `${Math.round(vectorIndexingProgress.estimatedRemaining)}s`
                      : 'Complete'
                    }
                  </p>
                </div>
              </div>
              
              {/* Current File */}
              {vectorIndexingProgress.currentFile && (
                <div className="text-sm">
                  <p className="text-gray-600 dark:text-gray-400">Currently processing:</p>
                  <p className="font-mono text-gray-900 dark:text-white truncate">
                    {vectorIndexingProgress.currentFile}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ollama Connection Warning */}
      {ollamaConnected === false && (
        <div className="card-play border-0 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ollama Not Connected</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vector search requires Ollama to be running. Please start Ollama and ensure the nomic-embed-text model is available.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => checkOllamaConnection().then(setOllamaConnected)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Check Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {stats && stats.total_vectors === 0 && ollamaConnected !== false && (
        <div className="card-play border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Vector Data Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by indexing cleaned files from AI processing, or create sample data to test the vector search functionality.
            </p>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Tip:</strong> If you have processed files through AI Cleaning, go to the Cleanse tab and click "Vector Search" to automatically index all cleaned content for semantic search.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCreateSampleData}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Create Sample Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Semantic Search Section */}
      <div className="card-play border-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Semantic Search
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Query
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your search query..."
                  className="flex-1 px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Results Limit
                </label>
                <input
                  type="number"
                  value={searchLimit}
                  onChange={(e) => setSearchLimit(parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Similarity Threshold
                </label>
                <input
                  type="number"
                  value={searchThreshold}
                  onChange={(e) => setSearchThreshold(parseFloat(e.target.value) || 0.7)}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  disabled={!ollamaConnected || availableModels.length === 0}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {ollamaConnected === false ? 'Ollama not connected' : 'Loading models...'}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Embedding Section */}
      <div className="card-play border-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate Embedding
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text to Embed
              </label>
              <textarea
                value={embeddingText}
                onChange={(e) => setEmbeddingText(e.target.value)}
                placeholder="Enter text to generate embedding..."
                rows={4}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none"
              />
            </div>
            
            <button
              onClick={handleGenerateEmbedding}
              disabled={loading || !embeddingText.trim()}
              className="btn-primary flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Generate Embedding
            </button>
          </div>
        </div>
      </div>

      {/* Index Content Section */}
      <div className="card-play border-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Index Content
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content to Index
              </label>
              <textarea
                value={indexContentText}
                onChange={(e) => setIndexContentText(e.target.value)}
                placeholder="Enter content to index for vector search..."
                rows={4}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleIndexContent}
                disabled={loading || !indexContentText.trim()}
                className="btn-primary flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Index Content
              </button>
              
              <button
                onClick={handleCreateSampleData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Create Sample Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="card-play border-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Search Results ({searchResults.length})
            </h2>
            
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-lg">
                          {result.content_type}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-lg">
                          {(result.similarity_score * 100).toFixed(1)}% match
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                        Content ID: {result.content_id}
                      </p>
                      <div className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <strong>Content:</strong> {result.content?.substring(0, 200)}{result.content?.length > 200 ? '...' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(result.content_id)}
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vector Database Viewer */}
      {showDatabaseViewer && (
        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Vector Database ({allEntries.length} entries)
              </h2>
              <button
                onClick={() => setShowDatabaseViewer(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allEntries.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-lg">
                          {entry.content_type}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg">
                          ID: {entry.content_id}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-lg">
                          {entry.model_name}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Vector Dimension:</strong> {entry.embedding_vector?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <strong>Content:</strong> {entry.content?.substring(0, 150)}{entry.content?.length > 150 ? '...' : ''}
                      </div>
                      {entry.metadata && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Metadata:</strong> {entry.metadata}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {new Date(entry.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {allEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No vector entries found in the database.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card-play border-0 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}