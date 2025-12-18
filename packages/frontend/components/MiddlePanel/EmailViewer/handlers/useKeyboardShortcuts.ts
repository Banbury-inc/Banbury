import { useEffect, useCallback } from 'react'

interface UseKeyboardShortcutsProps {
  onSend: () => void
  enabled: boolean
}

export function useKeyboardShortcuts({ onSend, enabled }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Ctrl+Enter or Cmd+Enter to send
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      onSend()
    }
  }, [onSend, enabled])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

// Helper to get the keyboard shortcut display text based on platform
export function getSendShortcutText(): string {
  // Check if running on macOS
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? '⌘↵' : 'Ctrl+↵'
}
