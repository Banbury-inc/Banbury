import { createKeyboardShortcutHandler } from './handleKeyboardShortcuts'

interface CreateWorkspacesKeyboardHandlerParams {
  setFileSearchOpen: (open: boolean) => void
  setIsFileSidebarCollapsed: () => void
  setIsAssistantPanelCollapsed: () => void
}

export function createWorkspacesKeyboardHandler({
  setFileSearchOpen,
  setIsFileSidebarCollapsed,
  setIsAssistantPanelCollapsed,
}: CreateWorkspacesKeyboardHandlerParams) {
  return createKeyboardShortcutHandler({
    onFileSearchOpen: () => setFileSearchOpen(true),
    onToggleFileSidebar: setIsFileSidebarCollapsed,
    onToggleAssistantPanel: setIsAssistantPanelCollapsed,
  })
}

