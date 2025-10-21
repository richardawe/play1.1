# Testing Chat v1.1.0 - Debug Guide

## Current Status
Running app in DEV MODE to diagnose chat issues.

## What to Test

### 1. Basic Chat Display
- [ ] Open app (dev mode should be running)
- [ ] Navigate to Chat module
- [ ] Do you see:
  - [ ] "AI Assistant" header with purple gradient icon?
  - [ ] Large input box at the bottom?
  - [ ] Welcome message in the middle?

### 2. Sending Messages
- [ ] Type "Hello" in the input box
- [ ] Press Enter
- [ ] Check browser console (Cmd+Option+I):
  - Look for errors in Console tab
  - Look for network requests in Network tab

### 3. Expected Behavior

**What SHOULD happen:**
1. You type "Hello"
2. Your message appears (blue bubble, right side)
3. "AI is thinking..." appears below input
4. After ~10 seconds, AI responds (gray bubble, left side)

**What might be BROKEN:**
- Messages don't save to database
- Messages don't load from database
- AI command fails
- UI doesn't refresh after sending

## Debug Checklist

### Check Console Errors
Open browser console (Cmd+Option+I) and look for:
- [ ] Red error messages
- [ ] Failed network requests
- [ ] Tauri IPC errors
- [ ] "Command not found" errors

### Check Backend Logs
In terminal where dev mode is running:
- [ ] Rust compilation errors
- [ ] Database errors
- [ ] Ollama connection errors

### Check Database
```bash
# Check if messages table exists
sqlite3 ~/Library/Application\ Support/play/data/play.db "SELECT * FROM messages LIMIT 5;"
```

### Check Ollama
```bash
# Verify Ollama is responding
curl http://localhost:11434/api/tags
```

## Common Issues

### Issue 1: No Messages Display
**Symptoms:** Chat area is blank, no welcome message
**Possible Causes:**
- Frontend not loading messages
- Database connection failed
- Messages component not rendering

**Debug:**
```javascript
// In browser console, try:
await window.__TAURI__.invoke('get_messages', { channelId: 1, limit: 10 })
```

### Issue 2: Can't Send Messages
**Symptoms:** Type and press Enter, nothing happens
**Possible Causes:**
- IPC command not registered
- Database write failed
- Frontend state not updating

**Debug:**
```javascript
// In browser console, try:
await window.__TAURI__.invoke('create_message', { 
  message: { 
    channel_id: 1, 
    user_id: 1, 
    content: "Test", 
    attachments: null 
  }
})
```

### Issue 3: AI Not Responding
**Symptoms:** Your message appears but AI doesn't respond
**Possible Causes:**
- Ollama not running
- AI command failing
- Wrong command name

**Debug:**
```javascript
// In browser console, try:
await window.__TAURI__.invoke('chat_with_ai', { 
  userMessage: "Hello", 
  conversationHistory: "" 
})
```

## Dev Mode Commands

### Start Dev Mode
```bash
npm run tauri:dev
```

### View Logs
```bash
tail -f /tmp/tauri-dev.log
```

### Stop Dev Mode
```bash
kill $(cat /tmp/tauri-dev.pid)
```

## What to Report

If chat is still not working, please provide:

1. **Console Errors** (Cmd+Option+I → Console tab)
   - Copy any red error messages
   
2. **Network Tab** (Cmd+Option+I → Network tab)
   - Any failed requests?
   
3. **Terminal Output**
   - Any Rust errors in terminal?
   
4. **Specific Behavior**
   - What happens when you type a message?
   - Does the input box work?
   - Do you see the welcome screen?
   - Is the Chat module visible at all?

## Next Steps

Based on the errors we see in dev mode, we can:
1. Fix database connection issues
2. Fix IPC command registration
3. Fix frontend state management
4. Fix AI integration

**Dev mode is running now - please check what you see in the app and report any errors!**

