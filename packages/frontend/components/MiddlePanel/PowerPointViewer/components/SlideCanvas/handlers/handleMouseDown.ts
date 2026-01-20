import type { SlideElement } from '../../../PowerPointViewer'
import type { RefObject, MutableRefObject, MouseEvent } from 'react'

interface HandleMouseDownParams {
  canvasRef: RefObject<HTMLDivElement>
  elements: SlideElement[]
  setDragOffset: (offset: { x: number; y: number }) => void
  setIsDragging: (isDragging: boolean) => void
  hasHistorySavedRef: MutableRefObject<boolean>
  onSelectElement: (elementId: string) => void
}

export function handleMouseDown({
  canvasRef,
  elements,
  setDragOffset,
  setIsDragging,
  hasHistorySavedRef,
  onSelectElement,
}: HandleMouseDownParams) {
  return (e: MouseEvent<HTMLDivElement>, elementId: string) => {
    if (!canvasRef.current) return
    
    // Don't start dragging if clicking on contentEditable element or its children
    const target = e.target as HTMLElement
    if (target.getAttribute('contenteditable') === 'true' || target.closest('[contenteditable="true"]')) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const elementX = (element.x / 100) * canvasRect.width
    const elementY = (element.y / 100) * canvasRect.height

    setDragOffset({
      x: e.clientX - canvasRect.left - elementX,
      y: e.clientY - canvasRect.top - elementY,
    })
    setIsDragging(true)
    hasHistorySavedRef.current = false
    onSelectElement(elementId)
  }
}
