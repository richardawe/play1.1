# Quick Start - Play v1.1.0

## 🚀 Launch the New Version

The app has been updated with AI Chat and linking features!

### Start Fresh

```bash
# 1. Stop old app
pkill Play

# 2. Launch v1.1.0
open /Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app
```

---

## ✅ Verify Everything Works

### 1. Check Ollama Connection

**Ollama Status:**
```bash
# Should show Ollama running on port 11434
ps aux | grep ollama | grep -v grep

# Test API
curl http://localhost:11434/api/tags
```

**Expected:** ✅ Ollama is running, models listed

---

### 2. Test AI Chat

1. Open the app
2. Go to **Chat** module (should see AI Assistant header)
3. Type: `"Hello, who are you?"`
4. Press Enter
5. Wait for AI response (10-15 seconds for first query)

**Expected:** ✅ AI responds with introduction

**Troubleshooting:**
- If "AI chat failed" → Check console in dev tools
- If "Ollama not running" → Restart Ollama
- If slow → First query loads model (normal)

---

### 3. Test AI Summarization

1. Go to **Documents** module
2. Create/open a document
3. Write some text (at least a paragraph)
4. Look for AI buttons in the toolbar
5. Click "Summarize"

**Expected:** ✅ Summary appears below editor

---

### 4. Test Linking

1. Go to **Tasks** module
2. Create a task
3. Click "..." menu on task card
4. Scroll down to "Linked Items"
5. Click "+Add Link"
6. Select "document"
7. Enter a document ID (e.g., `1`)
8. Verify link appears

**Expected:** ✅ Link created and saved

---

## 🔧 Configuration

### Ollama Ports

The app checks ports in this order:
1. **Port 11434** (default) ← Should work!
2. **Port 8080** (fallback)

Your Ollama is running on **11434** ✅

### Models Used

- **AI Chat**: `llama3.2`
- **Summarization**: `llama3.2`
- **Embeddings**: `nomic-embed-text`
- **Tasks**: `llama3.2`

All models are installed ✅

---

## ⚠️ Common Issues

### "AI summarization failed"

**Cause:** App can't connect to Ollama

**Fix:**
```bash
# 1. Check Ollama is running
ps aux | grep ollama

# 2. Test connection
curl http://localhost:11434/api/tags

# 3. If not running, start it
ollama serve

# 4. Restart the app
pkill Play
open /Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app
```

---

### "Chat not working"

**Symptoms:** Type message, nothing happens

**Causes:**
1. Running old app version (without AI chat)
2. Ollama not responding
3. Browser console has errors

**Fix:**
```bash
# Launch the NEW app
pkill Play
open /Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app

# Check browser console (Cmd+Option+I)
# Look for errors in Network tab
```

---

### First AI Query is Slow

**Normal!** First query loads the model into memory:
- First query: 10-15 seconds
- Subsequent queries: 1-3 seconds

**To speed up:**
- Pre-load model: `ollama run llama3.2 "hello"`
- Keep Ollama running in background

---

### Links Not Saving

**Symptoms:** Links disappear after refresh

**Causes:**
1. Database error
2. Old app version

**Fix:**
```bash
# Make sure you're running v1.1.0
open /Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app

# Check browser console for errors
```

---

## 📊 System Status

**Current Configuration:**
```
Ollama:         ✅ Running (port 11434)
Models:         ✅ llama3.2, nomic-embed-text
App Version:    v1.1.0
App Location:   /Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app
DMG:            /Users/3d7tech/Play/src-tauri/dist/Play-v1.1.0-macOS.dmg
```

---

## 🎮 Testing Checklist

- [ ] App launches without setup screen
- [ ] Chat shows "AI Assistant" header
- [ ] Type message → AI responds
- [ ] AI Summarize works in Documents
- [ ] AI Rewrite works in Documents
- [ ] AI Generate Tasks works in Tasks
- [ ] Links can be created
- [ ] Links persist after refresh
- [ ] Clear Chat History works
- [ ] All other modules work (Tasks, Calendar, Docs)

---

## 🆘 Still Having Issues?

### Get Detailed Logs

**Browser Console:**
```
1. Open app
2. Press Cmd+Option+I
3. Go to Console tab
4. Try the failing action
5. Copy error messages
```

**Ollama Logs:**
```bash
# Check Ollama is responding
curl -v http://localhost:11434/api/tags

# Test generation
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello"
}'
```

**Check App Configuration:**
```bash
# Verify app is using correct Ollama URL
# Should see "http://localhost:11434" in the code
grep -r "localhost:11434" /Users/3d7tech/Play/src-tauri/src/

# Verify commands are registered
grep "chat_with_ai" /Users/3d7tech/Play/src-tauri/src/main.rs
```

---

## 🎯 What Changed in v1.1.0

### Before (v1.0.x)
- Multi-channel chat (#General, #Random, #Dev)
- AI Summary button (separate)
- Links UI but not functional

### After (v1.1.0)
- Single AI chatbot (like ChatGPT)
- Direct AI conversation
- Links save to database
- Better UI

---

## 📞 Quick Help Commands

```bash
# Restart everything
pkill Play
pkill ollama
ollama serve &
sleep 5
open /Users/3d7tech/Play/src-tauri/target/release/bundle/macos/Play.app

# Test Ollama manually
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Say hello",
  "stream": false
}'

# Check what's running
ps aux | grep -E "(Play|ollama)"

# Check ports
lsof -i :11434
lsof -i :8080
```

---

## ✅ Success Indicators

**Everything is working when:**
1. ✅ App opens to Chat with "AI Assistant" header
2. ✅ Type message → See "AI is thinking..." → Get response
3. ✅ AI Summarize in Documents works
4. ✅ Links can be created and persist
5. ✅ No errors in browser console

---

**Play v1.1.0** - AI Chat & Linking Edition  
**Status**: Ready to use!  
**Next**: Test all features!

🎉

