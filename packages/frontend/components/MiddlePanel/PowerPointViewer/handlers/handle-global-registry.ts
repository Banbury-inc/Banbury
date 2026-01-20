import type { Slide } from '../PowerPointViewer'
import type { FileSystemItem } from '../../../../utils/fileTreeUtils'

interface HandleGlobalRegistryParams {
  currentFile: FileSystemItem
  slides: Slide[]
}

export function registerInGlobalRegistry(params: HandleGlobalRegistryParams) {
  const { currentFile, slides } = params

  if (!currentFile.file_id || slides.length === 0) return

  // Initialize global registry if it doesn't exist
  if (typeof window !== 'undefined') {
    if (!(window as any)._activePowerPointViewers) {
      (window as any)._activePowerPointViewers = []
    }

    const viewerState = {
      fileId: currentFile.file_id,
      slides: slides
    }

    // Remove any existing viewer with the same fileId
    const viewers = (window as any)._activePowerPointViewers as Array<{ fileId: string; slides: Slide[] }>
    const filteredViewers = viewers.filter(v => v.fileId !== currentFile.file_id)
    filteredViewers.push(viewerState)
    ;(window as any)._activePowerPointViewers = filteredViewers

    // Cleanup: unregister when component unmounts or file changes
    return () => {
      if ((window as any)._activePowerPointViewers) {
        ;(window as any)._activePowerPointViewers = (
          (window as any)._activePowerPointViewers as Array<{ fileId: string; slides: Slide[] }>
        ).filter(v => v.fileId !== currentFile.file_id)
      }
    }
  }
}
