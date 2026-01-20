import { Slide, SlideElement } from '../PowerPointViewer'
import type { ThemeColors } from '../types/pptx-types'
import { ShapeType } from '../components/shape-catalog'

interface ParsePptxFileParams {
  blob: Blob
  toast: (props: {
    title: string
    description: string
    variant?: 'default' | 'destructive'
  }) => void
}

import { parseSlideXml } from './parse-slide-xml'

/**
 * Parse PPTX file to extract slides
 */
export async function parsePptxFile({ blob, toast }: ParsePptxFileParams): Promise<Slide[]> {
  try {
    // Performance tracking
    const { PerformanceTimer, detectGoogleSlidesExport, clearParserErrors } = await import('./parser-error-handler')
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
    const { ThemeParser } = await import('../parsers/ThemeParser')
    const { SlideParser } = await import('../parsers/SlideParser')
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
          await import('./relationship-resolver')
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
          const { ImageParser } = await import('../parsers/ImageParser')
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
              const { TableParser } = await import('../parsers/TableParser')
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
    const { getUnsupportedFeatures } = await import('./parser-error-handler')
    const unsupportedFeatures = getUnsupportedFeatures()
    if (unsupportedFeatures.length > 0) {
      // Unsupported features are tracked but not logged to console to avoid lint warnings
      // Features: unsupportedFeatures
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
