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

// Helper function to find panel by ID
export const findPanel = (layout: PanelGroup, panelId: string): Panel | null => {
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    return layout.panel;
  }
  if (layout.type === 'group' && layout.children) {
    for (const child of layout.children) {
      const found = findPanel(child, panelId);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to get all tabs across all panels
export const getAllTabs = (layout: PanelGroup): WorkspaceTab[] => {
  if (layout.type === 'panel' && layout.panel) {
    return layout.panel.tabs;
  }
  if (layout.type === 'group' && layout.children) {
    return layout.children.flatMap(child => getAllTabs(child));
  }
  return [];
};

// Helper functions for panel operations
export const updatePanelActiveTab = (layout: PanelGroup, panelId: string, tabId: string): PanelGroup => {
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    return {
      ...layout,
      panel: {
        ...layout.panel,
        activeTabId: tabId
      }
    };
  }
  if (layout.type === 'group' && layout.children) {
    return {
      ...layout,
      children: layout.children.map(child => updatePanelActiveTab(child, panelId, tabId))
    };
  }
  return layout;
};

export const addTabToPanel = (layout: PanelGroup, panelId: string, tab: WorkspaceTab): PanelGroup => {
  console.log('addTabToPanel called with panelId:', panelId, 'tab:', tab.fileName, 'layout type:', layout.type);
  
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    console.log('Adding tab to panel:', panelId, 'current tabs:', layout.panel.tabs.length);
    return {
      ...layout,
      panel: {
        ...layout.panel,
        tabs: [...layout.panel.tabs, tab],
        activeTabId: tab.id
      }
    };
  }
  if (layout.type === 'group' && layout.children) {
    console.log('Searching in group children for panel:', panelId);
    return {
      ...layout,
      children: layout.children.map(child => addTabToPanel(child, panelId, tab))
    };
  }
  console.log('Panel not found, returning original layout');
  return layout;
};

export const removeTabFromPanel = (layout: PanelGroup, panelId: string, tabId: string): PanelGroup => {
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    const newTabs = layout.panel.tabs.filter(tab => tab.id !== tabId);
    let newActiveTabId = layout.panel.activeTabId;
    
    // If closing the active tab, switch to another tab
    if (layout.panel.activeTabId === tabId) {
      newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
    }
    
    return {
      ...layout,
      panel: {
        ...layout.panel,
        tabs: newTabs,
        activeTabId: newActiveTabId
      }
    };
  }
  if (layout.type === 'group' && layout.children) {
    // Recursively remove tab, then collapse empty panels and groups
    const updatedChildren = layout.children
      .map(child => removeTabFromPanel(child, panelId, tabId))
      .filter(child => {
        if (child.type === 'panel' && child.panel) {
          return child.panel.tabs.length > 0;
        }
        return true;
      });

    // If a group ends up with only one child, collapse the group
    if (updatedChildren.length === 1) {
      return updatedChildren[0];
    }

    return {
      ...layout,
      children: updatedChildren
    };
  }
  return layout;
};
