# ▶️ **Play – MVP Roadmap & Product Requirements Document (PRD)**  
### Version: Local Single-User Edition  

---

## 🎯 **Vision**

**Play** is a self-contained, AI-powered workspace that unites chat, documents, tasks, files, and a calendar into one local-first environment.  
It runs fully offline — no servers, no cloud sync — everything happens on your machine.  

---

## 🧩 **1️⃣ Module Roadmap**

| **Phase** | **Modules / Focus** | **Purpose** | **Core Dependencies** |
|------------|---------------------|--------------|------------------------|
| **Phase 1 – Foundation (Month 1)** | Core engine, database, UI shell | Create the base desktop framework and unified data model. | Tauri, SQLite, Auth |
| **Phase 2 – Communication & Notes (Month 2)** | Chat + Notes/Docs | Build communication and writing core with local storage. | File system, CRDT |
| **Phase 3 – Tasks & Calendar (Month 3)** | Tasks + Calendar | Connect daily work and scheduling. | Chat & Docs data |
| **Phase 4 – AI Integration (Month 4)** | Local LLM & Vector Index | Add contextual intelligence — summaries, searches, and automations. | Ollama, pgvector |
| **Phase 5 – Polishing MVP (Month 5)** | Unified UI + Offline optimization | Make Play stable, elegant, and ready for use. | Local DB & CRDT |

---

## 🧱 **2️⃣ PRODUCT REQUIREMENTS DOCUMENT (PRD)**

### 🧭 Overview

**Product Name:** Play  
**Type:** Desktop Application (Offline, Self-Contained)  
**Target User:** Individuals, freelancers, and independent creators who want full control of their data and tools without relying on cloud platforms.  
**Primary Goal:** Deliver an all-in-one work suite that runs entirely on local hardware — combining chat, notes, tasks, and AI assistance.  

---

## 💡 **3️⃣ Core MVP Modules**

### **A. Core System**
- Local user profile (no online account)
- Encrypted local SQLite database
- File system integration for uploads/saves
- Settings and preferences
- Unified sidebar and navigation shell

---

### **B. Chat**
- Local chat channels (solo or test multi-room)
- Message threads and quick replies
- File attachments from local storage
- AI-powered “Summarize Conversation”
- Local search and filtering

---

### **C. Notes & Docs**
- Rich text / Markdown editor (TipTap)
- Autosave to local DB + export to `.md`
- Document linking and tagging
- AI tools: Summarize, Rewrite, Generate Outline
- Version history stored locally

---

### **D. Tasks**
- Kanban-style task board
- Task creation and prioritization
- Link tasks to chat messages or docs
- AI “Generate Tasks from Notes”
- Local reminders and status filters

---

### **E. Calendar**
- Daily / Weekly / Monthly views
- Add and edit events locally
- Link events to tasks or notes
- Simple local notifications
- Import / export `.ics` files

---

### **F. AI Layer**
- Runs locally via **Ollama** or **LM Studio**
- Embedding and search via **pgvector** or **LanceDB**
- Summarization, rewriting, and local context retrieval
- Privacy-first: no internet calls
- Background indexer for chat/docs/tasks

---

## 🧠 **4️⃣ Data Model**

| **Table** | **Description** |
|------------|----------------|
| `user` | Local user settings, theme, preferences |
| `messages` | Chat messages with metadata |
| `documents` | Notes, docs, and their version history |
| `tasks` | Task items with status and priority |
| `events` | Calendar entries and reminders |
| `files` | File references and metadata |
| `embeddings` | AI vector embeddings for context |
| `settings` | Global configuration and system data |

🗄️ All stored locally in **SQLite**, encrypted on disk.

---

## 🧰 **5️⃣ Tech Stack**

| **Layer** | **Technology** | **Purpose** |
|------------|----------------|--------------|
| **Frontend** | React + Tailwind + shadcn/ui | Modular UI for Chat, Docs, Tasks, Calendar |
| **Shell** | Tauri | Lightweight, secure desktop runtime |
| **Backend** | Node.js (NestJS) or Rust (Axum) | Local API logic and file management |
| **Database** | SQLite | Fast, embedded local database |
| **Sync / Offline** | Yjs or Automerge (local-only mode) | Local state reconciliation |
| **Storage** | Local filesystem | File attachments, exports, and backups |
| **AI Runtime** | Ollama / LM Studio | Local language model execution |
| **Vector DB** | pgvector / LanceDB | Local semantic search |
| **Notifications** | OS-level (macOS/Windows/Linux) | Reminders and alerts |

---

## 🧩 **6️⃣ Build Steps (Technical Plan)**

### **Phase 1 – Core**
1. Initialize Tauri app shell  
2. Set up local SQLite schema  
3. Build user settings and theme persistence  
4. Add unified navigation layout (Sidebar + Topbar)  
5. Implement local file handling  

---

### **Phase 2 – Chat**
1. Build local chat interface (channel + message list)  
2. Implement local message store in SQLite  
3. Add markdown composer with attachments  
4. Integrate AI “Summarize Chat” button  
5. Store AI summaries locally  

---

### **Phase 3 – Notes**
1. Create TipTap editor  
2. Link notes to tasks and chat messages  
3. Implement document autosave and export  
4. Add AI-powered rewriting and summarization  

---

### **Phase 4 – Tasks**
1. Kanban board UI  
2. CRUD for tasks (create, edit, delete)  
3. Task linking to docs and chat items  
4. AI “Generate Tasks from Text” feature  

---

### **Phase 5 – Calendar**
1. Calendar view (day/week/month)  
2. Local event creation and reminders  
3. Link tasks to events  
4. ICS import/export  

---

### **Phase 6 – AI Integration**
1. Integrate Ollama runtime via local API  
2. Add vector index builder (pgvector or LanceDB)  
3. Connect AI queries to local context (docs, tasks, chat)  
4. Implement summarization and RAG-based search  

---

### **Phase 7 – MVP Polish**
1. Global search across all modules  
2. Offline caching and recovery checks  
3. Add user preferences and dark/light themes  
4. Package as signed Tauri desktop app  

---

## 🧱 **7️⃣ Deliverables**

| **Deliverable** | **Description** |
|------------------|-----------------|
| **Desktop App** | Self-contained Tauri app for macOS, Windows, Linux |
| **Core Modules** | Chat, Docs, Tasks, Calendar (fully offline) |
| **AI Assistant** | Local summarization and text generation |
| **Unified DB** | SQLite-based local data store |
| **Local File System** | Fully offline attachments and documents |
| **Search** | Local vector and keyword search |
| **Theme & UX** | Unified sidebar, minimal and intuitive interface |

---

## 🚀 **8️⃣ Post-MVP (Future Phases)**

- Email integration  
- CRM and contact management  
- Meeting/call module (VoIP integration)  
- Plugin SDK for extensibility  
- P2P multi-user sync  
- Cloud-optional remote access  

---

## 🔒 **9️⃣ Privacy & Security**

- All data encrypted locally (SQLCipher or LiteFS)  
- AI inference fully on-device  
- No external API calls by default  
- Optional “airplane mode” toggle for total offline use  
- Manual export/import for backups  

---

## ✅ **10️⃣ MVP Success Criteria**

- Fully functional on a single user’s device  
- No internet or external dependency required  
- All modules share one unified database  
- AI features operational via local LLM  
- Smooth UX, fast load, offline reliability  

---

**End of Document**
