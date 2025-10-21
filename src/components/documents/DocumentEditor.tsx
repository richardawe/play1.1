// Document Editor - per prd.md §3️⃣.C and ARCHITECTURE.md TipTap integration
import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useDocumentStore } from '../../store/useDocumentStore';
import VersionHistory from './VersionHistory';
import AISummarizeButton from '../ai/AISummarizeButton';
import AIRewriteButton from '../ai/AIRewriteButton';
import AITextProcessor from '../common/AITextProcessor';
import { 
  Bold, Italic, List, ListOrdered, Code, Quote, 
  Heading1, Heading2, Undo, Redo, Save, History, Sparkles
} from 'lucide-react';

interface DocumentEditorProps {
  documentId?: number;
}

export default function DocumentEditor({ documentId: _documentId }: DocumentEditorProps) {
  const { currentDocument, updateDocument, saving, loadDocument } = useDocumentStore();
  const [title, setTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [aiResult, setAIResult] = useState('');
  const [aiTextProcessorOpen, setAiTextProcessorOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: currentDocument?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3',
      },
    },
  });

  // Update editor when document changes
  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
      if (editor && currentDocument.content !== editor.getHTML()) {
        editor.commands.setContent(currentDocument.content);
      }
    }
  }, [currentDocument, editor]);

  // Auto-save - per prd.md §3️⃣.C "Autosave to local DB"
  useEffect(() => {
    if (!editor || !currentDocument) return;

    const timer = setInterval(() => {
      const content = editor.getHTML();
      if (content !== currentDocument.content || title !== currentDocument.title) {
        handleSave();
      }
    }, 2000); // 2 seconds auto-save per test-spec.md TC-P3.3.1

    return () => clearInterval(timer);
  }, [editor, currentDocument, title]);

  const handleSave = async () => {
    if (!editor || !currentDocument) return;

    const content = editor.getHTML();
    try {
      await updateDocument(currentDocument.id, content, title);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title Input */}
      <div className="border-b border-border p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document Title"
          className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none"
        />
        
        {/* Save Status */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {saving && <span>Saving...</span>}
          {lastSaved && !saving && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('bold') ? 'bg-accent' : ''
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('italic') ? 'bg-accent' : ''
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('bulletList') ? 'bg-accent' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('orderedList') ? 'bg-accent' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('codeBlock') ? 'bg-accent' : ''
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-accent ${
            editor.isActive('blockquote') ? 'bg-accent' : ''
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-accent disabled:opacity-50"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-accent disabled:opacity-50"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* AI Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiTextProcessorOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95"
            title="AI Text Processor"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI Process</span>
          </button>
          <AISummarizeButton 
            text={editor?.getText() || ''} 
            onSummary={setAIResult} 
          />
          <AIRewriteButton 
            text={editor?.getText() || ''} 
            onRewrite={(text) => editor?.commands.setContent(text)} 
          />
        </div>

        {/* Version History Button */}
        <button
          onClick={() => setShowVersions(true)}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded hover:bg-accent transition-colors"
          title="View Version History"
        >
          <History className="w-4 h-4" />
          <span className="text-sm">History</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          title="Save (Cmd+S)"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm">Save</span>
        </button>
      </div>

      {/* AI Result Display */}
      {aiResult && (
        <div className="mx-4 mb-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Result</span>
            </div>
            <button
              onClick={() => setAIResult('')}
              className="text-xs hover:bg-accent px-2 py-1 rounded"
            >
              Close
            </button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{aiResult}</p>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Version History Modal */}
      {currentDocument && (
        <VersionHistory
          documentId={currentDocument.id}
          isOpen={showVersions}
          onClose={() => setShowVersions(false)}
          onRestore={() => {
            // Reload document after restore
            if (currentDocument) {
              loadDocument(currentDocument.id);
            }
          }}
        />
      )}

      {/* AI Text Processor Modal */}
      <AITextProcessor
        isOpen={aiTextProcessorOpen}
        onClose={() => setAiTextProcessorOpen(false)}
        originalText={editor?.getText() || ''}
        onTextProcessed={(processedText) => {
          if (editor) {
            editor.commands.setContent(processedText);
          }
          setAiTextProcessorOpen(false);
        }}
      />
    </div>
  );
}

