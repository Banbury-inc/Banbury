// Handler functions for AI conversation tabs
import { AiTab } from '../../../pages/Workspaces/types'

export type { AiTab }

let tabCounter = 0

function generateThreadId(): string {
  // Generate a stable, unique thread ID for conversation tracking
  return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

export function createAiTab(label?: string, existingThreadId?: string): AiTab {
  tabCounter++
  return {
    id: `ai-tab-${Date.now()}-${tabCounter}`,
    label: label || `Chat ${tabCounter}`,
    type: 'ai',
    threadId: existingThreadId || generateThreadId(),
  }
}

export function createInitialAiTab(): AiTab {
  tabCounter = 1
  return {
    id: `ai-tab-${Date.now()}-1`,
    label: 'Chat 1',
    type: 'ai',
    threadId: generateThreadId(),
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

