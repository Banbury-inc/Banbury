import type { SlideElement } from '../../../PowerPointViewer'
import type { RefObject, MutableRefObject, MouseEvent } from 'react'

interface HandleMouseMoveParams {
  isResizing: boolean
  isDragging: boolean
  selectedElementId: string | null
  canvasRef: RefObject<HTMLDivElement>
  hasHistorySavedRef: MutableRefObject<boolean>
  elements: SlideElement[]
  onUpdateElements: (elements: SlideElement[], saveHistory?: boolean) => void
  dragOffset: { x: number; y: number }
}

export function handleMouseMove({
  isResizing,
  isDragging,
  selectedElementId,
  canvasRef,
  hasHistorySavedRef,
  elements,
  onUpdateElements,
  dragOffset,
}: HandleMouseMoveParams) {
  return (e: MouseEvent<HTMLDivElement>) => {
    if (isResizing) return
    if (!isDragging || !selectedElementId || !canvasRef.current) return

    // Save history only once at the start of drag
    if (!hasHistorySavedRef.current) {
      hasHistorySavedRef.current = true
      onUpdateElements(elements, true) // Save current state to history
    }

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newX = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100
    const newY = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100

    // Clamp values to keep element within canvas
    const clampedX = Math.max(0, Math.min(90, newX))
    const clampedY = Math.max(0, Math.min(90, newY))

    const newElements = elements.map(el =>
      el.id === selectedElementId ? { ...el, x: clampedX, y: clampedY } : el
    )
    onUpdateElements(newElements)
  }
}