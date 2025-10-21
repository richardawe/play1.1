import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { useIngestionStore, CreateIngestionJob } from '../../store/useIngestionStore';
import { FolderOpen, FileText, Archive, Database, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DataIngestionWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'select' | 'configure' | 'processing' | 'complete';

export default function DataIngestionWizard({ isOpen, onClose }: DataIngestionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [jobType, setJobType] = useState<string>('folder');
  const [, setIsProcessing] = useState(false);
  const [createdJob, setCreatedJob] = useState<any>(null);

  const { createJob, startJob, loading, error } = useIngestionStore();

  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select folder to import',
      });

      if (selected && typeof selected === 'string') {
        setSelectedPath(selected);
        setCurrentStep('configure');
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
    }
  }, []);

  const handleSelectFile = useCallback(async () => {
    try {
      const selected = await open({
        filters: [
          {
            name: 'Archives',
            extensions: ['zip', 'tar', 'gz', '7z', 'rar']
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ],
        multiple: false,
        title: 'Select file to import',
      });

      if (selected && typeof selected === 'string') {
        setSelectedPath(selected);
        setJobType('file');
        setCurrentStep('configure');
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  }, []);

  const handleStartImport = useCallback(async () => {
    try {
      setIsProcessing(true);
      setCurrentStep('processing');

      const jobData: CreateIngestionJob = {
        source_path: selectedPath,
        job_type: jobType,
      };

      const job = await createJob(jobData);
      setCreatedJob(job);

      // Start the job
      await startJob(job.id);

      setCurrentStep('complete');
    } catch (err) {
      console.error('Error starting import:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPath, jobType, createJob, startJob]);

  const handleClose = useCallback(() => {
    setCurrentStep('select');
    setSelectedPath('');
    setJobType('folder');
    setIsProcessing(false);
    setCreatedJob(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Import Your Data</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { key: 'select', label: 'Select Source', icon: FolderOpen },
                { key: 'configure', label: 'Configure', icon: FileText },
                { key: 'processing', label: 'Processing', icon: Loader2 },
                { key: 'complete', label: 'Complete', icon: CheckCircle },
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.key;
                const isCompleted = ['select', 'configure', 'processing', 'complete'].indexOf(currentStep) > index;
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive || isCompleted 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {index < 3 && (
                      <div className={`w-8 h-0.5 mx-4 ${
                        isCompleted ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[300px]">
            {currentStep === 'select' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Choose Your Data Source
                </h3>
                <p className="text-gray-600 mb-8">
                  Select a folder or archive file to import into Play. We'll automatically 
                  process and organize your content.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleSelectFolder}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <FolderOpen className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">Import Folder</h4>
                    <p className="text-sm text-gray-600">
                      Import all files from a directory
                    </p>
                  </button>
                  
                  <button
                    onClick={handleSelectFile}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <Archive className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">Import Archive</h4>
                    <p className="text-sm text-gray-600">
                      Import from ZIP, TAR, or other archive files
                    </p>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'configure' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configure Import
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Path
                    </label>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <div className="flex items-center">
                        <Database className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600 font-mono">{selectedPath}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Import Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="folder">Folder Import</option>
                      <option value="file">Archive Import</option>
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Files will be scanned and indexed</li>
                      <li>• Metadata will be extracted automatically</li>
                      <li>• Content will be made searchable</li>
                      <li>• You can track progress in real-time</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setCurrentStep('select')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartImport}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Starting...' : 'Start Import'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="text-center">
                <div className="mb-6">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Processing Your Data
                  </h3>
                  <p className="text-gray-600">
                    We're importing and organizing your files. This may take a few minutes.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  You can close this dialog and check the progress in the Data Dashboard.
                </p>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Import Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your data has been successfully imported and is now available in Play.
                </p>
                
                {createdJob && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-green-900 mb-2">Import Summary</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>• Job ID: {createdJob.id}</p>
                      <p>• Source: {createdJob.source_path}</p>
                      <p>• Status: {createdJob.status}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
