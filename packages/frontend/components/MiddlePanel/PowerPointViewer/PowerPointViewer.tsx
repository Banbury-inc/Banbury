import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../common/ui/use-toast'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { SlidePanel } from './components/SlidePanel/SlidePanel'
import { SlideCanvas } from './components/SlideCanvas/SlideCanvas'
import { PowerPointToolbar } from './components/PowerPointToolbar/PowerPointToolbar'
import { SlideshowPresenter } from './components/SlideshowPresenter/SlideshowPresenter'
import { handlePowerPointSave } from './components/PowerPointToolbar/handlers/handle-powerpoint-save'
import { slidesToPptx } from './utils/pptx-export-utils'
import {
  pushToHistory,
  canUndo,
  canRedo,
  undo,
  redo,
  clearHistory,
} from './components/PowerPointToolbar/handlers/powerpoint-toolbar-handlers'
import { Card } from '../../common/ui/card'
import { ContextMenuProvider } from '../../common/ui/context-menu'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../common/ui/resizable'
import {
  duplicateSlide,
  insertSlideBefore,
  insertSlideAfter,
} from './components/SlidePanel/handlers/handle-slide-context-menu'
import { handleAddSlide } from './components/SlidePanel/handlers/handle-add-slide'
import { handleDeleteSlide } from './components/SlidePanel/handlers/handle-delete-slide'
import { handleDeleteSlideByIndex } from './components/SlidePanel/handlers/handle-delete-slide-by-index'
import { handleLoadPresentation } from './handlers/handle-load-presentation'
import { handleKeyDown } from './handlers/handle-key-down'
import { handleResolveImages } from './handlers/handle-resolve-images'
import { handlePptxLiveUpdate } from './handlers/handle-pptx-live-update'
import { handleAIResponse, handleAIReject } from './handlers/handle-ai-response'
import { handleFileGenerated } from './handlers/handle-file-generated'
import { handlePptxUpdated } from './handlers/handle-pptx-updated'
import { registerInGlobalRegistry } from './handlers/handle-global-registry'
import { SlideLayoutType, ThemeType, TransitionType } from './types/slide-layouts'
import { applyLayoutToSlide } from './components/PowerPointToolbar/handlers/handle-apply-layout'
import { applyThemeToSlide } from './components/PowerPointToolbar/handlers/handle-apply-theme'
import { applyTransitionToSlide } from './components/PowerPointToolbar/handlers/handle-apply-transition'
import { ShapeType } from './components/shape-catalog'
import type { Paragraph, ThemeColors, Shadow, StrokeStyle, BorderStyle } from './types/pptx-types'

export interface TableCell {
  content: string
  paragraphs?: Paragraph[]
  fontSize?: number
  fontFace?: string
  color?: string
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  backgroundColor?: string
  borders?: {
    top?: { color: string; width: number }
    right?: { color: string; width: number }
    bottom?: { color: string; width: number }
    left?: { color: string; width: number }
  }
  colspan?: number
  rowspan?: number
}

export type FillStyle = 
  | { kind: 'solid'; color: string }
  | { kind: 'linearGradient'; startColor: string; endColor: string; angleDeg: number }

export interface HighlightRange {
  start: number
  end: number
  color: string
}

export type PlaceholderRole =
  | 'title'
  | 'subtitle'
  | 'body'
  | 'leftColumn'
  | 'rightColumn'
  | 'caption'
  | 'number'

export interface SlideElement {
  id: string
  type: 'text' | 'shape' | 'image' | 'table'
  x: number
  y: number
  width: number
  height: number
  content?: string
  paragraphs?: Paragraph[]
  fontSize?: number
  fontFace?: string
  color?: string
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  shapeType?: ShapeType
  fill?: string | FillStyle
  stroke?: string
  strokeWidth?: number
  rotation?: number
  shadow?: Shadow
  imageUrl?: string
  driveFileId?: string
  s3FileId?: string
  s3FileName?: string
  rows?: number
  columns?: number
  cells?: TableCell[][]
  borderColor?: string
  borderWidth?: number
  headerRow?: boolean
  textFill?: FillStyle
  border?: BorderStyle | StrokeStyle
  highlights?: HighlightRange[]
  placeholder?: PlaceholderRole
}

export interface Slide {
  id: string
  index: number
  elements: SlideElement[]
  background?: string
  backgroundStyle?: FillStyle
  backgroundImage?: string
  themeColors?: ThemeColors
  decorativeElements?: Array<{
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
  }>
  layout?: SlideLayoutType
  theme?: ThemeType
  transition?: TransitionType
  notes?: string
}

interface PowerPointViewerProps {
  file: FileSystemItem
  userInfo?: {
    username: string
    email?: string
  } | null
  onSaveComplete?: () => void
}

export function PowerPointViewer({ file, userInfo, onSaveComplete }: PowerPointViewerProps) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [textSelection, setTextSelection] = useState<{ start: number; end: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentFile, setCurrentFile] = useState<FileSystemItem>(file)
  const [undoAvailable, setUndoAvailable] = useState(false)
  const [redoAvailable, setRedoAvailable] = useState(false)
  const [isPresentingSlideshow, setIsPresentingSlideshow] = useState(false)
  const [activePresentationId, setActivePresentationId] = useState<string | null>(null)
  const { toast } = useToast()
  const lastFetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    setCurrentFile(file)
  }, [file])

  useEffect(() => {
    clearHistory()
    setUndoAvailable(false)
    setRedoAvailable(false)
  }, [file.file_id])

  useEffect(() => {
    return registerInGlobalRegistry({
      currentFile,
      slides,
    })
  }, [currentFile.file_id, slides])

  useEffect(() => {
    const loadPresentation = async () => {
      await handleLoadPresentation({
        currentFile,
        lastFetchKeyRef,
        toast,
        setSlides,
        setCurrentSlideIndex,
        setSelectedElementId,
        setError,
        setLoading,
        setUndoAvailable,
        setRedoAvailable,
      })
    }

    loadPresentation()
  }, [currentFile.file_id, currentFile.name, currentFile.path, currentFile.mimeType, toast])


  const saveToHistory = useCallback(() => {
    pushToHistory(slides, currentSlideIndex)
    setUndoAvailable(canUndo())
    setRedoAvailable(canRedo())
  }, [slides, currentSlideIndex])

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      handleAIResponse({
        event,
        slides,
        currentSlideIndex,
        selectedElementId,
        setSlides,
        setCurrentSlideIndex,
        setSelectedElementId,
        setHasUnsavedChanges,
        setUndoAvailable,
        setRedoAvailable,
      })
    }

    const rejectHandler = (event: CustomEvent) => {
      handleAIReject({
        event,
        slides,
        currentSlideIndex,
        selectedElementId,
        setSlides,
        setCurrentSlideIndex,
        setSelectedElementId,
        setHasUnsavedChanges,
        setUndoAvailable,
        setRedoAvailable,
      })
    }

    window.addEventListener('powerpoint-ai-response', handler as EventListener)
    window.addEventListener('powerpoint-ai-response-reject', rejectHandler as EventListener)
    return () => {
      window.removeEventListener('powerpoint-ai-response', handler as EventListener)
      window.removeEventListener('powerpoint-ai-response-reject', rejectHandler as EventListener)
    }
  }, [slides, currentSlideIndex, selectedElementId])

  useEffect(() => {
    const handler = async (event: CustomEvent) => {
      await handleFileGenerated({
        event,
        toast,
        setSlides,
        setCurrentSlideIndex,
        setSelectedElementId,
        setHasUnsavedChanges,
        setUndoAvailable,
        setRedoAvailable,
      })
    }

    window.addEventListener('powerpoint-file-generated', handler as unknown as EventListener)
    return () => {
      window.removeEventListener('powerpoint-file-generated', handler as unknown as EventListener)
    }
  }, [toast])

  useEffect(() => {
    const handler = async (event: CustomEvent) => {
      await handlePptxUpdated({
        event,
        currentFileId: currentFile.file_id,
        currentFileName: currentFile.name,
        currentSlideIndex,
        toast,
        setSlides,
        setCurrentSlideIndex,
        setHasUnsavedChanges,
        setUndoAvailable,
        setRedoAvailable,
      })
    }

    window.addEventListener('pptx-updated', handler as unknown as EventListener)
    return () => window.removeEventListener('pptx-updated', handler as unknown as EventListener)
  }, [currentFile.file_id, currentFile.name, currentSlideIndex, toast])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const { fileId, presentationId } = detail

      // Only set if this viewer is showing the matching file
      if (file?.file_id === fileId) {
        setActivePresentationId(presentationId)
      }
    }

    window.addEventListener('pptx-presentation-loaded', handler as EventListener)
    return () => window.removeEventListener('pptx-presentation-loaded', handler as EventListener)
  }, [file?.file_id])

  useEffect(() => {
    const handler = (event: Event) => {
      handlePptxLiveUpdate({
        event: event as CustomEvent,
        activePresentationId,
        fileId: file?.file_id,
        slides,
        setSlides,
        setActivePresentationId,
        setHasUnsavedChanges,
        toast,
      })
    }

    window.addEventListener('pptx-live-update', handler as EventListener)
    return () => window.removeEventListener('pptx-live-update', handler as EventListener)
  }, [activePresentationId, file?.file_id, slides, toast])

  useEffect(() => {
    const resolveImages = async () => {
      await handleResolveImages({
        slides,
        setSlides,
        setHasUnsavedChanges,
      })
    }
    
    resolveImages()
  }, [slides])

  const handleSlideSelect = useCallback((index: number) => {
    setCurrentSlideIndex(index)
    setSelectedElementId(null)
  }, [])

  const handleAddSlideCallback = useCallback(() => {
    handleAddSlide({
      slides,
      saveToHistory,
      setSlides,
      setCurrentSlideIndex,
      setSelectedElementId,
      setHasUnsavedChanges,
    })
  }, [slides, saveToHistory])

  const handleDeleteSlideCallback = useCallback(() => {
    handleDeleteSlide({
      slides,
      currentSlideIndex,
      saveToHistory,
      toast,
      setSlides,
      setCurrentSlideIndex,
      setSelectedElementId,
      setHasUnsavedChanges,
    })
  }, [slides, currentSlideIndex, toast, saveToHistory])

  const handleDeleteSlideByIndexCallback = useCallback((index: number) => {
    handleDeleteSlideByIndex({
      slides,
      index,
      currentSlideIndex,
      saveToHistory,
      toast,
      setSlides,
      setCurrentSlideIndex,
      setSelectedElementId,
      setHasUnsavedChanges,
    })
  }, [slides, currentSlideIndex, toast, saveToHistory])

  const handleDuplicateSlide = useCallback((index: number) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = duplicateSlide(prev, index)
      return newSlides
    })
    setCurrentSlideIndex(index + 1)
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  // Handle inserting slide before
  const handleInsertSlideBefore = useCallback((index: number) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = insertSlideBefore(prev, index)
      return newSlides
    })
    setCurrentSlideIndex(index)
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  // Handle inserting slide after
  const handleInsertSlideAfter = useCallback((index: number) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = insertSlideAfter(prev, index)
      return newSlides
    })
    setCurrentSlideIndex(index + 1)
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [saveToHistory])

  // Handle updating slide background
  const handleUpdateSlideBackground = useCallback((background: string) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = [...prev]
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        background,
      }
      return newSlides
    })
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, saveToHistory])

  // Handle applying layout
  const handleApplyLayout = useCallback((layoutType: SlideLayoutType) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = [...prev]
      const currentSlide = newSlides[currentSlideIndex]
      const newElements = applyLayoutToSlide(currentSlide, layoutType)
      newSlides[currentSlideIndex] = {
        ...currentSlide,
        layout: layoutType,
        elements: newElements,
      }
      return newSlides
    })
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, saveToHistory])

  // Handle applying theme
  const handleApplyTheme = useCallback(async (themeType: ThemeType) => {
    saveToHistory()
    try {
      const result = await applyThemeToSlide(slides[currentSlideIndex], themeType)
      setSlides(prev => {
        const newSlides = [...prev]
        const currentSlide = newSlides[currentSlideIndex]
        newSlides[currentSlideIndex] = {
          ...currentSlide,
          theme: themeType,
          background: typeof result.background === 'string' ? result.background : undefined,
          backgroundStyle: result.backgroundStyle || (typeof result.background !== 'string' ? result.background : undefined),
          decorativeElements: result.decorativeElements,
          elements: result.elements,
        }
        return newSlides
      })
      setHasUnsavedChanges(true)
    } catch (error) {
      console.error('Failed to apply theme:', error)
      // Fallback to sync version for backward compatibility
      const { applyThemeToSlideSync } = await import('./components/PowerPointToolbar/handlers/handle-apply-theme')
      const result = applyThemeToSlideSync(slides[currentSlideIndex], themeType)
      setSlides(prev => {
        const newSlides = [...prev]
        const currentSlide = newSlides[currentSlideIndex]
        newSlides[currentSlideIndex] = {
          ...currentSlide,
          theme: themeType,
          background: typeof result.background === 'string' ? result.background : undefined,
          backgroundStyle: result.backgroundStyle || (typeof result.background !== 'string' ? result.background : undefined),
          decorativeElements: result.decorativeElements,
          elements: result.elements,
        }
        return newSlides
      })
      setHasUnsavedChanges(true)
    }
  }, [currentSlideIndex, saveToHistory, slides])

  // Handle applying template to entire presentation
  const handleApplyTemplate = useCallback(async (templateId: string) => {
    saveToHistory()
    
    // Import the template application handler dynamically
    const { applyTemplateToPresentation } = await import('./components/PowerPointToolbar/handlers/handle-apply-template')
    
    const result = await applyTemplateToPresentation(slides, templateId)
    
    if (result.success) {
      setSlides(result.slides)
      setHasUnsavedChanges(true)
      toast({
        title: "Template applied",
        description: "The template has been applied to your presentation.",
        variant: "success",
      })
    } else {
      toast({
        title: "Failed to apply template",
        description: result.error || "Unknown error occurred.",
        variant: "destructive",
      })
    }
  }, [slides, saveToHistory, toast])

  // Handle applying transition
  const handleApplyTransition = useCallback((transitionType: TransitionType) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = [...prev]
      const currentSlide = newSlides[currentSlideIndex]
      const transition = applyTransitionToSlide(transitionType)
      newSlides[currentSlideIndex] = {
        ...currentSlide,
        transition,
      }
      return newSlides
    })
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, saveToHistory])

  const handleUpdateSlide = useCallback((updatedElements: SlideElement[], saveHistory = false) => {
    if (saveHistory) {
      saveToHistory()
    }
    setSlides(prev => {
      const newSlides = [...prev]
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: updatedElements,
      }
      return newSlides
    })
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, saveToHistory])

  const handleAddElement = useCallback((element: SlideElement) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = [...prev]
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: [...newSlides[currentSlideIndex].elements, element],
      }
      return newSlides
    })
    setSelectedElementId(element.id)
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, saveToHistory])

  const handleUpdateElement = useCallback((updates: Partial<SlideElement>) => {
    if (!selectedElementId) return
    
    setSlides(prev => {
      const newSlides = [...prev]
      const elementIndex = newSlides[currentSlideIndex].elements.findIndex(
        e => e.id === selectedElementId
      )
      if (elementIndex >= 0) {
        newSlides[currentSlideIndex].elements[elementIndex] = {
          ...newSlides[currentSlideIndex].elements[elementIndex],
          ...updates,
        }
      }
      return newSlides
    })
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, selectedElementId])

  // Handle deleting selected element
  const handleDeleteElement = useCallback(() => {
    if (!selectedElementId) return
    
    saveToHistory()
    setSlides(prev => {
      const newSlides = [...prev]
      newSlides[currentSlideIndex].elements = newSlides[currentSlideIndex].elements.filter(
        e => e.id !== selectedElementId
      )
      return newSlides
    })
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, selectedElementId, saveToHistory])

  // Handle undo
  const handleUndo = useCallback(() => {
    const state = undo()
    if (state) {
      setSlides(state.slides)
      setCurrentSlideIndex(state.currentSlideIndex)
      setSelectedElementId(null)
      setUndoAvailable(canUndo())
      setRedoAvailable(canRedo())
      setHasUnsavedChanges(true)
    }
  }, [])

  // Handle redo
  const handleRedo = useCallback(() => {
    const state = redo()
    if (state) {
      setSlides(state.slides)
      setCurrentSlideIndex(state.currentSlideIndex)
      setSelectedElementId(null)
      setUndoAvailable(canUndo())
      setRedoAvailable(canRedo())
      setHasUnsavedChanges(true)
    }
  }, [])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!currentFile.file_id) return

    setSaving(true)
    try {
      await handlePowerPointSave({
        currentFile,
        slides,
        toast,
        onSaveComplete,
      })
      setHasUnsavedChanges(false)
    } finally {
      setSaving(false)
    }
  }, [currentFile, slides, toast, onSaveComplete])

  // Handle download
  const handleDownload = useCallback(async () => {
    try {
      // Convert slides to PPTX using shared export function
      const pptx = await slidesToPptx(slides)

      // Download
      const blob = await pptx.write({ outputType: 'blob' }) as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      toast({
        title: "Download failed",
        description: "Failed to download presentation.",
        variant: "destructive",
      })
    }
  }, [slides, currentFile.name, toast])

  // Navigation
  const goToPreviousSlide = useCallback(() => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1))
    setSelectedElementId(null)
  }, [])

  const goToNextSlide = useCallback(() => {
    setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))
    setSelectedElementId(null)
  }, [slides.length])

  // Slideshow handlers
  const handleStartPresentation = useCallback(() => {
    setIsPresentingSlideshow(true)
  }, [])

  const handleExitPresentation = useCallback(() => {
    setIsPresentingSlideshow(false)
  }, [])

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e, {
        goToPreviousSlide,
        goToNextSlide,
        handleUndo,
        handleRedo,
        handleSave,
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goToPreviousSlide, goToNextSlide, handleUndo, handleRedo, handleSave])

  // Get selected element
  const selectedElement = slides[currentSlideIndex]?.elements.find(e => e.id === selectedElementId) || null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-card">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-card">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-2 border-destructive flex items-center justify-center text-destructive font-bold">!</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load presentation</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentSlide = slides[currentSlideIndex]

  return (
    <ContextMenuProvider>
      {isPresentingSlideshow ? (
        <SlideshowPresenter
          slides={slides}
          initialSlideIndex={currentSlideIndex}
          onExit={handleExitPresentation}
        />
      ) : (
        <div className="h-full flex flex-col bg-card">
          {/* Toolbar */}
          <PowerPointToolbar
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          currentSlide={currentSlide}
          selectedElement={selectedElement}
          textSelection={textSelection}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onAddSlide={handleAddSlideCallback}
          onDeleteSlide={handleDeleteSlideCallback}
          onUpdateSlideBackground={handleUpdateSlideBackground}
          onApplyLayout={handleApplyLayout}
          onApplyTheme={handleApplyTheme}
          onApplyTemplate={handleApplyTemplate}
          onApplyTransition={handleApplyTransition}
          onPreviousSlide={goToPreviousSlide}
          onNextSlide={goToNextSlide}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoAvailable}
          canRedo={redoAvailable}
          onSave={handleSave}
          onDownload={handleDownload}
          onStartPresentation={handleStartPresentation}
          saving={saving}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Main content area */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Slide panel (thumbnails) */}
          <ResizablePanel
            defaultSize={Number(localStorage.getItem('pptSlidePanelSize')) || 20}
            minSize={15}
            maxSize={35}
            onResize={(size) => localStorage.setItem('pptSlidePanelSize', size.toString())}
          >
            <SlidePanel
              slides={slides}
              currentSlideIndex={currentSlideIndex}
              onSlideSelect={handleSlideSelect}
              onSlidesReorder={(fromIndex, toIndex) => {
                saveToHistory()
                setSlides(prev => {
                  const newSlides = [...prev]
                  const [moved] = newSlides.splice(fromIndex, 1)
                  newSlides.splice(toIndex, 0, moved)
                  return newSlides.map((s, i) => ({ ...s, index: i }))
                })
                setHasUnsavedChanges(true)
              }}
              onDeleteSlide={handleDeleteSlideByIndexCallback}
              onDuplicateSlide={handleDuplicateSlide}
              onInsertSlideBefore={handleInsertSlideBefore}
              onInsertSlideAfter={handleInsertSlideAfter}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main slide canvas */}
          <ResizablePanel defaultSize={80}>
            <div className="flex-1 overflow-auto h-full">
              <Card className="w-full h-full flex items-center justify-center bg-muted/50">
                {currentSlide && (
                  <SlideCanvas
                    slide={currentSlide}
                    onUpdateElements={handleUpdateSlide}
                    selectedElementId={selectedElementId}
                    onSelectElement={setSelectedElementId}
                    onTextSelectionChange={setTextSelection}
                  />
                )}
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        </div>
      )}
    </ContextMenuProvider>
  )
}

export default PowerPointViewer

