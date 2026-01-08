import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { SlidePanel } from './SlidePanel'
import { SlideCanvas } from './SlideCanvas'
import { PowerPointToolbar } from './PowerPointToolbar'
import { SlideshowPresenter } from './SlideshowPresenter'
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../ui/resizable'
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
import type { Paragraph, ThemeColors, Shadow, BorderStyle, StrokeStyle } from './types/pptx-types'

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
      // Performance tracking
      const { PerformanceTimer, detectGoogleSlidesExport, clearParserErrors } = await import('./utils/parser-error-handler')
      const timer = new PerformanceTimer()

      // Clear previous errors
      clearParserErrors()

      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(blob)
      timer.mark('zip-loaded')

      // Detect Google Slides export
      const isGoogleSlides = detectGoogleSlidesExport(zip)

      const slides: Slide[] = []

      // Parse theme first
      const { ThemeParser } = await import('./parsers/ThemeParser')
      const { SlideParser } = await import('./parsers/SlideParser')
      const themeParser = new ThemeParser(zip)
      const slideParser = new SlideParser(zip)

      let themeColors: any = null
      try {
        const themeResult = await themeParser.parseTheme()
        themeColors = themeResult.colors
      } catch (error) {
        console.warn('[PowerPointViewer] Failed to parse theme, using defaults:', error)
        // Continue without theme - will use fallback colors
      }
      timer.mark('theme-parsed')

      // Find all slide XML files
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
          return numA - numB
        })

      for (let i = 0; i < slideFiles.length; i++) {
        try {
          const slideFile = slideFiles[i]
          const slideXml = await zip.file(slideFile)?.async('string')

          if (!slideXml) {
            console.warn(`[PowerPointViewer] Slide ${i + 1} XML not found`)
            continue
          }

          // Parse slide XML document
          const parser = new DOMParser()
          const slideDoc = parser.parseFromString(slideXml, 'application/xml')

          // Validate XML
          const parserError = slideDoc.querySelector('parsererror')
          if (parserError) {
            console.error(`[PowerPointViewer] XML parsing error in slide ${i + 1}:`, parserError.textContent)
            continue
          }

          // Parse relationships for this slide
          const { parseRelationships, getSlideRelationshipsPath, resolveRelationshipPath, extractImageAsBase64 } =
            await import('./utils/relationship-resolver')
          const relsPath = getSlideRelationshipsPath(i)
          const relationships = await parseRelationships(zip, relsPath)

          // Parse elements (text and shapes) with error handling
          let elements: any[] = []
          try {
            elements = await parseSlideXml(slideXml, zip, themeColors)
          } catch (error) {
            console.error(`[PowerPointViewer] Error parsing slide ${i + 1} elements:`, error)
            // Continue with empty elements rather than failing entire presentation
          }

          // Parse images with error handling
          try {
            const { ImageParser } = await import('./parsers/ImageParser')
            const imageParser = new ImageParser(zip)
            const spTree = slideDoc.getElementsByTagName('p:spTree')[0]
            if (spTree) {
              const imageResults = imageParser.parseImages(spTree, `slide${i + 1}-image`)

              // Resolve images and extract as base64
              for (const { element, relationshipId } of imageResults) {
                try {
                  const imagePath = resolveRelationshipPath(relationshipId, relationships, 'ppt/slides')
                  if (imagePath) {
                    const imageData = await extractImageAsBase64(zip, imagePath)
                    if (imageData) {
                      elements.push({
                        ...element,
                        imageUrl: imageData,
                      })
                    }
                  }
                } catch (error) {
                  console.warn(`[PowerPointViewer] Failed to extract image ${relationshipId}:`, error)
                  // Continue without this image
                }
              }

              // Parse tables with error handling
              try {
                const { TableParser } = await import('./parsers/TableParser')
                const tableParser = new TableParser(zip)
                const tables = tableParser.parseTables(spTree, themeColors || undefined, `slide${i + 1}-table`)

                // Add tables to elements
                elements.push(...tables)
              } catch (error) {
                console.warn(`[PowerPointViewer] Failed to parse tables in slide ${i + 1}:`, error)
                // Continue without tables
              }
            }
          } catch (error) {
            console.warn(`[PowerPointViewer] Failed to parse images/tables in slide ${i + 1}:`, error)
            // Continue without images/tables
          }

          // Parse background with error handling
          let backgroundInfo: any = {}
          try {
            backgroundInfo = slideParser.parseBackground(slideDoc, themeColors)

            // If background has a relationship ID (image), resolve it
            if (backgroundInfo.backgroundImage && relationships.has(backgroundInfo.backgroundImage)) {
              try {
                const bgImagePath = resolveRelationshipPath(backgroundInfo.backgroundImage, relationships, 'ppt/slides')
                if (bgImagePath) {
                  const bgImageData = await extractImageAsBase64(zip, bgImagePath)
                  if (bgImageData) {
                    backgroundInfo.backgroundImage = bgImageData
                  }
                }
              } catch (error) {
                console.warn(`[PowerPointViewer] Failed to extract background image for slide ${i + 1}:`, error)
                // Continue without background image
                delete backgroundInfo.backgroundImage
              }
            }
          } catch (error) {
            console.warn(`[PowerPointViewer] Failed to parse background for slide ${i + 1}:`, error)
            // Continue with default background
          }

          slides.push({
            id: `slide-${i + 1}`,
            index: i,
            elements,
            layout: 'content',
            themeColors: themeColors || undefined,
            ...backgroundInfo,
          })
        } catch (error) {
          console.error(`[PowerPointViewer] Failed to parse slide ${i + 1}:`, error)
          // Add a placeholder slide to maintain slide count
          slides.push({
            id: `slide-${i + 1}`,
            index: i,
            elements: [{
              id: 'error-text',
              type: 'text',
              x: 10,
              y: 40,
              width: 80,
              height: 20,
              content: `Error loading slide ${i + 1}`,
              fontSize: 24,
              fontFace: 'Arial',
              color: 'FF0000',
              align: 'center',
              valign: 'middle',
            }],
            layout: 'blank',
          })
        }
      }

      timer.mark('slides-parsed')

      // If no slides found, create a default empty slide
      if (slides.length === 0) {
        console.warn('[PowerPointViewer] No slides found in PPTX, creating default slide')
        slides.push({
          id: 'slide-1',
          index: 0,
          elements: [],
          layout: 'blank',
        })
      }

      // Log performance metrics
      timer.log('Total PPTX parsing')
      timer.log('ZIP loading', 'zip-loaded')
      timer.log('Theme parsing', 'theme-parsed')
      timer.log('Slides parsing', 'slides-parsed')

      // Log unsupported features if any
      const { getUnsupportedFeatures } = await import('./utils/parser-error-handler')
      const unsupportedFeatures = getUnsupportedFeatures()
      if (unsupportedFeatures.length > 0) {
        console.info('[PowerPointViewer] Unsupported features encountered:', unsupportedFeatures)
      }

      return slides
    } catch (err) {
      console.error('[PowerPointViewer] Critical error parsing PPTX:', err)
      toast({
        title: 'Error loading presentation',
        description: 'Some features may not display correctly.',
        variant: 'destructive',
      })

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
          content: 'Error loading presentation',
          fontSize: 32,
          fontFace: 'Arial',
          color: 'FF0000',
          bold: true,
          align: 'center',
          valign: 'middle',
        }],
        layout: 'title',
      }]
    }
  }

  // Parse slide XML to extract elements with full formatting
  const parseSlideXml = async (xml: string, zip: any, themeColors?: ThemeColors | null): Promise<SlideElement[]> => {
    const elements: SlideElement[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    // Import parsers dynamically
    const { TextParser } = await import('./parsers/TextParser')
    const { ShapeParser } = await import('./parsers/ShapeParser')
    const { emuToPercent } = await import('./utils/emu-converter')
    const textParser = new TextParser(zip)
    const shapeParser = new ShapeParser(zip)

    // Find all shapes in <p:spTree> (shape tree)
    const spTree = doc.getElementsByTagName('p:spTree')[0]
    if (!spTree) {
      // Fallback to old method if no spTree found
      return []
    }

    // Get all shape elements (<p:sp>)
    const shapes = spTree.getElementsByTagName('p:sp')

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i]

      try {
        // Parse transform (position and size)
        const spPr = shape.getElementsByTagName('p:spPr')[0]
        if (!spPr) continue

        const xfrm = spPr.getElementsByTagName('a:xfrm')[0]
        if (!xfrm) continue

        const off = xfrm.getElementsByTagName('a:off')[0]
        const ext = xfrm.getElementsByTagName('a:ext')[0]
        if (!off || !ext) continue

        // Get position and size in EMUs
        const xEmu = parseInt(off.getAttribute('x') || '0')
        const yEmu = parseInt(off.getAttribute('y') || '0')
        const cxEmu = parseInt(ext.getAttribute('cx') || '0')
        const cyEmu = parseInt(ext.getAttribute('cy') || '0')

        // Convert to percentages
        const x = emuToPercent(xEmu, true)
        const y = emuToPercent(yEmu, false)
        const width = emuToPercent(cxEmu, true)
        const height = emuToPercent(cyEmu, false)

        // Get rotation
        const rot = parseInt(xfrm.getAttribute('rot') || '0')
        const rotation = rot !== 0 ? rot / 60000 : undefined

        // Parse shape formatting (fill, stroke, shadow)
        const shapeFormatting = shapeParser.parseShapeFormatting(spPr, themeColors || undefined)

        // Parse text body (if present)
        const txBody = shape.getElementsByTagName('p:txBody')[0]

        if (txBody) {
          // This is a text box or shape with text
          const paragraphs = textParser.parseTextBody(txBody, themeColors || undefined)

          if (paragraphs.length > 0) {
            // Extract plain text for backward compatibility
            const content = textParser.extractPlainText(paragraphs)

            // Get default formatting from first run
            const fontSize = textParser.getDefaultFontSize(paragraphs)
            const fontFace = textParser.getDefaultFontFace(paragraphs)
            const firstRun = paragraphs[0]?.runs[0]
            const color = firstRun?.color?.replace('#', '') || '363636'
            const bold = firstRun?.bold || false
            const italic = firstRun?.italic || false

            // Get paragraph alignment
            const align = paragraphs[0]?.alignment || 'left'

            elements.push({
              id: `text-${i + 1}`,
              type: 'text',
              x,
              y,
              width,
              height,
              content,
              paragraphs, // Rich text paragraphs
              fontSize,
              fontFace,
              color,
              bold,
              italic,
              align,
              valign: 'top',
              rotation,
              // Include shape formatting for text boxes
              fill: shapeFormatting.fill,
              stroke: typeof shapeFormatting.stroke === 'string' ? shapeFormatting.stroke : shapeFormatting.stroke?.color,
              strokeWidth: shapeFormatting.strokeWidth,
              border: typeof shapeFormatting.stroke === 'object' ? shapeFormatting.stroke : undefined,
              shadow: shapeFormatting.shadow,
            })
          } else {
            // Handle empty text body as shape (Google Slides exports these)
            const shapeGeometry = shapeParser.parseShapeGeometry(spPr)
            const shapeType = shapeParser.mapShapeType(shapeGeometry)

            elements.push({
              id: `shape-${i + 1}`,
              type: 'shape',
              x,
              y,
              width,
              height,
              rotation,
              shapeType: shapeType as ShapeType,
              fill: shapeFormatting.fill,
              stroke: typeof shapeFormatting.stroke === 'string' ? shapeFormatting.stroke : shapeFormatting.stroke?.color,
              strokeWidth: shapeFormatting.strokeWidth,
              border: typeof shapeFormatting.stroke === 'object' ? shapeFormatting.stroke : undefined,
              shadow: shapeFormatting.shadow,
            })
          }
        } else {
          // This is a shape without text
          const shapeGeometry = shapeParser.parseShapeGeometry(spPr)
          const shapeType = shapeParser.mapShapeType(shapeGeometry)

          elements.push({
            id: `shape-${i + 1}`,
            type: 'shape',
            x,
            y,
            width,
            height,
            rotation,
            shapeType: shapeType as ShapeType,
            fill: shapeFormatting.fill,
            stroke: typeof shapeFormatting.stroke === 'string' ? shapeFormatting.stroke : shapeFormatting.stroke?.color,
            strokeWidth: shapeFormatting.strokeWidth,
            border: typeof shapeFormatting.stroke === 'object' ? shapeFormatting.stroke : undefined,
            shadow: shapeFormatting.shadow,
          })
        }
      } catch (err) {
        console.error(`Error parsing shape ${i}:`, err)
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
        const parsedSlides = await parsePptxFile(result.blob)

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

    window.addEventListener('powerpoint-file-generated', handler as EventListener)
    return () => {
      window.removeEventListener('powerpoint-file-generated', handler as EventListener)
    }
  }, [])

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
      const { applyThemeToSlideSync } = await import('./handlers/handle-apply-theme')
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
              onDeleteSlide={handleDeleteSlideByIndex}
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

