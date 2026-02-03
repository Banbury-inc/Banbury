import type { FileSystemItem } from '@/utils/fileTreeUtils'
import type { PanelGroup } from '@/pages/Workspaces/types'
import type { FileTab } from '@/pages/Workspaces/types'
import { getAllTabs } from './panelUtils'

interface HandleWorkspaceReopenFileParams {
  panelLayout: PanelGroup
  activePanelId: string
  openFileInTabCallback: (file: FileSystemItem, targetPanelId: string) => void
  handleCloseTabCallback: (tabId: string, panelId: string) => void
}

export function createWorkspaceReopenFileHandler({
  panelLayout,
  activePanelId,
  openFileInTabCallback,
  handleCloseTabCallback
}: HandleWorkspaceReopenFileParams): (e: Event) => void {
  return (e: Event) => {
    const detail = (e as CustomEvent).detail || {}
    const { newFile, oldPath } = detail as { oldPath?: string; newFile: FileSystemItem }
    if (!newFile) return

    try {
      const allTabs = getAllTabs(panelLayout)
      const fileTabs = allTabs.filter((t): t is FileTab => t.type === 'file')
      
      // Check if the file is already open in a tab
      const existingTab = fileTabs.find((t) => t.file.path === newFile.path)
      
      if (existingTab) {
        // File is already open, just switch to it
        // openFileInTabCallback will handle switching to the existing tab
        openFileInTabCallback(newFile, activePanelId)
        return
      }
      
      // File is not open, handle oldPath cleanup if provided and different
      if (oldPath && oldPath !== newFile.path) {
        const targets = fileTabs.filter((t) => t.file.path === oldPath)
        targets.forEach((t) => handleCloseTabCallback(t.id, activePanelId))
      }
    } catch {
      /* ignore */
    }
    
    // Open the file (will create a new tab since we checked it doesn't exist)
    openFileInTabCallback(newFile, activePanelId)
  }
}

export const WORKSPACE_REOPEN_FILE_EVENT = 'workspace-reopen-file'
