import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { SlidePanel } from './components/SlidePanel/SlidePanel'
import { SlideCanvas } from './components/SlideCanvas/SlideCanvas'
import { PowerPointToolbar } from './components/PowerPointToolbar/PowerPointToolbar'
import { BorderStyle } from './types/pptx-types'
import { SlideshowPresenter } from './components/SlideshowPresenter'
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
import { handlePptxAIResponse, handlePptxAIReject } from './components/PowerPointToolbar/handlers/handle-pptx-ai-response'
import { Card } from '../../ui/card'
import { ContextMenuProvider } from '../../ui/context-menu'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../ui/resizable'
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
import { parsePptxFile } from './utils/parse-pptx-file'
import { SlideLayoutType, ThemeType, TransitionType } from './types/slide-layouts'
import { applyLayoutToSlide } from './components/PowerPointToolbar/handlers/handle-apply-layout'
import { applyThemeToSlide } from './components/PowerPointToolbar/handlers/handle-apply-theme'
import { applyTransitionToSlide } from './components/PowerPointToolbar/handlers/handle-apply-transition'
import { ShapeType } from './components/shape-catalog'
import type { Paragraph, ThemeColors, Shadow, StrokeStyle } from './types/pptx-types'

export interface TableCell {
  content: string
  paragraphs?: Paragraph[] // Rich text content from PPTX
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

// Fill style types for text boxes and shapes
export type FillStyle = 
  | { kind: 'solid'; color: string }
  | { kind: 'linearGradient'; startColor: string; endColor: string; angleDeg: number }

// Text highlight range
export interface HighlightRange {
  start: number
  end: number
  color: string
}

// Border style for text boxes
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
  paragraphs?: Paragraph[]  // Rich text paragraphs from PPTX parsing
  fontSize?: number
  fontFace?: string
  color?: string
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  shapeType?: ShapeType
  fill?: string | FillStyle  // Backward compatible: string or FillStyle
  stroke?: string
  strokeWidth?: number
  rotation?: number
  shadow?: Shadow  // Shadow effect from PPTX
  imageUrl?: string
  driveFileId?: string
  s3FileId?: string
  s3FileName?: string
  // Table-specific properties
  rows?: number
  columns?: number
  cells?: TableCell[][]
  borderColor?: string
  borderWidth?: number
  headerRow?: boolean
  // New advanced formatting properties
  textFill?: FillStyle  // Background fill for text boxes
  border?: BorderStyle | StrokeStyle  // Border for text boxes (StrokeStyle for full PPTX support)
  highlights?: HighlightRange[]  // Text highlight ranges
  // Placeholder role for template application
  placeholder?: PlaceholderRole
}

export interface Slide {
  id: string
  index: number
  elements: SlideElement[]
  background?: string
  backgroundStyle?: FillStyle // Enhanced background support
  backgroundImage?: string // Background image data (base64 or URL)
  themeColors?: ThemeColors // Resolved theme colors from PPTX
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

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file)
  }, [file])

  // Clear history when file changes
  useEffect(() => {
    clearHistory()
    setUndoAvailable(false)
    setRedoAvailable(false)
  }, [file.file_id])

  // Register PowerPoint viewer state in global registry for context passing
  useEffect(() => {
    if (!currentFile.file_id || slides.length === 0) return

    // Initialize global registry if it doesn't exist
    if (typeof window !== 'undefined') {
      if (!(window as any)._activePowerPointViewers) {
        (window as any)._activePowerPointViewers = []
      }

      const viewerState = {
        fileId: currentFile.file_id,
        slides: slides
      }

      // Remove any existing viewer with the same fileId
      const viewers = (window as any)._activePowerPointViewers as Array<{ fileId: string; slides: Slide[] }>
      const filteredViewers = viewers.filter(v => v.fileId !== currentFile.file_id)
      filteredViewers.push(viewerState)
      ;(window as any)._activePowerPointViewers = filteredViewers

      // Cleanup: unregister when component unmounts or file changes
      return () => {
        if ((window as any)._activePowerPointViewers) {
          ;(window as any)._activePowerPointViewers = (
            (window as any)._activePowerPointViewers as Array<{ fileId: string; slides: Slide[] }>
          ).filter(v => v.fileId !== currentFile.file_id)
        }
      }
    }
  }, [currentFile.file_id, slides])

  // Load presentation from file
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


  // Push to history helper
  const saveToHistory = useCallback(() => {
    pushToHistory(slides, currentSlideIndex)
    setUndoAvailable(canUndo())
    setRedoAvailable(canRedo())
  }, [slides, currentSlideIndex])

  // Listen for AI PowerPoint operations
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const detail = event?.detail || {}
      
      // Use the new centralized handler
      const result = handlePptxAIResponse(
        detail,
        slides,
        currentSlideIndex
      )

      // If result is null, it means no changes (idempotent case or accept after preview)
      if (!result) {
        return
      }

      // Apply the changes
      setSlides(result.nextSlides)
      setCurrentSlideIndex(result.nextCurrentSlideIndex)
      
      // Clear selection if selected element no longer exists
      if (selectedElementId) {
        const currentSlide = result.nextSlides[result.nextCurrentSlideIndex]
        const elementExists = currentSlide?.elements.some(e => e.id === selectedElementId)
        if (!elementExists) {
          setSelectedElementId(null)
        }
      }
      
      setHasUnsavedChanges(true)
      
      // Save to history with the actual applied slides
      pushToHistory(result.nextSlides, result.nextCurrentSlideIndex)
      setUndoAvailable(canUndo())
      setRedoAvailable(canRedo())
    }

    // Handle reject event to restore original state
    const rejectHandler = (event: CustomEvent) => {
      const detail = event?.detail || {}
      const changeId = detail.changeId
      
      if (!changeId) {
        console.warn('[PowerPointViewer] Reject event missing changeId')
        return
      }

      const result = handlePptxAIReject(changeId, slides, currentSlideIndex)
      
      if (!result) {
        return
      }

      // Restore original slides
      setSlides(result.nextSlides)
      setCurrentSlideIndex(result.nextCurrentSlideIndex)
      
      // Clear selection if it no longer exists
      if (selectedElementId) {
        const currentSlide = result.nextSlides[result.nextCurrentSlideIndex]
        const elementExists = currentSlide?.elements.some(e => e.id === selectedElementId)
        if (!elementExists) {
          setSelectedElementId(null)
        }
      }
      
      setHasUnsavedChanges(true)
      
      // Save to history
      pushToHistory(result.nextSlides, result.nextCurrentSlideIndex)
      setUndoAvailable(canUndo())
      setRedoAvailable(canRedo())
    }

    window.addEventListener('powerpoint-ai-response', handler as EventListener)
    window.addEventListener('powerpoint-ai-response-reject', rejectHandler as EventListener)
    return () => {
      window.removeEventListener('powerpoint-ai-response', handler as EventListener)
      window.removeEventListener('powerpoint-ai-response-reject', rejectHandler as EventListener)
    }
  }, [slides, currentSlideIndex, selectedElementId])

  // Listen for Skills-generated files (new file-based workflow)
  useEffect(() => {
    const handler = async (event: CustomEvent) => {
      const detail = event?.detail || {}
      const { fileId, fileName, fileType } = detail

      if (fileType !== 'pptx') {
        return // Only handle PowerPoint files
      }

      if (!fileId || !fileName) {
        console.warn('[PowerPointViewer] File-generated event missing fileId or fileName')
        return
      }

      try {
        // Download file from S3
        const result = await ApiService.downloadFromS3(fileId, fileName)
        if (!result.success || !result.blob) {
          throw new Error('Failed to download generated presentation')
        }

        // Parse the PPTX file
        const parsedSlides = await parsePptxFile({ blob: result.blob, toast })

        // Replace current slides with generated ones
        setSlides(parsedSlides)
        setCurrentSlideIndex(0)
        setSelectedElementId(null)
        setHasUnsavedChanges(true) // Mark as unsaved so user can save to their location

        // Save to history
        pushToHistory(parsedSlides, 0)
        setUndoAvailable(canUndo())
        setRedoAvailable(canRedo())

        toast({
          title: 'Presentation generated',
          description: 'Your presentation has been created using Claude Skills',
          variant: 'default'
        })
      } catch (error) {
        console.error('Error loading Skills-generated file:', error)
        toast({
          title: 'Error loading presentation',
          description: error instanceof Error ? error.message : 'Failed to load generated presentation',
          variant: 'destructive'
        })
      }
    }

    window.addEventListener('powerpoint-file-generated', handler as unknown as EventListener)
    return () => {
      window.removeEventListener('powerpoint-file-generated', handler as unknown as EventListener)
    }
  }, [])

  // Listen for PPTX tool updates via SSE stream
  useEffect(() => {
    const handler = async (event: CustomEvent) => {
      const data = event.detail

      if (data.type === 'pptx-updated') {
        const { fileId, fileName, operation } = data

        // Only reload if this is the currently open file
        if (currentFile.file_id === fileId || currentFile.name === fileName) {
          try {
            const result = await ApiService.downloadFromS3(fileId, fileName)
            if (result.success && result.blob) {
              const parsedSlides = await parsePptxFile({ blob: result.blob, toast })
              setSlides(parsedSlides)
              setHasUnsavedChanges(false)

              // Preserve current slide index if still valid
              if (currentSlideIndex < parsedSlides.length) {
                setCurrentSlideIndex(currentSlideIndex)
              } else {
                setCurrentSlideIndex(Math.max(0, parsedSlides.length - 1))
              }

              pushToHistory(parsedSlides, currentSlideIndex)
              setUndoAvailable(canUndo())
              setRedoAvailable(canRedo())

              // Show toast notification
              toast({
                title: 'Presentation updated',
                description: `AI has completed: ${operation.replace(/_/g, ' ')}`,
                variant: 'default'
              })
            }
          } catch (error) {
            console.error('Failed to reload after AI update:', error)
          }
        }
      }
    }

    // Listen for custom events from SSE stream
    window.addEventListener('pptx-updated', handler as unknown as EventListener)
    return () => window.removeEventListener('pptx-updated', handler as unknown as EventListener)
  }, [currentFile.file_id, currentFile.name, currentSlideIndex])

  // Listen for pptx-presentation-loaded event to track active presentation ID
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const { fileId, presentationId } = detail

      console.log('[PowerPointViewer] Received pptx-presentation-loaded event:', { 
        fileId, 
        presentationId, 
        currentFileId: file?.file_id 
      })

      // Only set if this viewer is showing the matching file
      if (file?.file_id === fileId) {
        console.log('[PowerPointViewer] Setting activePresentationId:', presentationId)
        setActivePresentationId(presentationId)
      } else {
        console.log('[PowerPointViewer] File ID mismatch, not setting activePresentationId')
      }
    }

    window.addEventListener('pptx-presentation-loaded', handler as EventListener)
    return () => window.removeEventListener('pptx-presentation-loaded', handler as EventListener)
  }, [file?.file_id])

  // Listen for pptx-live-update events to apply changes without re-downloading
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const { presentationId, operation, operationData, fileId } = detail


      // Check if this event is for the current presentation
      // Match by presentationId (if activePresentationId is set) or by fileId
      const presentationMatches = activePresentationId && presentationId === activePresentationId
      const fileMatches = fileId && file?.file_id === fileId
      
      if (!presentationMatches && !fileMatches) {
        console.log('[PowerPointViewer] Ignoring event - presentation/file mismatch')
        return
      }

      // If we matched by fileId but activePresentationId isn't set, set it now
      if (!activePresentationId && fileMatches && presentationId) {
        console.log('[PowerPointViewer] Setting activePresentationId from event:', presentationId)
        setActivePresentationId(presentationId)
      }

      // Apply the operation to the slides
      setSlides((prevSlides) => {
        const updatedSlides = [...prevSlides]

        switch (operation) {
          case 'create_slide': {
            const { slideIndex, layout, background } = operationData
            const newSlide: Slide = {
              id: `slide-${Date.now()}`,
              index: slideIndex,
              elements: [],
              background: background,
            }
            updatedSlides.splice(slideIndex, 0, newSlide)
            // Update indices of subsequent slides
            updatedSlides.forEach((slide, idx) => {
              slide.index = idx
            })
            break
          }

          case 'add_text': {
            const { slideIndex, element } = operationData
            if (updatedSlides[slideIndex]) {
              updatedSlides[slideIndex] = {
                ...updatedSlides[slideIndex],
                elements: [...updatedSlides[slideIndex].elements, element],
              }
            }
            break
          }

          case 'add_image': {
            const { slideIndex, element } = operationData
            if (updatedSlides[slideIndex]) {
              updatedSlides[slideIndex] = {
                ...updatedSlides[slideIndex],
                elements: [...updatedSlides[slideIndex].elements, element],
              }
            }
            break
          }

          case 'add_shape': {
            const { slideIndex, element } = operationData
            if (updatedSlides[slideIndex]) {
              updatedSlides[slideIndex] = {
                ...updatedSlides[slideIndex],
                elements: [...updatedSlides[slideIndex].elements, element],
              }
            }
            break
          }

          case 'add_table': {
            const { slideIndex, element } = operationData
            if (updatedSlides[slideIndex]) {
              updatedSlides[slideIndex] = {
                ...updatedSlides[slideIndex],
                elements: [...updatedSlides[slideIndex].elements, element],
              }
            }
            break
          }

          case 'set_slide_background': {
            const { slideIndex, background } = operationData
            if (updatedSlides[slideIndex]) {
              updatedSlides[slideIndex] = {
                ...updatedSlides[slideIndex],
                background: background,
              }
            }
            break
          }

          default:
            console.warn('[PowerPointViewer] Unknown operation:', operation)
        }

        return updatedSlides
      })

      // Mark as unsaved changes
      setHasUnsavedChanges(true)

      // Show toast notification
      toast({
        title: 'Presentation updated',
        description: `AI has completed: ${operation.replace(/_/g, ' ')}`,
        variant: 'default'
      })
    }

    window.addEventListener('pptx-live-update', handler as EventListener)
    return () => window.removeEventListener('pptx-live-update', handler as EventListener)
  }, [activePresentationId, toast])

  // Resolve image references (driveFileId, s3FileId, web URLs) to data URLs
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

  // Handle slide selection
  const handleSlideSelect = useCallback((index: number) => {
    setCurrentSlideIndex(index)
    setSelectedElementId(null)
  }, [])

  // Handle adding new slide
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

  // Handle deleting current slide
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

  // Handle deleting slide by index (for context menu)
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

  // Handle duplicating slide
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

  // Handle updating slide elements
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

  // Handle adding element
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

  // Handle updating selected element
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

