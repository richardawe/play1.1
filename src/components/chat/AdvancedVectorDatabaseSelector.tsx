// Advanced Vector Database Selector with File Browser
import { useState, useEffect } from 'react';
import { 
  Database, 
  FolderOpen, 
  FileText, 
  RefreshCw, 
  Plus,
  Search,
  Check
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface VectorDatabase {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  vectorCount: number;
  lastModified: string;
  size?: number;
}

interface AdvancedVectorDatabaseSelectorProps {
  onDatabaseSelect: (database: VectorDatabase) => void;
  selectedDatabase?: VectorDatabase;
}

export default function AdvancedVectorDatabaseSelector({ 
  onDatabaseSelect, 
  selectedDatabase 
}: AdvancedVectorDatabaseSelectorProps) {
  const [databases, setDatabases] = useState<VectorDatabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentDatabases, setRecentDatabases] = useState<VectorDatabase[]>([]);

  // Load available vector databases
  const loadDatabases = async () => {
    setLoading(true);
    try {
      // Get LanceDB stats to see current database
      const stats = await invoke<{ total_vectors: number; last_updated?: string }>('lancedb_get_stats');
      console.log('📊 Vector stats loaded:', stats);
      
      // Load recent databases from localStorage
      const recent = JSON.parse(localStorage.getItem('recentVectorDatabases') || '[]');
      setRecentDatabases(recent);
      
      // Create current database entry
      const currentDb: VectorDatabase = {
        id: 'current-database',
        name: 'Current Database',
        path: 'data/lancedb',
        type: 'folder',
        vectorCount: stats.total_vectors || 0,
        lastModified: stats.last_updated || new Date().toISOString()
      };
      
      // Filter out any existing current database entries to avoid duplicates
      const filteredRecent = recent.filter((db: VectorDatabase) => db.id !== 'current-database');
      
      // Always update with fresh stats
      setDatabases([currentDb, ...filteredRecent]);
    } catch (error) {
      console.error('Failed to load databases:', error);
      // Load from recent databases only
      const recent = JSON.parse(localStorage.getItem('recentVectorDatabases') || '[]');
      setRecentDatabases(recent);
      setDatabases(recent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
    
    // Auto-refresh vector count every 5 seconds
    const interval = setInterval(loadDatabases, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSelectDatabase = (database: VectorDatabase) => {
    onDatabaseSelect(database);
    setIsOpen(false);
    
    // Add to recent databases
    const recent = JSON.parse(localStorage.getItem('recentVectorDatabases') || '[]');
    const updatedRecent = [database, ...recent.filter((db: VectorDatabase) => db.id !== database.id)].slice(0, 5);
    localStorage.setItem('recentVectorDatabases', JSON.stringify(updatedRecent));
    setRecentDatabases(updatedRecent);
  };

  const handleRefresh = () => {
    loadDatabases();
  };

  const handleBrowseFiles = async () => {
    try {
      // Open file dialog to select database folder/file
      const selectedPath = await invoke<string>('select_database_path');
      if (selectedPath) {
        const newDb: VectorDatabase = {
          id: `db_${Date.now()}`,
          name: selectedPath.split('/').pop() || 'Selected Database',
          path: selectedPath,
          type: selectedPath.endsWith('.db') || selectedPath.endsWith('.sqlite') ? 'file' : 'folder',
          vectorCount: 0,
          lastModified: new Date().toISOString()
        };
        
        handleSelectDatabase(newDb);
      }
    } catch (error) {
      console.error('Failed to browse files:', error);
    }
  };

  const handleCreateNew = async () => {
    try {
      // Create a new vector database
      const newDb: VectorDatabase = {
        id: `db_${Date.now()}`,
        name: `Database ${databases.length + 1}`,
        path: `data/lancedb_${Date.now()}`,
        type: 'folder',
        vectorCount: 0,
        lastModified: new Date().toISOString()
      };
      
      setDatabases(prev => [...prev, newDb]);
      handleSelectDatabase(newDb);
    } catch (error) {
      console.error('Failed to create new database:', error);
    }
  };

  const filteredDatabases = databases.filter(db => 
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Database Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors min-w-0"
      >
        <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="text-left min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {selectedDatabase?.name || 'Select Database'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedDatabase?.vectorCount || 0} vectors
          </div>
        </div>
        <RefreshCw 
          className={`w-4 h-4 text-gray-400 flex-shrink-0 ${loading ? 'animate-spin' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Vector Databases
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBrowseFiles}
                  className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  title="Browse Files"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCreateNew}
                  className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  title="Create New"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search databases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Database List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredDatabases.map((database) => (
              <button
                key={database.id}
                onClick={() => handleSelectDatabase(database)}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                  selectedDatabase?.id === database.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {database.type === 'folder' ? (
                    <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {database.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {database.vectorCount} vectors • {database.type}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {database.path}
                  </div>
                </div>
                
                {selectedDatabase?.id === database.id && (
                  <div className="flex-shrink-0">
                    <Check className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {filteredDatabases.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No databases match your search' : 'No vector databases found'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateNew}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Create your first database
                </button>
              )}
            </div>
          )}
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Recent: {recentDatabases.length}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('recentVectorDatabases');
                  setRecentDatabases([]);
                  loadDatabases();
                }}
                className="text-red-500 hover:text-red-600"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
