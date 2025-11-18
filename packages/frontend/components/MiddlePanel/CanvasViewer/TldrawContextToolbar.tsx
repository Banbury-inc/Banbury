import React from 'react';
import { useEditor, track, TLShapeId } from 'tldraw';
import { Button } from '../../ui/button';
import { Copy, Group, Ungroup, Lock, Unlock, Trash2, Edit3 } from 'lucide-react';
import { cn } from '../../../utils';

interface TldrawContextToolbarProps {
  onEdit?: (shapeIds: TLShapeId[]) => void;
  onDuplicate?: (shapeIds: TLShapeId[]) => void;
  onDelete?: (shapeIds: TLShapeId[]) => void;
  onGroup?: (shapeIds: TLShapeId[]) => void;
  onUngroup?: (shapeIds: TLShapeId[]) => void;
  onLock?: (shapeIds: TLShapeId[]) => void;
  onUnlock?: (shapeIds: TLShapeId[]) => void;
}

export const TldrawContextToolbar = track(({
  onEdit,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onLock,
  onUnlock,
}: TldrawContextToolbarProps) => {
  const editor = useEditor();
  
  // Only show toolbar when in select.idle state
  const showToolbar = editor.isIn('select.idle');
  if (!showToolbar) {
    console.log('[TldrawContextToolbar] Not showing - editor not in select.idle state');
    return null;
  }

  const selectedShapeIds = editor.getSelectedShapeIds();
  if (selectedShapeIds.length === 0) {
    console.log('[TldrawContextToolbar] Not showing - no shapes selected');
    return null;
  }

  console.log('[TldrawContextToolbar] Showing toolbar for', selectedShapeIds.length, 'selected shapes');

  const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds();
  if (!selectionRotatedPageBounds) return null;

  const pageCoordinates = editor.pageToViewport(selectionRotatedPageBounds.point);

  // Check if all selected shapes are already grouped
  const allShapesGrouped = selectedShapeIds.every(
    (shapeId) => editor.getShape(shapeId)?.type === 'group'
  );

  // Check if any shapes are locked
  const hasLockedShapes = selectedShapeIds.some(
    (shapeId) => editor.getShape(shapeId)?.isLocked
  );

  const handleEdit = () => {
    if (onEdit) {
      onEdit(selectedShapeIds);
    }
  };

  const handleDuplicate = () => {
    const shapeIds = Array.from(selectedShapeIds);
    editor.duplicateShapes(shapeIds);
    if (onDuplicate) {
      onDuplicate(shapeIds);
    }
  };

  const handleDelete = () => {
    const shapeIds = Array.from(selectedShapeIds);
    editor.deleteShapes(shapeIds);
    if (onDelete) {
      onDelete(shapeIds);
    }
  };

  const handleGroup = () => {
    const shapeIds = Array.from(selectedShapeIds);
    if (allShapesGrouped) {
      editor.ungroupShapes(shapeIds);
      if (onUngroup) {
        onUngroup(shapeIds);
      }
    } else {
      editor.groupShapes(shapeIds);
      if (onGroup) {
        onGroup(shapeIds);
      }
    }
  };

  const handleToggleLock = () => {
    const shapeIds = Array.from(selectedShapeIds);
    if (hasLockedShapes) {
      // Unlock shapes
      shapeIds.forEach(shapeId => {
        const shape = editor.getShape(shapeId);
        if (shape?.isLocked) {
          editor.updateShape({ ...shape, isLocked: false });
        }
      });
      if (onUnlock) {
        onUnlock(shapeIds);
      }
    } else {
      // Lock shapes
      shapeIds.forEach(shapeId => {
        const shape = editor.getShape(shapeId);
        if (shape && !shape.isLocked) {
          editor.updateShape({ ...shape, isLocked: true });
        }
      });
      if (onLock) {
        onLock(shapeIds);
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'all',
        top: pageCoordinates.y - 48,
        left: pageCoordinates.x,
        width: selectionRotatedPageBounds.width * editor.getZoomLevel(),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg',
          'bg-background border border-border',
          'backdrop-blur-sm bg-opacity-95'
        )}
      >
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          title="Edit selected shapes"
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <Edit3 className="h-4 w-4" />
        </Button>

        {/* Duplicate Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          title="Duplicate selected shapes"
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          <Copy className="h-4 w-4" />
        </Button>

        {/* Group/Ungroup Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGroup}
          title={allShapesGrouped ? 'Ungroup shapes' : 'Group shapes'}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {allShapesGrouped ? (
            <Ungroup className="h-4 w-4" />
          ) : (
            <Group className="h-4 w-4" />
          )}
        </Button>

        {/* Lock/Unlock Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleLock}
          title={hasLockedShapes ? 'Unlock shapes' : 'Lock shapes'}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {hasLockedShapes ? (
            <Unlock className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          title="Delete selected shapes"
          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

export default TldrawContextToolbar;
