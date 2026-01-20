import { ApiService } from '../../../../../backend/api/apiService'
import { parsePptxFile } from '../utils/parse-pptx-file'
import { pushToHistory, canUndo, canRedo } from '../components/PowerPointToolbar/handlers/powerpoint-toolbar-handlers'
import type { Slide } from '../PowerPointViewer'

interface HandleFileGeneratedParams {
  event: CustomEvent
  toast: (props: {
    title: string
    description: string
    variant?: 'default' | 'destructive' | 'success'
  }) => void
  setSlides: (slides: Slide[]) => void
  setCurrentSlideIndex: (index: number) => void
  setSelectedElementId: (id: string | null) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  setUndoAvailable: (available: boolean) => void
  setRedoAvailable: (available: boolean) => void
}

export async function handleFileGenerated(params: HandleFileGeneratedParams) {
  const {
    event,
    toast,
    setSlides,
    setCurrentSlideIndex,
    setSelectedElementId,
    setHasUnsavedChanges,
    setUndoAvailable,
    setRedoAvailable,
  } = params

  const detail = event?.detail || {}
  const { fileId, fileName, fileType } = detail

  if (fileType !== 'pptx') {
    return // Only handle PowerPoint files
  }

  if (!fileId || !fileName) {
    console.warn('[PowerPointViewer] File-generated event missing fileId or fileName')
    return
  }

  try {
    // Download file from S3
    const result = await ApiService.downloadFromS3(fileId, fileName)
    if (!result.success || !result.blob) {
      throw new Error('Failed to download generated presentation')
    }

    // Parse the PPTX file
    const parsedSlides = await parsePptxFile({ blob: result.blob, toast })

    // Replace current slides with generated ones
    setSlides(parsedSlides)
    setCurrentSlideIndex(0)
    setSelectedElementId(null)
    setHasUnsavedChanges(true) // Mark as unsaved so user can save to their location

    // Save to history
    pushToHistory(parsedSlides, 0)
    setUndoAvailable(canUndo())
    setRedoAvailable(canRedo())

    toast({
      title: 'Presentation generated',
      description: 'Your presentation has been created using Claude Skills',
      variant: 'default'
    })
  } catch (error) {
    console.error('Error loading Skills-generated file:', error)
    toast({
      title: 'Error loading presentation',
      description: error instanceof Error ? error.message : 'Failed to load generated presentation',
      variant: 'destructive'
    })
  }
}
