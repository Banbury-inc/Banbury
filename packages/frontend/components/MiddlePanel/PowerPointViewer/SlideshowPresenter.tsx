import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Slide, SlideElement } from './PowerPointViewer'
import { SlideshowControls } from './components/SlideshowControls'
import { getTransitionStyle, getTransitionDuration } from './handlers/handle-slideshow-transitions'
import { getShapeDefinition, renderShapeSvg } from './shape-catalog'
import { fillStyleToCSS, normalizeFill } from './utils/fill-utils'
import { strokeStyleToCSS, hexToRgba } from './utils/stroke-utils'
import type { Paragraph } from './types/pptx-types'

interface SlideshowPresenterProps {
  slides: Slide[]
  initialSlideIndex: number
  onExit: () => void
}

export function SlideshowPresenter({ slides, initialSlideIndex, onExit }: SlideshowPresenterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward')
  const hideControlsTimer = useRef<NodeJS.Timeout>()
  const isFullscreenRef = useRef(false)

  const currentSlide = slides[currentIndex]

  // Fullscreen API helpers
  const enterFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen()
      } else if ((container as any).webkitRequestFullscreen) {
        await (container as any).webkitRequestFullscreen()
      } else if ((container as any).mozRequestFullScreen) {
        await (container as any).mozRequestFullScreen()
      } else if ((container as any).msRequestFullscreen) {
        await (container as any).msRequestFullscreen()
      }
      isFullscreenRef.current = true
    } catch (error) {
      // Fullscreen request failed - continue in normal mode
      isFullscreenRef.current = false
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    // Check if we're actually in fullscreen before trying to exit
    const isInFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    )

    if (!isInFullscreen) {
      isFullscreenRef.current = false
      return
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
    } catch (error) {
      // Ignore exit errors
    }
    isFullscreenRef.current = false
  }, [])

  // Enter fullscreen on mount, exit on unmount
  useEffect(() => {
    // Attempt to enter fullscreen
    enterFullscreen()

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      isFullscreenRef.current = isCurrentlyFullscreen
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      // Cleanup: exit fullscreen if still in it
      exitFullscreen()
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [enterFullscreen, exitFullscreen])

  // Navigation functions
  const goToNextSlide = useCallback(async () => {
    if (isTransitioning || currentIndex >= slides.length - 1) return

    const nextSlide = slides[currentIndex + 1]
    const transition = nextSlide.transition || 'none'
    const duration = getTransitionDuration(transition)

    setTransitionDirection('forward')
    setIsTransitioning(true)

    if (duration > 0) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsTransitioning(false)
      }, duration)
    } else {
      setCurrentIndex(prev => prev + 1)
      setIsTransitioning(false)
    }
  }, [currentIndex, slides.length, isTransitioning])

  const goToPreviousSlide = useCallback(async () => {
    if (isTransitioning || currentIndex <= 0) return

    const prevSlide = slides[currentIndex - 1]
    const transition = prevSlide.transition || 'none'
    const duration = getTransitionDuration(transition)

    setTransitionDirection('backward')
    setIsTransitioning(true)

    if (duration > 0) {
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
        setIsTransitioning(false)
      }, duration)
    } else {
      setCurrentIndex(prev => prev - 1)
      setIsTransitioning(false)
    }
  }, [currentIndex, isTransitioning, slides])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Spacebar
          e.preventDefault()
          goToNextSlide()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPreviousSlide()
          break
        case 'Escape':
          e.preventDefault()
          onExit()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextSlide, goToPreviousSlide, onExit])

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(hideControlsTimer.current)
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(hideControlsTimer.current)
    }
  }, [])

  // Get transition style for current slide
  const transitionStyle = getTransitionStyle(
    currentSlide.transition || 'none',
    !isTransitioning,
    transitionDirection
  )

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Current Slide */}
      <div
        className="aspect-[16/9] w-full max-w-[90vw] max-h-[90vh] relative"
        style={{
          ...transitionStyle,
        }}
      >
        <SlideRenderer slide={currentSlide} />
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <SlideshowControls
          currentIndex={currentIndex}
          totalSlides={slides.length}
          onNext={goToNextSlide}
          onPrevious={goToPreviousSlide}
          onExit={onExit}
          canGoNext={currentIndex < slides.length - 1}
          canGoPrevious={currentIndex > 0}
        />
      )}
    </div>
  )
}

// Helper function to get background style for slide
function getBackgroundStyle(slide: Slide): React.CSSProperties {
  if (slide.backgroundImage) {
    return {
      backgroundImage: `url(${slide.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  if (slide.backgroundStyle) {
    const fill = normalizeFill(slide.backgroundStyle)
    if (fill) {
      return {
        background: fillStyleToCSS(fill),
      }
    }
  }

  return {
    backgroundColor: slide.background || '#ffffff',
  }
}

// Slide renderer component (simplified, no editing features)
function SlideRenderer({ slide }: { slide: Slide }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={getBackgroundStyle(slide)}
    >
      {/* Decorative elements layer */}
      {slide.decorativeElements && slide.decorativeElements.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {slide.decorativeElements.map((decorative) => (
            <DecorativeElementRenderer key={decorative.id} element={decorative} />
          ))}
        </div>
      )}

      {/* Slide elements */}
      {slide.elements.map((element) => (
        <ElementRenderer key={element.id} element={element} />
      ))}
    </div>
  )
}

// Element renderer (read-only, no selection or editing)
function ElementRenderer({ element }: { element: SlideElement }) {
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
  }

  if (element.type === 'text') {
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
                      fontSize: run.fontSize ? `${run.fontSize}px` : undefined,
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

      return element.content
    }

    let boxShadow: string | undefined
    if (element.shadow) {
      boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color}`
    }

    return (
      <div
        style={{
          ...baseStyles,
          background: element.textFill
            ? fillStyleToCSS(element.textFill)
            : element.fill
            ? typeof element.fill === 'string'
              ? element.fill
              : fillStyleToCSS(element.fill)
            : 'transparent',
          border: element.border && element.border.width > 0
            ? strokeStyleToCSS(element.border, element.border.width)
            : element.stroke
            ? `${element.strokeWidth || 1}px solid ${element.stroke}`
            : undefined,
          padding: '4px',
          boxShadow,
        }}
      >
        <div
          className="w-full h-full"
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
            overflow: 'hidden',
          }}
        >
          {renderRichText()}
        </div>
      </div>
    )
  }

  if (element.type === 'shape') {
    const fill = element.fill
      ? typeof element.fill === 'string'
        ? element.fill
        : fillStyleToCSS(element.fill)
      : '#4a90d9'
    const stroke = element.border || element.stroke || '#2d5a8c'
    const strokeWidth = element.strokeWidth ?? 2
    const rotation = element.rotation ?? 0
    const shapeType = element.shapeType || 'rect'

    let boxShadow: string | undefined
    if (element.shadow) {
      boxShadow = `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color}`
    }

    return (
      <div
        className="relative"
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
      >
        <div className="w-full h-full">
          {renderShapeSvg(shapeType, { fill, stroke, strokeWidth, text: element.content })}
        </div>
        {element.content && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none font-medium"
            style={{
              color: element.stroke || '#1f2937',
              fontSize: '14px',
            }}
          >
            {element.content}
          </div>
        )}
      </div>
    )
  }

  if (element.type === 'image') {
    const rotation = element.rotation ?? 0

    return (
      <div
        className="bg-muted flex items-center justify-center overflow-hidden relative"
        style={{
          ...baseStyles,
          transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
          transformOrigin: 'center',
          border: element.border && element.border.width > 0
            ? strokeStyleToCSS(element.border, element.border.width)
            : element.stroke
            ? `${element.strokeWidth || 1}px solid ${element.stroke}`
            : '2px solid hsl(var(--muted))',
        }}
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
      </div>
    )
  }

  if (element.type === 'table' && element.cells) {
    const borderColor = element.borderColor || '#cccccc'
    const borderWidth = element.borderWidth || 1
    const headerRow = element.headerRow || false

    const renderCellContent = (cell: typeof element.cells[0][0]) => {
      if (cell.paragraphs && cell.paragraphs.length > 0) {
        return (
          <>
            {cell.paragraphs.map((paragraph, pIdx) => (
              <div key={pIdx} style={{ marginBottom: pIdx < cell.paragraphs!.length - 1 ? '0.25em' : undefined }}>
                {paragraph.runs.map((run, rIdx) => {
                  const runStyle: React.CSSProperties = {
                    fontSize: run.fontSize ? `${run.fontSize}px` : undefined,
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
      return cell.content
    }

    return (
      <div style={baseStyles}>
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
                  backgroundColor:
                    headerRow && rowIndex === 0
                      ? 'rgba(0, 0, 0, 0.05)'
                      : rowIndex % 2 === 0
                      ? 'transparent'
                      : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                {row.map((cell, colIndex) => {
                  const cellBorderStyle: React.CSSProperties = {}
                  if (cell.borders) {
                    if (cell.borders.top) {
                      cellBorderStyle.borderTop = `${cell.borders.top.width}px solid ${cell.borders.top.color}`
                    }
                    if (cell.borders.right) {
                      cellBorderStyle.borderRight = `${cell.borders.right.width}px solid ${cell.borders.right.color}`
                    }
                    if (cell.borders.bottom) {
                      cellBorderStyle.borderBottom = `${cell.borders.bottom.width}px solid ${cell.borders.bottom.color}`
                    }
                    if (cell.borders.left) {
                      cellBorderStyle.borderLeft = `${cell.borders.left.width}px solid ${cell.borders.left.color}`
                    }
                  } else {
                    cellBorderStyle.border = `${borderWidth}px solid ${borderColor}`
                  }

                  return (
                    <td
                      key={colIndex}
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      style={{
                        ...cellBorderStyle,
                        fontSize: `${cell.fontSize || 14}px`,
                        fontFamily: cell.fontFace || 'Arial',
                        fontWeight: (headerRow && rowIndex === 0) || cell.bold ? 'bold' : 'normal',
                        fontStyle: cell.italic ? 'italic' : 'normal',
                        color: cell.color ? `#${cell.color}` : '#363636',
                        textAlign: cell.align || 'left',
                        verticalAlign: cell.valign || 'top',
                        backgroundColor: cell.backgroundColor || 'transparent',
                        padding: '4px 8px',
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
      </div>
    )
  }

  return null
}

// Decorative element renderer
function DecorativeElementRenderer({
  element,
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
