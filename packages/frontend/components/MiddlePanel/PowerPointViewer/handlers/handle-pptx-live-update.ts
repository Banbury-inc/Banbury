import type { Slide } from '../PowerPointViewer'

interface HandlePptxLiveUpdateParams {
  event: CustomEvent
  activePresentationId: string | null
  fileId: string | undefined
  slides: Slide[]
  setSlides: (updater: (prev: Slide[]) => Slide[]) => void
  setActivePresentationId: (id: string | null) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  toast: (props: {
    title: string
    description: string
    variant?: 'default' | 'destructive' | 'success'
  }) => void
}

export function handlePptxLiveUpdate(params: HandlePptxLiveUpdateParams) {
  const {
    event,
    activePresentationId,
    fileId,
    slides,
    setSlides,
    setActivePresentationId,
    setHasUnsavedChanges,
    toast,
  } = params

  const detail = event.detail || {}
  const { presentationId, operation, operationData, fileId: eventFileId } = detail

  // Check if this event is for the current presentation
  // Match by presentationId (if activePresentationId is set) or by fileId
  const presentationMatches = activePresentationId && presentationId === activePresentationId
  const fileMatches = eventFileId && fileId === eventFileId

  if (!presentationMatches && !fileMatches) {
    console.log('[PowerPointViewer] Ignoring event - presentation/file mismatch')
    return
  }

  // If we matched by fileId but activePresentationId isn't set, set it now
  if (!activePresentationId && fileMatches && presentationId) {
    console.log('[PowerPointViewer] Setting activePresentationId from event:', presentationId)
    setActivePresentationId(presentationId)
  }

  // Apply the operation to the slides
  setSlides((prevSlides) => {
    const updatedSlides = [...prevSlides]

    switch (operation) {
      case 'create_slide': {
        const { slideIndex, layout, background } = operationData
        const newSlide: Slide = {
          id: `slide-${Date.now()}`,
          index: slideIndex,
          elements: [],
          background: background,
        }
        updatedSlides.splice(slideIndex, 0, newSlide)
        // Update indices of subsequent slides
        updatedSlides.forEach((slide, idx) => {
          slide.index = idx
        })
        break
      }

      case 'add_text': {
        const { slideIndex, element } = operationData
        if (updatedSlides[slideIndex]) {
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            elements: [...updatedSlides[slideIndex].elements, element],
          }
        }
        break
      }

      case 'add_image': {
        const { slideIndex, element } = operationData
        if (updatedSlides[slideIndex]) {
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            elements: [...updatedSlides[slideIndex].elements, element],
          }
        }
        break
      }

      case 'add_shape': {
        const { slideIndex, element } = operationData
        if (updatedSlides[slideIndex]) {
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            elements: [...updatedSlides[slideIndex].elements, element],
          }
        }
        break
      }

      case 'add_table': {
        const { slideIndex, element } = operationData
        if (updatedSlides[slideIndex]) {
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            elements: [...updatedSlides[slideIndex].elements, element],
          }
        }
        break
      }

      case 'set_slide_background': {
        const { slideIndex, background } = operationData
        if (updatedSlides[slideIndex]) {
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            background: background,
          }
        }
        break
      }

      default:
        console.warn('[PowerPointViewer] Unknown operation:', operation)
    }

    return updatedSlides
  })

  // Mark as unsaved changes
  setHasUnsavedChanges(true)

  // Show toast notification
  toast({
    title: 'Presentation updated',
    description: `AI has completed: ${operation.replace(/_/g, ' ')}`,
    variant: 'default'
  })
}
