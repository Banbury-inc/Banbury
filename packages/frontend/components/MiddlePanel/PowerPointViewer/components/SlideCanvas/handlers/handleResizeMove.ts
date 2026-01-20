import type { SlideElement } from '../../../PowerPointViewer'
import type { RefObject, MutableRefObject } from 'react'

interface HandleResizeMoveParams {
  isResizing: boolean
  selectedElementId: string | null
  resizeHandle: string | null
  slideContentRef: RefObject<HTMLDivElement>
  hasHistorySavedRef: MutableRefObject<boolean>
  resizeStart: {
    x: number
    y: number
    width: number
    height: number
    elementX: number
    elementY: number
  }
  elements: SlideElement[]
  onUpdateElements: (elements: SlideElement[], saveHistory?: boolean) => void
}

export function handleResizeMove({
  isResizing,
  selectedElementId,
  resizeHandle,
  slideContentRef,
  hasHistorySavedRef,
  resizeStart,
  elements,
  onUpdateElements,
}: HandleResizeMoveParams) {
  return (e: MouseEvent) => {
    if (!isResizing || !selectedElementId || !resizeHandle || !slideContentRef.current) return

    // Save history only once at the start of resize
    if (!hasHistorySavedRef.current) {
      hasHistorySavedRef.current = true
      onUpdateElements(elements, true) // Save current state to history
    }

    const slideRect = slideContentRef.current.getBoundingClientRect()
    const deltaX = ((e.clientX - resizeStart.x) / slideRect.width) * 100
    const deltaY = ((e.clientY - resizeStart.y) / slideRect.height) * 100

    const minSize = 2
    const maxWidth = 100
    const maxHeight = 100

    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    let newX = resizeStart.elementX
    let newY = resizeStart.elementY

    // Horizontal resize
    if (resizeHandle.includes('right')) {
      newWidth = Math.max(minSize, Math.min(maxWidth - resizeStart.elementX, resizeStart.width + deltaX))
    }

    if (resizeHandle.includes('left')) {
      newX = resizeStart.elementX + deltaX
      newWidth = resizeStart.width - deltaX

      // Keep minimum size
      if (newWidth < minSize) {
        const diff = minSize - newWidth
        newWidth = minSize
        newX -= diff
      }

      // Keep within canvas
      if (newX < 0) {
        newWidth += newX
        newX = 0
      }
      if (newWidth > maxWidth - newX) {
        newWidth = maxWidth - newX
      }
    }

    // Vertical resize
    if (resizeHandle.includes('bottom')) {
      newHeight = Math.max(minSize, Math.min(maxHeight - resizeStart.elementY, resizeStart.height + deltaY))
    }

    if (resizeHandle.includes('top')) {
      newY = resizeStart.elementY + deltaY
      newHeight = resizeStart.height - deltaY

      // Keep minimum size
      if (newHeight < minSize) {
        const diff = minSize - newHeight
        newHeight = minSize
        newY -= diff
      }

      // Keep within canvas
      if (newY < 0) {
        newHeight += newY
        newY = 0
      }
      if (newHeight > maxHeight - newY) {
        newHeight = maxHeight - newY
      }
    }

    const newElements = elements.map(el =>
      el.id === selectedElementId ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight } : el
    )
    onUpdateElements(newElements)
  }
}
