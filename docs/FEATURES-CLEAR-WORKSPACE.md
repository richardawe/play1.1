# Clear Workspace Feature

## Overview

Each module now has a **"Clear All"** button that allows users to reset their workspace by permanently deleting all data for that module.

---

## Implementation Details

### Backend (Rust)

**New Command Module**: `src-tauri/src/commands/clear.rs`

```rust
// Clear Workspace Commands
#[tauri::command]
pub async fn clear_all_messages(db: State<'_, Arc<Mutex<Database>>>) -> Result<usize, String>

#[tauri::command]
pub async fn clear_all_documents(db: State<'_, Arc<Mutex<Database>>>) -> Result<usize, String>

#[tauri::command]
pub async fn clear_all_tasks(db: State<'_, Arc<Mutex<Database>>>) -> Result<usize, String>

#[tauri::command]
pub async fn clear_all_events(db: State<'_, Arc<Mutex<Database>>>) -> Result<usize, String>

#[tauri::command]
pub async fn clear_all_links(db: State<'_, Arc<Mutex<Database>>>) -> Result<usize, String>
```

**Database Service**: `src-tauri/src/services/database.rs`

```rust
// Clear all data methods
pub fn clear_all_messages(&self) -> Result<usize>
pub fn clear_all_documents(&self) -> Result<usize> // Also clears document_versions
pub fn clear_all_tasks(&self) -> Result<usize>
pub fn clear_all_events(&self) -> Result<usize>
pub fn clear_all_links(&self) -> Result<usize>
```

### Frontend (React)

**Reusable Component**: `src/components/common/ClearWorkspaceButton.tsx`

```typescript
interface ClearWorkspaceButtonProps {
  moduleName: string;
  onClear: () => Promise<void>;
}

export default function ClearWorkspaceButton({ moduleName, onClear })
```

**Features**:
- ⚠️ Confirmation modal with warning
- 🎨 Red color scheme (destructive action)
- ⏳ Loading state ("Clearing...")
- 🛡️ Prevents accidental clicks
- 🔒 Cannot be undone warning

---

## Integration

### Chat Module

**Location**: Top-right corner, next to Search and AI Summary buttons

```typescript
// src/components/chat/ChatInterface.tsx
const handleClearAll = async () => {
  await invoke('clear_all_messages');
  await loadMessages(currentChannelId);
};

<ClearWorkspaceButton moduleName="Messages" onClear={handleClearAll} />
```

**Clears**: All messages across all channels

---

### Documents Module

**Location**: Top-right corner of editor (when a document is selected)

```typescript
// src/components/documents/DocumentsInterface.tsx
const handleClearAll = async () => {
  await invoke('clear_all_documents');
  setCurrentDocument(null);
  await loadDocuments();
};

<ClearWorkspaceButton moduleName="Documents" onClear={handleClearAll} />
```

**Clears**: All documents + all version history

---

### Tasks Module

**Location**: Header area, between AI Generate and Task Filters

```typescript
// src/components/tasks/TasksInterface.tsx
const handleClearAll = async () => {
  await invoke('clear_all_tasks');
  await loadTasks();
};

<ClearWorkspaceButton moduleName="Tasks" onClear={handleClearAll} />
```

**Clears**: All tasks across all columns (To Do, In Progress, Done)

---

### Calendar Module

**Location**: Header area, before ICS Import/Export and View Toggle

```typescript
// src/components/calendar/CalendarView.tsx
const handleClearAll = async () => {
  await invoke('clear_all_events');
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  await loadEvents(start.toISOString(), end.toISOString());
};

<ClearWorkspaceButton moduleName="Events" onClear={handleClearAll} />
```

**Clears**: All calendar events

---

## User Experience

### Confirmation Flow

1. **User clicks "Clear All"** button
   - Red button with Trash icon
   - Clear visual indication of destructive action

2. **Confirmation modal appears**
   - ⚠️ Yellow warning icon
   - Bold heading: "Clear [Module]?"
   - Warning text: "This will permanently delete all [module] data. This action cannot be undone."
   - Two buttons: "Cancel" (gray) and "Delete All" (red)

3. **After confirmation**
   - Button shows "Clearing..." with disabled state
   - Backend IPC command executes
   - Database records deleted
   - UI refreshes to show empty state
   - Modal closes automatically

4. **Error handling**
   - If clear fails, shows alert with error message
   - Modal stays open for retry

---

## Visual Design

### Button

```css
- Border: red-600/30
- Text: red-600 (dark mode: red-400)
- Hover: red-500/10 background
- Icon: Trash2 (lucide-react)
- Size: Small (px-3 py-2)
```

### Modal

```css
- Overlay: Black 50% opacity
- Card: bg-card with border
- Warning Icon: Yellow (AlertTriangle)
- Cancel Button: Gray border
- Delete Button: Red background
```

---

## Safety Features

1. **Two-Step Confirmation**
   - Requires button click + modal confirmation
   - Prevents accidental deletions

2. **Clear Warning Message**
   - Explicitly states "permanently delete"
   - Specifies "cannot be undone"

3. **Visual Cues**
   - Red color throughout (universal danger color)
   - Warning icon in modal
   - Trash icon on button

4. **Loading State**
   - Disables buttons during operation
   - Shows "Clearing..." text
   - Prevents double-clicks

---

## Technical Notes

### Database Cascade

- **Documents**: When documents are cleared, all associated `document_versions` are also deleted (CASCADE)
- **Tasks**: All tasks deleted, but links to other modules remain (if those still exist)
- **Events**: All events deleted, but links remain
- **Messages**: All messages deleted across all channels
- **Links**: Can be cleared separately with `clear_all_links()`

### Performance

- Each clear operation returns the count of deleted records
- Single SQL `DELETE` statement per module (efficient)
- UI reloads immediately after clear completes

### Error Handling

- Database errors are caught and returned as `String` error
- Frontend shows alert() if clear fails
- Modal stays open on error for retry

---

## Testing

### Manual Test Cases

**TC-CLEAR-1: Chat Messages**
1. Send messages to multiple channels
2. Click "Clear All" in Chat
3. Confirm deletion
4. ✅ All messages deleted from all channels

**TC-CLEAR-2: Documents**
1. Create multiple documents with versions
2. Click "Clear All" in Documents
3. Confirm deletion
4. ✅ All documents + versions deleted
5. ✅ Editor shows empty state

**TC-CLEAR-3: Tasks**
1. Create tasks in all columns
2. Click "Clear All" in Tasks
3. Confirm deletion
4. ✅ All tasks deleted from all columns
5. ✅ Kanban board shows empty columns

**TC-CLEAR-4: Events**
1. Create multiple calendar events
2. Click "Clear All" in Calendar
3. Confirm deletion
4. ✅ All events deleted
5. ✅ Calendar shows no events

**TC-CLEAR-5: Confirmation**
1. Click "Clear All" in any module
2. Click "Cancel" in modal
3. ✅ No data deleted
4. ✅ Modal closes

**TC-CLEAR-6: Error Handling**
1. Simulate database error (disconnect DB)
2. Click "Clear All"
3. ✅ Error alert shown
4. ✅ Modal stays open

---

## Future Enhancements

### Potential Additions

1. **Selective Clear**
   - Clear by date range
   - Clear by channel/folder
   - Clear by status/priority

2. **Soft Delete**
   - Move to "Trash" instead of permanent delete
   - Allow recovery for 30 days
   - Add "Empty Trash" command

3. **Backup Before Clear**
   - Auto-export to JSON before clearing
   - Save to Downloads folder
   - Show success message with file path

4. **Undo Support**
   - Store deleted data temporarily
   - Allow immediate undo (5 seconds)
   - Clear undo buffer after timeout

5. **Bulk Operations**
   - Clear multiple modules at once
   - "Clear All Workspace Data" button in Settings
   - Master reset option

---

## Files Changed

### New Files
- `src/components/common/ClearWorkspaceButton.tsx` - Reusable component
- `src-tauri/src/commands/clear.rs` - Backend commands
- `FEATURES-CLEAR-WORKSPACE.md` - This documentation

### Modified Files
- `src-tauri/src/commands/mod.rs` - Registered clear module
- `src-tauri/src/main.rs` - Registered 5 clear commands
- `src-tauri/src/services/database.rs` - Added 5 clear methods
- `src/components/chat/ChatInterface.tsx` - Added clear button
- `src/components/documents/DocumentsInterface.tsx` - Added clear button
- `src/components/tasks/TasksInterface.tsx` - Added clear button
- `src/components/calendar/CalendarView.tsx` - Added clear button

---

## Code Statistics

- **Backend**: +5 commands, +25 lines
- **Database**: +5 methods, +30 lines
- **Frontend**: +1 component, +80 lines
- **Integration**: +4 files modified, +40 lines
- **Total**: ~175 lines of code added

---

## Summary

✅ **Clear Workspace** feature successfully implemented across all 4 modules  
✅ Safe, confirmed, and user-friendly  
✅ Consistent UI/UX across modules  
✅ Proper error handling and loading states  
✅ Ready for production use  

**User Benefit**: Quick way to reset workspace during testing or start fresh without reinstalling the app!

