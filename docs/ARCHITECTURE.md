# 🏗️ Play MVP - Technical Architecture

**Project**: Play - Offline-First Desktop Workspace  
**Version**: 1.0  
**Last Updated**: October 9, 2025

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Data Layer](#data-layer)
5. [Application Layer](#application-layer)
6. [Presentation Layer](#presentation-layer)
7. [AI Integration](#ai-integration)
8. [Security & Privacy](#security--privacy)
9. [Development Setup](#development-setup)
10. [Deployment](#deployment)

---

## 🎯 Architecture Overview

Play follows a **three-tier architecture** optimized for offline-first desktop applications:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React + TypeScript + Tailwind + shadcn/ui + TipTap + Yjs  │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│              Tauri (Rust) + Axum (REST API)                 │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│         SQLite + SQLCipher + LanceDB + File System          │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Offline-First**: All functionality works without network connectivity
2. **Local-First**: Data stored and processed locally
3. **Privacy-First**: No external API calls, encrypted storage
4. **Performance-First**: Fast startup, responsive UI, efficient queries
5. **Security-First**: Encrypted database, secure file handling

---

## 🛠️ Technology Stack

### Final Technology Decisions

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Shell** | Tauri | 1.5+ | Desktop application framework |
| **Frontend** | React | 18+ | UI framework |
| **Language** | TypeScript | 5.0+ | Type-safe frontend code |
| **Styling** | Tailwind CSS | 3.3+ | Utility-first CSS |
| **Components** | shadcn/ui | Latest | Pre-built components |
| **Editor** | TipTap | 2.0+ | Rich text editor |
| **CRDT** | Yjs | 13+ | Conflict-free data types |
| **Backend** | Rust + Axum | 0.7+ | API framework |
| **Database** | SQLite + SQLCipher | 3.44+ | Encrypted local database |
| **Vector DB** | LanceDB | 0.3+ | Embedding storage |
| **AI Runtime** | Ollama | Latest | Local LLM execution |
| **Testing** | Vitest + Playwright | Latest | Test framework |

### Why These Choices?

#### Rust (Axum) over Node.js (NestJS)
- ✅ Native Tauri integration
- ✅ Better performance (memory & speed)
- ✅ Single language for shell + backend
- ✅ Smaller compiled binaries
- ✅ Strong type safety
- ✅ Superior file system handling

#### LanceDB over pgvector
- ✅ Embedded (no external database)
- ✅ Rust-native bindings
- ✅ Optimized for ML embeddings
- ✅ Offline-first friendly
- ✅ Smaller footprint
- ✅ Simpler setup

#### Yjs over Automerge
- ✅ TipTap official integration
- ✅ Mature ecosystem & docs
- ✅ Excellent React bindings
- ✅ Better performance
- ✅ Larger community
- ✅ Local-first ready

---

## 🏛️ System Architecture

### Component Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                        Tauri Window                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React Application                          │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │   Chat   │  │   Docs   │  │  Tasks   │  │Calendar│ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │         Shared Components & UI Library          │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │         State Management (Zustand/Jotai)        │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │            Tauri API Client                     │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↕ IPC                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Rust Backend (Tauri Core)                  │ │
│  │                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │ │
│  │  │   Axum API  │  │ File System │  │  AI Service  │   │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │ │
│  │                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │ │
│  │  │  DB Service │  │Vector Service│  │Search Service│   │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                           │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │SQLite+Cipher │  │   LanceDB    │  │File Storage │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                           ↕ (Optional)
                   ┌──────────────────┐
                   │  Ollama Runtime  │
                   │   (Local LLM)    │
                   └──────────────────┘
```

### Inter-Process Communication (IPC)

Tauri provides a secure bridge between frontend (JavaScript) and backend (Rust):

```typescript
// Frontend: Invoke Rust command
import { invoke } from '@tauri-apps/api/tauri';

const messages = await invoke('get_messages', { channelId: 1 });
```

```rust
// Backend: Rust command handler
#[tauri::command]
async fn get_messages(channel_id: i64) -> Result<Vec<Message>, String> {
    // Database query
    Ok(messages)
}
```

---

## 💾 Data Layer

### Database Architecture

#### SQLite Schema (from PRD Section 4)

```sql
-- User Profile
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT,
    theme TEXT DEFAULT 'light',
    preferences TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Documents
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT, -- Rich text JSON or Markdown
    version INTEGER DEFAULT 1,
    tags TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document Version History
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- todo, in_progress, done
    priority TEXT DEFAULT 'medium', -- low, medium, high
    due_date DATETIME,
    reminder_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reminder_time DATETIME,
    recurrence TEXT, -- JSON: {type: 'daily', interval: 1}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Files (Attachments)
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL, -- Local file path
    filesize INTEGER,
    mimetype TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Embeddings
CREATE TABLE embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL, -- 'message', 'document', 'task'
    content_id INTEGER NOT NULL,
    embedding BLOB, -- Vector representation
    model TEXT, -- Model used for embedding
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cross-Module Links
CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL, -- 'message', 'document', 'task', 'event'
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_type, source_id, target_type, target_id)
);

-- Global Settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT, -- JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_events_start ON events(start_time);
CREATE INDEX idx_embeddings_content ON embeddings(content_type, content_id);
CREATE INDEX idx_links_source ON links(source_type, source_id);
CREATE INDEX idx_links_target ON links(target_type, target_id);
```

### SQLCipher Encryption

```rust
use rusqlite::{Connection, OpenFlags};

pub fn open_encrypted_db(path: &str, key: &str) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE,
    )?;
    
    // Set encryption key
    conn.execute(&format!("PRAGMA key = '{}'", key), [])?;
    
    // Verify database is accessible
    conn.execute("SELECT count(*) FROM sqlite_master", [])?;
    
    Ok(conn)
}
```

### LanceDB Integration

```rust
use lancedb::{Connection, Table};
use arrow_array::{Float32Array, RecordBatch, StringArray};

pub struct VectorStore {
    connection: Connection,
}

impl VectorStore {
    pub async fn new(path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let connection = lancedb::connect(path).execute().await?;
        Ok(Self { connection })
    }
    
    pub async fn create_table(&self) -> Result<Table, Box<dyn std::error::Error>> {
        // Create table schema
        let table = self.connection
            .create_table("embeddings", vec![])
            .mode(lancedb::CreateMode::CreateIfNotExist)
            .execute()
            .await?;
        
        Ok(table)
    }
    
    pub async fn insert_embedding(
        &self,
        content_id: i64,
        content_type: &str,
        embedding: Vec<f32>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let table = self.connection.open_table("embeddings").execute().await?;
        
        // Create record batch
        let ids = StringArray::from(vec![format!("{}_{}", content_type, content_id)]);
        let vectors = Float32Array::from(embedding);
        
        let batch = RecordBatch::try_from_iter(vec![
            ("id", Arc::new(ids) as ArrayRef),
            ("vector", Arc::new(vectors) as ArrayRef),
        ])?;
        
        table.add(vec![batch]).execute().await?;
        
        Ok(())
    }
    
    pub async fn search_similar(
        &self,
        query_vector: Vec<f32>,
        limit: usize,
    ) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let table = self.connection.open_table("embeddings").execute().await?;
        
        let results = table
            .search(&query_vector)
            .limit(limit)
            .execute()
            .await?;
        
        // Extract IDs from results
        let ids: Vec<String> = results
            .iter()
            .map(|r| r["id"].to_string())
            .collect();
        
        Ok(ids)
    }
}
```

### File System Organization

```
~/Library/Application Support/Play/  (macOS)
%APPDATA%/Play/                       (Windows)
~/.config/Play/                       (Linux)
├── data/
│   ├── play.db                      # SQLite database
│   └── vectors.lance/               # LanceDB directory
├── files/
│   ├── attachments/                 # Uploaded files
│   │   ├── 2025/10/
│   │   │   └── {uuid}.{ext}
│   └── exports/                     # Exported documents
│       └── documents/
└── backups/
    └── {timestamp}/
        ├── play.db.backup
        └── vectors.lance.tar.gz
```

---

## ⚙️ Application Layer

### Rust Backend Structure

```
src-tauri/
├── src/
│   ├── main.rs                      # Application entry point
│   ├── commands/                    # Tauri command handlers
│   │   ├── mod.rs
│   │   ├── messages.rs              # Chat commands
│   │   ├── documents.rs             # Document commands
│   │   ├── tasks.rs                 # Task commands
│   │   ├── events.rs                # Calendar commands
│   │   ├── files.rs                 # File commands
│   │   └── ai.rs                    # AI commands
│   ├── services/                    # Business logic
│   │   ├── mod.rs
│   │   ├── database.rs              # SQLite operations
│   │   ├── vector_store.rs          # LanceDB operations
│   │   ├── file_manager.rs          # File handling
│   │   ├── ai_service.rs            # Ollama integration
│   │   └── search_service.rs        # Search logic
│   ├── models/                      # Data structures
│   │   ├── mod.rs
│   │   ├── message.rs
│   │   ├── document.rs
│   │   ├── task.rs
│   │   └── event.rs
│   └── utils/                       # Utilities
│       ├── mod.rs
│       ├── encryption.rs
│       └── migration.rs
├── Cargo.toml                       # Rust dependencies
└── tauri.conf.json                  # Tauri configuration
```

### Key Dependencies (Cargo.toml)

```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
axum = "0.7"
rusqlite = { version = "0.30", features = ["bundled", "sqlcipher"] }
lancedb = "0.3"
ollama-rs = "0.1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4"] }
sha2 = "0.10"
```

### Example Tauri Command

```rust
// commands/messages.rs
use crate::services::database::Database;
use crate::models::message::{Message, CreateMessage};
use tauri::State;

#[tauri::command]
pub async fn create_message(
    message: CreateMessage,
    db: State<'_, Database>,
) -> Result<Message, String> {
    db.create_message(message)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_messages(
    channel_id: i64,
    limit: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<Message>, String> {
    let limit = limit.unwrap_or(100);
    db.get_messages_by_channel(channel_id, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_messages(
    query: String,
    channel_id: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<Message>, String> {
    db.search_messages(&query, channel_id)
        .await
        .map_err(|e| e.to_string())
}
```

### Axum API Server (Optional Internal API)

```rust
use axum::{
    routing::{get, post},
    Router,
    extract::State,
    Json,
};

pub fn create_router(db: Database) -> Router {
    Router::new()
        .route("/api/messages", post(create_message_handler))
        .route("/api/messages/:channel_id", get(get_messages_handler))
        .route("/api/documents", post(create_document_handler))
        .route("/api/tasks", post(create_task_handler))
        .with_state(db)
}

async fn create_message_handler(
    State(db): State<Database>,
    Json(message): Json<CreateMessage>,
) -> Result<Json<Message>, StatusCode> {
    db.create_message(message)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}
```

---

## 🎨 Presentation Layer

### React Frontend Structure

```
src/
├── main.tsx                         # Application entry
├── App.tsx                          # Root component
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageComposer.tsx
│   │   └── ChatSidebar.tsx
│   ├── documents/
│   │   ├── DocumentEditor.tsx
│   │   ├── DocumentList.tsx
│   │   └── DocumentToolbar.tsx
│   ├── tasks/
│   │   ├── KanbanBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskModal.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── DayView.tsx
│   │   ├── WeekView.tsx
│   │   └── MonthView.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── MainLayout.tsx
│   └── ui/                          # shadcn/ui components
│       ├── button.tsx
│       ├── dialog.tsx
│       └── ...
├── hooks/
│   ├── useMessages.ts
│   ├── useDocuments.ts
│   ├── useTasks.ts
│   └── useEvents.ts
├── lib/
│   ├── tauri.ts                     # Tauri API wrapper
│   ├── utils.ts
│   └── cn.ts
├── store/
│   ├── useStore.ts                  # Global state (Zustand)
│   └── slices/
│       ├── chat.ts
│       ├── documents.ts
│       └── tasks.ts
└── types/
    ├── message.ts
    ├── document.ts
    ├── task.ts
    └── event.ts
```

### TipTap + Yjs Integration

```typescript
// components/documents/DocumentEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';

export function DocumentEditor({ documentId }: { documentId: string }) {
  const [yDoc] = useState(() => new Y.Doc());
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: yDoc,
      }),
    ],
    content: '',
  });
  
  // Save to SQLite periodically
  useEffect(() => {
    const timer = setInterval(async () => {
      if (editor) {
        const content = editor.getHTML();
        await invoke('save_document', { 
          documentId, 
          content 
        });
      }
    }, 2000);
    
    return () => clearInterval(timer);
  }, [editor, documentId]);
  
  return <EditorContent editor={editor} />;
}
```

### State Management with Zustand

```typescript
// store/useStore.ts
import create from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

interface Message {
  id: number;
  channel_id: number;
  content: string;
  created_at: string;
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  loadMessages: (channelId: number) => Promise<void>;
  sendMessage: (channelId: number, content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,
  
  loadMessages: async (channelId: number) => {
    set({ loading: true });
    try {
      const messages = await invoke<Message[]>('get_messages', { channelId });
      set({ messages, loading: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ loading: false });
    }
  },
  
  sendMessage: async (channelId: number, content: string) => {
    try {
      const message = await invoke<Message>('create_message', {
        message: { channel_id: channelId, content }
      });
      set((state) => ({ messages: [...state.messages, message] }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },
}));
```

---

## 🤖 AI Integration

### Ollama Service

```rust
// services/ai_service.rs
use ollama_rs::{Ollama, generation::completion::request::GenerationRequest};

pub struct AIService {
    ollama: Ollama,
    model: String,
}

impl AIService {
    pub fn new() -> Self {
        Self {
            ollama: Ollama::new("http://localhost:11434".to_string()),
            model: "llama2".to_string(),
        }
    }
    
    pub async fn generate_summary(&self, text: &str) -> Result<String, Box<dyn std::error::Error>> {
        let prompt = format!(
            "Summarize the following text concisely:\n\n{}",
            text
        );
        
        let request = GenerationRequest::new(self.model.clone(), prompt);
        let response = self.ollama.generate(request).await?;
        
        Ok(response.response)
    }
    
    pub async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        let request = ollama_rs::generation::embeddings::request::GenerateEmbeddingsRequest::new(
            self.model.clone(),
            text.to_string(),
        );
        
        let response = self.ollama.generate_embeddings(request).await?;
        Ok(response.embeddings)
    }
    
    pub async fn generate_tasks(&self, text: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let prompt = format!(
            "Extract actionable tasks from the following text. Return only a JSON array of task titles:\n\n{}",
            text
        );
        
        let request = GenerationRequest::new(self.model.clone(), prompt);
        let response = self.ollama.generate(request).await?;
        
        let tasks: Vec<String> = serde_json::from_str(&response.response)?;
        Ok(tasks)
    }
}
```

### RAG (Retrieval Augmented Generation)

```rust
pub async fn semantic_search(
    query: &str,
    ai_service: &AIService,
    vector_store: &VectorStore,
) -> Result<Vec<SearchResult>, Box<dyn std::error::Error>> {
    // 1. Generate embedding for query
    let query_embedding = ai_service.generate_embedding(query).await?;
    
    // 2. Search vector database
    let similar_ids = vector_store.search_similar(query_embedding, 5).await?;
    
    // 3. Fetch full content from SQLite
    let mut results = Vec::new();
    for id in similar_ids {
        let parts: Vec<&str> = id.split('_').collect();
        let content_type = parts[0];
        let content_id: i64 = parts[1].parse()?;
        
        let content = fetch_content(content_type, content_id).await?;
        results.push(SearchResult {
            content_type: content_type.to_string(),
            content_id,
            content,
        });
    }
    
    Ok(results)
}
```

---

## 🔒 Security & Privacy

### Encryption Strategy

1. **Database Encryption**: SQLCipher with user-derived key
2. **File Encryption**: Sensitive files encrypted at rest
3. **Memory Security**: Sensitive data cleared after use
4. **No Network**: All processing happens locally

### Key Derivation

```rust
use sha2::{Sha256, Digest};

pub fn derive_key(password: &str, salt: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update(salt);
    format!("{:x}", hasher.finalize())
}
```

### Secure File Handling

```rust
use std::fs::{self, File};
use std::io::{Read, Write};

pub fn save_file_securely(
    content: &[u8],
    path: &Path,
) -> Result<(), std::io::Error> {
    // Create parent directories
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    
    // Write with restricted permissions
    let mut file = File::create(path)?;
    file.write_all(content)?;
    
    // Set file permissions (Unix)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = file.metadata()?.permissions();
        perms.set_mode(0o600); // Read/write for owner only
        fs::set_permissions(path, perms)?;
    }
    
    Ok(())
}
```

---

## 🚀 Development Setup

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (via nvm)
nvm install 18
nvm use 18

# Install Tauri CLI
cargo install tauri-cli

# Install Ollama (for AI features)
# macOS
brew install ollama
# Linux
curl https://ollama.ai/install.sh | sh
```

### Project Setup

```bash
# Create Tauri app
npm create tauri-app@latest
# Choose: React + TypeScript

# Install frontend dependencies
npm install
npm install -D @tauri-apps/cli
npm install @tauri-apps/api
npm install zustand yjs @tiptap/react @tiptap/starter-kit
npm install tailwindcss @shadcn/ui

# Install Rust dependencies (in src-tauri/)
cd src-tauri
cargo add serde serde_json tokio axum rusqlite lancedb ollama-rs chrono uuid

# Initialize database
cargo run --bin init-db

# Start development
npm run tauri dev
```

### Environment Variables

```bash
# .env
DATABASE_PATH=./data/play.db
DATABASE_KEY=your-secure-key-here
VECTOR_DB_PATH=./data/vectors.lance
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

---

## 📦 Deployment

### Build for Production

```bash
# Build all platforms
npm run tauri build

# Build specific platform
npm run tauri build -- --target x86_64-apple-darwin  # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin # macOS M1/M2
npm run tauri build -- --target x86_64-pc-windows-msvc # Windows
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

### Code Signing

#### macOS
```bash
# Sign with Apple Developer certificate
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" \
  target/release/bundle/macos/Play.app
```

#### Windows
```bash
# Sign with certificate
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com \
  target/release/bundle/msi/Play_1.0.0_x64.msi
```

### Distribution

- **macOS**: DMG or PKG installer
- **Windows**: MSI or NSIS installer
- **Linux**: AppImage, deb, or rpm

---

## 📊 Performance Optimization

### Database Optimization

```sql
-- Enable Write-Ahead Logging
PRAGMA journal_mode=WAL;

-- Increase cache size
PRAGMA cache_size=-64000; -- 64MB

-- Enable memory-mapped I/O
PRAGMA mmap_size=268435456; -- 256MB
```

### Memory Management

```rust
// Use Arc for shared state
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AppState {
    db: Arc<RwLock<Database>>,
    vector_store: Arc<RwLock<VectorStore>>,
    ai_service: Arc<AIService>,
}
```

---

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Axum Documentation](https://docs.rs/axum/)
- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [Yjs Documentation](https://docs.yjs.dev/)
- [TipTap Documentation](https://tiptap.dev/)
- [Ollama Documentation](https://github.com/jmorganca/ollama)

---

**Reference Documents**:
- [Product Requirements Document](./prd.md)
- [Development To-Do List](./todo.md)
- [Test Specification](./test-spec.md)
- [Test Setup Guide](./test-setup.md)
- [Project Guide](./PROJECT-GUIDE.md)

