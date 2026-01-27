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
    const { newFile } = detail as { oldPath?: string; newFile: FileSystemItem }
    if (!newFile) return

    try {
      const allTabs = getAllTabs(panelLayout)
      const fileTabs = allTabs.filter((t): t is FileTab => t.type === 'file')
      const pathToMatch = (detail as { oldPath?: string }).oldPath ?? newFile.path
      const targets = fileTabs.filter((t) => t.file.path === pathToMatch)
      targets.forEach((t) => handleCloseTabCallback(t.id, activePanelId))
    } catch {
      /* ignore */
    }
    openFileInTabCallback(newFile, activePanelId)
  }
}

export const WORKSPACE_REOPEN_FILE_EVENT = 'workspace-reopen-file'
