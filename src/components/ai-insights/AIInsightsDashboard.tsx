import { useEffect, useState } from 'react';
import { useAIInsightsStore } from '../../store/useAIInsightsStore';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Eye, 
  EyeOff, 
  Trash2, 
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function AIInsightsDashboard() {
  const {
    insights,
    recommendations,
    stats,
    loading,
    error,
    selectedInsight,
    contentAnalysis,
    realTimeAnalysis,
    generateInsights,
    generateContentRecommendations,
    analyzeContentPatterns,
    getRealTimeAnalysis,
    clearAllInsights,
    cleanCorruptedInsights,
    markInsightRead,
    deleteInsight,
    setSelectedInsight,
    refreshInsights,
    refreshStats,
    refreshRecommendations,
  } = useAIInsightsStore();

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'analysis' | 'realtime'>('insights');

  useEffect(() => {
    // Load initial data
    refreshInsights();
    refreshStats();
    refreshRecommendations();
    analyzeContentPatterns();

    // Set up auto-refresh
    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshStats();
        if (activeTab === 'insights') {
          refreshInsights();
        } else if (activeTab === 'recommendations') {
          refreshRecommendations();
        } else if (activeTab === 'analysis') {
          analyzeContentPatterns();
        } else if (activeTab === 'realtime') {
          getRealTimeAnalysis();
        }
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, refreshInsights, refreshStats, refreshRecommendations, analyzeContentPatterns, getRealTimeAnalysis]);

  const handleGenerateInsights = async () => {
    try {
      await generateInsights();
      await refreshStats();
    } catch (err) {
      console.error('Error generating insights:', err);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      await generateContentRecommendations(undefined, 10);
    } catch (err) {
      console.error('Error generating recommendations:', err);
    }
  };

  const handleRealTimeAnalysis = async () => {
    try {
      await getRealTimeAnalysis();
    } catch (err) {
      console.error('Error getting real-time analysis:', err);
    }
  };

  const handleClearAllInsights = async () => {
    if (window.confirm('Are you sure you want to clear all insights? This action cannot be undone.')) {
      try {
        const deletedCount = await clearAllInsights();
        await refreshStats();
        console.log(`Cleared ${deletedCount} insights`);
      } catch (err) {
        console.error('Error clearing insights:', err);
      }
    }
  };

  const handleCleanCorruptedInsights = async () => {
    if (window.confirm('Clean corrupted insights with unrealistic percentages (like 443.6%)? This will remove only the corrupted data.')) {
      try {
        const deletedCount = await cleanCorruptedInsights();
        await refreshInsights();
        await refreshStats();
        console.log(`Cleaned ${deletedCount} corrupted insights`);
      } catch (err) {
        console.error('Error cleaning corrupted insights:', err);
      }
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markInsightRead(id);
      await refreshStats();
    } catch (err) {
      console.error('Error marking insight as read:', err);
    }
  };

  const handleDeleteInsight = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this insight?')) {
      try {
        await deleteInsight(id);
        await refreshStats();
        if (selectedInsight?.id === id) {
          setSelectedInsight(null);
        }
      } catch (err) {
        console.error('Error deleting insight:', err);
      }
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 2: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 3: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 4: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
  };

  const filteredInsights = showUnreadOnly 
    ? insights.filter(insight => !insight.is_read)
    : insights;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient flex items-center mb-2">
                  AI Insights Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  AI-powered insights and recommendations for your content
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  showUnreadOnly
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {showUnreadOnly ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showUnreadOnly ? 'Show All' : 'Unread Only'}
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
                onClick={handleGenerateInsights}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Insights
              </button>
              
              {insights.length > 0 && (
                <button
                  onClick={handleCleanCorruptedInsights}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Clean Corrupted
                </button>
              )}
              
              {insights.length > 0 && (
                <button
                  onClick={handleClearAllInsights}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Insights</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_insights || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.unread_insights || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/30">
                <Star className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.high_priority_insights || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round((stats?.average_confidence || 0) * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
            {[
              { id: 'insights', label: 'Insights', icon: Brain },
              { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
              { id: 'analysis', label: 'Content Analysis', icon: BarChart3 },
              { id: 'realtime', label: 'Real-Time', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-play-glow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'insights' && (
        <div className="card-play border-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Insights ({filteredInsights.length})
            </h2>
            
            {filteredInsights.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No insights yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Generate insights to get AI-powered analysis of your content</p>
                <button
                  onClick={handleGenerateInsights}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Insights
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
                      insight.is_read 
                        ? 'bg-white/30 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50' 
                        : 'bg-white/40 dark:bg-gray-800/40 border-purple-200/50 dark:border-purple-700/50 shadow-play-glow'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                          </div>
                          {!insight.is_read && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs font-medium rounded-lg">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                          {insight.description}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(insight.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getPriorityColor(insight.priority)}`}>
                            Priority {insight.priority}
                          </span>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getConfidenceColor(insight.confidence)}`}>
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!insight.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(insight.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInsight(insight.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete insight"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Recommendations ({recommendations.length})
              </h2>
              <button
                onClick={handleGenerateRecommendations}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Recommendations
              </button>
            </div>
            
            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                  <Lightbulb className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Generate AI-powered recommendations based on your content</p>
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI Recommendations
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-6 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30 flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{rec.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                          {rec.reason}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-lg">
                            {rec.content_type}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-lg">
                            {rec.recommendation_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Content Analysis
              </h2>
              <button
                onClick={() => analyzeContentPatterns()}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Refresh Analysis
              </button>
            </div>
            
            {contentAnalysis ? (
              <div className="space-y-6">
                {/* Main Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Total Documents</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentAnalysis.totalDocuments || 0}</p>
                  </div>
                  
                  <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Content Quality</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentAnalysis.qualityScore || 0}%</p>
                  </div>
                  
                  <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Completeness</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentAnalysis.completenessScore || 0}%</p>
                  </div>
                  
                  <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Processing Success</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{contentAnalysis.processing_stats?.success_rate || 0}%</p>
                  </div>
                </div>
                
                {/* Content Type Distribution */}
                {contentAnalysis.content_types && Object.keys(contentAnalysis.content_types).length > 0 && (
                  <div className="card-play border-0">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Content Type Distribution
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(contentAnalysis.content_types).map(([type, count]) => (
                          <div key={type} className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type.replace('_', ' ')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{count as number}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Processing Statistics */}
                {contentAnalysis.processing_stats && (
                  <div className="card-play border-0">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Processing Statistics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{contentAnalysis.processing_stats.total_tasks || 0}</p>
                        </div>
                        <div className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                          <p className="text-xl font-bold text-green-600">{contentAnalysis.processing_stats.completed_tasks || 0}</p>
                        </div>
                        <div className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                          <p className="text-xl font-bold text-red-600">{contentAnalysis.processing_stats.failed_tasks || 0}</p>
                        </div>
                        <div className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                          <p className="text-xl font-bold text-yellow-600">{contentAnalysis.processing_stats.pending_tasks || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity Trends */}
                <div className="card-play border-0">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Recent Activity Trends
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Documents (7 days)</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{contentAnalysis.recentDocuments || 0}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Messages (7 days)</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{contentAnalysis.recentMessages || 0}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{contentAnalysis.totalDocuments || 0}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Target className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{contentAnalysis.totalMessages || 0}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No analysis data</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Analyze your content to get detailed insights and metrics</p>
                <button
                  onClick={() => analyzeContentPatterns()}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <BarChart3 className="w-4 h-4" />
                  Generate Content Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'realtime' && (
        <div className="card-play border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Real-Time Analysis
              </h2>
              <button
                onClick={handleRealTimeAnalysis}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Refresh Analysis
              </button>
            </div>
            
            {realTimeAnalysis ? (
              <div className="space-y-6">
                {/* Timestamp */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-200/30 dark:border-purple-700/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Analysis</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(realTimeAnalysis.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Recent Insights */}
                {realTimeAnalysis.recent_insights && realTimeAnalysis.recent_insights.length > 0 && (
                  <div className="card-play border-0">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        Recent Insights
                      </h3>
                      <div className="space-y-3">
                        {realTimeAnalysis.recent_insights.map((insight: any, index: number) => (
                          <div key={index} className="p-4 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getConfidenceColor(insight.confidence)}`}>
                                {Math.round(insight.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Recommendations */}
                {realTimeAnalysis.recent_recommendations && realTimeAnalysis.recent_recommendations.length > 0 && (
                  <div className="card-play border-0">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Recent Recommendations
                      </h3>
                      <div className="space-y-3">
                        {realTimeAnalysis.recent_recommendations.map((rec: any, index: number) => (
                          <div key={index} className="p-4 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                              <span className="px-2 py-1 text-xs font-medium rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                                {rec.recommendation_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                            <div className="mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Relevance: {Math.round(rec.relevance_score * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Summary */}
                {realTimeAnalysis.analysis && (
                  <div className="card-play border-0">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        Analysis Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeAnalysis.analysis.content_counts?.total_documents || 0}</p>
                        </div>
                        <div className="p-4 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Quality Score</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeAnalysis.analysis.qualityScore || 0}%</p>
                        </div>
                        <div className="p-4 bg-white/20 dark:bg-gray-800/20 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Processing Success</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeAnalysis.analysis.processing_stats?.success_rate || 0}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No real-time data</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Get live analysis of your content and AI insights</p>
                <button
                  onClick={handleRealTimeAnalysis}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Real-Time Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card-play border-0 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}