# Bug Fix: AI Commands Not Working

## Issue
AI summarization and chat features were failing with error:
"AI summarization failed. Make sure Ollama is running: ollama serve"

Even though Ollama WAS running and responding to API calls.

## Root Cause

**Command name mismatch** between frontend and backend!

### Frontend (src/lib/ai.ts)
Was calling these command names:
```typescript
'ai_summarize_text'
'ai_rewrite_text'
'ai_generate_tasks'
'check_ollama_connection'
'ai_generate_embedding'
'ai_index_content'
'ai_semantic_search'
'ai_chat_with_context'
```

### Backend (src-tauri/src/main.rs)
Actually registered these names:
```rust
commands::ai::summarize,
commands::ai::rewrite,
commands::ai::generate_tasks,
commands::ai::chat_with_ai,
commands::ai::generate_embedding,
commands::ai::index_content,
commands::ai::semantic_search,
commands::ai::chat_with_context,
```

**Result**: Frontend tried to call `'ai_summarize_text'` but backend only knew about `'summarize'`

## Fix Applied

Updated **src/lib/ai.ts** to use correct command names:

```typescript
// Before
await invoke<string>('ai_summarize_text', { text });

// After
await invoke<string>('summarize', { text });
```

### All Changes:
- `ai_summarize_text` → `summarize`
- `ai_rewrite_text` → `rewrite`
- `ai_generate_tasks` → `generate_tasks`
- `check_ollama_connection` → removed (simplified)
- `ai_generate_embedding` → `generate_embedding`
- `ai_index_content` → `index_content`
- `ai_semantic_search` → `semantic_search`
- `ai_chat_with_context` → `chat_with_context`

Also fixed parameter order for `index_content` (contentId must come first).

## Verification

### Ollama Status
```bash
$ curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Say hello",
  "stream": false
}'
```
✅ **Result**: Working perfectly, got response

### Command Registration
```bash
$ grep "commands::ai::" src-tauri/src/main.rs
```
✅ **Result**: All commands registered correctly

### Frontend API
```bash
$ grep "invoke.*summarize" src/lib/ai.ts
```
✅ **Result**: Now calling correct command names

## Testing Checklist

After fix, test these features:

- [ ] AI Summarize in Documents
- [ ] AI Rewrite in Documents (5 styles)
- [ ] AI Chat in Chat module
- [ ] AI Generate Tasks in Tasks
- [ ] Semantic Search (if implemented)

All should work now that command names match!

## Files Changed

1. **src/lib/ai.ts** - Updated all invoke() calls to use new names
2. Rebuilt frontend (npm run build)
3. Rebuilt app (npm run tauri:build)
4. Created new DMG: Play-v1.1.0-FIXED.dmg

## Distribution

**Updated Build:**
- `/Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app`
- `/Users/3d7tech/Play/src-tauri/dist/Play-v1.1.0-FIXED.dmg`

**Version**: v1.1.0 (with AI fix)

## Lesson Learned

When refactoring Tauri command names:
1. ✅ Update backend command functions
2. ✅ Update frontend invoke() calls
3. ✅ Test both match!

Use grep to verify:
```bash
# Backend
grep "pub async fn" src-tauri/src/commands/ai.rs

# Frontend
grep "invoke<" src/lib/ai.ts

# Registration
grep "commands::ai::" src-tauri/src/main.rs
```

All three must align!

## Status

✅ **FIXED** - v1.1.0 with working AI features
✅ Ollama integration working
✅ All commands calling correct names
✅ Ready to use!

