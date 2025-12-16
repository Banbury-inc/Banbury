interface KeyboardShortcutCallbacks {
  onFileSearchOpen?: () => void
  onToggleFileSidebar?: () => void
}

export function createKeyboardShortcutHandler(callbacks: KeyboardShortcutCallbacks = {}) {
  const { onFileSearchOpen, onToggleFileSidebar } = callbacks

  return function handleKeyDown(event: KeyboardEvent) {
    // Guard against undefined event.key
    if (!event.key) {
      return
    }

    const isCtrl = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()

    // Check for Ctrl+N (Windows/Linux) or Cmd+N (Mac) - always work globally
    if (isCtrl && key === 'n') {
      // Prevent default to override browser behavior
      event.preventDefault()
      event.stopPropagation()
      // Dispatch the clear-conversation event to create a new agent
      window.dispatchEvent(new CustomEvent('clear-conversation', {}))
      return
    }

    // Check for Ctrl+P (Windows/Linux) or Cmd+P (Mac) for file search - always work globally
    if (isCtrl && key === 'p') {
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

    // Check for Ctrl+H (Windows/Linux) or Cmd+H (Mac) to toggle file sidebar
    // Note: On macOS, Cmd+H may be intercepted by the OS to hide the app
    if (isCtrl && !event.shiftKey && key === 'h') {
      event.preventDefault()
      event.stopPropagation()
      onToggleFileSidebar?.()
      return
    }

    // Fallback: Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (Mac) to toggle file sidebar
    // This ensures the shortcut works even when Cmd+H is intercepted by the OS
    if (isCtrl && event.shiftKey && key === 'l') {
      event.preventDefault()
      event.stopPropagation()
      onToggleFileSidebar?.()
      return
    }
  }
}

