import { createKeyboardShortcutHandler } from './handleKeyboardShortcuts'

interface CreateWorkspacesKeyboardHandlerParams {
  setFileSearchOpen: (open: boolean) => void
  setIsFileSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

export function createWorkspacesKeyboardHandler({
  setFileSearchOpen,
  setIsFileSidebarCollapsed,
}: CreateWorkspacesKeyboardHandlerParams) {
  return createKeyboardShortcutHandler({
    onFileSearchOpen: () => setFileSearchOpen(true),
    onToggleFileSidebar: () => setIsFileSidebarCollapsed((prev) => !prev),
  })
}

