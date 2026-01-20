import Image from 'next/image'
import { Move } from 'lucide-react'
import { SlideElement } from '../../PowerPointViewer'
import { getShapeDefinition, renderShapeSvg } from '../../components/shape-catalog'
import { fillStyleToCSS } from '../../utils/fill-utils'
import { strokeStyleToCSS } from '../../utils/stroke-utils'

interface ElementRendererProps {
  element: SlideElement
  isSelected: boolean
  scaleFactor: number
  onClick: (e: React.MouseEvent<HTMLElement>) => void
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => void
  onTextFocus: () => void
  onTextChange: (content: string) => void
  onTableCellChange?: (rowIndex: number, colIndex: number, content: string) => void
  onSelectElement: (elementId: string) => void
  onResizeStart: (e: React.MouseEvent<HTMLElement>, handle: string) => void
  onTextSelectionChange?: (selection: { start: number; end: number } | null) => void
}

export function ElementRenderer({
  element,
  isSelected,
  scaleFactor,
  onClick,
  onMouseDown,
  onTextFocus,
  onTextChange,
  onTableCellChange,
  onSelectElement,
  onResizeStart,
  onTextSelectionChange,
}: ElementRendererProps) {
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
                marginBottom: paragraph.spaceAfter
                  ? `${paragraph.spaceAfter}px`
                  : pIdx < element.paragraphs!.length - 1
                    ? '0.5em'
                    : undefined,
                paddingLeft: paragraph.indentLevel ? `${paragraph.indentLevel * 20}px` : undefined,
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

    // Blue border for selected elements
    const selectionOutlineStyle = isSelected
      ? {
          outline: '2px solid #3b82f6',
          outlineOffset: '-2px',
        }
      : {}

    return (
      <div
        className="rounded-sm"
        style={{
          ...baseStyles,
          background: element.textFill ? fillStyleToCSS(element.textFill) : element.fill ? (typeof element.fill === 'string' ? element.fill : fillStyleToCSS(element.fill)) : 'transparent',
          border: element.border && element.border.width > 0
            ? strokeStyleToCSS(element.border, element.border.width * scaleFactor)
            : element.stroke
              ? `${(element.strokeWidth || 1) * scaleFactor}px solid ${element.stroke}`
              : undefined,
          padding: `${scaledPadding}px`,
          boxShadow,
          ...selectionOutlineStyle,
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
          onFocus={onTextFocus}
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
    const stroke = element.border || element.stroke || '#2d5a8c'
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

    // Blue border for selected elements
    const selectionOutlineStyle = isSelected
      ? {
          outline: '2px solid #3b82f6',
          outlineOffset: '-2px',
        }
      : {}

    return (
      <div
        className="relative rounded-sm"
        style={{
          ...baseStyles,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center',
          boxShadow,
          ...selectionOutlineStyle,
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

    // Blue border for selected elements
    const selectionOutlineStyle = isSelected
      ? {
          outline: '2px solid #3b82f6',
          outlineOffset: '-2px',
        }
      : {}

    return (
      <div
        className="bg-muted flex items-center justify-center overflow-hidden relative rounded-sm"
        style={{
          ...baseStyles,
          transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
          transformOrigin: 'center',
          border: element.border && element.border.width > 0
            ? strokeStyleToCSS(element.border, element.border.width * scaleFactor)
            : element.stroke
              ? `${(element.strokeWidth || 1) * scaleFactor}px solid ${element.stroke}`
              : '2px solid hsl(var(--muted))',
          ...selectionOutlineStyle,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        {element.imageUrl ? (
          <Image
            src={element.imageUrl}
            alt=""
            fill
            className="object-cover"
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

    // Blue border for selected elements
    const selectionOutlineStyle = isSelected
      ? {
          outline: '2px solid #3b82f6',
          outlineOffset: '-2px',
        }
      : {}

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
        className="rounded-sm"
        style={{
          ...baseStyles,
          ...selectionOutlineStyle,
        }}
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
                      onFocus={onTextFocus}
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
