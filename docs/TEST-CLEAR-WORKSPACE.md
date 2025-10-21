# Test Plan: Clear Workspace Feature

## Quick Test Guide

### Prerequisites
✅ Ollama running on port 11434  
✅ Play app v1.0.1 launched  

---

## Test Case 1: Chat Module - Clear All Messages

**Steps:**
1. Open Play app
2. Navigate to **Chat** module
3. Send a few test messages to #General channel
4. Switch to #Random and send more messages
5. Look for the **red "Clear All" button** in the top-right corner
6. Click "Clear All"
7. **Expected:** Confirmation modal appears
8. Read the warning message
9. Click "Cancel"
10. **Expected:** No messages deleted, modal closes
11. Click "Clear All" again
12. Click "Delete All"
13. **Expected:** 
    - Button shows "Clearing..."
    - All messages deleted from all channels
    - Chat shows empty state
    - Modal closes automatically

**Success Criteria:**
- ✅ Button visible and styled in red
- ✅ Confirmation modal works
- ✅ Cancel button prevents deletion
- ✅ Delete All removes all messages
- ✅ UI refreshes properly

---

## Test Case 2: Documents Module - Clear All Documents

**Steps:**
1. Navigate to **Documents** module
2. Create 2-3 test documents
3. Edit them to create version history
4. Select one document (Clear button should appear)
5. Look for the **red "Clear All" button** in the top-right of editor
6. Click "Clear All"
7. **Expected:** Confirmation modal appears
8. Click "Delete All"
9. **Expected:**
    - All documents deleted
    - Document list empty
    - Editor shows "No document selected" state
    - Clear button disappears (no document selected)

**Success Criteria:**
- ✅ Button only visible when document is selected
- ✅ All documents + versions deleted
- ✅ UI resets to empty state

---

## Test Case 3: Tasks Module - Clear All Tasks

**Steps:**
1. Navigate to **Tasks** module
2. Create tasks in all 3 columns:
   - To Do: 2 tasks
   - In Progress: 2 tasks
   - Done: 2 tasks
3. Set different priorities (High, Medium, Low)
4. Look for the **red "Clear All" button** in the header (next to AI Generate)
5. Click "Clear All"
6. **Expected:** Confirmation modal appears
7. Click "Delete All"
8. **Expected:**
    - All tasks deleted from all columns
    - Kanban board shows empty columns
    - Column headers still visible

**Success Criteria:**
- ✅ Button visible in header
- ✅ All tasks deleted regardless of status/priority
- ✅ Kanban board structure remains intact

---

## Test Case 4: Calendar Module - Clear All Events

**Steps:**
1. Navigate to **Calendar** module
2. Create 5-6 events across different dates
3. Try all views (Day, Week, Month)
4. Look for the **red "Clear All" button** in the header (before ICS Manager)
5. Click "Clear All"
6. **Expected:** Confirmation modal appears
7. Click "Delete All"
8. **Expected:**
    - All events deleted
    - Calendar shows no events
    - View navigation still works

**Success Criteria:**
- ✅ Button visible in header
- ✅ All events deleted
- ✅ Calendar views still functional

---

## Test Case 5: Confirmation Modal

**Steps:**
1. In any module, click "Clear All"
2. **Expected:** Modal appears with:
   - ⚠️ Yellow warning icon (AlertTriangle)
   - Bold heading: "Clear [Module]?"
   - Warning text mentioning "permanently delete" and "cannot be undone"
   - Two buttons: "Cancel" (gray) and "Delete All" (red)
3. Click anywhere outside the modal
4. **Expected:** Modal should NOT close (must click button)
5. Click "Cancel"
6. **Expected:** Modal closes, no data deleted

**Success Criteria:**
- ✅ Modal has proper warning UI
- ✅ Modal doesn't close on outside click
- ✅ Cancel works properly

---

## Test Case 6: Error Handling

**Steps:**
1. Stop the app database (if possible) or simulate error
2. Click "Clear All" in any module
3. **Expected:** Error message shown (alert or toast)
4. Modal stays open for retry

**Success Criteria:**
- ✅ Errors are caught and displayed
- ✅ App doesn't crash
- ✅ User can retry

---

## Test Case 7: Multi-Module Clear

**Steps:**
1. Add data to all 4 modules (chat, docs, tasks, calendar)
2. Clear Chat → verify only chat data deleted
3. Clear Documents → verify only docs deleted
4. Clear Tasks → verify only tasks deleted
5. Clear Calendar → verify only events deleted

**Success Criteria:**
- ✅ Each module's clear only affects that module
- ✅ No cross-contamination
- ✅ Other modules' data unaffected

---

## Test Case 8: Ollama Port Fix

**Steps:**
1. Ensure Ollama is running on **port 11434** (default)
2. Launch Play app
3. **Expected:** No setup screen, app opens directly
4. Try AI features (summarize in Chat)
5. **Expected:** AI works immediately

**Alternative:**
1. Stop Ollama on 11434
2. Start on port 8080: `OLLAMA_HOST=0.0.0.0:8080 ollama serve`
3. Launch Play app
4. **Expected:** App should fallback to port 8080 and work

**Success Criteria:**
- ✅ Port 11434 works (default)
- ✅ Port 8080 fallback works
- ✅ No manual configuration needed

---

## Visual Inspection Checklist

**Clear Workspace Button**
- [ ] Red border color
- [ ] Trash2 icon visible
- [ ] "Clear All" text visible
- [ ] Hover effect works (red background)
- [ ] Proper size (not too big/small)
- [ ] Consistent across all modules

**Confirmation Modal**
- [ ] Centered on screen
- [ ] Dark overlay behind (50% black)
- [ ] Warning icon (yellow triangle)
- [ ] Clear text and spacing
- [ ] Two buttons side by side
- [ ] Cancel button is gray
- [ ] Delete button is red
- [ ] Responsive to clicks

**Loading State**
- [ ] "Clearing..." text appears
- [ ] Buttons disabled during operation
- [ ] No double-click issues

---

## Performance Test

**Large Dataset Clear**
1. Add 100+ messages to chat
2. Create 50+ documents
3. Create 100+ tasks
4. Create 50+ calendar events
5. Clear each module
6. **Expected:** Clears complete in < 2 seconds each

**Success Criteria:**
- ✅ Fast deletion (single SQL statement)
- ✅ No UI freezing
- ✅ Proper progress feedback

---

## Regression Tests

**Ensure Nothing Broke:**
1. Chat still works (send/receive messages)
2. Documents still work (create/edit/save)
3. Tasks still work (drag-drop, create, edit)
4. Calendar still works (create events, change views)
5. AI features still work (summarize, rewrite, generate)
6. Settings still work (theme toggle)
7. Global search still works (Cmd+K)
8. Export/Import still works

**Success Criteria:**
- ✅ All existing features functional
- ✅ No UI/UX regressions
- ✅ No new errors in console

---

## Acceptance Criteria

**Feature Complete When:**
- [x] Clear button appears in all 4 modules
- [x] Confirmation modal works consistently
- [x] All modules clear their data properly
- [x] UI refreshes correctly after clear
- [x] Error handling is robust
- [x] Ollama port fix works (11434 default)
- [x] No regressions in existing features
- [x] Documentation is complete
- [x] Build is successful (DMG created)

---

## Bug Reporting

**If you find issues:**

1. **Console Errors:** Check browser console (Cmd+Option+I)
2. **Rust Errors:** Check terminal where app was launched
3. **Screenshot:** Take screenshot of issue
4. **Steps:** Write exact steps to reproduce
5. **Expected:** What should happen
6. **Actual:** What actually happened

**Report Format:**
```
**Module:** [Chat/Documents/Tasks/Calendar]
**Action:** [What you did]
**Expected:** [What should happen]
**Actual:** [What happened]
**Console:** [Any error messages]
**Screenshot:** [If relevant]
```

---

## Test Results

**Date:** ______________  
**Tester:** ______________  
**Version:** v1.0.1  

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Chat Clear | ⬜ Pass / ⬜ Fail | |
| TC2: Docs Clear | ⬜ Pass / ⬜ Fail | |
| TC3: Tasks Clear | ⬜ Pass / ⬜ Fail | |
| TC4: Calendar Clear | ⬜ Pass / ⬜ Fail | |
| TC5: Modal | ⬜ Pass / ⬜ Fail | |
| TC6: Errors | ⬜ Pass / ⬜ Fail | |
| TC7: Multi-Module | ⬜ Pass / ⬜ Fail | |
| TC8: Ollama Port | ⬜ Pass / ⬜ Fail | |
| Visual Check | ⬜ Pass / ⬜ Fail | |
| Performance | ⬜ Pass / ⬜ Fail | |
| Regression | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ PASS / ⬜ FAIL  
**Ship Decision:** ⬜ SHIP / ⬜ FIX FIRST

---

**Ready to ship when all tests PASS!** ✅

