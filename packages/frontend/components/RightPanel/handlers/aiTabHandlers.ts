// Handler functions for AI conversation tabs

export interface AiTab {
  id: string
  label: string
}

let tabCounter = 0

export function createAiTab(label?: string): AiTab {
  tabCounter++
  return {
    id: `ai-tab-${Date.now()}-${tabCounter}`,
    label: label || `Chat ${tabCounter}`,
  }
}

export function createInitialAiTab(): AiTab {
  tabCounter = 1
  return {
    id: `ai-tab-${Date.now()}-1`,
    label: 'Chat 1',
  }
}

export function getNextActiveTabId(
  tabs: AiTab[],
  closingTabId: string
): string | null {
  if (tabs.length <= 1) return null
  
  const closingIndex = tabs.findIndex((t) => t.id === closingTabId)
  if (closingIndex === -1) return tabs[0]?.id || null
  
  // Prefer tab to the right, then to the left
  if (closingIndex < tabs.length - 1) {
    return tabs[closingIndex + 1].id
  }
  return tabs[closingIndex - 1]?.id || null
}

export function reorderAiTabs(
  tabs: AiTab[],
  sourceIndex: number,
  destinationIndex: number
): AiTab[] {
  const newTabs = [...tabs]
  const [moved] = newTabs.splice(sourceIndex, 1)
  newTabs.splice(destinationIndex, 0, moved)
  return newTabs
}

export function resetTabCounter(): void {
  tabCounter = 0
}

