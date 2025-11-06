// Document List - per prd.md §3️⃣.C
import { useEffect } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { FileText, Plus } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';

export default function DocumentList() {
  const { documents, loading, loadDocuments, createDocument, setCurrentDocument } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleNewDocument = async () => {
    try {
      const newDoc = await createDocument({
        title: 'Untitled Document',
        content: '<p>Start writing...</p>',
        tags: null,
      });
      setCurrentDocument(newDoc);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  return (
    <div className="w-64 border-r border-border bg-card/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Documents</h3>
        </div>
        <button
          onClick={handleNewDocument}
          className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          title="New Document"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          <p className="mb-2">No documents yet</p>
          <button
            onClick={handleNewDocument}
            className="text-primary hover:underline"
          >
            Create your first document
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setCurrentDocument(doc)}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium text-sm truncate text-foreground">{doc.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(doc.updated_at)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

