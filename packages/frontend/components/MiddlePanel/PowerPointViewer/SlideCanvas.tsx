import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Slide, SlideElement, FillStyle } from './PowerPointViewer'
import { getShapeDefinition, renderShapeSvg } from './shape-catalog'
import { Move } from 'lucide-react'
import { fillStyleToCSS, normalizeFill } from './utils/fill-utils'
import type { Paragraph, TextRun } from './types/pptx-types'

interface SlideCanvasProps {
  slide: Slide
  onUpdateElements: (elements: SlideElement[]) => void
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

  // Handle text content change
  const handleTextChange = useCallback((elementId: string, newContent: string) => {
    const newElements = slide.elements.map(e =>
      e.id === elementId ? { ...e, content: newContent, paragraphs: undefined } : e
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
                cIdx === colIndex ? { ...cell, content: newContent, paragraphs: undefined } : cell
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
                onMouseDown={(e) => handleMouseDown(e, element.id)}
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

// Render individual elements
function ElementRenderer({
  element,
  isSelected,
  scaleFactor,
  onClick,
  onMouseDown,
  onTextChange,
  onTableCellChange,
  onSelectElement,
  onResizeStart,
  onTextSelectionChange,
}: {
  element: SlideElement
  isSelected: boolean
  scaleFactor: number
  onClick: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onTextChange: (content: string) => void
  onTableCellChange?: (rowIndex: number, colIndex: number, content: string) => void
  onSelectElement: (elementId: string) => void
  onResizeStart: (e: React.MouseEvent, handle: string) => void
  onTextSelectionChange?: (selection: { start: number; end: number } | null) => void
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
    // Render rich text paragraphs if available
    const renderRichText = () => {
      if (element.paragraphs && element.paragraphs.length > 0) {
        return (
          <>
            {element.paragraphs.map((paragraph, pIdx) => {
              const paragraphStyle: React.CSSProperties = {
                textAlign: paragraph.alignment || 'left',
                lineHeight: paragraph.lineSpacing ? `${paragraph.lineSpacing}` : undefined,
                marginTop: paragraph.spaceBefore ? `${paragraph.spaceBefore}px` : undefined,
                marginBottom: paragraph.spaceAfter ? `${paragraph.spaceAfter}px` : undefined,
                paddingLeft: paragraph.indentLevel ? `${paragraph.indentLevel * 20}px` : undefined,
                marginBottom: pIdx < element.paragraphs!.length - 1 ? '0.5em' : undefined,
              }

              // Render bullet/number if needed
              const bulletPrefix = paragraph.bulletType === 'bullet'
                ? (paragraph.bulletChar || '•') + ' '
                : paragraph.bulletType === 'number'
                ? `${pIdx + 1}. `
                : ''

              return (
                <div key={paragraph.id} style={paragraphStyle}>
                  {bulletPrefix}
                  {paragraph.runs.map((run, rIdx) => {
                    const runStyle: React.CSSProperties = {
                      fontSize: run.fontSize ? `${run.fontSize * scaleFactor}px` : undefined,
                      fontFamily: run.fontFace || undefined,
                      color: run.color || undefined,
                      fontWeight: run.bold ? 'bold' : 'normal',
                      fontStyle: run.italic ? 'italic' : 'normal',
                      textDecoration: run.underline
                        ? run.underline === 'double'
                          ? 'underline double'
                          : run.underline === 'wave'
                          ? 'underline wavy'
                          : 'underline'
                        : run.strikethrough
                        ? 'line-through'
                        : undefined,
                      verticalAlign: run.superscript
                        ? 'super'
                        : run.subscript
                        ? 'sub'
                        : undefined,
                      backgroundColor: run.highlight || undefined,
                    }

                    if (run.link) {
                      return (
                        <a
                          key={rIdx}
                          href={run.link}
                          style={runStyle}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {run.text}
                        </a>
                      )
                    }

                    return (
                      <span key={rIdx} style={runStyle}>
                        {run.text}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </>
        )
      }

      // Fallback to legacy content rendering
      return renderTextWithHighlights()
    }

    // Render highlighted text if highlights exist (legacy)
    const renderTextWithHighlights = () => {
      if (!element.highlights || element.highlights.length === 0) {
        return element.content
      }

      const content = element.content || ''
      const parts: Array<{ text: string; highlight?: string }> = []
      let lastIndex = 0

      // Sort highlights by start position
      const sortedHighlights = [...element.highlights].sort((a, b) => a.start - b.start)

      for (const highlight of sortedHighlights) {
        // Add text before highlight
        if (highlight.start > lastIndex) {
          parts.push({ text: content.substring(lastIndex, highlight.start) })
        }
        // Add highlighted text
        parts.push({
          text: content.substring(highlight.start, highlight.end),
          highlight: highlight.color
        })
        lastIndex = highlight.end
      }

      // Add remaining text
      if (lastIndex < content.length) {
        parts.push({ text: content.substring(lastIndex) })
      }

      return (
        <>
          {parts.map((part, idx) => (
            part.highlight ? (
              <span key={idx} style={{ backgroundColor: part.highlight }}>{part.text}</span>
            ) : (
              <span key={idx}>{part.text}</span>
            )
          ))}
        </>
      )
    }

    // Handle selection change
    const handleSelectionChange = () => {
      if (!onTextSelectionChange) return
      
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        onTextSelectionChange(null)
        return
      }

      const range = selection.getRangeAt(0)
      const content = element.content || ''
      
      // Get text content and calculate offsets
      const startOffset = Math.min(range.startOffset, content.length)
      const endOffset = Math.min(range.endOffset, content.length)
      
      if (startOffset !== endOffset) {
        onTextSelectionChange({ start: startOffset, end: endOffset })
      } else {
        onTextSelectionChange(null)
      }
    }

    const scaledFontSize = (element.fontSize || 18) * scaleFactor
    const scaledBorderWidth = element.border ? element.border.width * scaleFactor : undefined
    const scaledPadding = 4 * scaleFactor

    // Build shadow CSS if shadow exists
    let boxShadow: string | undefined
    if (element.shadow) {
      const scaledOffsetX = element.shadow.offsetX * scaleFactor
      const scaledOffsetY = element.shadow.offsetY * scaleFactor
      const scaledBlur = element.shadow.blur * scaleFactor
      boxShadow = `${scaledOffsetX}px ${scaledOffsetY}px ${scaledBlur}px ${element.shadow.color}`
    }

    return (
      <div
        className={isSelected ? 'border-2 border-primary rounded-sm' : 'border-2 border-transparent rounded-sm'}
        style={{
          ...baseStyles,
          background: element.textFill ? fillStyleToCSS(element.textFill) : element.fill ? (typeof element.fill === 'string' ? element.fill : fillStyleToCSS(element.fill)) : 'transparent',
          border: element.border ? `${scaledBorderWidth}px solid ${element.border.color}` : element.stroke ? `${(element.strokeWidth || 1) * scaleFactor}px solid ${element.stroke}` : undefined,
          padding: `${scaledPadding}px`,
          boxShadow,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        <div
          contentEditable
          suppressContentEditableWarning
          className="w-full h-full outline-none"
          style={{
            fontSize: `${scaledFontSize}px`,
            fontFamily: element.fontFace || 'Arial',
            fontWeight: element.bold ? 'bold' : 'normal',
            fontStyle: element.italic ? 'italic' : 'normal',
            color: element.color ? `#${element.color}` : '#363636',
            textAlign: element.align || 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: element.valign === 'top' ? 'flex-start' : element.valign === 'bottom' ? 'flex-end' : 'center',
            minHeight: '1em',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          onBlur={(e) => onTextChange(e.currentTarget.textContent || '')}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
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
          {renderRichText()}
        </div>
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} scaleFactor={scaleFactor} />
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
    // Normalize fill (handle both string and FillStyle)
    const fill = element.fill ? (typeof element.fill === 'string' ? element.fill : fillStyleToCSS(element.fill)) : '#4a90d9'
    const stroke = element.stroke || '#2d5a8c'
    const scaledStrokeWidth = (element.strokeWidth ?? 2) * scaleFactor
    const rotation = element.rotation ?? 0
    const shapeType = element.shapeType || 'rect'
    const shapeLabel = getShapeDefinition(shapeType)?.label || 'Shape'
    const scaledFontSize = 14 * scaleFactor

    // Build shadow CSS if shadow exists
    let boxShadow: string | undefined
    if (element.shadow) {
      const scaledOffsetX = element.shadow.offsetX * scaleFactor
      const scaledOffsetY = element.shadow.offsetY * scaleFactor
      const scaledBlur = element.shadow.blur * scaleFactor
      boxShadow = `${scaledOffsetX}px ${scaledOffsetY}px ${scaledBlur}px ${element.shadow.color}`
    }

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
          boxShadow,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        <div className="w-full h-full">
          {renderShapeSvg(shapeType, { fill, stroke, strokeWidth: scaledStrokeWidth, text: element.content })}
        </div>
        {element.content && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none font-medium"
            style={{ 
              color: element.stroke || '#1f2937',
              fontSize: `${scaledFontSize}px`
            }}
          >
            {element.content}
          </div>
        )}
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} scaleFactor={scaleFactor} />
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
    const rotation = element.rotation ?? 0

    return (
      <div
        className={`bg-muted flex items-center justify-center overflow-hidden relative ${isSelected ? 'border-2 border-primary rounded-sm' : 'border-2 border-muted rounded-sm'}`}
        style={{
          ...baseStyles,
          transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
          transformOrigin: 'center',
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        {element.imageUrl ? (
          <Image
            src={element.imageUrl}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="text-muted-foreground text-sm">No image</div>
        )}
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} scaleFactor={scaleFactor} />
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
    const scaledBorderWidth = (element.borderWidth || 1) * scaleFactor
    const headerRow = element.headerRow || false
    const scaledPadding = 4 * scaleFactor
    const scaledPaddingHorizontal = 8 * scaleFactor

    // Helper to render cell content (rich text or plain)
    const renderCellContent = (cell: typeof element.cells[0][0]) => {
      if (cell.paragraphs && cell.paragraphs.length > 0) {
        // Render rich text
        return (
          <>
            {cell.paragraphs.map((paragraph, pIdx) => (
              <div key={pIdx} style={{ marginBottom: pIdx < cell.paragraphs!.length - 1 ? '0.25em' : undefined }}>
                {paragraph.runs.map((run, rIdx) => {
                  const runStyle: React.CSSProperties = {
                    fontSize: run.fontSize ? `${run.fontSize * scaleFactor}px` : undefined,
                    fontFamily: run.fontFace || undefined,
                    color: run.color || undefined,
                    fontWeight: run.bold ? 'bold' : 'normal',
                    fontStyle: run.italic ? 'italic' : 'normal',
                    textDecoration: run.underline ? 'underline' : run.strikethrough ? 'line-through' : undefined,
                  }
                  return (
                    <span key={rIdx} style={runStyle}>
                      {run.text}
                    </span>
                  )
                })}
              </div>
            ))}
          </>
        )
      }
      // Fallback to plain content
      return cell.content
    }

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
            border: `${scaledBorderWidth}px solid ${borderColor}`,
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
                {row.map((cell, colIndex) => {
                  // Build border style from individual borders
                  const cellBorderStyle: React.CSSProperties = {}
                  if (cell.borders) {
                    if (cell.borders.top) {
                      cellBorderStyle.borderTop = `${cell.borders.top.width * scaleFactor}px solid ${cell.borders.top.color}`
                    }
                    if (cell.borders.right) {
                      cellBorderStyle.borderRight = `${cell.borders.right.width * scaleFactor}px solid ${cell.borders.right.color}`
                    }
                    if (cell.borders.bottom) {
                      cellBorderStyle.borderBottom = `${cell.borders.bottom.width * scaleFactor}px solid ${cell.borders.bottom.color}`
                    }
                    if (cell.borders.left) {
                      cellBorderStyle.borderLeft = `${cell.borders.left.width * scaleFactor}px solid ${cell.borders.left.color}`
                    }
                  } else {
                    // Fallback to table-wide border
                    cellBorderStyle.border = `${scaledBorderWidth}px solid ${borderColor}`
                  }

                  return (
                    <td
                      key={colIndex}
                      contentEditable
                      suppressContentEditableWarning
                      className="outline-none"
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      style={{
                        ...cellBorderStyle,
                        fontSize: `${(cell.fontSize || 14) * scaleFactor}px`,
                        fontFamily: cell.fontFace || 'Arial',
                        fontWeight: (headerRow && rowIndex === 0) || cell.bold ? 'bold' : 'normal',
                        fontStyle: cell.italic ? 'italic' : 'normal',
                        color: cell.color ? `#${cell.color}` : '#363636',
                        textAlign: cell.align || 'left',
                        verticalAlign: cell.valign || 'top',
                        backgroundColor: cell.backgroundColor || 'transparent',
                        padding: `${scaledPadding}px ${scaledPaddingHorizontal}px`,
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
                      {renderCellContent(cell)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {isSelected && (
          <>
            <ResizeHandles onResizeStart={onResizeStart} scaleFactor={scaleFactor} />
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
function ResizeHandles({ 
  onResizeStart, 
  scaleFactor 
}: { 
  onResizeStart: (e: React.MouseEvent, handle: string) => void
  scaleFactor: number
}) {
  const baseHandleSize = 8
  const handleSize = baseHandleSize * scaleFactor
  const handleOffset = handleSize / 2
  const scaledBorderWidth = 2 * scaleFactor

  const baseClass = "resize-handle absolute bg-primary rounded-full pointer-events-auto z-20"

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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
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
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
          onMouseDown={(e) => onResizeStart(e, 'right')}
      />
    </>
  )
}

// Helper function to get background style for slide
function getBackgroundStyle(slide: Slide): React.CSSProperties {
  // Check if slide has background image
  if (slide.backgroundImage) {
    return {
      backgroundImage: `url(${slide.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  // Check if slide has backgroundStyle (FillStyle - gradient or solid)
  if (slide.backgroundStyle) {
    const fill = normalizeFill(slide.backgroundStyle)
    if (fill) {
      return {
        background: fillStyleToCSS(fill),
      }
    }
  }

  // Fallback to solid color background
  return {
    backgroundColor: slide.background || '#ffffff',
  }
}

// Render decorative element
function DecorativeElementRenderer({ 
  element 
}: { 
  element: {
    id: string
    shape: 'circle' | 'rect' | 'line' | 'triangle' | 'blob'
    x: number
    y: number
    width?: number
    height?: number
    color: string
    opacity: number
    rotation?: number
    scale?: number
  }
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    opacity: element.opacity,
    transform: element.rotation 
      ? `rotate(${element.rotation}deg) scale(${element.scale || 1})`
      : element.scale 
        ? `scale(${element.scale})`
        : undefined,
    transformOrigin: 'center',
  }

  if (element.width !== undefined) {
    style.width = `${element.width}%`
  }
  if (element.height !== undefined) {
    style.height = `${element.height}%`
  }

  switch (element.shape) {
    case 'circle':
      return (
        <div
          style={{
            ...style,
            borderRadius: '50%',
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '20%',
            height: element.height ? `${element.height}%` : '20%',
          }}
        />
      )
    
    case 'rect':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '30%',
            height: element.height ? `${element.height}%` : '30%',
          }}
        />
      )
    
    case 'line':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '100%',
            height: element.height ? `${element.height}%` : '2px',
            top: `${element.y}%`,
            left: `${element.x}%`,
          }}
        />
      )
    
    case 'triangle':
      return (
        <div
          style={{
            ...style,
            width: 0,
            height: 0,
            borderLeft: `${element.width ? element.width / 2 : 10}% solid transparent`,
            borderRight: `${element.width ? element.width / 2 : 10}% solid transparent`,
            borderBottom: `${element.height ? element.height : 15}% solid ${element.color}`,
            backgroundColor: 'transparent',
          }}
        />
      )
    
    case 'blob':
      // For blob, use a circle with border-radius for organic shape
      return (
        <div
          style={{
            ...style,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            backgroundColor: element.color,
            width: element.width ? `${element.width}%` : '25%',
            height: element.height ? `${element.height}%` : '25%',
          }}
        />
      )
    
    default:
      return null
  }
}

export default SlideCanvas
