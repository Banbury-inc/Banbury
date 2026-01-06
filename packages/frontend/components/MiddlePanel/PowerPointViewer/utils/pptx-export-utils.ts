import { Slide, SlideElement, FillStyle } from '../PowerPointViewer'
import { generateGradientDataUrl, fillStyleToColorString, normalizeFill } from './fill-utils'

/**
 * Add element to pptx slide with advanced formatting support
 */
export function addElementToPptxSlide(pptxSlide: any, element: SlideElement): void {
  switch (element.type) {
    case 'text':
      // Handle text background fill
      if (element.textFill) {
        const fill = normalizeFill(element.textFill)
        if (fill) {
          if (fill.kind === 'solid') {
            // Add a background rectangle
            pptxSlide.addShape('rect', {
              x: `${element.x}%`,
              y: `${element.y}%`,
              w: `${element.width}%`,
              h: `${element.height}%`,
              fill: { color: fill.color.replace('#', '') },
              line: { type: 'none' },
            })
          } else if (fill.kind === 'linearGradient') {
            // Add gradient as image background
            const gradientImage = generateGradientDataUrl(
              fill.startColor,
              fill.endColor,
              fill.angleDeg,
              400,
              300
            )
            pptxSlide.addImage({
              data: gradientImage,
              x: `${element.x}%`,
              y: `${element.y}%`,
              w: `${element.width}%`,
              h: `${element.height}%`,
            })
          }
        }
      }

      // Handle text border
      if (element.border) {
        pptxSlide.addShape('rect', {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          fill: { type: 'none' },
          line: {
            color: element.border.color.replace('#', ''),
            width: element.border.width,
          },
        })
      }

      // Check if we have rich paragraphs from PPTX parsing
      if (element.paragraphs && element.paragraphs.length > 0) {
        // Export with full paragraph and run formatting
        const parts: Array<{ text: string; options?: any }> = []

        for (let pIdx = 0; pIdx < element.paragraphs.length; pIdx++) {
          const paragraph = element.paragraphs[pIdx]

          for (const run of paragraph.runs) {
            const runOptions: any = {}
            if (run.fontSize) runOptions.fontSize = run.fontSize
            if (run.fontFace) runOptions.fontFace = run.fontFace
            if (run.color) runOptions.color = run.color.replace('#', '')
            if (run.bold) runOptions.bold = true
            if (run.italic) runOptions.italic = true
            if (run.underline) runOptions.underline = true
            if (paragraph.alignment) runOptions.align = paragraph.alignment

            parts.push({
              text: run.text,
              options: Object.keys(runOptions).length > 0 ? runOptions : undefined
            })
          }

          // Add line break between paragraphs (except after last paragraph)
          if (pIdx < element.paragraphs.length - 1) {
            parts.push({ text: '\n' })
          }
        }

        // Add all parts as a single text box
        const textOptions: any = {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          valign: element.valign || 'top',
        }

        // Use alignment from first paragraph if no per-run alignment
        if (element.paragraphs[0]?.alignment && !parts.some(p => p.options?.align)) {
          textOptions.align = element.paragraphs[0].alignment
        }

        pptxSlide.addText(parts, textOptions)
      } else if (element.highlights && element.highlights.length > 0 && element.content) {
        // Build rich text array with highlights
        const content = element.content
        const parts: Array<{ text: string; options?: any }> = []
        let lastIndex = 0

        const sortedHighlights = [...element.highlights].sort((a, b) => a.start - b.start)

        for (const highlight of sortedHighlights) {
          // Add text before highlight
          if (highlight.start > lastIndex) {
            parts.push({ text: content.substring(lastIndex, highlight.start) })
          }
          // Add highlighted text
          parts.push({
            text: content.substring(highlight.start, highlight.end),
            options: { highlight: highlight.color.replace('#', '') }
          })
          lastIndex = highlight.end
        }

        // Add remaining text
        if (lastIndex < content.length) {
          parts.push({ text: content.substring(lastIndex) })
        }

        pptxSlide.addText(parts, {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          fontSize: element.fontSize || 18,
          fontFace: element.fontFace || 'Arial',
          color: element.color || '363636',
          bold: element.bold || false,
          italic: element.italic || false,
          align: element.align || 'left',
          valign: element.valign || 'top',
        })
      } else {
        // Regular text without highlights
        pptxSlide.addText(element.content || '', {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          fontSize: element.fontSize || 18,
          fontFace: element.fontFace || 'Arial',
          color: element.color || '363636',
          bold: element.bold || false,
          italic: element.italic || false,
          align: element.align || 'left',
          valign: element.valign || 'top',
        })
      }
      break

    case 'shape':
      const shapeTypeMap: Record<string, string> = {
        rect: 'rect',
        'round-rect': 'roundRect',
        ellipse: 'ellipse',
        circle: 'ellipse',
        triangle: 'triangle',
        'right-triangle': 'triangle',
        diamond: 'diamond',
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
      
      // Handle gradient fill
      const fill = normalizeFill(element.fill)
      if (fill && fill.kind === 'linearGradient') {
        // Add gradient as image background
        const gradientImage = generateGradientDataUrl(
          fill.startColor,
          fill.endColor,
          fill.angleDeg,
          400,
          300
        )
        pptxSlide.addImage({
          data: gradientImage,
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
        })
        // Add shape with transparent fill on top
        pptxSlide.addShape(pptxShape, {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          fill: { type: 'none' },
          line: element.stroke ? {
            color: element.stroke.replace('#', ''),
            width: element.strokeWidth || 1
          } : undefined,
          rotate: element.rotation || 0,
        })
      } else {
        // Regular solid fill
        const fillColor = fillStyleToColorString(element.fill)
        const shapeOptions: any = {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          fill: fillColor ? { color: fillColor.replace('#', '') } : undefined,
          line: element.stroke ? {
            color: element.stroke.replace('#', ''),
            width: element.strokeWidth || 1
          } : undefined,
          rotate: element.rotation || 0,
        }

        // Add shadow if present
        if (element.shadow) {
          shapeOptions.shadow = {
            type: 'outer',
            color: element.shadow.color.replace(/^#/, ''),
            blur: element.shadow.blur || 0,
            offset: Math.sqrt(
              Math.pow(element.shadow.offsetX || 0, 2) +
              Math.pow(element.shadow.offsetY || 0, 2)
            ),
            angle: Math.atan2(element.shadow.offsetY || 0, element.shadow.offsetX || 0) * (180 / Math.PI),
            opacity: element.shadow.opacity || 1,
          }
        }

        pptxSlide.addShape(pptxShape, shapeOptions)
      }
      
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
      break

    case 'image':
      if (element.imageUrl) {
        // Check if it's a data URL or external URL
        const imageOptions: any = {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
        }

        if (element.imageUrl.startsWith('data:')) {
          imageOptions.data = element.imageUrl
        } else {
          imageOptions.path = element.imageUrl
        }

        pptxSlide.addImage(imageOptions)
      }
      break

    case 'table':
      if (element.cells && element.cells.length > 0) {
        const tableData: any[][] = []
        const borderColor = element.borderColor?.replace('#', '') || 'CCCCCC'

        for (let rowIndex = 0; rowIndex < element.cells.length; rowIndex++) {
          const row = element.cells[rowIndex]
          const rowData: any[] = []
          const isHeaderRow = element.headerRow && rowIndex === 0

          for (const cell of row) {
            // Check if cell has rich paragraphs
            if (cell.paragraphs && cell.paragraphs.length > 0) {
              // Build rich text array for cell
              const parts: Array<{ text: string; options?: any }> = []

              for (let pIdx = 0; pIdx < cell.paragraphs.length; pIdx++) {
                const paragraph = cell.paragraphs[pIdx]

                for (const run of paragraph.runs) {
                  const runOptions: any = {}
                  if (run.fontSize) runOptions.fontSize = run.fontSize
                  if (run.fontFace) runOptions.fontFace = run.fontFace
                  if (run.color) runOptions.color = run.color.replace('#', '')
                  if (run.bold || isHeaderRow) runOptions.bold = true
                  if (run.italic) runOptions.italic = true
                  if (paragraph.alignment) runOptions.align = paragraph.alignment

                  parts.push({
                    text: run.text,
                    options: Object.keys(runOptions).length > 0 ? runOptions : undefined
                  })
                }

                // Add line break between paragraphs
                if (pIdx < cell.paragraphs.length - 1) {
                  parts.push({ text: '\n' })
                }
              }

              rowData.push({
                text: parts,
                options: {
                  valign: cell.valign || 'middle',
                  fill: cell.backgroundColor?.replace('#', ''),
                },
              })
            } else {
              // Regular cell without rich text
              rowData.push({
                text: cell.content || '',
                options: {
                  fontSize: cell.fontSize || 14,
                  fontFace: cell.fontFace || 'Arial',
                  color: cell.color || '363636',
                  bold: cell.bold || isHeaderRow,
                  italic: cell.italic,
                  align: cell.align || 'left',
                  valign: cell.valign || 'middle',
                  fill: cell.backgroundColor?.replace('#', ''),
                },
              })
            }
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
      break
  }
}

/**
 * Convert slides to PPTX presentation
 */
export async function slidesToPptx(slides: Slide[]): Promise<any> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()

  for (const slide of slides) {
    const pptxSlide = pptx.addSlide()

    // Handle background (image, gradient, or solid color)
    if (slide.backgroundImage) {
      // Add background image
      if (slide.backgroundImage.startsWith('data:')) {
        pptxSlide.addImage({
          data: slide.backgroundImage,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        })
      }
    } else if (slide.backgroundStyle) {
      // Handle gradient background
      const bgStyle = slide.backgroundStyle
      if (typeof bgStyle === 'object' && bgStyle.kind === 'linearGradient') {
        // Generate gradient as image
        const gradientImage = generateGradientDataUrl(
          bgStyle.startColor,
          bgStyle.endColor,
          bgStyle.angleDeg,
          960,
          540
        )
        pptxSlide.addImage({
          data: gradientImage,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        })
      }
    } else if (slide.background) {
      // Solid color background
      pptxSlide.background = { color: slide.background.replace('#', '') }
    }

    for (const element of slide.elements) {
      addElementToPptxSlide(pptxSlide, element)
    }

    if (slide.notes) {
      pptxSlide.addNotes(slide.notes)
    }
  }

  return pptx
}

