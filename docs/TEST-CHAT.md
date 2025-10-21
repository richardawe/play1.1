# 🧪 Phase 2 - Chat Module Testing

**App URL**: http://localhost:1420/  
**Phase**: Phase 2 - Chat Module (80% Complete)  
**Status**: ✅ Ready to test

---

## 🎯 What's New in Chat

You can now test a **fully functional chat system** with:
- ✅ Multiple channels
- ✅ Send/receive messages  
- ✅ **Markdown formatting** (bold, italic, lists, code blocks)
- ✅ **File attachments** (upload any file)
- ✅ **Local search** (find messages instantly)
- ✅ Auto-scroll to latest message
- ✅ Real-time UI updates

---

## 🧪 Test Sequence (10 minutes)

### Test 1: Basic Chat (2 minutes)

1. Go to http://localhost:1420/
2. Click **"Chat"** in sidebar (should be selected by default)
3. You should see:
   - Channel list on left (#General, #Random, #Dev)
   - Empty message area saying "No messages yet"
   - Message composer at bottom

4. **Type a message**: "Hello! This is my first message"
5. **Press Enter**
6. ✅ Message should appear instantly with:
   - User avatar (U)
   - "User" name
   - Timestamp ("Just now")
   - Your message content

7. **Send more messages**:
   - "This is message 2"
   - "Testing **bold** and *italic*"
   - "Here's a list:\n- Item 1\n- Item 2"

8. ✅ All messages should appear with proper markdown formatting

---

### Test 2: Markdown Formatting (3 minutes)

Send these messages and verify rendering:

```
**Bold text** and *italic text*
```
✅ Should show: **Bold text** and *italic text*

```
## Heading 2
### Heading 3
```
✅ Should show proper heading sizes

```
- Bullet point 1
- Bullet point 2
- Bullet point 3
```
✅ Should show bullet list

```
`inline code` and 

```code block```
```
✅ Should show code with mono font

---

### Test 3: File Attachments (3 minutes)

1. Click the **📎 Paperclip** icon
2. Select any file from your computer (image, document, etc.)
3. You should see:
   - File name preview above textarea
   - File size
   - X button to remove
4. **Type**: "Here's the file"
5. **Press Enter**
6. ✅ Message should send with:
   - Your text
   - "📎 Attachment: {filename}" below

---

### Test 4: Channel Switching (1 minute)

1. Click **#Random** in channel list
2. ✅ Should say "No messages yet" (new channel)
3. Send a message: "This is in Random channel"
4. Click back to **#General**
5. ✅ Should show your original messages
6. Click **#Random** again
7. ✅ Should show the "Random channel" message

**This proves**: Messages persist per channel in SQLite!

---

### Test 5: Search Feature (2 minutes)

1. Go back to **#General** (should have multiple messages)
2. Click the **🔍 Search** button (top-right of message area)
3. Search overlay should appear
4. **Type**: "bold"
5. ✅ Should find the message with "bold" in it
6. ✅ Search term should be highlighted in yellow
7. **Clear search** and type something else
8. ✅ Results update instantly
9. Click **X** to close search

---

## ✅ Expected Results

### Chat UI
- ✅ Clean interface with channels and messages
- ✅ Smooth scrolling
- ✅ Auto-scroll to latest message
- ✅ Messages load from database on channel switch

### Markdown Features
- ✅ **Bold** and *italic* formatting
- ✅ Headings (# ## ###)
- ✅ Lists (bullets and numbered)
- ✅ Code blocks
- ✅ Proper styling in light/dark mode

### File Attachments
- ✅ Click paperclip to select file
- ✅ File preview before sending
- ✅ File uploads and associates with message
- ✅ Attachment info displays in message

### Search
- ✅ Opens with button click
- ✅ Filters messages in real-time
- ✅ Highlights search terms
- ✅ Shows result count
- ✅ Fast (< 200ms per test-spec.md)

---

## 📸 What to Look For

### Light Mode
- White message backgrounds
- Dark text
- Blue accents on active channel
- Yellow highlights on search results

### Dark Mode
1. Open Settings (⚙️)
2. Toggle to Dark mode
3. Chat should have:
   - Dark backgrounds
   - Light text
   - Proper contrast
   - Readable markdown

---

## 🎯 Success Checklist

- [ ] Can send and receive messages
- [ ] Markdown renders correctly (**bold**, *italic*, lists)
- [ ] Can attach files (paperclip button works)
- [ ] Files upload and show in messages
- [ ] Can switch between channels
- [ ] Messages persist per channel
- [ ] Search opens and filters messages
- [ ] Search highlights terms in yellow
- [ ] Auto-scrolls to new messages
- [ ] Works in both light and dark mode

**If 8+ checked** → ✅ **Phase 2 PASSES!**

---

## 💡 Try These Advanced Tests

### Test Message Persistence
1. Send several messages
2. **Refresh the page** (Cmd+R)
3. ✅ Messages should still be there!

### Test Multiple Channels
1. Send messages in #General
2. Switch to #Random, send messages there
3. Switch back to #General
4. ✅ Each channel keeps its own messages

### Test Search Performance
1. Send 10+ messages
2. Open search
3. Type quickly
4. ✅ Should filter instantly (no lag)

### Test File Types
Try attaching:
- Images (.jpg, .png)
- Documents (.pdf, .docx)
- Text files (.txt, .md)
- Code files (.js, .ts)

✅ All should upload successfully

---

## 🐛 Troubleshooting

### Messages don't appear
- Check console (F12) for errors
- Verify backend is running
- Run browser-test.js script

### Markdown doesn't render
- Check if you see raw markdown like **bold**
- Verify react-markdown is installed
- Refresh page

### File upload fails
- Check file size (very large files may take time)
- Check console for errors
- Verify file permissions

---

## 📊 What This Validates

✅ **Database Integration**: Messages persist in SQLite  
✅ **State Management**: Zustand stores work perfectly  
✅ **File System**: File upload integration working  
✅ **Markdown**: ReactMarkdown rendering correctly  
✅ **Search**: Fast local search implemented  
✅ **IPC**: Frontend ↔ Backend communication solid  
✅ **UX**: Smooth, responsive chat experience  

---

## 🚀 After Testing

### If Tests Pass:
✅ Phase 2 is production-ready!  
✅ Chat module is fully functional  
➡️ **Ready for Phase 3: Documents Module**

### Report Results:
- How many features work? (out of 10)
- Any bugs or issues?
- Performance (is it fast)?
- UI quality (does it look good)?

---

**Test Now**: http://localhost:1420/ → Click "Chat"

**Try this**:
1. Send message: "Test **bold** and *italic*"
2. Attach a file
3. Search for "bold"
4. Switch channels

**Result**: Should all work smoothly! 🎉

