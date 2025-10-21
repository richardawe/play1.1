# Debug: AI Connection Issues

## Issue
AI summarization and chat not working with error:
"AI summarization failed. Make sure Ollama is running: ollama serve"

## Verified Status
✅ Ollama IS running (port 11434)
✅ Models are installed (llama3.2, nomic-embed-text)
✅ API responds to curl tests
✅ App was rebuilt with port 11434 configured

## Possible Causes

### 1. CORS Issue
The frontend might be blocked by CORS when calling Ollama from Tauri.

**Fix**: Tauri should handle this via IPC, not direct HTTP calls.

### 2. IPC Command Not Registered
The `summarize` command might not be properly registered in main.rs.

**Check**:
```bash
grep "summarize" src-tauri/src/main.rs
```

### 3. Wrong Build Being Run
The old build might still be running instead of the new one.

**Fix**: 
```bash
# Kill all instances
killall Play

# Run in dev mode to see errors
npm run tauri:dev
```

### 4. Frontend Calling Wrong Function
The frontend might be calling old function names.

**Check**: 
- `src/components/ai/AISummarizeButton.tsx`
- Should call `invoke('summarize', { text })`

## Debugging Steps

### Step 1: Test Ollama Directly
```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Say hello",
  "stream": false
}'
```

**Expected**: JSON response with generated text

### Step 2: Check Tauri IPC
Open dev mode and check browser console:
```bash
npm run tauri:dev
```

Then try AI summarize and look for:
- IPC command errors
- Rust backend errors in terminal
- Network errors

### Step 3: Verify Command Registration
```bash
# Check main.rs has all AI commands
grep -A5 "invoke_handler" src-tauri/src/main.rs | grep summarize
```

**Expected**: Should see `commands::ai::summarize`

### Step 4: Check Frontend Code
```bash
# Check what the summarize button is calling
grep -r "invoke.*summarize" src/components/
```

**Expected**: Should see `invoke('summarize', { text: ... })`

## Quick Fixes to Try

### Fix 1: Run in Dev Mode
```bash
killall Play
npm run tauri:dev
```

This shows console errors and uses hot-reload.

### Fix 2: Check Browser Console
1. Open app in dev mode
2. Press Cmd+Option+I
3. Go to Console tab
4. Try AI summarize
5. Look for error messages

### Fix 3: Verify Rust Binary
```bash
# Check if the binary has the right port compiled in
strings src-tauri/target/release/play-mvp | grep localhost
```

**Expected**: Should see `localhost:11434`

### Fix 4: Rebuild Everything
```bash
# Clean build
rm -rf src-tauri/target/release
npm run build
cargo build --release --manifest-path=src-tauri/Cargo.toml

# Then test
npm run tauri:dev
```

## Testing Checklist

After each fix, test:
- [ ] AI Summarize in Documents
- [ ] AI Chat in Chat module
- [ ] AI Rewrite in Documents
- [ ] AI Task Generate in Tasks
- [ ] Check browser console for errors
- [ ] Check terminal for Rust errors

## Expected Error Messages

### If Ollama Not Running
```
Error: Failed to connect to Ollama
```

### If Model Not Found
```
Error: Model llama3.2 not found
```

### If IPC Command Missing
```
Error: Command 'summarize' not found
```

### If Port Wrong
```
Error: Connection refused (port 11434)
```

## Solution Path

1. **Run in dev mode** to see actual errors
2. **Check browser console** for frontend errors  
3. **Check terminal** for backend errors
4. **Fix the specific error** found
5. **Test again**

## Common Root Causes

### Cause 1: Old Code Running
**Symptom**: AI features don't exist in UI
**Fix**: Launch the new build

### Cause 2: IPC Not Set Up
**Symptom**: "Command not found" errors
**Fix**: Verify main.rs has `commands::ai::summarize`

### Cause 3: Frontend Using Old API
**Symptom**: Network errors or wrong endpoints
**Fix**: Frontend should use `invoke()`, not `fetch()`

### Cause 4: Model Name Mismatch
**Symptom**: "Model not found"
**Fix**: Use exact model name from `ollama list`

## Next Steps

Let's run in dev mode to see the actual error:

```bash
# Terminal 1: Run dev mode
npm run tauri:dev

# Terminal 2: Monitor Ollama
tail -f /var/log/ollama.log  # If logs exist

# Then in app:
# 1. Open Documents
# 2. Try AI Summarize
# 3. Watch both terminals for errors
```

The error message will tell us exactly what's wrong!

