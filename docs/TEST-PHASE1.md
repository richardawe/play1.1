# 🧪 Phase 1 Testing Guide

**App URL**: http://localhost:1420/  
**Test Date**: October 9, 2025  
**Phase**: Phase 1 - Foundation

---

## ✅ Test Checklist

### 1. Application Launch ✓
- [x] App loads at http://localhost:1420/
- [ ] Window renders within 2 seconds
- [ ] No console errors on startup
- [ ] Welcome message displays

**Expected**: 
- Clean UI with sidebar and main content
- "Welcome to Play" message in center
- Sidebar shows: Chat, Documents, Tasks, Calendar

---

### 2. Navigation System
**Test Reference**: TC-P1.4.x (CORE-004)

#### Test Steps:
1. [ ] Click "Chat" in sidebar
   - Expected: Sidebar item highlights, topbar shows "Chat"
   
2. [ ] Click "Documents" in sidebar
   - Expected: Sidebar highlights Documents, topbar shows "Documents"
   
3. [ ] Click "Tasks" in sidebar
   - Expected: Sidebar highlights Tasks, topbar shows "Tasks"
   
4. [ ] Click "Calendar" in sidebar
   - Expected: Sidebar highlights Calendar, topbar shows "Calendar"

5. [ ] Check "Offline Mode" indicator at bottom of sidebar
   - Expected: Green dot with "Offline Mode" text

**Pass Criteria**: All modules switch correctly with visual feedback

---

### 3. Settings System
**Test Reference**: TC-P1.3.x (CORE-003)

#### Test Steps:
1. [ ] Click the Settings icon (⚙️) in top-right corner
   - Expected: Settings modal opens

2. [ ] **Theme Switching**:
   - [ ] Click theme toggle button
   - Expected: 
     - UI switches between Light/Dark mode immediately
     - Button shows current theme (Sun ☀️ for light, Moon 🌙 for dark)
     - All components respect theme (sidebar, topbar, modal)

3. [ ] **Notifications Toggle**:
   - [ ] Toggle "Enable Notifications" checkbox
   - Expected: Checkbox state changes

4. [ ] **Auto-save Interval**:
   - [ ] Change the auto-save interval (default: 2 seconds)
   - Expected: Value updates in input field

5. [ ] **Default Module**:
   - [ ] Select different module from dropdown
   - Expected: Dropdown shows selection

6. [ ] Click "Save Changes"
   - Expected: Modal closes, settings saved

7. [ ] **Persistence Test**:
   - [ ] Re-open settings modal
   - Expected: All settings from step 2-5 are preserved
   
8. [ ] **Reload Test**:
   - [ ] Refresh the page (Cmd+R / Ctrl+R)
   - Expected: Theme and settings persist after reload

**Pass Criteria**: 
- Theme switches work in real-time
- Settings persist in modal
- Settings survive page refresh

---

### 4. Database Verification
**Test Reference**: TC-P1.2.x (CORE-002)

#### Test Steps:
1. [ ] Open Browser DevTools (F12 or Cmd+Option+I)
2. [ ] Go to Console tab
3. [ ] Check for any database errors
   - Expected: No SQLite errors

4. [ ] **Database Location**:
   - macOS: `~/Library/Application Support/play/data/play.db`
   - Windows: `%APPDATA%/play/data/play.db`
   - Linux: `~/.config/play/data/play.db`

**To verify database**:
```bash
# On macOS
ls -la ~/Library/Application\ Support/play/data/

# Should see:
# play.db (SQLite database file)
```

**Pass Criteria**: Database file exists and app runs without DB errors

---

### 5. File System Structure
**Test Reference**: TC-P1.5.x (CORE-005)

#### Test Steps:
1. [ ] Check file system structure exists:

**macOS**:
```bash
ls -la ~/Library/Application\ Support/play/
```

**Expected structure**:
```
play/
├── data/
│   └── play.db
└── files/
    ├── attachments/
    └── exports/
```

**Pass Criteria**: Directory structure created automatically

---

### 6. Console Tests
**Test Reference**: All modules

#### Test Steps:
1. [ ] Open Browser Console (F12)
2. [ ] Check for JavaScript errors
   - Expected: No red error messages
   
3. [ ] Check for warnings
   - Note: Some development warnings are OK
   
4. [ ] Check Network tab
   - Expected: No failed requests

**Pass Criteria**: No critical errors in console

---

### 7. Performance Tests
**Test Reference**: Test-spec.md Performance Benchmarks

#### Test Steps:
1. [ ] **Startup Time**:
   - Reload page and time how long until UI appears
   - Expected: < 2 seconds

2. [ ] **Module Switching**:
   - Click between modules rapidly
   - Expected: Instant response, < 100ms

3. [ ] **Settings Modal**:
   - Open/close settings modal
   - Expected: Smooth animation, no lag

4. [ ] **Theme Switching**:
   - Toggle theme multiple times
   - Expected: Instant visual update

**Pass Criteria**: All interactions feel responsive

---

## 🎯 Expected Results Summary

### What Should Work:
✅ **UI Layout**: Sidebar with 4 modules, topbar with search/settings  
✅ **Navigation**: Click any module to highlight it  
✅ **Settings Modal**: Opens when clicking settings icon  
✅ **Theme Switching**: Real-time light/dark mode toggle  
✅ **Settings Persistence**: All preferences save and reload  
✅ **Database**: Auto-created on first run  
✅ **File Structure**: Directories created automatically  
✅ **Offline Indicator**: Green dot showing "Offline Mode"

### What's NOT Implemented Yet:
❌ **Search**: Search button is placeholder (Phase 7)  
❌ **Chat Messages**: Chat module shows welcome screen (Phase 2)  
❌ **Documents**: Documents module shows welcome screen (Phase 3)  
❌ **Tasks**: Tasks module shows welcome screen (Phase 4)  
❌ **Calendar**: Calendar module shows welcome screen (Phase 5)  

---

## 🐛 Known Limitations

1. **Module Content**: All modules show same welcome screen (Phase 1 is foundation only)
2. **Search**: Global search button is UI-only (implemented in Phase 7)
3. **File Upload**: No UI yet (backend ready, UI in Phase 2)
4. **Encryption**: SQLite is plain (SQLCipher deferred per architecture)

---

## 📸 Visual Checklist

### Light Theme
- [ ] Sidebar: Light gray/white background
- [ ] Topbar: Light background with dark text
- [ ] Settings Modal: Light background
- [ ] Text: Dark color for readability

### Dark Theme
- [ ] Sidebar: Dark background
- [ ] Topbar: Dark background with light text
- [ ] Settings Modal: Dark background
- [ ] Text: Light color for readability
- [ ] Proper contrast maintained

---

## 🎯 Success Criteria

**Phase 1 is successful if**:
- ✅ All 7 test sections pass
- ✅ No critical console errors
- ✅ Theme switching works smoothly
- ✅ Settings persist across reloads
- ✅ Navigation feels responsive
- ✅ Database and files auto-create

---

## 📝 Test Results

### Test Session 1
**Date**: _____________  
**Tester**: _____________  
**Environment**: _____________

| Test | Status | Notes |
|------|--------|-------|
| 1. App Launch | ⬜ | |
| 2. Navigation | ⬜ | |
| 3. Settings | ⬜ | |
| 4. Database | ⬜ | |
| 5. File System | ⬜ | |
| 6. Console | ⬜ | |
| 7. Performance | ⬜ | |

**Issues Found**:
- 

**Overall Result**: ⬜ Pass / ⬜ Fail

---

## 🔧 Troubleshooting

### Issue: Settings don't persist
**Solution**: Check browser console for database errors

### Issue: Theme doesn't switch
**Solution**: Check if settings are loading (open console)

### Issue: Module navigation doesn't work
**Solution**: Check console for React errors

### Issue: Database not created
**Solution**: Check file permissions for app data directory

---

## 🚀 Next Steps After Testing

1. Document any bugs found
2. Create GitHub issues for bugs
3. Proceed to Phase 2 (Chat Module) if all tests pass
4. Write automated tests for Phase 1 features

---

**Testing Status**: 🧪 Ready to Test  
**Phase 1 Implementation**: ✅ Complete  
**Ready for Phase 2**: ⏳ Pending test results

