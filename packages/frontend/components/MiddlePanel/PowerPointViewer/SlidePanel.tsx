import { useCallback } from 'react'
import { cn } from '../../../lib/utils'
import { Slide } from './PowerPointViewer'
import { renderShapeSvg } from './shape-catalog'
import { useContextMenu } from '../../ui/context-menu'
import { getSlideContextMenuItems } from './SlidePanel/handlers/handle-slide-context-menu'

interface SlidePanelProps {
  slides: Slide[]
  currentSlideIndex: number
  onSlideSelect: (index: number) => void
  onSlidesReorder?: (fromIndex: number, toIndex: number) => void
  onDeleteSlide?: (index: number) => void
  onDuplicateSlide?: (index: number) => void
  onInsertSlideBefore?: (index: number) => void
  onInsertSlideAfter?: (index: number) => void
}

export function SlidePanel({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlidesReorder,
  onDeleteSlide,
  onDuplicateSlide,
  onInsertSlideBefore,
  onInsertSlideAfter,
}: SlidePanelProps) {
  const { showContextMenu } = useContextMenu()

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('slideIndex', index.toString())
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('slideIndex'), 10)
    if (fromIndex !== toIndex && onSlidesReorder) {
      onSlidesReorder(fromIndex, toIndex)
    }
  }, [onSlidesReorder])

  const handleContextMenu = useCallback((e: React.MouseEvent, slideIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onDeleteSlide || !onDuplicateSlide || !onInsertSlideBefore || !onInsertSlideAfter) {
      return
    }

    const menuItems = getSlideContextMenuItems(slideIndex, {
      onDeleteSlide,
      onDuplicateSlide,
      onInsertSlideBefore,
      onInsertSlideAfter,
      canDeleteSlide: () => slides.length > 1,
    })

    showContextMenu(e.clientX, e.clientY, menuItems)
  }, [showContextMenu, slides.length, onDeleteSlide, onDuplicateSlide, onInsertSlideBefore, onInsertSlideAfter])

  return (
    <div className="w-48 border-r overflow-y-auto flex flex-col gap-2 p-2">
      <div className="text-xs font-medium text-muted-foreground px-2 py-1">
        Slides
      </div>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "relative cursor-pointer rounded-md border-2 transition-all hover:border-primary/50",
            currentSlideIndex === index
              ? "border-primary ring-2 ring-primary/20"
              : "border-border"
          )}
          onClick={() => onSlideSelect(index)}
          onContextMenu={(e) => handleContextMenu(e, index)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          {/* Slide number badge */}
          <div className="absolute top-1 left-1 bg-background/80 text-xs font-medium px-1.5 py-0.5 rounded text-muted-foreground">
            {index + 1}
          </div>

          {/* Slide thumbnail */}
          <div
            className="aspect-[16/9] rounded-sm overflow-hidden"
            style={{
              backgroundColor: slide.background || '#ffffff',
            }}
          >
            <SlideThumbnail slide={slide} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Mini thumbnail preview of slide content
function SlideThumbnail({ slide }: { slide: Slide }) {
  return (
    <div className="w-full h-full relative p-1" style={{ backgroundColor: slide.background || '#ffffff' }}>
      {slide.elements.map((element) => {
        if (element.type === 'text') {
          return (
            <div
              key={element.id}
              className="absolute overflow-hidden"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                fontSize: `${Math.max(4, (element.fontSize || 18) / 6)}px`,
                fontWeight: element.bold ? 'bold' : 'normal',
                fontStyle: element.italic ? 'italic' : 'normal',
                color: element.color ? `#${element.color}` : '#363636',
                textAlign: element.align || 'left',
                lineHeight: 1.2,
              }}
            >
              {element.content?.substring(0, 50)}
            </div>
          )
        }

        if (element.type === 'shape') {
          const fill = element.fill || '#e0e0e0'
          const stroke = element.stroke || '#9e9e9e'
          const strokeWidth = element.strokeWidth ?? 1
          const rotation = element.rotation ?? 0
          const shapeType = element.shapeType || 'rect'

          return (
            <div
              key={element.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
            >
              {renderShapeSvg(shapeType, { fill, stroke, strokeWidth, text: element.content })}
              {element.content && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-medium"
                  style={{ color: element.stroke || '#1f2937' }}
                >
                  {element.content}
                </div>
              )}
            </div>
          )
        }

        if (element.type === 'image') {
          return (
            <div
              key={element.id}
              className="absolute bg-muted flex items-center justify-center"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
              }}
            >
              {element.imageUrl && (
                <img
                  src={element.imageUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          )
        }

        if (element.type === 'table' && element.cells) {
          return (
            <div
              key={element.id}
              className="absolute border"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                borderColor: element.borderColor || '#cccccc',
                borderWidth: `${element.borderWidth || 1}px`,
              }}
            >
              <table
                className="w-full h-full border-collapse"
                style={{
                  fontSize: '2px',
                }}
              >
                <tbody>
                  {element.cells.slice(0, Math.min(3, element.cells.length)).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.slice(0, Math.min(3, row.length)).map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          style={{
                            border: `0.5px solid ${element.borderColor || '#cccccc'}`,
                            padding: '0.5px 1px',
                            fontSize: '2px',
                          }}
                        >
                          {cell.content?.substring(0, 3) || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return null
      })}

      {/* Empty slide placeholder */}
      {slide.elements.length === 0 && (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-[6px]">
          Empty slide
        </div>
      )}
    </div>
  )
}

export default SlidePanel

