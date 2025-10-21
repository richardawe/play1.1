// First Run Setup - Auto-download Ollama + models
import { useState, useEffect } from 'react';
import { Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface SetupStatus {
  ollama_installed: boolean;
  models_installed: string[];
  ollama_running: boolean;
}

export default function FirstRunSetup({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const result = await invoke<SetupStatus>('check_setup_status');
      setStatus(result);
      
      // If everything is ready, skip setup
      if (result.ollama_installed && 
          result.models_installed.includes('llama3.2') && 
          result.models_installed.includes('nomic-embed-text') &&
          result.ollama_running) {
        onComplete();
      }
    } catch (error) {
      console.error('Setup check failed:', error);
      setStatus({
        ollama_installed: false,
        models_installed: [],
        ollama_running: false,
      });
    }
  };

  const handleAutoSetup = async () => {
    setInstalling(true);
    setError('');

    try {
      let needsReload = false;

      // Step 1: Install Ollama if needed
      if (!status?.ollama_installed) {
        setProgress('📥 Downloading Ollama... (50MB, ~30 seconds)');
        await invoke('install_ollama');
        setProgress('✅ Ollama installed');
        needsReload = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Start Ollama if not running
      if (!status?.ollama_running) {
        setProgress('🚀 Starting Ollama service...');
        try {
          await invoke('start_ollama');
          setProgress('✅ Ollama started');
          needsReload = true;
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (err) {
          // If auto-start fails, provide instructions
          setError('Please start Ollama manually in a terminal: ollama serve');
          return;
        }
      }

      // Step 3: Download missing models only
      const installedModels = status?.models_installed || [];
      
      // Smart model detection - check if similar models exist
      const hasLlama = installedModels.some(m => 
        m.includes('llama3.2') || m.includes('llama3') || m.includes('llama')
      );
      const hasEmbed = installedModels.some(m => 
        m.includes('nomic-embed') || m.includes('embed')
      );

      const modelsToDownload = [];
      if (!hasLlama) modelsToDownload.push('llama3.2');
      if (!hasEmbed) modelsToDownload.push('nomic-embed-text');

      if (modelsToDownload.length === 0) {
        setProgress('✅ All models already installed!');
      } else {
        for (const model of modelsToDownload) {
          const size = model === 'llama3.2' ? '2.0GB' : '274MB';
          setProgress(`📥 Downloading ${model}... (${size}, ~1-2 minutes)`);
          await invoke('download_model', { model });
          setProgress(`✅ ${model} downloaded`);
          needsReload = true;
        }
      }

      // Step 4: Complete
      if (needsReload) {
        setProgress('🔄 Refreshing setup...');
        await checkSetup();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setProgress('✅ Setup complete! Launching app...');
      localStorage.setItem('play_skip_setup', 'true');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();
    } catch (err) {
      console.error('Auto setup failed:', err);
      setError(String(err));
      setInstalling(false);
    }
  };

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if all requirements met
  const allReady = status.ollama_running && (
    status.models_installed.includes('llama3.2') || 
    status.models_installed.includes('llama3') ||
    status.models_installed.length >= 2 // Has at least 2 models
  );

  if (allReady && !installing) {
    // Everything ready, skip setup screen automatically
    setTimeout(() => onComplete(), 500);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">▶️ Play</h1>
          <p className="text-muted-foreground">Starting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">▶️ Play</h1>
          <p className="text-xl text-muted-foreground">Offline AI Workspace</p>
        </div>

        {/* Setup Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Welcome! Let's set up your AI workspace</h2>

          {/* Status Checklist */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              {status.ollama_installed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span>Ollama Runtime {status.ollama_installed && '✅'}</span>
              {!status.ollama_installed && <span className="text-xs text-muted-foreground">(50MB)</span>}
            </div>

            <div className="flex items-center gap-3">
              {status.models_installed.includes('llama3.2') ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span>llama3.2 AI Model {status.models_installed.includes('llama3.2') && '✅'}</span>
              {!status.models_installed.includes('llama3.2') && (
                <span className="text-xs text-muted-foreground">(2.0GB)</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {status.models_installed.includes('nomic-embed-text') ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span>nomic-embed-text Model {status.models_installed.includes('nomic-embed-text') && '✅'}</span>
              {!status.models_installed.includes('nomic-embed-text') && (
                <span className="text-xs text-muted-foreground">(274MB)</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {status.ollama_running ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
              <span>Ollama Service {status.ollama_running && '✅'}</span>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm">{progress}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Setup failed:</p>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAutoSetup}
            disabled={installing}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-lg font-medium"
          >
            {installing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Download className="w-6 h-6" />
            )}
            {installing ? 'Setting up...' : 'Auto Setup (One-Click Install)'}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-accent rounded-lg text-sm space-y-2">
            <p className="font-medium">What happens:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Downloads Ollama if needed (~50MB)</li>
              <li>✓ Downloads AI models if needed (~2.3GB)</li>
              <li>✓ Everything installs automatically</li>
              <li>✓ Takes 2-5 minutes depending on internet speed</li>
            </ul>
            <p className="text-xs mt-3">
              <strong>Privacy:</strong> All downloads are official Ollama releases. 
              After setup, the app works 100% offline.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                checkSetup();
              }}
              className="flex-1 px-4 py-2 border border-border hover:bg-accent rounded-lg text-sm"
            >
              Refresh Status
            </button>
            <button
              onClick={() => {
                localStorage.setItem('play_skip_setup', 'true');
                onComplete();
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium"
            >
              Skip Setup (Use Current Ollama)
            </button>
          </div>

          {/* Manual Setup Instructions */}
          <details className="mt-4">
            <summary className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              Manual Setup Instructions
            </summary>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs">
              <code className="block bg-background p-2 rounded space-y-1">
                <div>brew install ollama</div>
                <div>ollama serve</div>
                <div>ollama pull llama3.2</div>
                <div>ollama pull nomic-embed-text</div>
              </code>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          Play v1.0.0 | 100% Offline & Private
        </div>
      </div>
    </div>
  );
}

