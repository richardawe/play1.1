# Changelog - v1.0.1

**Release Date**: October 9, 2025  
**Build**: Production Release  
**Type**: Feature Addition

---

## 🆕 What's New

### Clear Workspace Feature

Each module now has a **"Clear All"** button that allows you to reset your workspace by deleting all data for that module.

**Where to find it:**
- **Chat**: Top-right corner (red button with trash icon)
- **Documents**: Top-right of editor when document is selected
- **Tasks**: Header area, next to AI Generate button
- **Calendar**: Header area, before ICS Import/Export

**Safety Features:**
- ⚠️ Confirmation modal with warning message
- 🔒 "Cannot be undone" warning
- 🎨 Red color scheme (destructive action indicator)
- ⏳ Loading state during operation

---

## 📋 Feature Details

### What Gets Cleared

| Module | What's Deleted |
|--------|----------------|
| **Messages** | All messages across all channels (#General, #Random, #Dev) |
| **Documents** | All documents + all version history |
| **Tasks** | All tasks across all columns (To Do, In Progress, Done) |
| **Events** | All calendar events |

### How It Works

1. Click "Clear All" button
2. Confirmation modal appears
3. Read the warning carefully
4. Click "Delete All" to confirm (or "Cancel" to abort)
5. Data is permanently deleted
6. UI refreshes to show empty state

---

## 🔧 Technical Changes

### Backend (Rust)

**New Files:**
- `src-tauri/src/commands/clear.rs` - Clear workspace commands

**New IPC Commands:**
- `clear_all_messages`
- `clear_all_documents`
- `clear_all_tasks`
- `clear_all_events`
- `clear_all_links`

**Database Methods:**
- `Database::clear_all_messages()` → Returns count of deleted messages
- `Database::clear_all_documents()` → Deletes documents + versions
- `Database::clear_all_tasks()` → Returns count of deleted tasks
- `Database::clear_all_events()` → Returns count of deleted events
- `Database::clear_all_links()` → Returns count of deleted links

### Frontend (React)

**New Component:**
- `src/components/common/ClearWorkspaceButton.tsx` - Reusable clear button with confirmation modal

**Updated Components:**
- `ChatInterface.tsx` - Added clear messages button
- `DocumentsInterface.tsx` - Added clear documents button
- `TasksInterface.tsx` - Added clear tasks button
- `CalendarView.tsx` - Added clear events button

---

## 🐛 Bug Fixes

### Ollama Port Configuration
- ✅ Fixed app to use default Ollama port 11434 (was incorrectly set to 8080)
- ✅ App now properly detects running Ollama instances
- ✅ Fallback to port 8080 if needed

---

## 📊 Build Statistics

```
Version:       v1.0.1
DMG Size:      3.7 MB
App Size:      5.8 MB
Binary:        play-mvp (aarch64)
Min macOS:     10.15 (Catalina)
```

---

## 🔄 Upgrade from v1.0.0

### What Changed
- Ollama port now defaults to 11434
- New "Clear All" buttons in all modules
- Better detection of existing Ollama installation

### Compatibility
- ✅ Fully compatible with v1.0.0 databases
- ✅ No migration required
- ✅ All existing data preserved

### How to Upgrade
1. Download `Play-v1.0.1-macOS.dmg`
2. Drag new Play.app to Applications (replace old version)
3. Launch - your data is safe!

---

## 🧪 Testing Recommendations

After upgrading, test:
1. ✅ App launches successfully
2. ✅ Ollama connection works (no setup screen if already installed)
3. ✅ All existing data is intact
4. ✅ Clear Workspace buttons appear in all modules
5. ✅ Clear functionality works with confirmation
6. ✅ AI features still work properly

---

## 📦 Download

**macOS (Apple Silicon & Intel)**
- File: `Play-v1.0.1-macOS.dmg`
- Size: 3.7 MB
- Checksum: (Generate with `shasum -a 256 Play-v1.0.1-macOS.dmg`)

---

##  📚 Documentation

**New Documentation:**
- [FEATURES-CLEAR-WORKSPACE.md](./FEATURES-CLEAR-WORKSPACE.md) - Detailed feature documentation

**Updated Documentation:**
- [README.md](./README.md) - Updated with v1.0.1 info
- [RELEASE-NOTES-v1.0.1.md](./RELEASE-NOTES-v1.0.1.md) - Full release notes

---

## ⚠️ Known Issues

**Same as v1.0.0:**
- First AI query may take 10-15 seconds (model loading)
- May show "Play cannot be opened" on first launch → Right-click → Open

**New Issues:**
- None reported yet!

---

## 🙏 User Feedback

This feature was implemented based on user request! Thank you for helping improve Play.

**Have more feature ideas?** Open a GitHub Issue!

---

## 🎯 Next Steps

**Planned for v1.0.2:**
- Export before clear (optional backup)
- Soft delete with undo option
- Selective clear by date range
- Better keyboard shortcuts

---

**Play v1.0.1** - Now with Clear Workspace!  
**Download**: `dist/Play-v1.0.1-macOS.dmg`  
**Status**: ✅ Ready for Distribution

Made with 🤖 + ❤️

