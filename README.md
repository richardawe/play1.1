# ▶️ Play v1.1 - Offline-First AI-Powered Workspace

**Version 1.1.0** | **Development** 🚧

A completely **offline**, **privacy-focused** desktop workspace with built-in AI capabilities. No cloud, no tracking, no subscriptions - just you and your data.

## ✨ Features

### 🤖 **AI-Powered** (100% Local)
- **Chat Summarization** - Summarize conversations with one click
- **Document Rewriting** - 5 AI styles (professional, casual, concise, etc.)
- **Task Generation** - Extract action items from any text
- **Semantic Search** - Search by meaning, not just keywords
- **RAG (Retrieval-Augmented Generation)** - AI with context from your data

### 💬 **Chat Module**
- Multi-channel messaging
- Markdown formatting
- File attachments
- Local search
- AI summarization

### 📝 **Documents Module**
- Rich text editor (TipTap)
- Auto-save (2 seconds)
- Version history
- Cross-module linking
- AI rewriting & summarization
- Export to Markdown

### ✅ **Tasks Module**
- Kanban board (To Do, In Progress, Done)
- Drag-and-drop
- Priority levels & due dates
- Status & priority filters
- AI task generation
- Cross-module linking

### 📅 **Calendar Module**
- 3 views (Day, Week, Month)
- Event creation & management
- ICS import/export
- Event reminders
- Linking to tasks

### 🔍 **Global Features**
- **Cmd+K**: Search across all modules
- **Dark/Light themes**
- **Backup/Export** to JSON
- **100% Offline** - No internet required

## 🚀 Quick Start

### Prerequisites:
```bash
# Install Node.js, Rust, and Ollama
brew install node rust ollama

# Pull AI models
ollama pull llama3.2
ollama pull nomic-embed-text
```

### Run App:
```bash
# Install dependencies
npm install

# Start Ollama (in separate terminal)
OLLAMA_HOST=0.0.0.0:8080 ollama serve

# Run app
npm run tauri:dev
```

### Open: http://localhost:1420/

## 🏗️ Architecture

```
Frontend:   React + TypeScript + Tailwind CSS + shadcn/ui
Editor:     TipTap + Yjs (CRDT support)
Shell:      Tauri (Rust-based)
Backend:    Rust + Axum
Database:   SQLite + SQLCipher (encrypted)
Vector DB:  In-memory vector store (cosine similarity)
AI:         Ollama (embedded local LLM)
Models:     llama3.2 + nomic-embed-text
```

## 📦 Building

```bash
# Build for production
npm run tauri:build

# Create complete bundle (with Ollama + models)
./scripts/bundle-complete-app.sh
```

## 🔒 Privacy & Security

- ✅ **100% Offline** - Zero network requests (except localhost)
- ✅ **Encrypted Database** - SQLCipher encryption
- ✅ **Local AI** - Models run on your machine
- ✅ **No Tracking** - No analytics, no telemetry
- ✅ **Your Data Stays Yours** - Stored locally only

## 📖 Documentation

See the `docs/` folder for detailed documentation:
- [RELEASE-NOTES-v1.0.0.md](./docs/RELEASE-NOTES-v1.0.0.md) - Release notes
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical architecture
- [OLLAMA-SETUP.md](./docs/OLLAMA-SETUP.md) - AI setup guide
- [TESTING-GUIDE.md](./docs/TESTING-GUIDE.md) - Testing procedures

---

**🎉 Play v1.0 - Your data, your machine, your privacy.**

Made with ❤️ for offline-first productivity.
