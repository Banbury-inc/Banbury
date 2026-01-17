import type { Slide } from '../../../components/MiddlePanel/PowerPointViewer/PowerPointViewer'

/**
 * Get current presentation context from global registry or localStorage
 * Similar to getDocumentContext but for PowerPoint presentations
 */
function getCurrentPresentationState(): { fileId?: string; slides?: Slide[] } | null {
  try {
    // Try to get presentation from global registry (similar to _tiptapDocxEditors)
    if (typeof window !== 'undefined' && (window as any)._activePowerPointViewers) {
      const viewers = (window as any)._activePowerPointViewers as Array<{
        fileId: string
        slides: Slide[]
      }>
      
      // Return the most recently registered viewer that's still active
      for (let i = viewers.length - 1; i >= 0; i--) {
        const viewer = viewers[i]
        if (viewer && viewer.fileId && viewer.slides && Array.isArray(viewer.slides) && viewer.slides.length > 0) {
          return { fileId: viewer.fileId, slides: viewer.slides }
        }
      }
    }
  } catch (error) {
    console.error('[getPresentationContext] Error getting presentation state:', error)
  }
  
  return null
}

/**
 * Get presentation context as JSON string for backend processing
 * Returns the current slides state if available
 */
export function getPresentationContext(): string | null {
  try {
    // First, try to get current unsaved content from the global registry
    const presentationState = getCurrentPresentationState()
    if (presentationState && presentationState.slides && presentationState.slides.length > 0) {
      // Convert slides to JSON (only include essential data to keep it compact)
      const slidesJson = JSON.stringify({
        fileId: presentationState.fileId,
        slides: presentationState.slides.map(slide => ({
          id: slide.id,
          index: slide.index,
          elements: slide.elements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            content: el.content,
            fontSize: el.fontSize,
            fontFace: el.fontFace,
            color: el.color,
            bold: el.bold,
            italic: el.italic,
            align: el.align,
            valign: el.valign,
            shapeType: el.shapeType,
            fill: el.fill,
            stroke: el.stroke,
            strokeWidth: el.strokeWidth,
            imageUrl: el.imageUrl,
            driveFileId: el.driveFileId,
            s3FileId: el.s3FileId,
            s3FileName: el.s3FileName,
          })),
          background: slide.background,
          backgroundStyle: slide.backgroundStyle,
          backgroundImage: slide.backgroundImage,
          layout: slide.layout,
          notes: slide.notes,
        }))
      })
      
      return slidesJson
    }
    
    // Fallback: Check localStorage for pending presentation context (for backwards compatibility)
    const stored = localStorage.getItem('pendingPresentationContext')
    if (stored) {
      localStorage.removeItem('pendingPresentationContext') // Clean up after reading
      return stored
    }
  } catch (error) {
    console.error('[getPresentationContext] Error getting presentation context:', error)
  }
  
  return null
}

/**
 * Side-effect-free version of getPresentationContext for preview/budget estimation
 */
export function getPresentationContextPreview(): string | null {
  try {
    // Try to get live presentation state
    const presentationState = getCurrentPresentationState()
    if (presentationState && presentationState.slides && presentationState.slides.length > 0) {
      const slidesJson = JSON.stringify({
        fileId: presentationState.fileId,
        slides: presentationState.slides.map(slide => ({
          id: slide.id,
          index: slide.index,
          elements: slide.elements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            content: el.content,
          })),
        }))
      })
      return slidesJson
    }
    
    // Fallback: peek at localStorage without removing
    const stored = localStorage.getItem('pendingPresentationContext')
    if (stored) {
      return stored
    }
  } catch {
    // Ignore errors
  }
  
  return null
}