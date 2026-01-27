import type { PanelGroup, WorkspaceTab } from '../types'
import { getAllTabs } from './panelUtils'

export type FindTabInAllLayoutsResult = {
  tab: WorkspaceTab | null
  sourceLayout: 'main' | 'assistant'
  sourcePanelId: string | null
}

function findSourcePanelId(layout: PanelGroup, tabId: string): string | null {
  let sourcePanelId: string | null = null
  const findSource = (l: PanelGroup): void => {
    if (l.type === 'panel' && l.panel) {
      if (l.panel.tabs.some((t) => t.id === tabId)) {
        sourcePanelId = l.panel.id
      }
    } else if (l.type === 'group' && l.children) {
      l.children.forEach(findSource)
    }
  }
  findSource(layout)
  return sourcePanelId
}

export function findTabInAllLayouts(
  tabId: string,
  panelLayout: PanelGroup,
  assistantDockLayout: PanelGroup
): FindTabInAllLayoutsResult {
  const mainTabs = getAllTabs(panelLayout)
  const mainTab = mainTabs.find((t) => t.id === tabId)
  if (mainTab) {
    const sourcePanelId = findSourcePanelId(panelLayout, tabId)
    return { tab: mainTab, sourceLayout: 'main', sourcePanelId }
  }

  const assistantTabs = getAllTabs(assistantDockLayout)
  const assistantTab = assistantTabs.find((t) => t.id === tabId)
  if (assistantTab) {
    const sourcePanelId = findSourcePanelId(assistantDockLayout, tabId)
    return { tab: assistantTab, sourceLayout: 'assistant', sourcePanelId }
  }

  return { tab: null, sourceLayout: 'main', sourcePanelId: null }
}
