# ▶️ Play - Offline-First AI-Powered Workspace

**Version 1.0.0** | **97% Complete** (35/36 tasks) 🎉

A completely **offline**, **privacy-focused** desktop workspace with built-in AI capabilities. No cloud, no tracking, no subscriptions - just you and your data.

---

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

---

## 🚀 Quick Start

### Option 1: Development Mode

1. **Prerequisites:**
   ```bash
   # Install Node.js, Rust, and Ollama
   brew install node rust ollama
   
   # Pull AI models
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

2. **Run App:**
   ```bash
   # Install dependencies
   npm install
   
   # Start Ollama (in separate terminal)
   OLLAMA_HOST=0.0.0.0:8080 ollama serve
   
   # Run app
   npm run tauri:dev
   ```

3. **Open:** http://localhost:1420/

### Option 2: Production Build (Coming Soon)

Download the complete installer:
- **macOS**: `Play-Complete-v1.0.0-macOS.dmg` (2.5GB)
- **Windows**: `Play-Complete-v1.0.0-Windows.exe` (2.4GB)
- **Linux**: `Play-Complete-v1.0.0-Linux.AppImage` (2.5GB)

**Includes everything**: App + Ollama + AI models (llama3.2 + nomic-embed-text)

**One-click install** - No setup required!

---

## 📦 What's Included

- ✅ **Play Desktop App** (~30MB)
- ✅ **Ollama Runtime** (~100MB)
- ✅ **llama3.2 Model** (2.0GB)
- ✅ **nomic-embed-text Model** (274MB)

**Total**: ~2.5GB complete package

---

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

---

## 📊 Project Stats

- **Files**: 135+
- **Lines of Code**: ~9,500+
- **Backend Commands**: 45+ (Rust)
- **React Components**: 40+
- **State Stores**: 5 (Zustand)
- **Services**: 10 (Database, AI, Files, Settings, etc.)
- **Documentation**: 19 files

---

## 🧪 Testing

See comprehensive testing guides:
- [TEST-ALL.md](./TEST-ALL.md) - Complete feature testing
- [TEST-CHAT.md](./TEST-CHAT.md) - Chat module testing
- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - Phase 1 testing
- [OLLAMA-SETUP.md](./OLLAMA-SETUP.md) - AI setup guide

---

## 📖 Documentation

- [prd.md](./prd.md) - Product Requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Design
- [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) - Development Workflow
- [todo.md](./todo.md) - Development Progress (97% complete!)
- [BUNDLED-PACKAGING.md](./BUNDLED-PACKAGING.md) - Packaging Strategy

---

## 🔒 Privacy & Security

- ✅ **100% Offline** - Zero network requests (except localhost)
- ✅ **Encrypted Database** - SQLCipher encryption
- ✅ **Local AI** - Models run on your machine
- ✅ **No Tracking** - No analytics, no telemetry
- ✅ **Your Data Stays Yours** - Stored locally only

**Data Location:**
- Database: `~/Library/Application Support/play/data/`
- Files: `~/Library/Application Support/play/files/`
- Models: `~/Library/Application Support/play/models/`

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run tauri:dev

# Build for production
npm run tauri:build

# Create complete bundle (with Ollama + models)
./scripts/bundle-complete-app.sh

# Run tests
npm test

# Lint code
npm run lint
```

---

## 📦 Building Complete Package

To create a self-contained installer with Ollama + models:

```bash
# 1. Ensure models are downloaded
ollama pull llama3.2
ollama pull nomic-embed-text

# 2. Run bundling script
./scripts/bundle-complete-app.sh

# 3. Find installer in dist/complete/
# Play-Complete-v1.0.0-macOS.dmg (2.5GB)
```

See [BUNDLED-PACKAGING.md](./BUNDLED-PACKAGING.md) for detailed instructions.

---

## 🎯 Roadmap

### v1.0.0 (Current - 97% Complete) ✅
- [x] All 4 core modules (Chat, Docs, Tasks, Calendar)
- [x] Full AI integration (Ollama + models)
- [x] Global search (Cmd+K)
- [x] Backup/Export system
- [x] Cross-module linking
- [x] ICS import/export
- [ ] Bundled packaging (in progress)

### v1.1.0 (Future)
- [ ] Real-time collaboration (Yjs sync)
- [ ] Mobile app (iOS/Android)
- [ ] Cloud sync (optional)
- [ ] More AI models
- [ ] Plugin system

---

## 🤝 Contributing

This is an MVP built from a comprehensive PRD. See [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) for development workflows.

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop app framework
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [TipTap](https://tiptap.dev/) - Rich text editor
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**🎉 Play - Your data, your machine, your privacy.**

Made with ❤️ for offline-first productivity.
