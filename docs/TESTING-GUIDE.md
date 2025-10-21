# 🧪 Live Testing Instructions - Phase 1

**App Running At**: http://localhost:1420/

---

## 🎯 Quick Test Sequence (5 minutes)

### 1. Visual Check (30 seconds)
Look at the app - you should see:
- ✅ Sidebar on the left with "▶️ Play" logo
- ✅ Four module buttons: Chat, Documents, Tasks, Calendar
- ✅ Top bar with module name and settings icon
- ✅ "Welcome to Play" message in center
- ✅ "Offline Mode" indicator at bottom of sidebar

---

### 2. Navigation Test (1 minute)
**Click each module in the sidebar:**

1. Click **"Chat"** → Topbar should show "Chat"
2. Click **"Documents"** → Topbar should show "Documents"  
3. Click **"Tasks"** → Topbar should show "Tasks"
4. Click **"Calendar"** → Topbar should show "Calendar"

**✅ PASS if**: Each click updates the topbar and highlights the sidebar button

---

### 3. Settings Test (2 minutes)
**Click the ⚙️ Settings icon** in top-right corner

Settings modal should open. Now test:

#### A. Theme Switching (Most Important!)
1. **Click the theme toggle button**
2. Watch the app switch between Light ↔ Dark mode
3. **Try toggling 3-4 times**
   - Light mode: White/light gray backgrounds
   - Dark mode: Dark backgrounds with light text

**✅ PASS if**: Theme switches INSTANTLY with smooth transition

#### B. Settings Persistence
1. Change theme to Dark mode
2. Toggle "Enable Notifications" OFF
3. Change "Auto-save Interval" to 5 seconds
4. Select "documents" as Default Module
5. Click **"Save Changes"**
6. **Refresh the page** (Cmd+R or Ctrl+R)
7. Re-open Settings

**✅ PASS if**: All your settings are still there after refresh!

---

### 4. Browser Console Check (1 minute)
1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for errors (red messages)

**✅ PASS if**: No red error messages (warnings in yellow are OK)

---

### 5. Responsive Test (30 seconds)
1. Resize the browser window (make it smaller/larger)
2. Check if the layout adjusts properly

**✅ PASS if**: Sidebar and content remain usable

---

## 🎨 What You're Testing

### Core Features:
1. **App Shell**: Desktop application framework
2. **Navigation**: Module switching system
3. **Settings Management**: Persistent user preferences
4. **Theme System**: Real-time light/dark mode
5. **Database**: SQLite backend (invisible but working)
6. **File System**: Local file storage (background)

---

## 🐞 Common Issues & Solutions

### Issue: "Cannot connect" or blank page
**Solution**: Make sure you ran `npm run tauri:dev`

### Issue: Settings don't save
**Check**: Open Console (F12) - any red errors?

### Issue: Theme toggle doesn't work
**Check**: Look in Console for JavaScript errors

### Issue: Window looks broken
**Try**: Refresh page (Cmd+R / Ctrl+R)

---

## ✅ Expected Behavior

### What SHOULD Work:
- ✅ App launches and displays UI
- ✅ All 4 module buttons clickable
- ✅ Settings modal opens/closes
- ✅ Theme switches between light/dark
- ✅ Settings persist after page refresh
- ✅ UI feels responsive

### What's NOT Implemented (Normal):
- ❌ Search button does nothing (Phase 7)
- ❌ All modules show same welcome screen (Phases 2-5)
- ❌ No chat messages yet (Phase 2)
- ❌ No document editor yet (Phase 3)
- ❌ No task board yet (Phase 4)
- ❌ No calendar yet (Phase 5)

---

## 📸 Screenshots to Verify

### Light Mode:
- Light gray sidebar
- White/light content area
- Dark text on light background
- Blue highlights on active items

### Dark Mode:
- Dark sidebar and topbar
- Dark content area
- Light text on dark background
- Blue highlights preserved

### Settings Modal:
- Clean modal window
- Theme toggle with icon
- Notification checkbox
- Auto-save number input
- Module dropdown
- Save/Cancel buttons

---

## 🎯 Test Checklist

Use this quick checklist:

- [ ] App loads successfully
- [ ] All 4 modules clickable
- [ ] Settings icon opens modal
- [ ] Theme switches work smoothly
- [ ] Can toggle light ↔ dark multiple times
- [ ] Settings modal has all options
- [ ] Settings save when clicking "Save Changes"
- [ ] Settings persist after page refresh
- [ ] No red errors in console
- [ ] UI is responsive to window resizing

**If 8+ items checked**: ✅ **Phase 1 PASSES!**

---

## 📊 Report Your Findings

### Quick Status:
**Works perfectly**: Everything smooth, no issues  
**Works with issues**: Mostly works but found bugs  
**Doesn't work**: Major problems

### If you found bugs:
1. Note what you did
2. What happened vs. what you expected
3. Any console errors
4. Screenshot if helpful

---

## 🚀 After Testing

### If Tests Pass:
✅ Phase 1 is solid!  
➡️ Ready to build Phase 2 (Chat Module)  
➡️ Foundation proven stable

### If Tests Fail:
🐛 Note issues found  
🔧 Fix bugs before continuing  
🧪 Re-test after fixes

---

**Start Testing Now** → http://localhost:1420/

**Time Needed**: 5-10 minutes for thorough test  
**Current Phase**: Phase 1 (Foundation)  
**Status**: ✅ Ready for testing

---

## 💡 What This Tests

You're validating:
- ✅ **Architecture**: Tauri + React communication
- ✅ **State Management**: Zustand stores working
- ✅ **Persistence**: SQLite saving settings
- ✅ **UI System**: Tailwind themes functional
- ✅ **IPC Layer**: Frontend ↔ Backend communication
- ✅ **Foundation**: All infrastructure operational

**This is the foundation for all future features!** 🎯

