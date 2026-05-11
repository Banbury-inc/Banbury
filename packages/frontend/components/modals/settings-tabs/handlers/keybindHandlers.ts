// Default keybind configuration
export interface KeybindConfig {
  id: string
  label: string
  description: string
  defaultKey: string
  customKey: string | null
}

export interface KeybindsState {
  newAgent: KeybindConfig
  searchFiles: KeybindConfig
  toggleFileSidebar: KeybindConfig
  toggleFileSidebarAlt: KeybindConfig
  toggleAssistantPanel: KeybindConfig
}

const KEYBINDS_STORAGE_KEY = 'customKeybinds'

export const defaultKeybinds: KeybindsState = {
  newAgent: {
    id: 'newAgent',
    label: 'New Agent',
    description: 'Create a new AI agent conversation',
    defaultKey: 'n',
    customKey: null,
  },
  searchFiles: {
    id: 'searchFiles',
    label: 'Search Files',
    description: 'Open the file search dialog',
    defaultKey: 'p',
    customKey: null,
  },
  toggleFileSidebar: {
    id: 'toggleFileSidebar',
    label: 'Toggle File Sidebar',
    description: 'Show or hide the file sidebar',
    defaultKey: 'h',
    customKey: null,
  },
  toggleFileSidebarAlt: {
    id: 'toggleFileSidebarAlt',
    label: 'Toggle File Sidebar (Alt)',
    description: 'Alternative shortcut to toggle file sidebar',
    defaultKey: 'shift+l',
    customKey: null,
  },
  toggleAssistantPanel: {
    id: 'toggleAssistantPanel',
    label: 'Toggle Right Sidebar',
    description: 'Show or hide the right sidebar',
    defaultKey: 'l',
    customKey: null,
  },
}

export function getStoredKeybinds(): KeybindsState {
  if (typeof window === 'undefined') return defaultKeybinds
  
  try {
    const stored = localStorage.getItem(KEYBINDS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge stored values with defaults to ensure all keybinds exist
      return {
        newAgent: { ...defaultKeybinds.newAgent, customKey: parsed.newAgent?.customKey ?? null },
        searchFiles: { ...defaultKeybinds.searchFiles, customKey: parsed.searchFiles?.customKey ?? null },
        toggleFileSidebar: { ...defaultKeybinds.toggleFileSidebar, customKey: parsed.toggleFileSidebar?.customKey ?? null },
        toggleFileSidebarAlt: { ...defaultKeybinds.toggleFileSidebarAlt, customKey: parsed.toggleFileSidebarAlt?.customKey ?? null },
        toggleAssistantPanel: { ...defaultKeybinds.toggleAssistantPanel, customKey: parsed.toggleAssistantPanel?.customKey ?? null },
      }
    }
  } catch (error) {
    console.error('Error reading keybinds from storage:', error)
  }
  
  return defaultKeybinds
}

export function saveKeybinds(keybinds: KeybindsState): void {
  if (typeof window === 'undefined') return
  
  try {
    // Only save custom keys to minimize storage
    const toStore = {
      newAgent: { customKey: keybinds.newAgent.customKey },
      searchFiles: { customKey: keybinds.searchFiles.customKey },
      toggleFileSidebar: { customKey: keybinds.toggleFileSidebar.customKey },
      toggleFileSidebarAlt: { customKey: keybinds.toggleFileSidebarAlt.customKey },
      toggleAssistantPanel: { customKey: keybinds.toggleAssistantPanel.customKey },
    }
    localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(toStore))
    
    // Dispatch storage event for other components to pick up
    window.dispatchEvent(new CustomEvent('keybinds-updated'))
  } catch (error) {
    console.error('Error saving keybinds to storage:', error)
  }
}

export function updateKeybind(keybindId: keyof KeybindsState, newKey: string | null): KeybindsState {
  const currentKeybinds = getStoredKeybinds()
  const updatedKeybinds = {
    ...currentKeybinds,
    [keybindId]: {
      ...currentKeybinds[keybindId],
      customKey: newKey,
    },
  }
  saveKeybinds(updatedKeybinds)
  return updatedKeybinds
}

export function resetKeybind(keybindId: keyof KeybindsState): KeybindsState {
  return updateKeybind(keybindId, null)
}

export function resetAllKeybinds(): KeybindsState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEYBINDS_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('keybinds-updated'))
  }
  return defaultKeybinds
}

export function getActiveKey(keybind: KeybindConfig): string {
  return keybind.customKey ?? keybind.defaultKey
}

// Parse a key string like "shift+l" into its components
export function parseKeyString(keyString: string): { key: string; shift: boolean } {
  const parts = keyString.toLowerCase().split('+')
  const hasShift = parts.includes('shift')
  const key = parts.filter(p => p !== 'shift')[0] || ''
  return { key, shift: hasShift }
}

// Format a key for display (e.g., "shift+l" -> "⇧ + L")
export function formatKeyForDisplay(keyString: string, isMac: boolean): string {
  const { key, shift } = parseKeyString(keyString)
  const parts: string[] = []
  
  parts.push(isMac ? '⌘' : 'Ctrl')
  if (shift) parts.push(isMac ? '⇧' : 'Shift')
  parts.push(key.toUpperCase())
  
  return parts.join(' + ')
}

// Convert a keyboard event to a key string
export function keyEventToString(event: KeyboardEvent): string | null {
  // Ignore modifier-only key presses
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) {
    return null
  }
  
  const key = event.key.toLowerCase()
  
  // Only allow alphanumeric keys and some special keys
  const allowedKeys = /^[a-z0-9]$/
  if (!allowedKeys.test(key)) {
    return null
  }
  
  if (event.shiftKey) {
    return `shift+${key}`
  }
  
  return key
}

// Check if a key combination matches a keybind
export function matchesKeybind(event: KeyboardEvent, keybind: KeybindConfig): boolean {
  const isCtrl = event.ctrlKey || event.metaKey
  if (!isCtrl) return false
  
  const activeKey = getActiveKey(keybind)
  const { key, shift } = parseKeyString(activeKey)
  
  return event.key.toLowerCase() === key && event.shiftKey === shift
}
