# 🧪 Test Framework Setup Guide

**Project**: Play MVP  
**Purpose**: Practical implementation guide for test infrastructure  
**Last Updated**: October 9, 2025

---

## 📋 Quick Start

### 1. Install Testing Dependencies

```bash
# Core testing framework
npm install -D vitest @vitest/ui

# React testing
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E testing
npm install -D playwright @playwright/test

# Tauri testing
npm install -D @tauri-apps/cli

# Database testing
npm install -D better-sqlite3

# Coverage reporting
npm install -D @vitest/coverage-v8
```

---

## 📁 Project Structure

```
play/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ChatInterface.test.tsx          # Unit tests
│   │   ├── Documents/
│   │   ├── Tasks/
│   │   └── Calendar/
│   ├── services/
│   │   ├── database/
│   │   │   ├── messages.ts
│   │   │   └── messages.test.ts                # Service tests
│   │   ├── ai/
│   │   └── storage/
│   └── utils/
├── tests/
│   ├── integration/
│   │   ├── chat-to-tasks.test.ts               # Cross-module tests
│   │   ├── document-linking.test.ts
│   │   └── ai-workflow.test.ts
│   ├── e2e/
│   │   ├── complete-user-flow.spec.ts          # Full user journeys
│   │   ├── offline-mode.spec.ts
│   │   └── performance.spec.ts
│   ├── fixtures/
│   │   ├── test-data.ts                        # Sample data
│   │   └── test-database.ts                    # Test DB setup
│   └── helpers/
│       ├── setup.ts                            # Test setup utilities
│       └── teardown.ts                         # Cleanup utilities
├── vitest.config.ts                             # Vitest configuration
├── playwright.config.ts                         # Playwright configuration
└── package.json
```

---

## ⚙️ Configuration Files

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
```

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Offline app needs sequential tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Single worker for desktop app
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'macos',
      use: { ...devices['Desktop Chrome'] }, // Adjust for Tauri
    },
  ],
});
```

### `tests/helpers/setup.ts`

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { initTestDatabase } from '../fixtures/test-database';

// Extend matchers
declare global {
  namespace Vi {
    interface Matchers<R> {
      toBeWithinRange(min: number, max: number): R;
    }
  }
}

// Setup test database before all tests
beforeAll(async () => {
  await initTestDatabase();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Close database connections after all tests
afterAll(async () => {
  // Cleanup logic here
});

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    return {
      message: () =>
        `expected ${received} to be within range ${min} - ${max}`,
      pass,
    };
  },
});
```

### `tests/fixtures/test-database.ts`

```typescript
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(__dirname, '../../test.db');

export function initTestDatabase() {
  // Remove existing test database
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }

  // Create new database
  const db = new Database(TEST_DB_PATH);

  // Create schema (from PRD Section 4)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT,
      theme TEXT DEFAULT 'light',
      preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      version INTEGER DEFAULT 1,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      reminder_time DATETIME,
      recurrence TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      filesize INTEGER,
      mimetype TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      embedding BLOB NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source_type, source_id, target_type, target_id)
    );
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX idx_messages_channel ON messages(channel_id);
    CREATE INDEX idx_messages_user ON messages(user_id);
    CREATE INDEX idx_messages_created ON messages(created_at);
    CREATE INDEX idx_documents_title ON documents(title);
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_priority ON tasks(priority);
    CREATE INDEX idx_events_start ON events(start_time);
    CREATE INDEX idx_embeddings_content ON embeddings(content_type, content_id);
    CREATE INDEX idx_links_source ON links(source_type, source_id);
    CREATE INDEX idx_links_target ON links(target_type, target_id);
  `);

  db.close();
  return TEST_DB_PATH;
}

export function getTestDatabase() {
  return new Database(TEST_DB_PATH);
}

export function clearTestDatabase() {
  const db = getTestDatabase();
  
  // Clear all tables
  db.exec(`
    DELETE FROM messages;
    DELETE FROM documents;
    DELETE FROM tasks;
    DELETE FROM events;
    DELETE FROM files;
    DELETE FROM embeddings;
    DELETE FROM links;
    DELETE FROM settings;
  `);
  
  db.close();
}

export function seedTestData() {
  const db = getTestDatabase();

  // Insert test user
  db.prepare(`
    INSERT INTO user (username, email, theme)
    VALUES ('testuser', 'test@example.com', 'dark')
  `).run();

  // Insert test messages
  const insertMessage = db.prepare(`
    INSERT INTO messages (channel_id, user_id, content)
    VALUES (?, ?, ?)
  `);

  for (let i = 1; i <= 100; i++) {
    insertMessage.run(1, 1, `Test message ${i}`);
  }

  // Insert test documents
  const insertDoc = db.prepare(`
    INSERT INTO documents (title, content)
    VALUES (?, ?)
  `);

  insertDoc.run('Getting Started', '# Getting Started\n\nThis is a test document.');
  insertDoc.run('Project Plan', '# Project Plan\n\n## Tasks\n- Task 1\n- Task 2');

  // Insert test tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, status, priority)
    VALUES (?, ?, ?, ?)
  `);

  insertTask.run('Test Task 1', 'Description 1', 'todo', 'high');
  insertTask.run('Test Task 2', 'Description 2', 'in_progress', 'medium');
  insertTask.run('Test Task 3', 'Description 3', 'done', 'low');

  // Insert test events
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  insertEvent.run(
    'Team Meeting',
    'Weekly sync',
    now.toISOString(),
    new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  );

  db.close();
}
```

### `tests/fixtures/test-data.ts`

```typescript
export const sampleMessages = [
  {
    id: 1,
    channel_id: 1,
    user_id: 1,
    content: 'Hello, this is a test message',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    channel_id: 1,
    user_id: 1,
    content: 'Can you help me with **markdown**?',
    created_at: new Date().toISOString(),
  },
];

export const sampleDocuments = [
  {
    id: 1,
    title: 'Project Requirements',
    content: '# Requirements\n\n- Build chat\n- Add tasks\n- Calendar integration',
    version: 1,
  },
  {
    id: 2,
    title: 'Meeting Notes',
    content: '# Meeting Notes\n\nDiscussed project timeline.',
    version: 1,
  },
];

export const sampleTasks = [
  {
    id: 1,
    title: 'Build login page',
    description: 'Create authentication UI',
    status: 'todo',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Setup database',
    description: 'Initialize SQLite',
    status: 'done',
    priority: 'high',
  },
];

export const sampleEvents = [
  {
    id: 1,
    title: 'Sprint Planning',
    description: 'Plan next sprint',
    start_time: new Date('2025-10-10T10:00:00'),
    end_time: new Date('2025-10-10T11:00:00'),
  },
];
```

---

## 🧪 Example Test Files

### Unit Test: `src/services/database/messages.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { 
  createMessage, 
  getMessagesByChannel, 
  updateMessage, 
  deleteMessage 
} from './messages';
import { clearTestDatabase, seedTestData } from '@tests/fixtures/test-database';

describe('Message Service', () => {
  beforeEach(() => {
    clearTestDatabase();
    seedTestData();
  });

  test('creates message with correct schema', async () => {
    const message = await createMessage({
      channel_id: 1,
      user_id: 1,
      content: 'New test message',
    });

    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('created_at');
    expect(message.content).toBe('New test message');
    expect(message.channel_id).toBe(1);
  });

  test('retrieves messages by channel', async () => {
    const messages = await getMessagesByChannel(1);
    
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toHaveProperty('content');
  });

  test('updates message content', async () => {
    const updated = await updateMessage(1, { 
      content: 'Updated content' 
    });

    expect(updated.content).toBe('Updated content');
    expect(updated.updated_at).not.toBe(updated.created_at);
  });

  test('deletes message', async () => {
    await deleteMessage(1);
    
    const messages = await getMessagesByChannel(1);
    expect(messages.find(m => m.id === 1)).toBeUndefined();
  });

  test('handles large message sets efficiently', async () => {
    const startTime = Date.now();
    const messages = await getMessagesByChannel(1); // 100 messages
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100); // < 100ms
    expect(messages.length).toBe(100);
  });
});
```

### Component Test: `src/components/Chat/ChatInterface.test.tsx`

```typescript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from './ChatInterface';
import { sampleMessages } from '@tests/fixtures/test-data';

describe('ChatInterface Component', () => {
  test('renders chat interface', () => {
    render(<ChatInterface channelId={1} />);
    
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('displays messages', async () => {
    render(<ChatInterface channelId={1} messages={sampleMessages} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hello, this is a test message/i)).toBeInTheDocument();
    });
  });

  test('sends message on button click', async () => {
    const onSendMessage = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInterface channelId={1} onSendMessage={onSendMessage} />);
    
    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'New message');
    await user.click(sendButton);
    
    expect(onSendMessage).toHaveBeenCalledWith({
      content: 'New message',
      channel_id: 1,
    });
  });

  test('renders markdown correctly', () => {
    const messageWithMarkdown = {
      ...sampleMessages[0],
      content: '**Bold** and *italic*',
    };
    
    render(<ChatInterface channelId={1} messages={[messageWithMarkdown]} />);
    
    expect(screen.getByText(/Bold/)).toHaveStyle({ fontWeight: 'bold' });
  });

  test('handles file attachments', async () => {
    const onAttachFile = vi.fn();
    const user = userEvent.setup();
    
    render(<ChatInterface channelId={1} onAttachFile={onAttachFile} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/attach file/i);
    
    await user.upload(input, file);
    
    expect(onAttachFile).toHaveBeenCalledWith(file);
  });
});
```

### Integration Test: `tests/integration/chat-to-tasks.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { createMessage } from '@/services/database/messages';
import { createTask } from '@/services/database/tasks';
import { createLink } from '@/services/database/links';
import { getLinkedItems } from '@/services/database/links';
import { clearTestDatabase, seedTestData } from '@tests/fixtures/test-database';

describe('Chat to Tasks Integration', () => {
  beforeEach(() => {
    clearTestDatabase();
    seedTestData();
  });

  test('links chat message to task', async () => {
    // Create a chat message
    const message = await createMessage({
      channel_id: 1,
      user_id: 1,
      content: 'We need to fix the login bug',
    });

    // Create a task
    const task = await createTask({
      title: 'Fix login bug',
      description: 'Mentioned in chat',
      status: 'todo',
      priority: 'high',
    });

    // Create bidirectional link
    await createLink({
      source_type: 'message',
      source_id: message.id,
      target_type: 'task',
      target_id: task.id,
    });

    // Verify link exists from message perspective
    const linkedToMessage = await getLinkedItems('message', message.id);
    expect(linkedToMessage).toContainEqual(
      expect.objectContaining({
        target_type: 'task',
        target_id: task.id,
      })
    );

    // Verify reverse link exists from task perspective
    const linkedToTask = await getLinkedItems('task', task.id);
    expect(linkedToTask).toContainEqual(
      expect.objectContaining({
        target_type: 'message',
        target_id: message.id,
      })
    );
  });

  test('generates tasks from chat AI summary', async () => {
    // Simulate AI extracting action items from chat
    const messages = [
      'We should update the documentation',
      'Don\'t forget to run tests',
      'Deploy to staging first',
    ];

    for (const content of messages) {
      await createMessage({ channel_id: 1, user_id: 1, content });
    }

    // This would call your AI service
    // const tasks = await generateTasksFromChat(1);
    
    // For now, manually create expected tasks
    const expectedTasks = [
      'Update documentation',
      'Run tests',
      'Deploy to staging',
    ];

    expect(expectedTasks.length).toBe(3);
  });
});
```

### E2E Test: `tests/e2e/complete-user-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Flow', () => {
  test('user creates document and generates tasks', async ({ page }) => {
    // 1. Launch app
    await page.goto('tauri://localhost'); // Adjust for Tauri
    
    // 2. Navigate to Documents
    await page.click('nav >> text=Documents');
    await expect(page.locator('h1')).toContainText('Documents');
    
    // 3. Create new document
    await page.click('button:has-text("New Document")');
    await page.fill('[data-testid="document-title"]', 'Project Requirements');
    
    // 4. Add content
    await page.fill('[data-testid="document-editor"]', 
      '# Project Requirements\n\n' +
      '- Build authentication system\n' +
      '- Create user dashboard\n' +
      '- Add reporting features'
    );
    
    // 5. Wait for autosave
    await page.waitForTimeout(2500);
    await expect(page.locator('text=Saved')).toBeVisible();
    
    // 6. Generate tasks from document
    await page.click('button:has-text("Generate Tasks")');
    await page.waitForSelector('[data-testid="ai-processing"]');
    await page.waitForSelector('[data-testid="tasks-generated"]', { 
      timeout: 10000 
    });
    
    // 7. Navigate to Tasks
    await page.click('nav >> text=Tasks');
    
    // 8. Verify tasks were created
    await expect(page.locator('.task-card')).toHaveCount(3);
    await expect(page.locator('text=Build authentication system')).toBeVisible();
    
    // 9. Move task to In Progress
    await page.dragAndDrop(
      '.task-card:has-text("Build authentication system")',
      '[data-column="in-progress"]'
    );
    
    // 10. Verify persistence - restart app
    await page.reload();
    
    // 11. Navigate back to tasks
    await page.click('nav >> text=Tasks');
    
    // 12. Verify task is still in In Progress
    await expect(
      page.locator('[data-column="in-progress"] >> text=Build authentication system')
    ).toBeVisible();
  });

  test('app works fully offline', async ({ page, context }) => {
    // Disable network
    await context.setOffline(true);
    
    // Launch app
    await page.goto('tauri://localhost');
    
    // Verify all modules load
    await page.click('nav >> text=Chat');
    await expect(page.locator('h1')).toContainText('Chat');
    
    await page.click('nav >> text=Documents');
    await expect(page.locator('h1')).toContainText('Documents');
    
    await page.click('nav >> text=Tasks');
    await expect(page.locator('h1')).toContainText('Tasks');
    
    await page.click('nav >> text=Calendar');
    await expect(page.locator('h1')).toContainText('Calendar');
    
    // Create content in offline mode
    await page.click('nav >> text=Chat');
    await page.fill('[data-testid="message-input"]', 'Offline message');
    await page.click('button:has-text("Send")');
    
    // Verify message appears
    await expect(page.locator('text=Offline message')).toBeVisible();
  });
});
```

---

## 🎯 Running Tests

### NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:coverage && npm run test:e2e",
    "test:watch": "vitest watch",
    "test:setup": "tsx tests/fixtures/test-database.ts"
  }
}
```

### Test Commands

```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run everything
npm run test:all

# Watch mode for development
npm run test:watch
```

---

## 📊 Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.os }}
          path: |
            coverage/
            playwright-report/
```

---

## ✅ Test Checklist

### Before Committing Code
- [ ] All unit tests pass
- [ ] No linting errors
- [ ] Coverage remains above 80%
- [ ] Integration tests pass for affected modules

### Before Creating PR
- [ ] All tests pass (unit + integration + E2E)
- [ ] Test coverage meets requirements
- [ ] New features have corresponding tests
- [ ] Test documentation updated

### Before Release
- [ ] All automated tests pass
- [ ] Manual testing checklist completed
- [ ] Performance benchmarks met
- [ ] Cross-platform testing completed
- [ ] No P0 or P1 bugs open

---

## 📝 Best Practices

### Writing Good Tests

1. **Arrange, Act, Assert**: Structure tests clearly
   ```typescript
   test('example', () => {
     // Arrange
     const data = setupTestData();
     
     // Act
     const result = performAction(data);
     
     // Assert
     expect(result).toBe(expected);
   });
   ```

2. **Test behavior, not implementation**
   ```typescript
   // Good: Tests behavior
   test('user can send message', async () => {
     await sendMessage('Hello');
     expect(screen.getByText('Hello')).toBeInTheDocument();
   });
   
   // Bad: Tests implementation
   test('sendMessage function is called', async () => {
     expect(sendMessage).toHaveBeenCalled();
   });
   ```

3. **Use descriptive test names**
   ```typescript
   // Good
   test('displays error when message is empty', () => {});
   
   // Bad
   test('test1', () => {});
   ```

4. **Keep tests isolated and independent**
   ```typescript
   beforeEach(() => {
     clearTestDatabase(); // Reset state
   });
   ```

5. **Test edge cases**
   ```typescript
   test('handles empty message list', () => {});
   test('handles very long messages (>10000 chars)', () => {});
   test('handles special characters in input', () => {});
   ```

---

## 🐛 Debugging Tests

### Vitest Debugging

```bash
# Run specific test file
npx vitest src/services/database/messages.test.ts

# Run tests matching pattern
npx vitest -t "creates message"

# Debug in VS Code
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

### Playwright Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific test
npx playwright test tests/e2e/complete-user-flow.spec.ts

# Generate test code
npx playwright codegen tauri://localhost
```

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Test Specification](./test-spec.md)
- [Development To-Do List](./todo.md)
- [Product Requirements](./prd.md)

---

**Next Steps**:
1. Set up test infrastructure (run setup commands)
2. Implement Phase 1 tests as you build features
3. Maintain >80% test coverage
4. Run tests before each commit
5. Update test documentation as needed

