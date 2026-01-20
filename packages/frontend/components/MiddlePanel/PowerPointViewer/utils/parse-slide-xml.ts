import { SlideElement } from '../PowerPointViewer'
import type { ThemeColors } from '../types/pptx-types'
import { ShapeType } from '../components/shape-catalog'

/**
 * Parse slide XML to extract elements (text, shapes)
 */
export async function parseSlideXml(xml: string, zip: any, themeColors?: ThemeColors | null): Promise<SlideElement[]> {
  const elements: SlideElement[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  // Import parsers dynamically
  const { TextParser } = await import('../parsers/TextParser')
  const { ShapeParser } = await import('../parsers/ShapeParser')
  const { emuToPercent } = await import('./emu-converter')
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
