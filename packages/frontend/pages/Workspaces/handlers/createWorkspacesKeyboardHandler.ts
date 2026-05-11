import { createKeyboardShortcutHandler } from './handleKeyboardShortcuts'

interface CreateWorkspacesKeyboardHandlerParams {
  setFileSearchOpen: (open: boolean) => void
  setIsFileSidebarCollapsed: () => void
}

export function createWorkspacesKeyboardHandler({
  setFileSearchOpen,
  setIsFileSidebarCollapsed,
}: CreateWorkspacesKeyboardHandlerParams) {
  return createKeyboardShortcutHandler({
    onFileSearchOpen: () => setFileSearchOpen(true),
    onToggleFileSidebar: setIsFileSidebarCollapsed,
  })
}

