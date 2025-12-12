import { useState, useCallback, useRef, useEffect } from 'react'
import { Slide, SlideElement } from './PowerPointViewer'
import { getShapeDefinition, renderShapeSvg } from './shape-catalog'
import { Move } from 'lucide-react'

interface SlideCanvasProps {
  slide: Slide
  onUpdateElements: (elements: SlideElement[]) => void
  selectedElementId: string | null
  onSelectElement: (elementId: string | null) => void
}

export function SlideCanvas({ 
  slide, 
  onUpdateElements, 
  selectedElementId,
  onSelectElement 
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

  // Handle element selection
  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    onSelectElement(elementId)
  }, [onSelectElement])

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
    onSelectElement(null)
  }, [onSelectElement])

  // Handle text content change
  const handleTextChange = useCallback((elementId: string, newContent: string) => {
    const newElements = slide.elements.map(e =>
      e.id === elementId ? { ...e, content: newContent } : e
    )
    onUpdateElements(newElements)
  }, [slide.elements, onUpdateElements])

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
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (!canvasRef.current) return
    
    // Don't start dragging if clicking on contentEditable element or its children
    const target = e.target as HTMLElement
    if (target.getAttribute('contenteditable') === 'true' || target.closest('[contenteditable="true"]')) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    const element = slide.elements.find(el => el.id === elementId)
    if (!element) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const elementX = (element.x / 100) * canvasRect.width
    const elementY = (element.y / 100) * canvasRect.height

    setDragOffset({
      x: e.clientX - canvasRect.left - elementX,
      y: e.clientY - canvasRect.top - elementY,
    })
    setIsDragging(true)
    onSelectElement(elementId)
  }, [slide.elements, onSelectElement])

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
    onSelectElement(elementId)
  }, [slide.elements, onSelectElement])

  // Handle element resize move
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !selectedElementId || !resizeHandle || !slideContentRef.current) return

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

    const newElements = slide.elements.map(el =>
      el.id === selectedElementId ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight } : el
    )
    onUpdateElements(newElements)
  }, [isResizing, selectedElementId, resizeHandle, resizeStart, slide.elements, onUpdateElements])

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isResizing) return
    if (!isDragging || !selectedElementId || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newX = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100
    const newY = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100

    // Clamp values to keep element within canvas
    const clampedX = Math.max(0, Math.min(90, newX))
    const clampedY = Math.max(0, Math.min(90, newY))

    const newElements = slide.elements.map(el =>
      el.id === selectedElementId ? { ...el, x: clampedX, y: clampedY } : el
    )
    onUpdateElements(newElements)
  }, [isDragging, selectedElementId, dragOffset, slide.elements, onUpdateElements])

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
            className="relative w-full h-full shadow-lg rounded-sm"
            style={{ backgroundColor: slide.background || '#ffffff' }}
          >
            {slide.elements.map((element) => (
              <ElementRenderer
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                onClick={(e) => handleElementClick(e, element.id)}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onTextChange={(content) => handleTextChange(element.id, content)}
                onTableCellChange={element.type === 'table' ? (rowIndex, colIndex, content) => handleTableCellChange(element.id, rowIndex, colIndex, content) : undefined}
                onSelectElement={onSelectElement}
                onResizeStart={(evt, handle) => handleResizeStart(evt, handle, element.id)}
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

// Render individual elements
function ElementRenderer({
  element,
  isSelected,
  onClick,
  onMouseDown,
  onTextChange,
  onTableCellChange,
  onSelectElement,
  onResizeStart,
}: {
  element: SlideElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onTextChange: (content: string) => void
  onTableCellChange?: (rowIndex: number, colIndex: number, content: string) => void
  onSelectElement: (elementId: string) => void
  onResizeStart: (e: React.MouseEvent, handle: string) => void
}) {
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    cursor: 'move',
  }

  if (element.type === 'text') {
    return (
      <div
        className={isSelected ? 'border-2 border-muted rounded-sm' : 'border-2 border-primary rounded-sm'}
        style={{
          ...baseStyles,
          padding: '2px',
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        <div
          contentEditable
          suppressContentEditableWarning
          className="w-full h-full outline-none"
          style={{
            fontSize: `${element.fontSize || 18}px`,
            fontFamily: element.fontFace || 'Arial',
            fontWeight: element.bold ? 'bold' : 'normal',
            fontStyle: element.italic ? 'italic' : 'normal',
            color: element.color ? `#${element.color}` : '#363636',
            textAlign: element.align || 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: element.valign === 'top' ? 'flex-start' : element.valign === 'bottom' ? 'flex-end' : 'center',
            minHeight: '1em',
          }}
          onBlur={(e) => onTextChange(e.currentTarget.textContent || '')}
          onClick={(e) => {
            e.stopPropagation()
            // Select the element when clicked
            onSelectElement(element.id)
            // Focus the element when clicked
            e.currentTarget.focus()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            // Select the element when clicked
            onSelectElement(element.id)
            // Allow focus for text editing
          }}
        >
          {element.content}
        </div>
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} />
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
              <Move className="h-3 w-3 inline mr-1" />
              Text
            </div>
          </>
        )}
      </div>
    )
  }

  if (element.type === 'shape') {
    const fill = element.fill || '#4a90d9'
    const stroke = element.stroke || '#2d5a8c'
    const strokeWidth = element.strokeWidth ?? 2
    const rotation = element.rotation ?? 0
    const shapeType = element.shapeType || 'rect'
    const shapeLabel = getShapeDefinition(shapeType)?.label || 'Shape'

    return (
      <div
        className={isSelected ? 'relative border-2 border-primary rounded-sm' : 'relative border-2 border-muted rounded-sm'}
        style={{
          ...baseStyles,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center',
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        <div className="w-full h-full">
          {renderShapeSvg(shapeType, { fill, stroke, strokeWidth, text: element.content })}
        </div>
        {element.content && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-medium"
            style={{ color: element.stroke || '#1f2937' }}
          >
            {element.content}
          </div>
        )}
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} />
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
              <Move className="h-3 w-3 inline mr-1" />
              {shapeLabel}
            </div>
          </>
        )}
      </div>
    )
  }

  if (element.type === 'image') {
    return (
      <div
        className={`bg-muted flex items-center justify-center overflow-hidden ${isSelected ? 'border-2 border-primary rounded-sm' : 'border-2 border-muted rounded-sm'}`}
        style={baseStyles}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        {element.imageUrl ? (
          <img
            src={element.imageUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="text-muted-foreground text-sm">No image</div>
        )}
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} />
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
              <Move className="h-3 w-3 inline mr-1" />
              Image
            </div>
          </>
        )}
      </div>
    )
  }

  if (element.type === 'table' && element.cells) {
    const borderColor = element.borderColor || '#cccccc'
    const borderWidth = element.borderWidth || 1
    const headerRow = element.headerRow || false

    return (
      <div
        className={`${isSelected ? 'border-2 border-primary rounded-sm ring-2 ring-primary/20' : 'border-2 border-transparent rounded-sm'}`}
        style={baseStyles}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        <table
          className="w-full h-full border-collapse"
          style={{
            border: `${borderWidth}px solid ${borderColor}`,
          }}
        >
          <tbody>
            {element.cells.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: headerRow && rowIndex === 0 ? 'rgba(0, 0, 0, 0.05)' : rowIndex % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    contentEditable
                    suppressContentEditableWarning
                    className="outline-none p-1"
                    style={{
                      border: `${borderWidth}px solid ${borderColor}`,
                      fontSize: `${cell.fontSize || 14}px`,
                      fontFamily: cell.fontFace || 'Arial',
                      fontWeight: (headerRow && rowIndex === 0) || cell.bold ? 'bold' : 'normal',
                      fontStyle: cell.italic ? 'italic' : 'normal',
                      color: cell.color ? `#${cell.color}` : '#363636',
                      textAlign: cell.align || 'left',
                      backgroundColor: cell.backgroundColor || 'transparent',
                      padding: '4px 8px',
                    }}
                    onBlur={(e) => {
                      if (onTableCellChange) {
                        onTableCellChange(rowIndex, colIndex, e.currentTarget.textContent || '')
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectElement(element.id)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    {cell.content}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} />
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
              <Move className="h-3 w-3 inline mr-1" />
              Table ({element.rows || 0}x{element.columns || 0})
            </div>
          </>
        )}
      </div>
    )
  }

  return null
}

// Resize handles component
function ResizeHandles({ onResizeStart }: { onResizeStart: (e: React.MouseEvent, handle: string) => void }) {
  const handleSize = 8
  const handleOffset = handleSize / 2

  const baseClass = "resize-handle absolute bg-primary border-2 border-background rounded-full pointer-events-auto z-20"

  return (
    <>
      {/* Corner handles */}
      <div
        className={`${baseClass} cursor-nwse-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: `-${handleOffset}px`,
          top: `-${handleOffset}px`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'top-left')}
      />
      <div
        className={`${baseClass} cursor-nesw-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          right: `-${handleOffset}px`,
          top: `-${handleOffset}px`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'top-right')}
      />
      <div
        className={`${baseClass} cursor-nwse-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          right: `-${handleOffset}px`,
          bottom: `-${handleOffset}px`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'bottom-right')}
      />
      <div
        className={`${baseClass} cursor-nesw-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: `-${handleOffset}px`,
          bottom: `-${handleOffset}px`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'bottom-left')}
      />
      {/* Edge handles */}
      <div
        className={`${baseClass} cursor-ns-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: '50%',
          top: `-${handleOffset}px`,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={(e) => onResizeStart(e, 'top')}
      />
      <div
        className={`${baseClass} cursor-ns-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: '50%',
          bottom: `-${handleOffset}px`,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={(e) => onResizeStart(e, 'bottom')}
      />
      <div
        className={`${baseClass} cursor-ew-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: `-${handleOffset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        onMouseDown={(e) => onResizeStart(e, 'left')}
      />
      <div
        className={`${baseClass} cursor-ew-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          right: `-${handleOffset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        onMouseDown={(e) => onResizeStart(e, 'right')}
      />
    </>
  )
}

export default SlideCanvas
