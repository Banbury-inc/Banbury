# Global Accept All / Reject All Implementation

## Overview
This implements a Cursor-style global "Accept all" and "Reject all" button interface at the top of the conversation thread. When AI suggests changes across multiple documents, spreadsheets, or canvases, a single consolidated bar appears allowing the user to accept or reject all changes at once.

## Architecture

### Event System
The implementation uses a custom event-based system to coordinate between the thread and individual AI tool components:

#### Events
1. **`ai-change-registered`** - Emitted when an AI tool mounts with pending changes
   - `id`: Unique identifier for the change
   - `type`: Type of change ('document', 'spreadsheet', 'canvas')
   - `description`: Human-readable description

2. **`ai-change-resolved`** - Emitted when a change is accepted, rejected, or cleaned up
   - `id`: The change ID to remove from tracking

3. **`ai-accept-all`** - Broadcast event to accept all pending changes
   - Listened to by all active AI tool components

4. **`ai-reject-all`** - Broadcast event to reject all pending changes
   - Listened to by all active AI tool components

### Components Modified

#### 1. `thread.tsx`
**State Management:**
```typescript
const [pendingChanges, setPendingChanges] = useState<Array<{ 
  id: string; 
  type: string; 
  description: string 
}>>([]);
```

**UI Bar:**
- Appears at the top of the thread when `pendingChanges.length > 0`
- Shows count of pending changes
- Displays descriptions of each change
- Provides "Accept all" and "Reject all" buttons
- Styled with amber/warning colors matching the AI tool cards
- Includes keyboard shortcuts (⌘↵ for accept, ⌘⇧⌫ for reject)
- Sticky positioned for visibility while scrolling

**Event Handlers:**
- Listens for `ai-change-registered` events to add changes to tracker
- Listens for `ai-change-resolved` events to remove changes from tracker
- Broadcasts `ai-accept-all` when user clicks "Accept all"
- Broadcasts `ai-reject-all` when user clicks "Reject all"

#### 2. `DocxAITool.tsx`
- Generates unique change ID on mount
- Registers change with thread via `ai-change-registered` event
- Listens for `ai-accept-all` and `ai-reject-all` events
- Calls `handleAcceptAll()` or `handleReject()` when global events fire
- Emits `ai-change-resolved` when change is processed
- Prevents double-application/rejection with guards

#### 3. `SheetAITool.tsx`
- Same pattern as DocxAITool
- Registers spreadsheet changes
- Responds to global accept/reject events
- Auto-applies changes but can still be controlled globally

#### 4. `TldrawAITool.tsx`
- Same pattern as DocxAITool and SheetAITool
- Registers canvas changes
- Responds to global accept/reject events

## User Experience

### Before (Individual)
```
AI suggests document changes
  ↓
User clicks "Accept all" on document card
  ↓
AI suggests spreadsheet changes
  ↓
User clicks "Accept all" on spreadsheet card
  ↓
AI suggests canvas changes
  ↓
User clicks "Accept all" on canvas card
```

### After (Global)
```
AI suggests changes to document, spreadsheet, and canvas
  ↓
Global bar appears: "3 changes suggested"
  ↓
User clicks "Accept all" in global bar
  ↓
All changes applied across all tools simultaneously
```

## Visual Design

### Global Bar Appearance
- **Position**: Sticky at top of thread
- **Background**: Amber with backdrop blur (`bg-amber-900/90 backdrop-blur-sm`)
- **Border**: Amber border (`border-amber-700`)
- **Indicator**: Pulsing amber dot showing active state
- **Layout**: Flex with change count + descriptions on left, buttons on right
- **Animation**: Smooth fade-in/out with motion.div

### Buttons
- **Reject all**: Outlined button with red text (`text-red-400 border-red-700`)
- **Accept all**: Solid green button (`bg-green-600 hover:bg-green-700`)
- **Size**: Small (`size="sm"`)
- **Height**: Fixed at `h-8` for consistency

## Technical Details

### Change ID Generation
```typescript
const changeId = `${type}-${Date.now()}-${Math.random()}`;
```
Ensures uniqueness across multiple simultaneous changes.

### Cleanup
All AI tool components clean up properly:
- Remove event listeners on unmount
- Emit `ai-change-resolved` in cleanup
- Clear timers

### State Guards
Prevent double-application/rejection:
```typescript
if (applied || rejected) return;
```

### Responsive Design
- Full descriptions shown on desktop (`hidden sm:flex`)
- Keyboard shortcuts hidden on mobile (`hidden sm:inline`)
- Mobile-friendly button sizes

## Future Enhancements
- Keyboard shortcut implementation (currently visual only)
- Individual change selection/deselection
- Undo/redo support
- Change preview on hover
- Grouped changes by type
- Progress indicator for batch operations

