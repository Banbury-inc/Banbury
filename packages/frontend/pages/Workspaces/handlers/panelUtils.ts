import { Panel, PanelGroup, WorkspaceTab } from '../types';

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

export const addTabToPanel = (layout: PanelGroup, panelId: string, tab: WorkspaceTab, insertIndex?: number): PanelGroup => {
  
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    const nextTabs = [...layout.panel.tabs];
    const safeInsertIndex = typeof insertIndex === 'number'
      ? Math.max(0, Math.min(insertIndex, nextTabs.length))
      : nextTabs.length;
    nextTabs.splice(safeInsertIndex, 0, tab);

    return {
      ...layout,
      panel: {
        ...layout.panel,
        tabs: nextTabs,
        activeTabId: tab.id
      }
    };
  }
  if (layout.type === 'group' && layout.children) {
    return {
      ...layout,
      children: layout.children.map(child => addTabToPanel(child, panelId, tab, insertIndex))
    };
  }
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
