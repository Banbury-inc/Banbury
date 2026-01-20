import { ApiService } from '../../../../../backend/api/apiService'
import { parsePptxFile } from '../utils/parse-pptx-file'
import { pushToHistory, canUndo, canRedo } from '../components/PowerPointToolbar/handlers/powerpoint-toolbar-handlers'
import type { Slide } from '../PowerPointViewer'

interface HandlePptxUpdatedParams {
  event: CustomEvent
  currentFileId: string | undefined
  currentFileName: string
  currentSlideIndex: number
  toast: (props: {
    title: string
    description: string
    variant?: 'default' | 'destructive' | 'success'
  }) => void
  setSlides: (slides: Slide[]) => void
  setCurrentSlideIndex: (index: number) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  setUndoAvailable: (available: boolean) => void
  setRedoAvailable: (available: boolean) => void
}

export async function handlePptxUpdated(params: HandlePptxUpdatedParams) {
  const {
    event,
    currentFileId,
    currentFileName,
    currentSlideIndex,
    toast,
    setSlides,
    setCurrentSlideIndex,
    setHasUnsavedChanges,
    setUndoAvailable,
    setRedoAvailable,
  } = params

  const data = event.detail

  if (data.type === 'pptx-updated') {
    const { fileId, fileName, operation } = data

    // Only reload if this is the currently open file
    if (currentFileId === fileId || currentFileName === fileName) {
      try {
        const result = await ApiService.downloadFromS3(fileId, fileName)
        if (result.success && result.blob) {
          const parsedSlides = await parsePptxFile({ blob: result.blob, toast })
          setSlides(parsedSlides)
          setHasUnsavedChanges(false)

          // Preserve current slide index if still valid
          if (currentSlideIndex < parsedSlides.length) {
            setCurrentSlideIndex(currentSlideIndex)
          } else {
            setCurrentSlideIndex(Math.max(0, parsedSlides.length - 1))
          }

          pushToHistory(parsedSlides, currentSlideIndex)
          setUndoAvailable(canUndo())
          setRedoAvailable(canRedo())

          // Show toast notification
          toast({
            title: 'Presentation updated',
            description: `AI has completed: ${operation.replace(/_/g, ' ')}`,
            variant: 'default'
          })
        }
      } catch (error) {
        console.error('Failed to reload after AI update:', error)
      }
    }
  }
}
