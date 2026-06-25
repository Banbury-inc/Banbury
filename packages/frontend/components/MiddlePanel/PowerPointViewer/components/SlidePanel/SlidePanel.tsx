import { useCallback } from 'react'
import Image from 'next/image'
import { cn } from '../../../../../lib/utils'
import { Slide } from '../../PowerPointViewer'
import { renderShapeSvg } from '../../components/shape-catalog'
import { useContextMenu } from '../../../../common/ui/context-menu'
import { getSlideContextMenuItems } from './handlers/handle-slide-context-menu'
import { fillStyleToCSS, normalizeFill, fillStyleToColorString } from '../../utils/fill-utils'

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
    <div className="h-full border-r overflow-y-auto flex flex-col gap-2 p-2">
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
            className="aspect-[16/9] rounded-sm overflow-hidden relative"
            style={getBackgroundStyle(slide)}
          >
            <SlideThumbnail slide={slide} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper function to get background style for slide (matches SlideCanvas)
function getBackgroundStyle(slide: Slide): React.CSSProperties {
  // Check if slide has backgroundStyle (FillStyle)
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

// Render decorative element (matches SlideCanvas)
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

// Mini thumbnail preview of slide content
function SlideThumbnail({ slide }: { slide: Slide }) {
  return (
    <div className="w-full h-full relative p-1">
      {/* Decorative elements layer (rendered behind content) */}
      {slide.decorativeElements && slide.decorativeElements.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {slide.decorativeElements.map((decorative) => (
            <DecorativeElementRenderer key={decorative.id} element={decorative} />
          ))}
        </div>
      )}
      
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
          // Normalize fill to string for renderShapeSvg
          const fill = fillStyleToColorString(element.fill) || '#e0e0e0'
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
                  style={{ color: element.stroke || 'var(--foreground)' }}
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
              className="absolute bg-muted flex items-center justify-center relative"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
              }}
            >
              {element.imageUrl && (
                <Image
                  src={element.imageUrl}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized
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

