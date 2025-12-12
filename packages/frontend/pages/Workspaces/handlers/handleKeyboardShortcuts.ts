export function createKeyboardShortcutHandler(onFileSearchOpen?: () => void) {
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
      if (onFileSearchOpen) {
        onFileSearchOpen()
      }
      return
    }
  }
}

