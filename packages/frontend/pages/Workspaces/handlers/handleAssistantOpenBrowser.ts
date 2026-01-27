import type { FileSystemItem } from '@/utils/fileTreeUtils'

interface HandleAssistantOpenBrowserParams {
  openFileInTabCallback: (file: FileSystemItem, targetPanelId: string) => void
}

export function createAssistantOpenBrowserHandler({
  openFileInTabCallback
}: HandleAssistantOpenBrowserParams): (event: Event) => void {
  return (event: Event) => {
    const detail = (event as CustomEvent).detail || {}
    const { viewerUrl, title } = detail as { viewerUrl?: string; title?: string }
    if (!viewerUrl) return

    const virtualName = `${title || 'Browser Session'}.browserbase`
    const virtualPath = `browserbase/${virtualName}?viewerUrl=${encodeURIComponent(viewerUrl)}&title=${encodeURIComponent(title || 'Browser Session')}`
    const file: FileSystemItem = {
      id: virtualPath,
      file_id: virtualPath,
      name: virtualName,
      type: 'file',
      path: virtualPath
    } as FileSystemItem

    openFileInTabCallback(file, 'main-panel')
  }
}

export const ASSISTANT_OPEN_BROWSER_EVENT = 'assistant-open-browser'
