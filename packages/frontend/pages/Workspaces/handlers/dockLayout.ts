import { Panel, PanelGroup, WorkspaceTab, SplitDirection } from '../types'

// Determine which dock root a panel belongs to based on its ID prefix
export function getDockRoot(panelId: string): 'main' | 'assistant' {
  return panelId.startsWith('assistant-') ? 'assistant' : 'main'
}

// Helper function to find panel by ID in a layout
export function findPanelInLayout(layout: PanelGroup, panelId: string): Panel | null {
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    return layout.panel
  }
  if (layout.type === 'group' && layout.children) {
    for (const child of layout.children) {
      const found = findPanelInLayout(child, panelId)
      if (found) return found
    }
  }
  return null
}

// Get all tabs across all panels in a layout
export function getAllTabsFromLayout(layout: PanelGroup): WorkspaceTab[] {
  if (layout.type === 'panel' && layout.panel) {
    return layout.panel.tabs
  }
  if (layout.type === 'group' && layout.children) {
    return layout.children.flatMap(child => getAllTabsFromLayout(child))
  }
  return []
}

// Find which panel contains a tab
export function findPanelContainingTab(layout: PanelGroup, tabId: string): string | null {
  if (layout.type === 'panel' && layout.panel) {
    if (layout.panel.tabs.some(t => t.id === tabId)) {
      return layout.panel.id
    }
  }
  if (layout.type === 'group' && layout.children) {
    for (const child of layout.children) {
      const found = findPanelContainingTab(child, tabId)
      if (found) return found
    }
  }
  return null
}

// Add tab to a panel in layout
export function addTabToPanelInLayout(layout: PanelGroup, panelId: string, tab: WorkspaceTab): PanelGroup {
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    return {
      ...layout,
      panel: {
        ...layout.panel,
        tabs: [...layout.panel.tabs, tab],
        activeTabId: tab.id
      }
    }
  }
  if (layout.type === 'group' && layout.children) {
    return {
      ...layout,
      children: layout.children.map(child => addTabToPanelInLayout(child, panelId, tab))
    }
  }
  return layout
}

// Remove tab from a panel in layout
export function removeTabFromPanelInLayout(layout: PanelGroup, panelId: string, tabId: string): PanelGroup {
  if (layout.type === 'panel' && layout.panel?.id === panelId) {
    const newTabs = layout.panel.tabs.filter(tab => tab.id !== tabId)
    let newActiveTabId = layout.panel.activeTabId
    
    if (layout.panel.activeTabId === tabId) {
      newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null
    }
    
    return {
      ...layout,
      panel: {
        ...layout.panel,
        tabs: newTabs,
        activeTabId: newActiveTabId
      }
    }
  }
  if (layout.type === 'group' && layout.children) {
    const updatedChildren = layout.children
      .map(child => removeTabFromPanelInLayout(child, panelId, tabId))
      .filter(child => {
        if (child.type === 'panel' && child.panel) {
          return child.panel.tabs.length > 0
        }
        return true
      })

    if (updatedChildren.length === 1) {
      return updatedChildren[0]
    }

    return {
      ...layout,
      children: updatedChildren
    }
  }
  return layout
}

// Split a panel in layout with a new tab
export function splitPanelInLayout(
  layout: PanelGroup,
  panelId: string,
  direction: SplitDirection,
  newTab: WorkspaceTab
): { layout: PanelGroup; newPanelId: string } {
  const newPanelId = `panel-${Date.now()}`
  const newPanel: Panel = {
    id: newPanelId,
    tabs: [newTab],
    activeTabId: newTab.id
  }
  
  const splitInLayout = (l: PanelGroup): PanelGroup => {
    if (l.type === 'panel' && l.panel?.id === panelId) {
      return {
        id: `group-${Date.now()}`,
        type: 'group',
        direction,
        children: [
          { ...l, size: 50 },
          {
            id: newPanelId,
            type: 'panel',
            panel: newPanel,
            size: 50
          }
        ]
      }
    }
    if (l.type === 'group' && l.children) {
      return {
        ...l,
        children: l.children.map(child => splitInLayout(child))
      }
    }
    return l
  }
  
  return { layout: splitInLayout(layout), newPanelId }
}

// Get the first panel ID from a layout
export function getFirstPanelId(layout: PanelGroup): string | null {
  if (layout.type === 'panel' && layout.panel) {
    return layout.panel.id
  }
  if (layout.type === 'group' && layout.children && layout.children.length > 0) {
    return getFirstPanelId(layout.children[0])
  }
  return null
}

