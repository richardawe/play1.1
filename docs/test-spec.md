# 🧪 Play MVP - Test Specification Document

**Project**: Play - Offline-First Desktop Workspace  
**Version**: 1.0  
**Last Updated**: October 9, 2025

---

## 📋 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Phase-by-Phase Test Plans](#phase-by-phase-test-plans)
4. [Automated Test Suite](#automated-test-suite)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Performance Benchmarks](#performance-benchmarks)

---

## 🎯 Testing Strategy

### Testing Pyramid

```
        ┌─────────────────┐
        │  E2E Tests (10%) │ ← Tauri integration tests
        ├─────────────────┤
        │ Integration (30%)│ ← API + DB + UI tests
        ├─────────────────┤
        │  Unit Tests (60%)│ ← Component + Logic tests
        └─────────────────┘
```

### Testing Principles

1. **Offline-First Testing**: All tests must pass without network connectivity
2. **Data Integrity**: Verify SQLite transactions and data consistency
3. **Cross-Platform**: Test on macOS, Windows, and Linux
4. **Performance**: Monitor startup time, query speed, UI responsiveness
5. **Security**: Validate encryption, file permissions, data isolation

---

## 🛠️ Test Environment Setup

### Required Tools

```json
{
  "testing_frameworks": {
    "unit": "Vitest",
    "integration": "Playwright",
    "e2e": "Tauri Testing Library",
    "component": "React Testing Library"
  },
  "test_data": {
    "sample_messages": 1000,
    "sample_documents": 100,
    "sample_tasks": 50,
    "sample_events": 30
  },
  "test_environments": {
    "local": "Development machine",
    "ci": "GitHub Actions",
    "platforms": ["macOS", "Windows", "Linux"]
  }
}
```

### Setup Commands

```bash
# Install dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright

# Initialize test database
npm run test:db:setup

# Generate test data
npm run test:seed

# Run all tests
npm run test:all
```

---

## 🏗️ Phase-by-Phase Test Plans

### Phase 1: Foundation Testing

#### P1.1 - Tauri App Shell
**Test ID**: `CORE-001`  
**PRD Reference**: Section 3️⃣.A (Core System)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P1.1.1 | App launches successfully | Window opens within 2 seconds | ⏳ |
| TC-P1.1.2 | App renders on macOS | Native window with proper styling | ⏳ |
| TC-P1.1.3 | App renders on Windows | Native window with proper styling | ⏳ |
| TC-P1.1.4 | App renders on Linux | Native window with proper styling | ⏳ |
| TC-P1.1.5 | App closes gracefully | No zombie processes or data corruption | ⏳ |

**Test Script**:
```javascript
describe('Tauri App Shell', () => {
  test('should launch within 2 seconds', async () => {
    const startTime = Date.now();
    const app = await launch();
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(2000);
  });
});
```

---

#### P1.2 - SQLite Database Schema
**Test ID**: `CORE-002`  
**PRD Reference**: Section 4️⃣ (Data Model)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P1.2.1 | Database file creates on first run | `.db` file exists in correct location | ⏳ |
| TC-P1.2.2 | All tables create successfully | 8 tables: user, messages, documents, tasks, events, files, embeddings, settings | ⏳ |
| TC-P1.2.3 | Database encrypts data | File is not readable as plain text | ⏳ |
| TC-P1.2.4 | Foreign key constraints work | Cascading deletes function correctly | ⏳ |
| TC-P1.2.5 | Migrations run successfully | Schema version updates correctly | ⏳ |

**Test Script**:
```javascript
describe('SQLite Database', () => {
  test('should create all required tables', async () => {
    const db = await initDatabase();
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('user');
    expect(tableNames).toContain('messages');
    expect(tableNames).toContain('documents');
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('events');
    expect(tableNames).toContain('files');
    expect(tableNames).toContain('embeddings');
    expect(tableNames).toContain('settings');
  });
});
```

---

#### P1.3 - User Settings & Theme
**Test ID**: `CORE-003`  
**PRD Reference**: Section 3️⃣.A (Core System)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P1.3.1 | Default settings load | User preferences table populated | ⏳ |
| TC-P1.3.2 | Theme persists across sessions | Selected theme loads on restart | ⏳ |
| TC-P1.3.3 | Settings update in real-time | UI reflects changes immediately | ⏳ |
| TC-P1.3.4 | Settings validate input | Invalid values rejected with error | ⏳ |

---

#### P1.4 - Navigation Layout
**Test ID**: `CORE-004`  
**PRD Reference**: Section 5️⃣ (Tech Stack - Frontend)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P1.4.1 | Sidebar renders all modules | Chat, Docs, Tasks, Calendar visible | ⏳ |
| TC-P1.4.2 | Module switching works | Content area updates on click | ⏳ |
| TC-P1.4.3 | Active state highlights correctly | Current module visually indicated | ⏳ |
| TC-P1.4.4 | Responsive layout adapts | Works on different window sizes | ⏳ |

---

#### P1.5 - Local File Handling
**Test ID**: `CORE-005`  
**PRD Reference**: Section 3️⃣.A (Core System)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P1.5.1 | File upload works | Files save to local storage | ⏳ |
| TC-P1.5.2 | File metadata stores correctly | Size, type, date recorded in DB | ⏳ |
| TC-P1.5.3 | File retrieval works | Can load and display saved files | ⏳ |
| TC-P1.5.4 | File deletion works | File removed from storage and DB | ⏳ |
| TC-P1.5.5 | Large file handling | Files >100MB process correctly | ⏳ |

---

### Phase 2: Chat Module Testing

#### P2.1 - Chat Interface
**Test ID**: `CHAT-001`  
**PRD Reference**: Section 3️⃣.B (Chat)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P2.1.1 | Channel list renders | Shows all available channels | ⏳ |
| TC-P2.1.2 | Message list renders | Displays messages in chronological order | ⏳ |
| TC-P2.1.3 | Message composer renders | Input field with send button visible | ⏳ |
| TC-P2.1.4 | UI handles empty state | Shows helpful placeholder | ⏳ |
| TC-P2.1.5 | Scrolling works correctly | Auto-scroll to bottom on new message | ⏳ |

---

#### P2.2 - Message Store (CRUD)
**Test ID**: `CHAT-002`  
**PRD Reference**: Section 3️⃣.B (Chat)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P2.2.1 | Create message | Message saves to DB with correct timestamp | ⏳ |
| TC-P2.2.2 | Read messages | Query returns all messages for channel | ⏳ |
| TC-P2.2.3 | Update message | Edited message updates in DB | ⏳ |
| TC-P2.2.4 | Delete message | Message removed from DB and UI | ⏳ |
| TC-P2.2.5 | Bulk operations | Can load 1000+ messages efficiently | ⏳ |

**Performance Benchmark**: Load 1000 messages in < 100ms

---

#### P2.3 - Markdown Composer
**Test ID**: `CHAT-003`  
**PRD Reference**: Section 3️⃣.B (Chat)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P2.3.1 | Markdown formatting works | Bold, italic, code render correctly | ⏳ |
| TC-P2.3.2 | File attachment works | Files attach to message | ⏳ |
| TC-P2.3.3 | Multiple file attachments | Can attach multiple files | ⏳ |
| TC-P2.3.4 | Attachment preview works | Images show preview thumbnail | ⏳ |

---

#### P2.4 - AI Chat Summarization
**Test ID**: `CHAT-004`  
**PRD Reference**: Section 3️⃣.B (Chat), Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P2.4.1 | Summarize button appears | Visible when >10 messages exist | ⏳ |
| TC-P2.4.2 | Summary generates | AI produces coherent summary | ⏳ |
| TC-P2.4.3 | Summary saves locally | Stored in DB for later retrieval | ⏳ |
| TC-P2.4.4 | Summary is relevant | Contains key points from chat | ⏳ |
| TC-P2.4.5 | Works offline | No network calls made | ⏳ |

---

#### P2.5 - Local Search & Filtering
**Test ID**: `CHAT-005`  
**PRD Reference**: Section 3️⃣.B (Chat)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P2.5.1 | Text search works | Finds messages containing query | ⏳ |
| TC-P2.5.2 | Search is fast | Returns results in <200ms | ⏳ |
| TC-P2.5.3 | Date filter works | Filters messages by date range | ⏳ |
| TC-P2.5.4 | File filter works | Shows only messages with attachments | ⏳ |
| TC-P2.5.5 | Combined filters work | Multiple filters apply together | ⏳ |

---

### Phase 3: Notes & Documents Testing

#### P3.1 - TipTap Editor
**Test ID**: `DOCS-001`  
**PRD Reference**: Section 3️⃣.C (Notes & Docs)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P3.1.1 | Editor renders | TipTap component loads correctly | ⏳ |
| TC-P3.1.2 | Rich text formatting works | Bold, italic, underline, headings | ⏳ |
| TC-P3.1.3 | Markdown support works | Can toggle between rich text and markdown | ⏳ |
| TC-P3.1.4 | Lists work correctly | Ordered and unordered lists | ⏳ |
| TC-P3.1.5 | Code blocks work | Syntax highlighting for code | ⏳ |

---

#### P3.2 - Document Linking
**Test ID**: `DOCS-002`  
**PRD Reference**: Section 3️⃣.C (Notes & Docs)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P3.2.1 | Link to chat message | Creates bidirectional link | ⏳ |
| TC-P3.2.2 | Link to task | Creates bidirectional link | ⏳ |
| TC-P3.2.3 | Link to another document | Internal doc linking works | ⏳ |
| TC-P3.2.4 | Link navigation works | Clicking link opens linked item | ⏳ |
| TC-P3.2.5 | Link updates on deletion | Orphaned links handled gracefully | ⏳ |

---

#### P3.3 - Autosave & Export
**Test ID**: `DOCS-003`  
**PRD Reference**: Section 3️⃣.C (Notes & Docs)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P3.3.1 | Autosave triggers | Saves after 2 seconds of inactivity | ⏳ |
| TC-P3.3.2 | Manual save works | Save button persists immediately | ⏳ |
| TC-P3.3.3 | Export to .md works | Creates valid markdown file | ⏳ |
| TC-P3.3.4 | Export preserves formatting | Markdown maintains structure | ⏳ |
| TC-P3.3.5 | No data loss on crash | Can recover unsaved changes | ⏳ |

---

#### P3.4 - AI Document Tools
**Test ID**: `DOCS-004`  
**PRD Reference**: Section 3️⃣.C (Notes & Docs), Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P3.4.1 | Summarize works | Produces concise summary | ⏳ |
| TC-P3.4.2 | Rewrite works | Improves text quality | ⏳ |
| TC-P3.4.3 | Generate outline works | Creates structured outline | ⏳ |
| TC-P3.4.4 | AI maintains context | Results relevant to document | ⏳ |
| TC-P3.4.5 | Works offline | No network dependency | ⏳ |

---

#### P3.5 - Version History
**Test ID**: `DOCS-005`  
**PRD Reference**: Section 3️⃣.C (Notes & Docs)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P3.5.1 | Versions save automatically | Each save creates version entry | ⏳ |
| TC-P3.5.2 | Version list displays | Shows all versions with timestamps | ⏳ |
| TC-P3.5.3 | Version restore works | Can revert to previous version | ⏳ |
| TC-P3.5.4 | Version comparison works | Shows diff between versions | ⏳ |
| TC-P3.5.5 | Old versions prune | Keeps last 50 versions by default | ⏳ |

---

### Phase 4: Tasks Module Testing

#### P4.1 - Kanban Board UI
**Test ID**: `TASK-001`  
**PRD Reference**: Section 3️⃣.D (Tasks)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P4.1.1 | Board renders columns | Todo, In Progress, Done columns | ⏳ |
| TC-P4.1.2 | Drag and drop works | Tasks move between columns | ⏳ |
| TC-P4.1.3 | Task card displays correctly | Shows title, priority, due date | ⏳ |
| TC-P4.1.4 | Add task button works | Opens task creation modal | ⏳ |
| TC-P4.1.5 | Board persists state | Column positions save to DB | ⏳ |

---

#### P4.2 - Task CRUD Operations
**Test ID**: `TASK-002`  
**PRD Reference**: Section 3️⃣.D (Tasks)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P4.2.1 | Create task | Task saves with all fields | ⏳ |
| TC-P4.2.2 | Read tasks | Loads all tasks for board | ⏳ |
| TC-P4.2.3 | Update task | Changes persist to DB | ⏳ |
| TC-P4.2.4 | Delete task | Removes task from DB and UI | ⏳ |
| TC-P4.2.5 | Prioritize tasks | Priority order maintained | ⏳ |

---

#### P4.3 - Task Linking
**Test ID**: `TASK-003`  
**PRD Reference**: Section 3️⃣.D (Tasks)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P4.3.1 | Link to chat message | Bidirectional link created | ⏳ |
| TC-P4.3.2 | Link to document | Bidirectional link created | ⏳ |
| TC-P4.3.3 | Multiple links work | Task can link to multiple items | ⏳ |
| TC-P4.3.4 | Link preview works | Shows preview of linked content | ⏳ |

---

#### P4.4 - AI Task Generation
**Test ID**: `TASK-004`  
**PRD Reference**: Section 3️⃣.D (Tasks), Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P4.4.1 | Generate from text | Creates relevant tasks | ⏳ |
| TC-P4.4.2 | Generate from document | Extracts action items | ⏳ |
| TC-P4.4.3 | Tasks are actionable | Clear, specific task descriptions | ⏳ |
| TC-P4.4.4 | Works offline | No network calls | ⏳ |

---

#### P4.5 - Reminders & Filters
**Test ID**: `TASK-005`  
**PRD Reference**: Section 3️⃣.D (Tasks)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P4.5.1 | Set reminder | Reminder saves to task | ⏳ |
| TC-P4.5.2 | Reminder triggers | Notification appears at set time | ⏳ |
| TC-P4.5.3 | Status filter works | Shows only selected statuses | ⏳ |
| TC-P4.5.4 | Priority filter works | Filters by priority level | ⏳ |
| TC-P4.5.5 | Combined filters work | Multiple filters apply correctly | ⏳ |

---

### Phase 5: Calendar Module Testing

#### P5.1 - Calendar Views
**Test ID**: `CAL-001`  
**PRD Reference**: Section 3️⃣.E (Calendar)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P5.1.1 | Day view renders | Shows hourly schedule | ⏳ |
| TC-P5.1.2 | Week view renders | Shows 7-day grid | ⏳ |
| TC-P5.1.3 | Month view renders | Shows full month calendar | ⏳ |
| TC-P5.1.4 | View switching works | Transitions between views | ⏳ |
| TC-P5.1.5 | Navigation works | Previous/next navigation buttons | ⏳ |

---

#### P5.2 - Event Management
**Test ID**: `CAL-002`  
**PRD Reference**: Section 3️⃣.E (Calendar)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P5.2.1 | Create event | Event saves with all details | ⏳ |
| TC-P5.2.2 | Edit event | Changes persist correctly | ⏳ |
| TC-P5.2.3 | Delete event | Removes event from calendar | ⏳ |
| TC-P5.2.4 | Recurring events work | Repeating events display correctly | ⏳ |
| TC-P5.2.5 | Event reminders work | Notifications trigger on time | ⏳ |

---

#### P5.3 - Event-Task Linking
**Test ID**: `CAL-003`  
**PRD Reference**: Section 3️⃣.E (Calendar)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P5.3.1 | Link event to task | Bidirectional link created | ⏳ |
| TC-P5.3.2 | Multiple tasks link | Event can link to multiple tasks | ⏳ |
| TC-P5.3.3 | Link displays in both | Shows in event details and task | ⏳ |

---

#### P5.4 - ICS Import/Export
**Test ID**: `CAL-004`  
**PRD Reference**: Section 3️⃣.E (Calendar)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P5.4.1 | Import .ics file | Events load into calendar | ⏳ |
| TC-P5.4.2 | Export to .ics | Creates valid ICS file | ⏳ |
| TC-P5.4.3 | Data integrity maintained | All event fields preserve | ⏳ |
| TC-P5.4.4 | Handles large files | Import 1000+ events successfully | ⏳ |

---

#### P5.5 - OS Notifications
**Test ID**: `CAL-005`  
**PRD Reference**: Section 3️⃣.E (Calendar)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P5.5.1 | macOS notifications work | Native notification appears | ⏳ |
| TC-P5.5.2 | Windows notifications work | Native notification appears | ⏳ |
| TC-P5.5.3 | Linux notifications work | Native notification appears | ⏳ |
| TC-P5.5.4 | Notification timing accurate | Triggers at exact scheduled time | ⏳ |
| TC-P5.5.5 | Notification actions work | Click opens event details | ⏳ |

---

### Phase 6: AI Integration Testing

#### P6.1 - Ollama Integration
**Test ID**: `AI-001`  
**PRD Reference**: Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P6.1.1 | Ollama connects | Successful connection to local API | ⏳ |
| TC-P6.1.2 | Model loads | Selected model initializes | ⏳ |
| TC-P6.1.3 | Query works | Receives response from model | ⏳ |
| TC-P6.1.4 | Error handling | Graceful failure if Ollama not running | ⏳ |
| TC-P6.1.5 | Performance acceptable | Response time <5 seconds | ⏳ |

---

#### P6.2 - Vector Index System
**Test ID**: `AI-002`  
**PRD Reference**: Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P6.2.1 | Vector DB initializes | Database/index created | ⏳ |
| TC-P6.2.2 | Embeddings generate | Text converts to vectors | ⏳ |
| TC-P6.2.3 | Embeddings store | Vectors save to database | ⏳ |
| TC-P6.2.4 | Vector search works | Similar content retrieved | ⏳ |
| TC-P6.2.5 | Performance acceptable | Search <500ms for 10k vectors | ⏳ |

---

#### P6.3 - Background Indexer
**Test ID**: `AI-003`  
**PRD Reference**: Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P6.3.1 | Indexer starts automatically | Begins indexing on app start | ⏳ |
| TC-P6.3.2 | Indexes all content types | Chat, docs, tasks indexed | ⏳ |
| TC-P6.3.3 | Incremental updates work | New content indexes automatically | ⏳ |
| TC-P6.3.4 | Doesn't block UI | Runs in background thread | ⏳ |
| TC-P6.3.5 | Progress tracking | Shows indexing status | ⏳ |

---

#### P6.4 - AI Context Connection
**Test ID**: `AI-004`  
**PRD Reference**: Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P6.4.1 | Queries use context | AI responses reference local data | ⏳ |
| TC-P6.4.2 | Context relevance | Retrieved context is relevant | ⏳ |
| TC-P6.4.3 | Multi-module context | Combines data from multiple modules | ⏳ |
| TC-P6.4.4 | Context freshness | Uses recently updated content | ⏳ |

---

#### P6.5 - RAG-Based Search
**Test ID**: `AI-005`  
**PRD Reference**: Section 3️⃣.F (AI Layer)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P6.5.1 | Semantic search works | Finds conceptually similar content | ⏳ |
| TC-P6.5.2 | Search accuracy | Relevant results ranked higher | ⏳ |
| TC-P6.5.3 | Summarization works | Generates coherent summaries | ⏳ |
| TC-P6.5.4 | Answer generation | Produces accurate answers | ⏳ |
| TC-P6.5.5 | Cites sources | References original content | ⏳ |

---

### Phase 7: MVP Polish & Packaging Testing

#### P7.1 - Global Search
**Test ID**: `POLISH-001`  
**PRD Reference**: Section 6️⃣ Phase 7

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P7.1.1 | Search all modules | Returns results from all types | ⏳ |
| TC-P7.1.2 | Search is fast | Results in <300ms | ⏳ |
| TC-P7.1.3 | Results are relevant | Ranked by relevance | ⏳ |
| TC-P7.1.4 | Keyboard shortcuts work | Ctrl/Cmd+K opens search | ⏳ |
| TC-P7.1.5 | Result preview works | Shows context around match | ⏳ |

---

#### P7.2 - Offline Caching & Recovery
**Test ID**: `POLISH-002`  
**PRD Reference**: Section 9️⃣ (Privacy & Security)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P7.2.1 | Works fully offline | All features function without network | ⏳ |
| TC-P7.2.2 | Crash recovery works | Unsaved data recovered on restart | ⏳ |
| TC-P7.2.3 | Data corruption detection | Detects and repairs corruption | ⏳ |
| TC-P7.2.4 | Backup creation works | Manual backup creates complete copy | ⏳ |
| TC-P7.2.5 | Restore from backup | Successfully restores all data | ⏳ |

---

#### P7.3 - Themes & Preferences
**Test ID**: `POLISH-003`  
**PRD Reference**: Section 6️⃣ Phase 7

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P7.3.1 | Dark theme works | All components styled correctly | ⏳ |
| TC-P7.3.2 | Light theme works | All components styled correctly | ⏳ |
| TC-P7.3.3 | Theme switches smoothly | No flashing or delay | ⏳ |
| TC-P7.3.4 | Preferences persist | Settings survive app restart | ⏳ |
| TC-P7.3.5 | Custom themes work | User can customize colors | ⏳ |

---

#### P7.4 - App Packaging
**Test ID**: `POLISH-004`  
**PRD Reference**: Section 7️⃣ (Deliverables)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P7.4.1 | macOS build works | DMG installs and runs | ⏳ |
| TC-P7.4.2 | Windows build works | EXE/MSI installs and runs | ⏳ |
| TC-P7.4.3 | Linux build works | AppImage/deb runs correctly | ⏳ |
| TC-P7.4.4 | Code signing works | Apps are properly signed | ⏳ |
| TC-P7.4.5 | Auto-updates work | Update mechanism functions | ⏳ |

---

#### P7.5 - Airplane Mode
**Test ID**: `POLISH-005`  
**PRD Reference**: Section 9️⃣ (Privacy & Security)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P7.5.1 | Toggle works | Blocks all network access | ⏳ |
| TC-P7.5.2 | All features work | No degradation in offline mode | ⏳ |
| TC-P7.5.3 | Visual indicator | Shows when airplane mode active | ⏳ |

---

#### P7.6 - Export/Import System
**Test ID**: `POLISH-006`  
**PRD Reference**: Section 9️⃣ (Privacy & Security)

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| TC-P7.6.1 | Full export works | Creates complete data archive | ⏳ |
| TC-P7.6.2 | Selective export works | Exports specific modules | ⏳ |
| TC-P7.6.3 | Import works | Restores exported data | ⏳ |
| TC-P7.6.4 | Data integrity | No data loss in export/import | ⏳ |
| TC-P7.6.5 | Format compatibility | Exports use standard formats | ⏳ |

---

## 🤖 Automated Test Suite

### Unit Tests

```javascript
// Example: Message CRUD Tests
describe('Message Service', () => {
  test('creates message with correct schema', async () => {
    const message = await createMessage({
      content: 'Test message',
      channelId: 1,
      userId: 1
    });
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('timestamp');
    expect(message.content).toBe('Test message');
  });

  test('retrieves messages by channel', async () => {
    const messages = await getMessagesByChannel(1);
    expect(Array.isArray(messages)).toBe(true);
  });

  test('updates message content', async () => {
    const updated = await updateMessage(1, { content: 'Updated' });
    expect(updated.content).toBe('Updated');
  });

  test('deletes message', async () => {
    await deleteMessage(1);
    const message = await getMessage(1);
    expect(message).toBeNull();
  });
});
```

### Integration Tests

```javascript
// Example: Cross-Module Linking Test
describe('Cross-Module Linking', () => {
  test('links task to document', async () => {
    const doc = await createDocument({ title: 'Test Doc' });
    const task = await createTask({ title: 'Test Task' });
    
    const link = await createLink({
      sourceType: 'task',
      sourceId: task.id,
      targetType: 'document',
      targetId: doc.id
    });
    
    expect(link).toBeDefined();
    
    const taskLinks = await getLinksForTask(task.id);
    expect(taskLinks).toContain(doc.id);
  });
});
```

### E2E Tests

```javascript
// Example: Complete User Flow Test
describe('User Workflow: Create Task from Document', () => {
  test('user creates document, generates tasks, completes task', async () => {
    // 1. Create document
    await navigateToModule('documents');
    await createNewDocument();
    await typeInEditor('Project requirements:\n- Build login\n- Add API');
    
    // 2. Generate tasks from document
    await clickAIButton('Generate Tasks');
    await waitForAIResponse();
    
    // 3. Verify tasks created
    await navigateToModule('tasks');
    const tasks = await getTasks();
    expect(tasks.length).toBeGreaterThan(0);
    
    // 4. Complete a task
    await dragTaskToColumn(tasks[0], 'done');
    
    // 5. Verify persistence
    await restartApp();
    await navigateToModule('tasks');
    const updatedTasks = await getTasks();
    expect(updatedTasks[0].status).toBe('done');
  });
});
```

---

## ✅ Manual Testing Checklist

### Pre-Release Manual Tests

#### Offline Functionality
- [ ] Disconnect from network
- [ ] Verify all modules load
- [ ] Create/edit content in each module
- [ ] Test AI features offline
- [ ] Restart app and verify data persists

#### Cross-Platform Testing
- [ ] Install on macOS (Intel and M1/M2)
- [ ] Install on Windows 10 and 11
- [ ] Install on Ubuntu Linux
- [ ] Test on different screen sizes
- [ ] Test with external monitors

#### Data Integrity
- [ ] Create 1000+ items across modules
- [ ] Perform full export
- [ ] Wipe database
- [ ] Import backup
- [ ] Verify all data restored

#### Performance Testing
- [ ] App startup time < 2 seconds
- [ ] Search response < 300ms
- [ ] AI response < 5 seconds
- [ ] No memory leaks after 1 hour use
- [ ] Database queries < 100ms

#### Security Testing
- [ ] Database file is encrypted
- [ ] Cannot read DB without app
- [ ] File permissions correct
- [ ] No data sent to network
- [ ] Crash logs don't contain sensitive data

---

## 🎯 Acceptance Criteria

### MVP Success Criteria (from PRD Section 10️⃣)

| Criteria | Test | Pass/Fail |
|----------|------|-----------|
| Fully functional on single user's device | All modules work independently | ⏳ |
| No internet or external dependency required | All offline tests pass | ⏳ |
| All modules share one unified database | Database schema complete | ⏳ |
| AI features operational via local LLM | All AI tests pass | ⏳ |
| Smooth UX, fast load, offline reliability | Performance benchmarks met | ⏳ |

---

## ⚡ Performance Benchmarks

### Startup Performance
- Cold start: < 2 seconds
- Warm start: < 1 second
- Initial database load: < 500ms

### Query Performance
- Simple SELECT: < 10ms
- Complex JOIN: < 50ms
- Full-text search: < 200ms
- Vector search: < 500ms

### UI Responsiveness
- User input to render: < 16ms (60fps)
- Module switching: < 100ms
- Search results: < 300ms

### AI Performance
- Embedding generation: < 1 second per document
- Summary generation: < 5 seconds
- RAG query: < 3 seconds

### Memory Usage
- Idle: < 200MB
- Active use: < 500MB
- With AI loaded: < 2GB

---

## 📊 Test Coverage Goals

- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: All critical user flows
- **Manual Tests**: 100% of checklist items

---

## 🐛 Bug Tracking

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 - Critical | App crashes, data loss | Immediate |
| P1 - High | Feature broken, workaround exists | 24 hours |
| P2 - Medium | Minor functionality issue | 1 week |
| P3 - Low | Cosmetic issue | 2 weeks |

### Bug Report Template

```markdown
**Title**: [Brief description]
**Severity**: P0/P1/P2/P3
**Module**: Chat/Docs/Tasks/Calendar/AI/Core
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected**: What should happen
**Actual**: What actually happens
**Screenshots**: [if applicable]
**Environment**: macOS/Windows/Linux, version X.Y.Z
**Test ID**: TC-XXX-X.X.X (if applicable)
```

---

## 📝 Test Execution Log

### Test Run Template

```markdown
**Date**: YYYY-MM-DD
**Phase**: X
**Tester**: Name
**Environment**: macOS/Windows/Linux
**Build Version**: X.Y.Z

**Tests Executed**: XX/XX
**Pass**: XX
**Fail**: XX
**Blocked**: XX

**Critical Issues**:
- [List any P0/P1 bugs found]

**Notes**:
- [Any additional observations]
```

---

**Reference Documents**:
- [Product Requirements Document](./prd.md)
- [Development To-Do List](./todo.md)

**Test Files**:
- Unit Tests: `/src/**/*.test.ts`
- Integration Tests: `/tests/integration/**/*.test.ts`
- E2E Tests: `/tests/e2e/**/*.spec.ts`

