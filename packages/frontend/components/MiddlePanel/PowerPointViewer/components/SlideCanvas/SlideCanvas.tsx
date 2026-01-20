import { useState, useCallback, useRef, useEffect } from 'react'
import { Slide, SlideElement } from '../../PowerPointViewer'
import { handleMouseMove as createHandleMouseMove } from './handlers/handleMouseMove'
import { handleMouseDown as createHandleMouseDown } from './handlers/handleMouseDown'
import { handleResizeMove as createHandleResizeMove } from './handlers/handleResizeMove'
import { ElementRenderer } from './ElementRenderer'
import { getBackgroundStyle } from './utils/getBackgroundStyle'
import { DecorativeElementRenderer } from './DecorativeElementRenderer'

interface SlideCanvasProps {
  slide: Slide
  onUpdateElements: (elements: SlideElement[], saveHistory?: boolean) => void
  selectedElementId: string | null
  onSelectElement: (elementId: string | null) => void
  onTextSelectionChange?: (selection: { start: number; end: number } | null) => void
}

export function SlideCanvas({ 
  slide, 
  onUpdateElements, 
  selectedElementId,
  onSelectElement,
  onTextSelectionChange
}: SlideCanvasProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    elementX: 0,
    elementY: 0,
  })
  const canvasRef = useRef<HTMLDivElement>(null)
  const slideContentRef = useRef<HTMLDivElement>(null)
  const [scaleFactor, setScaleFactor] = useState(1)
  const hasHistorySavedRef = useRef(false)

  // Reference size: 960px width (16:9 aspect ratio)
  const REFERENCE_WIDTH = 960

  // Calculate scale factor based on slide container size
  useEffect(() => {
    if (!slideContentRef.current) return

    const updateScale = () => {
      if (!slideContentRef.current) return
      const rect = slideContentRef.current.getBoundingClientRect()
      // Use width for scale calculation (both width and height should scale proportionally)
      const scale = rect.width / REFERENCE_WIDTH
      setScaleFactor(scale)
    }

    // Initial calculation
    updateScale()

    // Use ResizeObserver to track size changes
    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(slideContentRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [slide])

  // Handle element selection
  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    onSelectElement(elementId)
  }, [onSelectElement])

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
    // Don't deselect if we're editing text
    const activeElement = document.activeElement
    if (activeElement?.getAttribute('contenteditable') === 'true') {
      return
    }
    onSelectElement(null)
    if (onTextSelectionChange) {
      onTextSelectionChange(null)
    }
  }, [onSelectElement, onTextSelectionChange])

  // Handle text focus (save history before editing)
  const handleTextFocus = useCallback(() => {
    if (!hasHistorySavedRef.current) {
      hasHistorySavedRef.current = true
      onUpdateElements(slide.elements, true) // Save current state to history
    }
  }, [slide.elements, onUpdateElements])

  // Handle text content change
  const handleTextChange = useCallback((elementId: string, newContent: string) => {
    const newElements = slide.elements.map(e =>
      e.id === elementId ? { ...e, content: newContent } : e
    )
    onUpdateElements(newElements)
  }, [slide.elements, onUpdateElements])
  
  // Reset history saved flag when selection changes
  useEffect(() => {
    hasHistorySavedRef.current = false
  }, [selectedElementId])

  // Handle table cell content change
  const handleTableCellChange = useCallback((elementId: string, rowIndex: number, colIndex: number, newContent: string) => {
    const newElements = slide.elements.map(e => {
      if (e.id === elementId && e.type === 'table' && e.cells) {
        const newCells = e.cells.map((row, rIdx) =>
          rIdx === rowIndex
            ? row.map((cell, cIdx) =>
                cIdx === colIndex ? { ...cell, content: newContent } : cell
              )
            : row
        )
        return { ...e, cells: newCells }
      }
      return e
    })
    onUpdateElements(newElements)
  }, [slide.elements, onUpdateElements])

  // Handle element drag
  const handleMouseDown = useCallback(
    createHandleMouseDown({
      canvasRef,
      elements: slide.elements,
      setDragOffset,
      setIsDragging,
      hasHistorySavedRef,
      onSelectElement,
    }),
    [slide.elements, onSelectElement]
  )

  // Handle element resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const element = slide.elements.find(el => el.id === elementId)
    if (!element || !slideContentRef.current) return

    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
      elementX: element.x,
      elementY: element.y,
    })
    hasHistorySavedRef.current = false
    onSelectElement(elementId)
  }, [slide.elements, onSelectElement])

  // Handle element resize move
  const handleResizeMove = useCallback(
    createHandleResizeMove({
      isResizing,
      selectedElementId,
      resizeHandle,
      slideContentRef,
      hasHistorySavedRef,
      resizeStart,
      elements: slide.elements,
      onUpdateElements,
    }),
    [isResizing, selectedElementId, resizeHandle, resizeStart, slide.elements, onUpdateElements]
  )

  // Handle element resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const handleMouseMove = useCallback(
    createHandleMouseMove({
      isResizing,
      isDragging,
      selectedElementId,
      canvasRef,
      hasHistorySavedRef,
      elements: slide.elements,
      onUpdateElements,
      dragOffset,
    }),
    [isResizing, isDragging, selectedElementId, dragOffset, slide.elements, onUpdateElements]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Keyboard shortcuts for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementId && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Don't delete if we're editing text
        const activeElement = document.activeElement
        if (activeElement?.getAttribute('contenteditable') === 'true') return
        
        const newElements = slide.elements.filter(el => el.id !== selectedElementId)
        onUpdateElements(newElements)
        onSelectElement(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, slide.elements, onUpdateElements, onSelectElement])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-muted/50"
        style={{
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Slide content with aspect ratio */}
        <div className="absolute inset-4 mx-auto" style={{ aspectRatio: '16/9', maxWidth: '100%', maxHeight: '100%' }}>
          <div 
            ref={slideContentRef} 
            className="relative w-full h-full shadow-lg rounded-sm overflow-hidden"
            style={getBackgroundStyle(slide)}
          >
            {/* Decorative elements layer (rendered behind content) */}
            {slide.decorativeElements && slide.decorativeElements.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {slide.decorativeElements.map((decorative) => (
                  <DecorativeElementRenderer key={decorative.id} element={decorative} />
                ))}
              </div>
            )}
            
            {slide.elements.map((element) => (
              <ElementRenderer
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                scaleFactor={scaleFactor}
                onClick={(e) => handleElementClick(e, element.id)}
                onMouseDown={(e) => handleMouseDown(e as React.MouseEvent<HTMLDivElement>, element.id)}
                onTextFocus={handleTextFocus}
                onTextChange={(content) => handleTextChange(element.id, content)}
                onTableCellChange={element.type === 'table' ? (rowIndex, colIndex, content) => handleTableCellChange(element.id, rowIndex, colIndex, content) : undefined}
                onSelectElement={onSelectElement}
                onResizeStart={(evt, handle) => handleResizeStart(evt, handle, element.id)}
                onTextSelectionChange={onTextSelectionChange}
              />
            ))}

            {/* Empty slide placeholder */}
            {slide.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">Empty slide</p>
                  <p className="text-sm">Use the toolbar above to add content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlideCanvas
