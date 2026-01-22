import { PanelGroup, Panel, AiTab } from '../types';
import { getAllTabs } from './panelUtils';

interface SetupActiveAiTabIdParams {
  panelLayout: PanelGroup;
  assistantDockLayout: PanelGroup;
  activeAssistantPanelId: string;
}

export const setupActiveAiTabId = ({
  panelLayout,
  assistantDockLayout,
  activeAssistantPanelId,
}: SetupActiveAiTabIdParams) => {
  // Helper to find the active panel in the dock layout
  const findActivePanel = (group: PanelGroup): Panel | null => {
    if (group.type === 'panel' && group.panel) {
      if (group.panel.id === activeAssistantPanelId) {
        return group.panel
      }
    }
    if (group.type === 'split' && group.children) {
      for (const child of group.children) {
        const found = findActivePanel(child)
        if (found) return found
      }
    }
    return null
  }

  const activePanel = findActivePanel(assistantDockLayout)
  const activeTabId = activePanel?.activeTabId || activePanel?.tabs[0]?.id

  if (activeTabId) {
    (window as any).__banburyActiveAiTabId = activeTabId
  }
  
  // Populate __banburyAiTabs with AI tabs from BOTH layouts for plan execution coordination
  // This ensures agents are discoverable even when dragged between docks
  const mainTabs = getAllTabs(panelLayout)
  const assistantTabs = getAllTabs(assistantDockLayout)
  const allAiTabs = [...mainTabs, ...assistantTabs].filter((t): t is AiTab => t.type === 'ai')
  ;(window as any).__banburyAiTabs = allAiTabs
  
  // Register all tab threadIds in the thread map
  const threadMap = (window as any).__banburyTabThreadMap || {}
  allAiTabs.forEach((tab) => {
    if (tab.threadId) {
      threadMap[tab.id] = tab.threadId
    }
  })
  ;(window as any).__banburyTabThreadMap = threadMap

  return () => {
    delete (window as any).__banburyActiveAiTabId
  }
};
