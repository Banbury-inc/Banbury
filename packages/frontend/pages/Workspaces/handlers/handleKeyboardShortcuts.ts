import { 
  getStoredKeybinds, 
  getActiveKey, 
  parseKeyString,
  KeybindsState 
} from '../../../components/modals/settings-tabs/handlers/keybindHandlers'

interface KeyboardShortcutCallbacks {
  onFileSearchOpen?: () => void
  onToggleFileSidebar?: () => void
}

// Cache keybinds to avoid reading localStorage on every keypress
let cachedKeybinds: KeybindsState | null = null

function getKeybinds(): KeybindsState {
  if (!cachedKeybinds) {
    cachedKeybinds = getStoredKeybinds()
  }
  return cachedKeybinds
}

// Listen for keybind updates to invalidate cache
if (typeof window !== 'undefined') {
  window.addEventListener('keybinds-updated', () => {
    cachedKeybinds = null
  })
}

function matchesKeybind(event: KeyboardEvent, keybindKey: string): boolean {
  const { key: expectedKey, shift: expectedShift } = parseKeyString(keybindKey)
  return event.key.toLowerCase() === expectedKey && event.shiftKey === expectedShift
}

export function createKeyboardShortcutHandler(callbacks: KeyboardShortcutCallbacks = {}) {
  const { onFileSearchOpen, onToggleFileSidebar } = callbacks

  return function handleKeyDown(event: KeyboardEvent) {
    // Guard against undefined event.key
    if (!event.key) {
      return
    }

    const isCtrl = event.ctrlKey || event.metaKey
    if (!isCtrl) return

    const keybinds = getKeybinds()

    // Check for new agent shortcut (default: Ctrl+N)
    const newAgentKey = getActiveKey(keybinds.newAgent)
    if (matchesKeybind(event, newAgentKey)) {
      // Prevent default to override browser behavior
      event.preventDefault()
      event.stopPropagation()
      // Get the active AI tab ID if available
      const activeTabId = (window as any).__banburyActiveAiTabId
      // Dispatch the clear-conversation event to create a new agent
      // Note: If activeTabId is not set, dispatch without tabId - the thread component
      // will check if it's the active tab and handle accordingly
      window.dispatchEvent(new CustomEvent('clear-conversation', { 
        detail: activeTabId ? { tabId: activeTabId } : {} 
      }))
      return
    }

    // Check for file search shortcut (default: Ctrl+P)
    const searchFilesKey = getActiveKey(keybinds.searchFiles)
    if (matchesKeybind(event, searchFilesKey)) {
      // Check if file search dialog is already open by looking for the command dialog
      const fileSearchDialog = document.querySelector('[role="dialog"][data-state="open"]')
      const isFileSearchOpen = fileSearchDialog && 
                              fileSearchDialog.querySelector('[cmdk-input-wrapper]')
      
      // If file search is already open, don't prevent default - let the dialog handle it
      if (isFileSearchOpen) {
        return
      }
      
      // Otherwise, prevent default (override browser print) and open file search
      event.preventDefault()
      event.stopPropagation()
      onFileSearchOpen?.()
      return
    }

    // Check for toggle file sidebar shortcut (default: Ctrl+H)
    const toggleSidebarKey = getActiveKey(keybinds.toggleFileSidebar)
    if (matchesKeybind(event, toggleSidebarKey)) {
      event.preventDefault()
      event.stopPropagation()
      onToggleFileSidebar?.()
      return
    }

    // Check for alternate toggle file sidebar shortcut (default: Ctrl+Shift+L)
    const toggleSidebarAltKey = getActiveKey(keybinds.toggleFileSidebarAlt)
    if (matchesKeybind(event, toggleSidebarAltKey)) {
      event.preventDefault()
      event.stopPropagation()
      onToggleFileSidebar?.()
      return
    }
  }
}

