import type { FileSystemItem } from '@/utils/fileTreeUtils'

interface HandleOpenPresentationInViewerParams {
  triggerSidebarRefresh: () => void
  openFileInTabCallback: (file: FileSystemItem, targetPanelId: string) => void
}

export function createOpenPresentationInViewerHandler({
  triggerSidebarRefresh,
  openFileInTabCallback
}: HandleOpenPresentationInViewerParams): (event: Event) => void {
  return (event: Event) => {
    const detail = (event as CustomEvent).detail || {}
    const { fileId, fileName, presentationId } = detail as {
      fileId?: string
      fileName?: string
      presentationId?: string
      fileUrl?: string
    }
    if (!fileId || !fileName || !presentationId) {
      console.warn('[Workspaces] Missing required fields in event detail')
      return
    }

    setTimeout(async () => {
      triggerSidebarRefresh()
      await new Promise((resolve) => setTimeout(resolve, 500))

      const file: FileSystemItem = {
        id: fileId,
        file_id: fileId,
        name: fileName,
        path: `presentations/${fileName}`,
        type: 'file'
      }

      openFileInTabCallback(file, 'main-panel')

      window.dispatchEvent(
        new CustomEvent('pptx-presentation-loaded', {
          detail: { fileId, presentationId }
        })
      )
    }, 300)
  }
}

export const OPEN_PRESENTATION_IN_VIEWER_EVENT = 'open-presentation-in-viewer'
