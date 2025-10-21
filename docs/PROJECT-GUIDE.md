# 🚀 Play MVP - Project Guide

**Complete Reference for Building Play**  
**Last Updated**: October 9, 2025

---

## 📚 Document Overview

This project has four key reference documents that work together:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[prd.md](./prd.md)** | Product vision, requirements, and architecture | Understanding WHAT to build |
| **[todo.md](./todo.md)** | Development roadmap with 36 tasks across 7 phases | Tracking progress and dependencies |
| **[test-spec.md](./test-spec.md)** | 300+ test cases for quality assurance | Ensuring specifications are met |
| **[test-setup.md](./test-setup.md)** | Practical test framework implementation | Setting up and writing tests |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical architecture and implementation details | Understanding HOW to build |
| **PROJECT-GUIDE.md** (this file) | Master reference tying everything together | Quick navigation and workflow |

---

## 🎯 Quick Start Workflow

### For New Developers

1. **Read**: [prd.md](./prd.md) - Understand the vision and architecture
2. **Study**: [ARCHITECTURE.md](./ARCHITECTURE.md) - Learn technical implementation
3. **Review**: [todo.md](./todo.md) - See what needs to be built
4. **Setup**: [test-setup.md](./test-setup.md) - Configure test infrastructure
5. **Build**: Start with Phase 1, Task 1 (P1.1)
6. **Test**: Reference [test-spec.md](./test-spec.md) for acceptance criteria
7. **Repeat**: Complete → Test → Document → Next Task

### For Project Managers

1. Track progress using [todo.md](./todo.md)
2. Verify deliverables against [test-spec.md](./test-spec.md)
3. Reference [prd.md](./prd.md) for feature scope
4. Use this guide for overall project status

### For QA Engineers

1. Follow [test-spec.md](./test-spec.md) for test cases
2. Implement tests using [test-setup.md](./test-setup.md)
3. Verify features match [prd.md](./prd.md) requirements
4. Update test status in [test-spec.md](./test-spec.md)

---

## 📋 Development Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Core infrastructure

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P1.1: Tauri App Shell | §3️⃣.A, §5️⃣ | TC-P1.1.x (CORE-001) | ⏳ |
| P1.2: SQLite Database | §4️⃣ | TC-P1.2.x (CORE-002) | ⏳ |
| P1.3: User Settings | §3️⃣.A | TC-P1.3.x (CORE-003) | ⏳ |
| P1.4: Navigation | §5️⃣ | TC-P1.4.x (CORE-004) | ⏳ |
| P1.5: File Handling | §3️⃣.A | TC-P1.5.x (CORE-005) | ⏳ |

**Key Deliverable**: Working Tauri app with database and navigation

**Success Criteria**:
- [ ] App launches in <2 seconds
- [ ] All 8 database tables created
- [ ] Navigation between modules works
- [ ] File operations functional

---

### Phase 2: Chat Module (Weeks 3-4)
**Goal**: Local chat system

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P2.1: Chat Interface | §3️⃣.B | TC-P2.1.x (CHAT-001) | ⏳ |
| P2.2: Message CRUD | §3️⃣.B | TC-P2.2.x (CHAT-002) | ⏳ |
| P2.3: Markdown Composer | §3️⃣.B | TC-P2.3.x (CHAT-003) | ⏳ |
| P2.4: AI Summarization | §3️⃣.B, §3️⃣.F | TC-P2.4.x (CHAT-004) | ⏳ |
| P2.5: Local Search | §3️⃣.B | TC-P2.5.x (CHAT-005) | ⏳ |

**Key Deliverable**: Functional local chat with search

**Success Criteria**:
- [ ] Messages save and load correctly
- [ ] Markdown rendering works
- [ ] Search returns results in <200ms
- [ ] File attachments work

---

### Phase 3: Notes Module (Weeks 5-6)
**Goal**: Rich text document editor

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P3.1: TipTap Editor | §3️⃣.C | TC-P3.1.x (DOCS-001) | ⏳ |
| P3.2: Document Linking | §3️⃣.C | TC-P3.2.x (DOCS-002) | ⏳ |
| P3.3: Autosave/Export | §3️⃣.C | TC-P3.3.x (DOCS-003) | ⏳ |
| P3.4: AI Doc Tools | §3️⃣.C, §3️⃣.F | TC-P3.4.x (DOCS-004) | ⏳ |
| P3.5: Version History | §3️⃣.C | TC-P3.5.x (DOCS-005) | ⏳ |

**Key Deliverable**: Rich text editor with AI features

**Success Criteria**:
- [ ] Rich text formatting works
- [ ] Autosave triggers after 2s
- [ ] Links to other modules work
- [ ] Export to .md successful

---

### Phase 4: Tasks Module (Weeks 7-8)
**Goal**: Kanban task management

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P4.1: Kanban UI | §3️⃣.D | TC-P4.1.x (TASK-001) | ⏳ |
| P4.2: Task CRUD | §3️⃣.D | TC-P4.2.x (TASK-002) | ⏳ |
| P4.3: Task Linking | §3️⃣.D | TC-P4.3.x (TASK-003) | ⏳ |
| P4.4: AI Task Generation | §3️⃣.D, §3️⃣.F | TC-P4.4.x (TASK-004) | ⏳ |
| P4.5: Reminders/Filters | §3️⃣.D | TC-P4.5.x (TASK-005) | ⏳ |

**Key Deliverable**: Working Kanban board with cross-linking

**Success Criteria**:
- [ ] Drag-and-drop works
- [ ] Tasks link to chat/docs
- [ ] AI generates relevant tasks
- [ ] Filters work correctly

---

### Phase 5: Calendar Module (Weeks 9-10)
**Goal**: Event scheduling and notifications

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P5.1: Calendar Views | §3️⃣.E | TC-P5.1.x (CAL-001) | ⏳ |
| P5.2: Event Management | §3️⃣.E | TC-P5.2.x (CAL-002) | ⏳ |
| P5.3: Event-Task Linking | §3️⃣.E | TC-P5.3.x (CAL-003) | ⏳ |
| P5.4: ICS Import/Export | §3️⃣.E | TC-P5.4.x (CAL-004) | ⏳ |
| P5.5: OS Notifications | §3️⃣.E | TC-P5.5.x (CAL-005) | ⏳ |

**Key Deliverable**: Full calendar with notifications

**Success Criteria**:
- [ ] All views (day/week/month) render
- [ ] Events link to tasks
- [ ] ICS import/export works
- [ ] Notifications trigger on time

---

### Phase 6: AI Integration (Weeks 11-13)
**Goal**: Local LLM and semantic search

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P6.1: Ollama Integration | §3️⃣.F | TC-P6.1.x (AI-001) | ⏳ |
| P6.2: Vector Index | §3️⃣.F | TC-P6.2.x (AI-002) | ⏳ |
| P6.3: Background Indexer | §3️⃣.F | TC-P6.3.x (AI-003) | ⏳ |
| P6.4: AI Context | §3️⃣.F | TC-P6.4.x (AI-004) | ⏳ |
| P6.5: RAG Search | §3️⃣.F | TC-P6.5.x (AI-005) | ⏳ |

**Key Deliverable**: Working local AI with semantic search

**Success Criteria**:
- [ ] Ollama connects successfully
- [ ] Embeddings generate and store
- [ ] Semantic search works
- [ ] AI responses use local context

---

### Phase 7: MVP Polish (Weeks 14-16)
**Goal**: Production-ready application

| Task | PRD Reference | Test Reference | Status |
|------|---------------|----------------|--------|
| P7.1: Global Search | §6️⃣ Phase 7 | TC-P7.1.x (POLISH-001) | ⏳ |
| P7.2: Offline/Recovery | §9️⃣ | TC-P7.2.x (POLISH-002) | ⏳ |
| P7.3: Themes | §6️⃣ Phase 7 | TC-P7.3.x (POLISH-003) | ⏳ |
| P7.4: Packaging | §7️⃣ | TC-P7.4.x (POLISH-004) | ⏳ |
| P7.5: Airplane Mode | §9️⃣ | TC-P7.5.x (POLISH-005) | ⏳ |
| P7.6: Export/Import | §9️⃣ | TC-P7.6.x (POLISH-006) | ⏳ |

**Key Deliverable**: Signed desktop app for all platforms

**Success Criteria**:
- [ ] Global search <300ms
- [ ] Works fully offline
- [ ] Themes apply consistently
- [ ] Builds for macOS/Windows/Linux

---

## 🧪 Testing Strategy

### Test Coverage Requirements

| Test Type | Target | Current |
|-----------|--------|---------|
| Unit Tests | 80% | 0% |
| Integration Tests | 100% of APIs | 0% |
| E2E Tests | All critical flows | 0% |
| Manual Tests | 100% of checklist | 0% |

### Test Execution Schedule

**During Development**:
- Run unit tests before each commit
- Run integration tests before each PR
- Run affected E2E tests for feature changes

**Before Release**:
- Complete automated test suite
- Execute manual testing checklist
- Cross-platform testing (macOS, Windows, Linux)
- Performance benchmarking
- Security audit

### Test Documentation

- **Write tests as you code**: Don't wait until the end
- **Update test specs**: Keep [test-spec.md](./test-spec.md) current
- **Document test failures**: Track in test execution log
- **Maintain test data**: Keep fixtures up to date

---

## 📊 Progress Tracking

### Weekly Review Questions

1. **Tasks Completed**: Which tasks from [todo.md](./todo.md) are done?
2. **Tests Passed**: Which test cases from [test-spec.md](./test-spec.md) pass?
3. **Blockers**: Any technical decisions or issues blocking progress?
4. **Next Week**: Which tasks are planned for next week?

### Phase Completion Checklist

Before marking a phase complete:
- [ ] All tasks in phase completed
- [ ] All phase tests passing
- [ ] Code reviewed and merged
- [ ] Documentation updated
- [ ] No P0 or P1 bugs remaining
- [ ] Performance benchmarks met
- [ ] Demo prepared for stakeholders

---

## 🔄 Change Management

### Updating Requirements

If requirements change:
1. Update [prd.md](./prd.md) with new specification
2. Update [todo.md](./todo.md) with new/modified tasks
3. Update [test-spec.md](./test-spec.md) with new test cases
4. Update this guide if workflow changes
5. Communicate changes to team

### Adding Features

For new features:
1. Document in PRD (what and why)
2. Create tasks in todo list (how and when)
3. Define test cases (acceptance criteria)
4. Implement test infrastructure if needed
5. Build → Test → Document → Review

---

## 🎯 Success Metrics

### MVP Success Criteria (from PRD §10️⃣)

| Criteria | Measurement | Target | Status |
|----------|-------------|--------|--------|
| Fully functional on single device | All modules work independently | 100% | ⏳ |
| No internet dependency | All offline tests pass | 100% | ⏳ |
| Unified database | Database schema complete | 8 tables | ⏳ |
| AI features operational | All AI tests pass | 100% | ⏳ |
| Smooth UX, fast load | Performance benchmarks met | All pass | ⏳ |

### Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| App startup | <2s | - |
| Database queries | <100ms | - |
| Search results | <300ms | - |
| AI response | <5s | - |
| Memory usage | <500MB active | - |

---

## 🛠️ Technical Stack Reference

### Core Technologies (from PRD §5️⃣)

```
Frontend:   React + Tailwind + shadcn/ui
Shell:      Tauri
Backend:    Node.js (NestJS) or Rust (Axum) [Decision pending]
Database:   SQLite (SQLCipher for encryption)
Sync:       Yjs or Automerge [Decision pending]
AI:         Ollama / LM Studio
Vector DB:  pgvector / LanceDB [Decision pending]
```

### Key Dependencies

```json
{
  "frontend": [
    "react",
    "tailwindcss",
    "@shadcn/ui",
    "@tiptap/react",
    "yjs"
  ],
  "backend": [
    "better-sqlite3",
    "sqlcipher",
    "@tauri-apps/api"
  ],
  "ai": [
    "ollama-js",
    "pgvector" // or "lancedb"
  ],
  "testing": [
    "vitest",
    "@testing-library/react",
    "playwright"
  ]
}
```

---

## 📁 Project Structure

```
play/
├── docs/                           # Project documentation
│   ├── prd.md                      # Product requirements
│   ├── todo.md                     # Development roadmap
│   ├── test-spec.md                # Test specification
│   ├── test-setup.md               # Test framework guide
│   └── PROJECT-GUIDE.md            # This file
├── src/
│   ├── components/                 # React components
│   │   ├── Chat/
│   │   ├── Documents/
│   │   ├── Tasks/
│   │   ├── Calendar/
│   │   └── shared/
│   ├── services/                   # Business logic
│   │   ├── database/               # Database operations
│   │   ├── ai/                     # AI integrations
│   │   ├── storage/                # File handling
│   │   └── sync/                   # State management
│   ├── utils/                      # Utilities
│   ├── types/                      # TypeScript types
│   └── App.tsx                     # Main app component
├── src-tauri/                      # Tauri backend
│   ├── src/
│   │   ├── main.rs                 # Rust entry point
│   │   └── commands/               # Tauri commands
│   └── tauri.conf.json             # Tauri configuration
├── tests/                          # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json                    # Dependencies
├── vitest.config.ts                # Vitest config
└── playwright.config.ts            # Playwright config
```

---

## 🚀 Getting Started Commands

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd play

# Install dependencies
npm install

# Initialize test database
npm run test:setup

# Start development
npm run tauri dev
```

### Development Workflow

```bash
# Start dev server
npm run tauri dev

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm run test:all

# Run specific phase tests
npm run test -- tests/integration/phase-1

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Building

```bash
# Build for development
npm run tauri build --debug

# Build for production
npm run tauri build

# Build for specific platform
npm run tauri build -- --target x86_64-apple-darwin
```

---

## 🔍 Finding Information Quickly

### "Where do I find...?"

| Looking for... | Check... |
|----------------|----------|
| Feature specifications | [prd.md](./prd.md) §3️⃣ |
| Data model/schema | [ARCHITECTURE.md](./ARCHITECTURE.md) Data Layer |
| Tech stack decisions | [todo.md](./todo.md) Technical Decisions |
| Implementation details | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Current task priorities | [todo.md](./todo.md) |
| What's blocking | [todo.md](./todo.md) Notes section |
| Test cases for feature X | [test-spec.md](./test-spec.md) search for feature |
| How to write tests | [test-setup.md](./test-setup.md) |
| Performance targets | [test-spec.md](./test-spec.md) Performance Benchmarks |
| Success criteria | [prd.md](./prd.md) §10️⃣ |
| Post-MVP features | [prd.md](./prd.md) §8️⃣ |

---

## 💡 Best Practices

### Development

1. **Follow the phases**: Don't skip ahead - each builds on previous
2. **Test as you build**: Write tests alongside implementation
3. **Keep docs updated**: Update all 4 reference docs as needed
4. **Commit frequently**: Small, focused commits with clear messages
5. **Review regularly**: Check [todo.md](./todo.md) daily, other docs weekly

### Testing

1. **Test offline first**: Ensure all tests work without network
2. **Test cross-platform**: Run on macOS, Windows, Linux regularly
3. **Monitor performance**: Track against benchmarks
4. **Document failures**: Use bug report template from [test-spec.md](./test-spec.md)
5. **Maintain coverage**: Keep above 80% unit test coverage

### Documentation

1. **Single source of truth**: Each doc has a specific purpose
2. **Reference links**: Link between docs for traceability
3. **Version control**: Track doc changes in git
4. **Clear updates**: Note what changed and why
5. **Regular reviews**: Ensure docs stay current

---

## 📞 Common Questions

### Q: Which backend should I use - Node.js or Rust?
**A**: See [todo.md](./todo.md) "Technical Decisions Pending". Recommendation: Rust (Axum) for better Tauri integration and performance.

### Q: Which vector database - pgvector or LanceDB?
**A**: See [todo.md](./todo.md) "Technical Decisions Pending". Recommendation: LanceDB for easier local setup and pure Rust option.

### Q: Do I need to implement all AI features in MVP?
**A**: Yes, per [prd.md](./prd.md) §10️⃣, "AI features operational via local LLM" is a success criterion. However, AI is additive - build core features first, then add AI enhancement.

### Q: What if I find a bug in the requirements?
**A**: Update [prd.md](./prd.md), then cascade changes to [todo.md](./todo.md) and [test-spec.md](./test-spec.md). Document in commit message.

### Q: How do I know if my implementation is correct?
**A**: Reference corresponding test cases in [test-spec.md](./test-spec.md). If all tests pass, implementation meets specification.

---

## 🎯 Next Steps

### Starting Development

1. ✅ Read this guide
2. ✅ Review [prd.md](./prd.md) completely
3. ⏳ Set up development environment
4. ⏳ Install test infrastructure ([test-setup.md](./test-setup.md))
5. ⏳ Start Phase 1, Task P1.1
6. ⏳ Write tests as you build
7. ⏳ Update [todo.md](./todo.md) progress
8. ⏳ Repeat for each task

### Weekly Routine

**Monday**:
- Review [todo.md](./todo.md)
- Plan week's tasks
- Check for blockers

**Daily**:
- Write code
- Write tests
- Update task status
- Commit progress

**Friday**:
- Run full test suite
- Update progress metrics
- Plan next week
- Document learnings

---

## 📚 Document Quick Reference

### [prd.md](./prd.md) - Product Requirements
- **§1-2**: Vision and roadmap
- **§3**: Core modules (A-F)
- **§4**: Data model (8 tables)
- **§5**: Tech stack
- **§6**: Build steps (7 phases)
- **§7**: Deliverables
- **§8**: Post-MVP features
- **§9**: Privacy & security
- **§10**: Success criteria

### [todo.md](./todo.md) - Development Roadmap
- 36 tasks across 7 phases
- Dependencies and estimates
- Success criteria per phase
- Technical decision tracking
- Progress checkboxes

### [test-spec.md](./test-spec.md) - Test Specification
- 300+ test cases
- Testing pyramid strategy
- Performance benchmarks
- Automated test examples
- Manual testing checklists
- Bug tracking system

### [test-setup.md](./test-setup.md) - Test Framework
- Setup instructions
- Configuration files
- Example test files
- Running tests
- Best practices
- Debugging guide

### [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Architecture
- System architecture diagrams
- Database schema with SQL
- Rust backend structure
- React frontend structure
- AI integration patterns
- Security implementation
- Development setup guide

---

## ✅ Summary

**Play** is an ambitious MVP that will take ~16 weeks to build. Success requires:

1. **Clear vision**: Follow [prd.md](./prd.md)
2. **Structured approach**: Use [todo.md](./todo.md)
3. **Quality assurance**: Test against [test-spec.md](./test-spec.md)
4. **Practical implementation**: Apply [test-setup.md](./test-setup.md)
5. **Consistent tracking**: Reference this guide

**Remember**: Build incrementally, test continuously, document thoroughly, and reference these docs often!

---

**Document Status**: ✅ Complete and Ready for Use

**Last Review**: October 9, 2025  
**Next Review**: Start of each phase  
**Maintained By**: Development Team

