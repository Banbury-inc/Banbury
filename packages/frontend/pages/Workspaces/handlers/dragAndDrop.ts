import { FileSystemItem } from '../../../utils/fileTreeUtils';

// Types from Workspaces.tsx
interface Panel {
  id: string;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}

type SplitDirection = 'horizontal' | 'vertical';

interface PanelGroup {
  id: string;
  type: 'panel' | 'group';
  direction?: SplitDirection;
  children?: PanelGroup[];
  panel?: Panel;
  size?: number;
}

interface FileTab {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  file: FileSystemItem;
  type: 'file';
}

interface EmailTab {
  id: string;
  subject: string;
  emailId: string;
  email: any; // Gmail message object
  type: 'email';
}

interface CalendarTab {
  id: string;
  title: string;
  type: 'calendar';
}

type WorkspaceTab = FileTab | EmailTab | CalendarTab;

interface DragState {
  isDragging: boolean;
  draggedTab: FileTab | null;
  draggedFromPanel: string | null;
  dragStartPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  dragDirection: 'horizontal' | 'vertical' | null;
  dropZone: string | null;
  dropTargetPanel: string | null;
}

// Handle context menu for tabs
export const handleTabContextMenu = (
  event: React.MouseEvent,
  tabId: string,
  panelId: string,
  setContextMenu: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    tabId: string;
    panelId: string;
  } | null>>
) => {
  event.preventDefault();
  setContextMenu({
    x: event.clientX,
    y: event.clientY,
    tabId,
    panelId
  });
};

// Mouse-based drag handlers (more reliable than HTML5 drag)
export const handleTabMouseDown = (
  event: React.MouseEvent,
  tab: FileTab,
  panelId: string,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) => {
  event.preventDefault();

  const startPos = { x: event.clientX, y: event.clientY };
  
  setDragState({
    isDragging: true,
    draggedTab: tab,
    draggedFromPanel: panelId,
    dragStartPosition: startPos,
    currentPosition: startPos,
    dragDirection: null,
    dropZone: null,
    dropTargetPanel: null,
  });
};

// Mouse move handler: only update position/direction; creation happens on drop
export const handleGlobalMouseMove = (
  event: MouseEvent,
  dragState: DragState,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) => {
  if (!dragState.isDragging || !dragState.dragStartPosition) return;

  const currentPos = { x: event.clientX, y: event.clientY };
  const deltaX = event.clientX - dragState.dragStartPosition.x;
  const deltaY = event.clientY - dragState.dragStartPosition.y;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);
  const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  let direction: 'horizontal' | 'vertical' | null = null;
  if (dragDistance > 30) direction = absDeltaX > absDeltaY ? 'horizontal' : 'vertical';

  setDragState(prev => ({ ...prev, currentPosition: currentPos, dragDirection: direction }));
};

export const handleGlobalMouseUp = (
  dragState: DragState,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) => {
  if (!dragState.isDragging) return;
  // Mouse-up does not create panels here; panel creation happens via monitor drop handler below
  setDragState({
    isDragging: false,
    draggedTab: null,
    draggedFromPanel: null,
    dragStartPosition: null,
    currentPosition: null,
    dragDirection: null,
    dropZone: null,
    dropTargetPanel: null,
  });
};

// Close context menu
export const closeContextMenu = (
  setContextMenu: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    tabId: string;
    panelId: string;
  } | null>>
) => {
  setContextMenu(null);
};

// Split tab to new panel
export const splitTabToNewPanel = (
  direction: SplitDirection,
  contextMenu: {
    x: number;
    y: number;
    tabId: string;
    panelId: string;
  } | null,
  findPanel: (layout: PanelGroup, panelId: string) => Panel | null,
  panelLayout: PanelGroup,
  removeTabFromPanel: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  splitPanel: (panelId: string, direction: SplitDirection, newFileTab?: FileTab) => void,
  closeContextMenu: () => void,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  if (!contextMenu) return;
  
  const panel = findPanel(panelLayout, contextMenu.panelId);
  const tab = panel?.tabs.find(t => t.id === contextMenu.tabId);
  
  if (tab) {
    // Remove tab from current panel
    setPanelLayout(prev => removeTabFromPanel(prev, contextMenu.panelId, contextMenu.tabId));
    
    // Create new panel with the tab
    splitPanel(contextMenu.panelId, direction, tab);
  }
  
  closeContextMenu();
};
