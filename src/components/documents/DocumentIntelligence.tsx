import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Brain, Tag, FileText, Search, BarChart3, Sparkles, Loader2 } from 'lucide-react';

interface DocumentIntelligenceStats {
  total_documents_processed: number;
  vector_dimensions: number;
  models_used: string[];
  last_updated?: string;
}

interface SimilarityResult {
  content_id: number;
  content_type: string;
  content: string;
  similarity_score: number;
  metadata?: string;
}

export default function DocumentIntelligence() {
  const [stats, setStats] = useState<DocumentIntelligenceStats | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [testContent, setTestContent] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [relatedDocs, setRelatedDocs] = useState<SimilarityResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await invoke<DocumentIntelligenceStats>('get_document_intelligence_stats');
      setStats(stats);
    } catch (error) {
      console.error('Failed to load intelligence stats:', error);
    }
  };

  const handleProcessAllDocuments = async () => {
    setProcessing(true);
    try {
      const count = await invoke<number>('process_all_documents_intelligence');
      setProcessingCount(count);
      await loadStats();
    } catch (error) {
      console.error('Failed to process documents:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoTag = async () => {
    if (!testContent.trim()) return;

    setLoading(true);
    try {
      const tags = await invoke<string[]>('auto_tag_document', {
        content: testContent
      });
      setAutoTags(tags);
    } catch (error) {
      console.error('Auto-tagging failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!testContent.trim()) return;

    setLoading(true);
    try {
      const summary = await invoke<string>('summarize_document', {
        content: testContent
      });
      setSummary(summary);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindRelated = async () => {
    if (!testContent.trim()) return;

    setLoading(true);
    try {
      const related = await invoke<SimilarityResult[]>('find_related_documents', {
        documentId: Date.now(), // Use timestamp as document ID for testing
        limit: 5
      });
      setRelatedDocs(related);
    } catch (error) {
      console.error('Related documents search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Document Intelligence</h2>
        </div>
        <button
          onClick={handleProcessAllDocuments}
          disabled={processing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Process All Documents</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Documents Processed</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.total_documents_processed || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Vector Dimensions</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.vector_dimensions || 384}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Models Used</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats?.models_used?.join(', ') || 'None'}
          </p>
        </div>
      </div>

      {/* Processing Status */}
      {processingCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Processing Complete</h3>
          </div>
          <p className="text-green-700">
            Successfully processed {processingCount} documents with AI intelligence.
          </p>
        </div>
      )}

      {/* Test Content Section */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Test Document Intelligence</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document Title</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Document Content</label>
            <textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Enter document content to analyze..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={6}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAutoTag}
              disabled={!testContent.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
              Auto-Tag
            </button>
            
            <button
              onClick={handleSummarize}
              disabled={!testContent.trim() || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Summarize
            </button>
            
            <button
              onClick={handleFindRelated}
              disabled={!testContent.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Find Related
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(autoTags.length > 0 || summary || relatedDocs.length > 0) && (
        <div className="space-y-4">
          {/* Auto-Tags */}
          {autoTags.length > 0 && (
            <div className="bg-card p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Suggested Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {autoTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="bg-card p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                AI Summary
              </h4>
              <p className="text-sm text-foreground">{summary}</p>
            </div>
          )}

          {/* Related Documents */}
          {relatedDocs.length > 0 && (
            <div className="bg-card p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-600" />
                Related Documents ({relatedDocs.length})
              </h4>
              <div className="space-y-2">
                {relatedDocs.map((doc, index) => (
                  <div key={index} className="p-3 bg-accent/30 rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                        {doc.content_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(doc.similarity_score * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {doc.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


