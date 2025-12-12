import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { SlidePanel } from './SlidePanel'
import { SlideCanvas } from './SlideCanvas'
import { PowerPointToolbar } from './PowerPointToolbar'
import { handlePowerPointSave } from './handlers/handle-powerpoint-save'
import {
  pushToHistory,
  canUndo,
  canRedo,
  undo,
  redo,
  clearHistory,
} from './handlers/powerpoint-toolbar-handlers'
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
  fill?: string
  stroke?: string
  strokeWidth?: number
  rotation?: number
  imageUrl?: string
  // Table-specific properties
  rows?: number
  columns?: number
  cells?: TableCell[][]
  borderColor?: string
  borderWidth?: number
  headerRow?: boolean
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
        // Check if this is a Google Drive file
        const isDriveFile = currentFile.path?.startsWith('drive://')
        const isGoogleSlides = currentFile.mimeType?.includes('vnd.google-apps.presentation')

        let blob: Blob

        if (isDriveFile && isGoogleSlides) {
          // Export Google Slides as PPTX
          blob = await ApiService.Drive.exportSlidesAsPptx(currentFile.file_id)
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
      const { operations, slidesData } = detail as {
        operations?: Array<{
          type: string
          slideIndex?: number
          element?: Partial<SlideElement>
          elementId?: string
          layout?: string
          background?: string
          fromIndex?: number
          toIndex?: number
          theme?: string
        }>
        slidesData?: Slide[]
      }

      // If full slides data is provided, replace slides
      if (slidesData && Array.isArray(slidesData)) {
        setSlides(slidesData)
        setHasUnsavedChanges(true)
        saveToHistory()
        return
      }

      // Apply operations
      if (operations && Array.isArray(operations)) {
        setSlides(prevSlides => {
          let newSlides = [...prevSlides]

          for (const op of operations) {
            switch (op.type) {
              case 'createSlide': {
                const newSlide: Slide = {
                  id: `slide-${Date.now()}`,
                  index: newSlides.length,
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
                  layout: (op.layout as Slide['layout']) || 'title',
                  background: op.background,
                }
                const insertIndex = op.slideIndex ?? newSlides.length
                newSlides.splice(insertIndex, 0, newSlide)
                // Update indices
                newSlides = newSlides.map((s, i) => ({ ...s, index: i }))
                break
              }

              case 'deleteSlide': {
                const deleteIndex = op.slideIndex ?? newSlides.length - 1
                if (deleteIndex >= 0 && deleteIndex < newSlides.length && newSlides.length > 1) {
                  newSlides.splice(deleteIndex, 1)
                  newSlides = newSlides.map((s, i) => ({ ...s, index: i }))
                }
                break
              }

              case 'reorderSlides': {
                if (op.fromIndex !== undefined && op.toIndex !== undefined) {
                  const [moved] = newSlides.splice(op.fromIndex, 1)
                  newSlides.splice(op.toIndex, 0, moved)
                  newSlides = newSlides.map((s, i) => ({ ...s, index: i }))
                }
                break
              }

              case 'addText':
              case 'addShape':
              case 'addImage': {
                const slideIndex = op.slideIndex ?? currentSlideIndex
                if (slideIndex >= 0 && slideIndex < newSlides.length && op.element) {
                  const newElement: SlideElement = {
                    id: `element-${Date.now()}`,
                    type: op.type === 'addText' ? 'text' : op.type === 'addShape' ? 'shape' : 'image',
                    x: op.element.x ?? 10,
                    y: op.element.y ?? 10,
                    width: op.element.width ?? 80,
                    height: op.element.height ?? 20,
                    ...op.element,
                  } as SlideElement
                  newSlides[slideIndex].elements.push(newElement)
                }
                break
              }

              case 'updateElement': {
                const slideIndex = op.slideIndex ?? currentSlideIndex
                if (slideIndex >= 0 && slideIndex < newSlides.length && op.elementId) {
                  const elementIndex = newSlides[slideIndex].elements.findIndex(e => e.id === op.elementId)
                  if (elementIndex >= 0) {
                    newSlides[slideIndex].elements[elementIndex] = {
                      ...newSlides[slideIndex].elements[elementIndex],
                      ...op.element,
                    }
                  }
                }
                break
              }

              case 'deleteElement': {
                const slideIndex = op.slideIndex ?? currentSlideIndex
                if (slideIndex >= 0 && slideIndex < newSlides.length && op.elementId) {
                  newSlides[slideIndex].elements = newSlides[slideIndex].elements.filter(
                    e => e.id !== op.elementId
                  )
                }
                break
              }

              case 'setSlideBackground': {
                const slideIndex = op.slideIndex ?? currentSlideIndex
                if (slideIndex >= 0 && slideIndex < newSlides.length) {
                  newSlides[slideIndex].background = op.background
                }
                break
              }

              case 'applyTheme': {
                // Apply theme colors to all slides
                // This is a simplified implementation
                break
              }
            }
          }

          return newSlides
        })
        setHasUnsavedChanges(true)
        saveToHistory()
      }
    }

    window.addEventListener('powerpoint-ai-response', handler as EventListener)
    return () => window.removeEventListener('powerpoint-ai-response', handler as EventListener)
  }, [currentSlideIndex, saveToHistory])

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
      const PptxGenJS = (await import('pptxgenjs')).default
      const pptx = new PptxGenJS()

      // Convert slides to PPTX
      for (const slide of slides) {
        const pptxSlide = pptx.addSlide()

        if (slide.background) {
          pptxSlide.background = { color: slide.background.replace('#', '') }
        }

        for (const element of slide.elements) {
          if (element.type === 'text') {
            pptxSlide.addText(element.content || '', {
              x: `${element.x}%`,
              y: `${element.y}%`,
              w: `${element.width}%`,
              h: `${element.height}%`,
              fontSize: element.fontSize || 18,
              fontFace: element.fontFace || 'Arial',
              color: element.color || '363636',
              bold: element.bold,
              italic: element.italic,
              align: element.align || 'left',
              valign: element.valign || 'top',
            })
          } else if (element.type === 'shape') {
            const shapeTypeMap: Record<string, string> = {
              rect: 'rect',
              'round-rect': 'roundRect',
              ellipse: 'ellipse',
              circle: 'ellipse',
              diamond: 'diamond',
              triangle: 'triangle',
              'right-triangle': 'triangle',
              hexagon: 'hexagon',
              line: 'line',
              'line-diagonal': 'line',
              'arrow-right': 'rightArrow',
              'arrow-left': 'leftArrow',
              'arrow-up': 'upArrow',
              'arrow-down': 'downArrow',
              chevron: 'chevron',
              heart: 'heart',
              cloud: 'cloud',
              'star-5': 'star5',
              'star-6': 'star6',
              'star-7': 'star7',
              'star-8': 'star8',
              'star-10': 'star10',
              'star-12': 'star12',
              'pie-half': 'pie',
              'pie-quarter': 'pie',
              'pie-three-quarter': 'pie',
              cylinder: 'can',
            }
            const pptxShape = (shapeTypeMap[element.shapeType || 'rect'] || 'rect') as any
            pptxSlide.addShape(pptxShape, {
              x: `${element.x}%`,
              y: `${element.y}%`,
              w: `${element.width}%`,
              h: `${element.height}%`,
              fill: { color: element.fill?.replace('#', '') || 'FFFFFF' },
              line: element.stroke ? { color: element.stroke.replace('#', ''), width: element.strokeWidth || 1 } : undefined,
              rotate: element.rotation || 0,
            })
            if (element.content) {
              pptxSlide.addText(element.content, {
                x: `${element.x}%`,
                y: `${element.y}%`,
                w: `${element.width}%`,
                h: `${element.height}%`,
                align: 'center',
                valign: 'middle',
                color: element.stroke?.replace('#', '') || '363636',
                fontSize: Math.max(12, (element.fontSize || 18) * 0.5),
              })
            }
          } else if (element.type === 'image' && element.imageUrl) {
            pptxSlide.addImage({
              path: element.imageUrl,
              x: `${element.x}%`,
              y: `${element.y}%`,
              w: `${element.width}%`,
              h: `${element.height}%`,
            })
          } else if (element.type === 'table' && element.cells && element.cells.length > 0) {
            const tableData: any[][] = []
            const borderColor = element.borderColor?.replace('#', '') || 'CCCCCC'
            
            for (let rowIndex = 0; rowIndex < element.cells.length; rowIndex++) {
              const row = element.cells[rowIndex]
              const rowData: any[] = []
              const isHeaderRow = element.headerRow && rowIndex === 0
              
              for (const cell of row) {
                rowData.push({
                  text: cell.content || '',
                  options: {
                    fontSize: cell.fontSize || 14,
                    fontFace: cell.fontFace || 'Arial',
                    color: cell.color || '363636',
                    bold: cell.bold || isHeaderRow,
                    italic: cell.italic,
                    align: cell.align || 'left',
                    valign: 'middle',
                  },
                })
              }
              tableData.push(rowData)
            }
            
            if (tableData.length > 0) {
              pptxSlide.addTable(tableData, {
                x: `${element.x}%`,
                y: `${element.y}%`,
                w: `${element.width}%`,
                h: `${element.height}%`,
                border: {
                  type: 'solid',
                  color: borderColor,
                  pt: element.borderWidth || 1,
                },
                fill: { color: 'FFFFFF' },
              })
            }
          }
        }
      }

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
      <div className="flex items-center justify-center h-full bg-accent">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-accent">
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
      <div className="h-full flex flex-col bg-accent">
        {/* Toolbar */}
        <PowerPointToolbar
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          currentSlide={currentSlide}
          selectedElement={selectedElement}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onUpdateSlideBackground={handleUpdateSlideBackground}
          onApplyLayout={handleApplyLayout}
          onApplyTheme={handleApplyTheme}
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
