import {
  handlePptxAIResponse,
  handlePptxAIReject,
} from '../components/PowerPointToolbar/handlers/handle-pptx-ai-response'
import {
  pushToHistory,
  canUndo,
  canRedo,
} from '../components/PowerPointToolbar/handlers/powerpoint-toolbar-handlers'
import type { Slide } from '../PowerPointViewer'

interface HandleAIResponseParams {
  event: CustomEvent
  slides: Slide[]
  currentSlideIndex: number
  selectedElementId: string | null
  setSlides: (slides: Slide[]) => void
  setCurrentSlideIndex: (index: number) => void
  setSelectedElementId: (id: string | null) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  setUndoAvailable: (available: boolean) => void
  setRedoAvailable: (available: boolean) => void
}

export function handleAIResponse(params: HandleAIResponseParams) {
  const {
    event,
    slides,
    currentSlideIndex,
    selectedElementId,
    setSlides,
    setCurrentSlideIndex,
    setSelectedElementId,
    setHasUnsavedChanges,
    setUndoAvailable,
    setRedoAvailable,
  } = params

  const detail = event?.detail || {}

  // Use the new centralized handler
  const result = handlePptxAIResponse(
    detail,
    slides,
    currentSlideIndex
  )

  // If result is null, it means no changes (idempotent case or accept after preview)
  if (!result) {
    return
  }

  // Apply the changes
  setSlides(result.nextSlides)
  setCurrentSlideIndex(result.nextCurrentSlideIndex)

  // Clear selection if selected element no longer exists
  if (selectedElementId) {
    const currentSlide = result.nextSlides[result.nextCurrentSlideIndex]
    const elementExists = currentSlide?.elements.some(e => e.id === selectedElementId)
    if (!elementExists) {
      setSelectedElementId(null)
    }
  }

  setHasUnsavedChanges(true)

  // Save to history with the actual applied slides
  pushToHistory(result.nextSlides, result.nextCurrentSlideIndex)
  setUndoAvailable(canUndo())
  setRedoAvailable(canRedo())
}

export function handleAIReject(params: HandleAIResponseParams) {
  const {
    event,
    slides,
    currentSlideIndex,
    selectedElementId,
    setSlides,
    setCurrentSlideIndex,
    setSelectedElementId,
    setHasUnsavedChanges,
    setUndoAvailable,
    setRedoAvailable,
  } = params

  const detail = event?.detail || {}
  const changeId = detail.changeId

  if (!changeId) {
    console.warn('[PowerPointViewer] Reject event missing changeId')
    return
  }

  const result = handlePptxAIReject(changeId, slides, currentSlideIndex)

  if (!result) {
    return
  }

  // Restore original slides
  setSlides(result.nextSlides)
  setCurrentSlideIndex(result.nextCurrentSlideIndex)

  // Clear selection if it no longer exists
  if (selectedElementId) {
    const currentSlide = result.nextSlides[result.nextCurrentSlideIndex]
    const elementExists = currentSlide?.elements.some(e => e.id === selectedElementId)
    if (!elementExists) {
      setSelectedElementId(null)
    }
  }

  setHasUnsavedChanges(true)

  // Save to history
  pushToHistory(result.nextSlides, result.nextCurrentSlideIndex)
  setUndoAvailable(canUndo())
  setRedoAvailable(canRedo())
}
