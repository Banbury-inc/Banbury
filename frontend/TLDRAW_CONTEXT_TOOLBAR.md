# Tldraw Context Toolbar Implementation

This document describes the implementation of the context toolbar that appears when shapes are selected, matching athena-intelligence's approach.

## 🎯 **Athena Intelligence Pattern:**

From analyzing athena-intelligence's implementation:
```typescript
const ContextToolbarComponent = track(() => {
  const editor = useEditor();
  const showToolbar = editor.isIn('select.idle');
  if (!showToolbar) return null;

  const selectedShapeIds = editor.getSelectedShapeIds();
  if (selectedShapeIds.length === 0) return null;

  // Position toolbar above selected shapes
  const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds();
  const pageCoordinates = editor.pageToViewport(selectionRotatedPageBounds.point);

  return (
    <div style={{ position: 'absolute', top: pageCoordinates.y - 42, ... }}>
      <Button onClick={() => exportShapesToCopilotChatAsImage(...)}>Ask</Button>
      <Button onClick={() => editor.duplicateShapes(...)}>Duplicate</Button>
      <Button onClick={() => editor.groupShapes(...)}>Group</Button>
      <Button onClick={() => editor.deleteShapes(...)}>Delete</Button>
    </div>
  );
});
```

## 🔧 **Your Implementation:**

### 1. **TldrawContextToolbar Component** (`/src/components/TldrawContextToolbar.tsx`):

```typescript
import { useEditor, track, TLShapeId } from 'tldraw';
import { Button } from './ui/button';
import { Copy, Group, Ungroup, Lock, Unlock, Trash2, Edit3 } from 'lucide-react';

export const TldrawContextToolbar = track(({ ... }) => {
  const editor = useEditor();
  
  // Only show when shapes are selected and in select.idle state
  const showToolbar = editor.isIn('select.idle');
  const selectedShapeIds = editor.getSelectedShapeIds();
  
  if (!showToolbar || selectedShapeIds.length === 0) return null;

  // Position toolbar above selection
  const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds();
  const pageCoordinates = editor.pageToViewport(selectionRotatedPageBounds.point);

  return (
    <div style={{ position: 'absolute', top: pageCoordinates.y - 48, ... }}>
      {/* Buttons for Edit, Duplicate, Group/Ungroup, Lock/Unlock, Delete */}
    </div>
  );
});
```

### 2. **Integration into TldrawViewer:**

```typescript
<Tldraw
  components={{
    InFrontOfTheCanvas: isEditMode ? () => (
      <TldrawContextToolbar
        onEdit={handleEditShapes}
        onDuplicate={handleDuplicateShapes}
        onDelete={handleDeleteShapes}
        onGroup={handleGroupShapes}
        onUngroup={handleUngroupShapes}
        onLock={handleLockShapes}
        onUnlock={handleUnlockShapes}
      />
    ) : undefined,
  }}
/>
```

## 🎨 **Toolbar Features:**

### **Smart Positioning:**
- Appears above selected shapes
- Automatically adjusts to zoom level
- Follows selection bounds
- Prevents pointer event conflicts

### **Action Buttons:**

1. **✏️ Edit** - Custom edit functionality
2. **📋 Duplicate** - Duplicates selected shapes
3. **📦 Group/Ungroup** - Groups or ungroups shapes (context-aware)
4. **🔒 Lock/Unlock** - Locks or unlocks shapes (context-aware)
5. **🗑️ Delete** - Deletes selected shapes

### **Smart Button States:**
```typescript
// Context-aware grouping
const allShapesGrouped = selectedShapeIds.every(
  (shapeId) => editor.getShape(shapeId)?.type === 'group'
);

// Shows "Group" or "Ungroup" based on selection
{allShapesGrouped ? <Ungroup /> : <Group />}

// Context-aware locking
const hasLockedShapes = selectedShapeIds.some(
  (shapeId) => editor.getShape(shapeId)?.isLocked
);

// Shows "Lock" or "Unlock" based on selection
{hasLockedShapes ? <Unlock /> : <Lock />}
```

## 🎯 **User Experience:**

### **Activation:**
1. Switch to Edit Mode in tldraw viewer
2. Select one or more shapes
3. Context toolbar appears above selection

### **Interactions:**
- **Edit**: Custom handler for shape editing
- **Duplicate**: Creates copies of selected shapes
- **Group**: Groups multiple shapes into single group
- **Ungroup**: Ungroups grouped shapes into individual shapes
- **Lock**: Prevents shapes from being edited/moved
- **Unlock**: Re-enables editing for locked shapes
- **Delete**: Removes selected shapes from canvas

### **Visual Design:**
```typescript
<div className="flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg bg-background border border-border backdrop-blur-sm bg-opacity-95">
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
    <Edit3 className="h-4 w-4" />
  </Button>
  {/* More buttons... */}
</div>
```

## 🔄 **Integration Flow:**

1. **Shape Selection** → Toolbar appears
2. **Button Click** → Action executed via editor
3. **Callback Fired** → Custom handler called
4. **UI Updates** → Toolbar updates based on new state

## 🚀 **Advanced Features:**

### **Track Integration:**
```typescript
export const TldrawContextToolbar = track(({ ... }) => {
  // Automatically re-renders when editor state changes
});
```

### **Event Handling:**
```typescript
onPointerDown={(e) => e.stopPropagation()} // Prevents canvas interaction
```

### **Responsive Positioning:**
```typescript
style={{
  top: pageCoordinates.y - 48,
  left: pageCoordinates.x,
  width: selectionRotatedPageBounds.width * editor.getZoomLevel(),
}}
```

## 🎨 **Visual Comparison:**

**Athena Intelligence Style:**
- Material-UI buttons
- Rounded corners
- Shadow effects
- Button text labels

**Your Implementation:**
- Lucide React icons
- Consistent button sizing
- Modern glass-morphism effect
- Icon-only buttons with tooltips

## 🔮 **Extension Points:**

### **Easy to Add More Actions:**
```typescript
// Custom shape transformations
<Button onClick={() => editor.rotateShapes(selectedShapeIds, Math.PI / 4)}>
  <RotateCw className="h-4 w-4" />
</Button>

// Color changes
<Button onClick={() => editor.setStyleForSelectedShapes(DefaultColorStyle, 'red')}>
  <Palette className="h-4 w-4" />
</Button>

// Alignment tools
<Button onClick={() => editor.alignShapes(selectedShapeIds, 'left')}>
  <AlignLeft className="h-4 w-4" />
</Button>
```

### **Custom Handlers:**
```typescript
// Implement specific business logic
const handleEditShapes = useCallback((shapeIds: TLShapeId[]) => {
  // Open custom editing modal
  // Trigger specific workflows
  // Log analytics events
}, []);
```

## 🎯 **Perfect Match with Athena Intelligence:**

- ✅ **Same positioning logic** - Above selected shapes
- ✅ **Same activation pattern** - Only when shapes selected
- ✅ **Similar functionality** - Duplicate, group, delete
- ✅ **Context-aware buttons** - Smart state management
- ✅ **Track integration** - Reactive updates
- ✅ **InFrontOfTheCanvas** - Proper layer positioning

Your implementation now provides the same professional editing experience as athena-intelligence, with a modern design system and extensible architecture! 🚀
