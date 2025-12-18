import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { SlidePanel } from './SlidePanel'
import { SlideCanvas } from './SlideCanvas'
import { PowerPointToolbar } from './PowerPointToolbar'
import { handlePowerPointSave } from './handlers/handle-powerpoint-save'
import { slidesToPptx } from './utils/pptx-export-utils'
import {
  pushToHistory,
  canUndo,
  canRedo,
  undo,
  redo,
  clearHistory,
} from './handlers/powerpoint-toolbar-handlers'
import { handlePptxAIResponse, handlePptxAIReject } from './handlers/handle-pptx-ai-response'
import {
  resolveWebImageToDataUrl,
  resolveDriveImageToDataUrl,
  resolveS3ImageToDataUrl,
} from './handlers/powerpoint-image-handlers'
import { Card } from '../../ui/card'
import { ContextMenuProvider } from '../../ui/context-menu'
import {
  duplicateSlide,
  insertSlideBefore,
  insertSlideAfter,
} from './SlidePanel/handlers/handle-slide-context-menu'
import { SlideLayoutType, ThemeType, TransitionType } from './types/slide-layouts'
import { applyLayoutToSlide } from './handlers/handle-apply-layout'
import { applyThemeToSlide } from './handlers/handle-apply-theme'
import { applyTransitionToSlide } from './handlers/handle-apply-transition'
import { ShapeType } from './shape-catalog'

export interface TableCell {
  content: string
  fontSize?: number
  fontFace?: string
  color?: string
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  backgroundColor?: string
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
export interface BorderStyle {
  color: string
  width: number
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
  border?: BorderStyle  // Border for text boxes
  highlights?: HighlightRange[]  // Text highlight ranges
  // Placeholder role for template application
  placeholder?: PlaceholderRole
}

export interface Slide {
  id: string
  index: number
  elements: SlideElement[]
  background?: string
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

  // Load presentation from file
  useEffect(() => {
    const loadPresentation = async () => {
      const fetchKey = `${currentFile.file_id}|${currentFile.name}`
      if (lastFetchKeyRef.current === fetchKey) return
      lastFetchKeyRef.current = fetchKey

      if (!currentFile.file_id) {
        setError('No file ID available for this presentation')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Check if this is a Google Drive or OneDrive file
        const isDriveFile = currentFile.path?.startsWith('drive://')
        const isOneDriveFile = currentFile.path?.startsWith('onedrive://')
        const isGoogleSlides = currentFile.mimeType?.includes('vnd.google-apps.presentation')

        let blob: Blob

        if (isDriveFile && isGoogleSlides) {
          // Export Google Slides as PPTX
          blob = await ApiService.Drive.exportSlidesAsPptx(currentFile.file_id)
        } else if (isOneDriveFile) {
          // Download from OneDrive
          blob = await ApiService.OneDrive.getFileBlob(currentFile.file_id)
        } else {
          // Download regular file from S3
          const result = await ApiService.downloadFromS3(currentFile.file_id, currentFile.name)
          if (!result.success || !result.blob) {
            throw new Error('Failed to load presentation')
          }
          blob = result.blob
        }

        // Parse the PPTX file
        const parsedSlides = await parsePptxFile(blob)
        setSlides(parsedSlides)
        setCurrentSlideIndex(0)
        setSelectedElementId(null)
        
        // Initialize history
        pushToHistory(parsedSlides, 0)
        setUndoAvailable(canUndo())
        setRedoAvailable(canRedo())
      } catch (err) {
        console.error('PowerPointViewer: Error loading presentation:', err)
        setError('Failed to load presentation')
      } finally {
        setLoading(false)
      }
    }

    loadPresentation()
  }, [currentFile.file_id, currentFile.name, currentFile.path, currentFile.mimeType])

  // Parse PPTX file to extract slides
  const parsePptxFile = async (blob: Blob): Promise<Slide[]> => {
    try {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(blob)

      const slides: Slide[] = []

      // Find all slide XML files
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
          return numA - numB
        })

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i]
        const slideXml = await zip.file(slideFile)?.async('string')

        if (slideXml) {
          const elements = parseSlideXml(slideXml)
          slides.push({
            id: `slide-${i + 1}`,
            index: i,
            elements,
            layout: 'content',
          })
        }
      }

      // If no slides found, create a default empty slide
      if (slides.length === 0) {
        slides.push({
          id: 'slide-1',
          index: 0,
          elements: [],
          layout: 'blank',
        })
      }

      return slides
    } catch (err) {
      console.error('Error parsing PPTX:', err)
      // Return a default slide on error
      return [{
        id: 'slide-1',
        index: 0,
        elements: [{
          id: 'text-1',
          type: 'text',
          x: 10,
          y: 40,
          width: 80,
          height: 20,
          content: 'New Presentation',
          fontSize: 44,
          fontFace: 'Arial',
          color: '363636',
          bold: true,
          align: 'center',
          valign: 'middle',
        }],
        layout: 'title',
      }]
    }
  }

  // Parse slide XML to extract elements
  const parseSlideXml = (xml: string): SlideElement[] => {
    const elements: SlideElement[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    // Extract text elements from <a:t> tags
    const textElements = doc.getElementsByTagName('a:t')
    let yPosition = 20

    for (let i = 0; i < textElements.length; i++) {
      const text = textElements[i].textContent?.trim()
      if (text) {
        elements.push({
          id: `text-${i + 1}`,
          type: 'text',
          x: 5,
          y: yPosition,
          width: 90,
          height: 10,
          content: text,
          fontSize: i === 0 ? 32 : 18,
          fontFace: 'Arial',
          color: '363636',
          align: 'left',
          valign: 'middle',
        })
        yPosition += 15
      }
    }

    return elements
  }

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

  // Resolve image references (driveFileId, s3FileId, web URLs) to data URLs
  useEffect(() => {
    const resolveImages = async () => {
      let hasChanges = false
      const updatedSlides = await Promise.all(
        slides.map(async (slide) => {
          const updatedElements = await Promise.all(
            slide.elements.map(async (element) => {
              // Skip if not an image or already has a data URL
              if (element.type !== 'image') return element
              if (element.imageUrl && element.imageUrl.startsWith('data:')) return element
              
              // Check if we need to resolve an image reference
              const needsResolution = element.driveFileId || element.s3FileId || 
                (element.imageUrl && (element.imageUrl.startsWith('http://') || element.imageUrl.startsWith('https://')))
              
              if (!needsResolution) return element
              
              try {
                let dataUrl: string | null = null
                
                if (element.driveFileId) {
                  dataUrl = await resolveDriveImageToDataUrl(element.driveFileId)
                } else if (element.s3FileId) {
                  // Use stored fileName or fallback
                  const fileName = element.s3FileName || `image-${element.s3FileId}.jpg`
                  dataUrl = await resolveS3ImageToDataUrl(element.s3FileId, fileName)
                } else if (element.imageUrl) {
                  dataUrl = await resolveWebImageToDataUrl(element.imageUrl)
                }
                
                if (dataUrl) {
                  hasChanges = true
                  return {
                    ...element,
                    imageUrl: dataUrl,
                    // Clear the reference fields once resolved
                    driveFileId: undefined,
                    s3FileId: undefined,
                    s3FileName: undefined,
                  }
                }
              } catch (error) {
                console.error('Failed to resolve image:', error)
                // Keep the element as-is if resolution fails
              }
              
              return element
            })
          )
          
          return {
            ...slide,
            elements: updatedElements,
          }
        })
      )
      
      if (hasChanges) {
        setSlides(updatedSlides)
        setHasUnsavedChanges(true)
      }
    }
    
    resolveImages()
  }, [slides])

  // Handle slide selection
  const handleSlideSelect = useCallback((index: number) => {
    setCurrentSlideIndex(index)
    setSelectedElementId(null)
  }, [])

  // Handle adding new slide
  const handleAddSlide = useCallback(() => {
    saveToHistory()
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      index: slides.length,
      elements: [{
        id: `text-${Date.now()}`,
        type: 'text',
        x: 10,
        y: 40,
        width: 80,
        height: 20,
        content: 'Click to edit',
        fontSize: 44,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'center',
        valign: 'middle',
      }],
      layout: 'title',
    }
    setSlides(prev => [...prev, newSlide])
    setCurrentSlideIndex(slides.length)
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [slides.length, saveToHistory])

  // Handle deleting current slide
  const handleDeleteSlide = useCallback(() => {
    if (slides.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "Presentation must have at least one slide.",
        variant: "destructive",
      })
      return
    }

    saveToHistory()
    setSlides(prev => {
      const newSlides = prev.filter((_, i) => i !== currentSlideIndex)
      return newSlides.map((s, i) => ({ ...s, index: i }))
    })

    if (currentSlideIndex >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
    }
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, slides.length, toast, saveToHistory])

  // Handle deleting slide by index (for context menu)
  const handleDeleteSlideByIndex = useCallback((index: number) => {
    if (slides.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "Presentation must have at least one slide.",
        variant: "destructive",
      })
      return
    }

    saveToHistory()
    setSlides(prev => {
      const newSlides = prev.filter((_, i) => i !== index)
      return newSlides.map((s, i) => ({ ...s, index: i }))
    })

    if (index === currentSlideIndex) {
      if (index >= slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, index - 1))
      } else {
        setCurrentSlideIndex(index)
      }
    } else if (index < currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
    setSelectedElementId(null)
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, slides.length, toast, saveToHistory])

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
  const handleApplyTheme = useCallback((themeType: ThemeType) => {
    saveToHistory()
    setSlides(prev => {
      const newSlides = [...prev]
      const currentSlide = newSlides[currentSlideIndex]
      const { background, elements } = applyThemeToSlide(currentSlide, themeType)
      newSlides[currentSlideIndex] = {
        ...currentSlide,
        theme: themeType,
        background,
        elements,
      }
      return newSlides
    })
    setHasUnsavedChanges(true)
  }, [currentSlideIndex, saveToHistory])

  // Handle applying template to entire presentation
  const handleApplyTemplate = useCallback(async (templateId: string) => {
    saveToHistory()
    
    // Import the template application handler dynamically
    const { applyTemplateToPresentation } = await import('./handlers/handle-apply-template')
    
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
  const handleUpdateSlide = useCallback((updatedElements: SlideElement[]) => {
    setSlides(prev => {
      const newSlides = [...prev]
      newSlides[currentSlideIndex] = {
        ...newSlides[currentSlideIndex],
        elements: updatedElements,
      }
      return newSlides
    })
    setHasUnsavedChanges(true)
  }, [currentSlideIndex])

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

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true') {
        return
      }

      if (e.key === 'ArrowLeft') goToPreviousSlide()
      if (e.key === 'ArrowRight') goToNextSlide()
      
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
      
      // Save shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
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
          saving={saving}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Slide panel (thumbnails) */}
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
            onDeleteSlide={handleDeleteSlideByIndex}
            onDuplicateSlide={handleDuplicateSlide}
            onInsertSlideBefore={handleInsertSlideBefore}
            onInsertSlideAfter={handleInsertSlideAfter}
          />

          {/* Main slide canvas */}
          <div className="flex-1 overflow-auto">
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
        </div>
      </div>
    </ContextMenuProvider>
  )
}

export default PowerPointViewer

