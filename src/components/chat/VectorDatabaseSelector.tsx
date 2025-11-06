// Vector Database Selector Component
import { useState, useEffect } from 'react';
import { Database, FolderOpen, FileText, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface VectorDatabase {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  vectorCount: number;
  lastModified: string;
}

interface VectorDatabaseSelectorProps {
  onDatabaseSelect: (database: VectorDatabase) => void;
  selectedDatabase?: VectorDatabase;
}

export default function VectorDatabaseSelector({ 
  onDatabaseSelect, 
  selectedDatabase 
}: VectorDatabaseSelectorProps) {
  const [databases, setDatabases] = useState<VectorDatabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load available vector databases
  const loadDatabases = async () => {
    setLoading(true);
    try {
      // Get LanceDB stats to see current database
      const stats = await invoke<{ total_vectors: number; last_updated?: string }>('lancedb_get_stats');
      
      // For now, we'll create a default database entry
      // In the future, this could scan for multiple databases
      const defaultDb: VectorDatabase = {
        id: 'default',
        name: 'Default Vector Database',
        path: 'data/lancedb',
        type: 'folder',
        vectorCount: stats.total_vectors || 0,
        lastModified: stats.last_updated || new Date().toISOString()
      };
      
      setDatabases([defaultDb]);
    } catch (error) {
      console.error('Failed to load databases:', error);
      // Create empty database if none exists
      const emptyDb: VectorDatabase = {
        id: 'empty',
        name: 'Empty Database',
        path: 'data/lancedb',
        type: 'folder',
        vectorCount: 0,
        lastModified: new Date().toISOString()
      };
      setDatabases([emptyDb]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const handleSelectDatabase = (database: VectorDatabase) => {
    onDatabaseSelect(database);
    setIsOpen(false);
  };

  const handleRefresh = () => {
    loadDatabases();
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
      onDatabaseSelect(newDb);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create new database:', error);
    }
  };

  return (
    <div className="relative">
      {/* Database Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedDatabase?.name || 'Select Database'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedDatabase?.vectorCount || 0} vectors
          </div>
        </div>
        <RefreshCw 
          className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Vector Databases
              </h3>
              <button
                onClick={handleCreateNew}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                + New
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {databases.map((database) => (
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
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {database.path}
                  </div>
                </div>
                
                {selectedDatabase?.id === database.id && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {databases.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No vector databases found</p>
              <button
                onClick={handleCreateNew}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Create your first database
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


