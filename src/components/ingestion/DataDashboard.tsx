import { useEffect, useState } from 'react';
import { useIngestionStore, IngestionJob } from '../../store/useIngestionStore';
import DataIngestionWizard from './DataIngestionWizard';
import { 
  Database, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';

export default function DataDashboard() {
  const {
    jobs,
    stats,
    loading,
    error,
    selectedJob,
    startJob,
    cancelJob,
    deleteJob,
    setSelectedJob,
    refreshJobs,
    refreshStats,
  } = useIngestionStore();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Load initial data
    refreshJobs();
    refreshStats();

    // Set up auto-refresh for running jobs
    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshJobs();
        refreshStats();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshJobs, refreshStats]);

  const handleStartJob = async (job: IngestionJob) => {
    try {
      await startJob(job.id);
      await refreshJobs();
    } catch (err) {
      console.error('Error starting job:', err);
    }
  };

  const handleCancelJob = async (job: IngestionJob) => {
    try {
      await cancelJob(job.id);
      await refreshJobs();
    } catch (err) {
      console.error('Error cancelling job:', err);
    }
  };

  const handleDeleteJob = async (job: IngestionJob) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(job.id);
        await refreshJobs();
        if (selectedJob?.id === job.id) {
          setSelectedJob(null);
        }
      } catch (err) {
        console.error('Error deleting job:', err);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <Pause className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            Data Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your data imports and track processing status
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Data
          </button>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={refreshJobs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_jobs}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.completed_jobs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-gray-900">{stats.running_jobs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Files Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_files_processed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Import Jobs</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr 
                  key={job.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedJob?.id === job.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {job.source_path.split('/').pop() || job.source_path}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.job_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{job.progress.toFixed(1)}%</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.processed_files} / {job.total_files}
                    {job.error_count > 0 && (
                      <div className="text-xs text-red-600">
                        {job.error_count} errors
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.created_at)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {job.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartJob(job);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {job.status === 'running' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelJob(job);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No import jobs yet</h3>
            <p className="text-gray-600">Start by importing your data using the Import button above.</p>
          </div>
        )}
      </div>

      {/* Job Details Sidebar */}
      {selectedJob && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-40">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center">
                  {getStatusIcon(selectedJob.status)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Path</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {selectedJob.source_path}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${selectedJob.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{selectedJob.progress.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Files</label>
                  <p className="text-sm text-gray-900">{selectedJob.total_files}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processed</label>
                  <p className="text-sm text-gray-900">{selectedJob.processed_files}</p>
                </div>
              </div>
              
              {selectedJob.error_count > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Errors</label>
                  <p className="text-sm text-red-600">{selectedJob.error_count}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-900">{formatDate(selectedJob.created_at)}</p>
              </div>
              
              {selectedJob.started_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Started</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedJob.started_at)}</p>
                </div>
              )}
              
              {selectedJob.completed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedJob.completed_at)}</p>
                </div>
              )}
              
              {selectedJob.error_message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {selectedJob.error_message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Ingestion Wizard */}
      <DataIngestionWizard 
        isOpen={showWizard} 
        onClose={() => setShowWizard(false)} 
      />
    </div>
  );
}
