import { BaseParser } from './BaseParser'
import { emuToPercent } from '../utils/emu-converter'
import { parseColor } from '../utils/color-resolver'
import type { ThemeColors, Shadow, GradientFill } from '../types/pptx-types'
import type { SlideElement, FillStyle } from '../PowerPointViewer'

/**
 * ShapeParser - Parses shape elements with fills, strokes, shadows, and effects
 *
 * Handles:
 * - Shape geometry (<a:prstGeom>)
 * - Fills (solid, gradient)
 * - Strokes (color, width, dash patterns)
 * - Shadows (<a:outerShdw>, <a:innerShdw>)
 * - Effects and transformations
 */
export class ShapeParser extends BaseParser {
  /**
   * Parse shape fill and stroke from shape properties
   */
  public parseShapeFormatting(
    spPr: Element | null,
    themeColors?: ThemeColors
  ): {
    fill?: string | FillStyle
    stroke?: string
    strokeWidth?: number
    shadow?: Shadow
  } {
    const result: {
      fill?: string | FillStyle
      stroke?: string
      strokeWidth?: number
      shadow?: Shadow
    } = {}

    if (!spPr) return result

    // Parse fill
    result.fill = this.parseShapeFill(spPr, themeColors)

    // Parse stroke/line
    const ln = this.getFirstElement(spPr, 'a:ln')
    if (ln) {
      const strokeInfo = this.parseStroke(ln, themeColors)
      result.stroke = strokeInfo.color
      result.strokeWidth = strokeInfo.width
    }

    // Parse shadow
    const effectLst = this.getFirstElement(spPr, 'a:effectLst')
    if (effectLst) {
      result.shadow = this.parseShadow(effectLst, themeColors)
    }

    return result
  }

  /**
   * Parse shape fill (solid, gradient, pattern, image)
   */
  private parseShapeFill(
    spPr: Element,
    themeColors?: ThemeColors
  ): string | FillStyle | undefined {
    // Check for solid fill
    const solidFill = this.getFirstElement(spPr, 'a:solidFill')
    if (solidFill) {
      const color = parseColor(solidFill, themeColors)
      return color
    }

    // Check for gradient fill
    const gradFill = this.getFirstElement(spPr, 'a:gradFill')
    if (gradFill) {
      return this.parseGradientFill(gradFill, themeColors)
    }

    // Check for no fill
    const noFill = this.getFirstElement(spPr, 'a:noFill')
    if (noFill) {
      return 'transparent'
    }

    // Check for pattern fill
    const pattFill = this.getFirstElement(spPr, 'a:pattFill')
    if (pattFill) {
      // For now, treat pattern fills as solid colors (foreground color)
      const fgClr = this.getFirstElement(pattFill, 'a:fgClr')
      if (fgClr) {
        return parseColor(fgClr, themeColors)
      }
    }

    // No explicit fill found, return undefined (will use default)
    return undefined
  }

  /**
   * Parse gradient fill
   */
  private parseGradientFill(
    gradFill: Element,
    themeColors?: ThemeColors
  ): FillStyle | undefined {
    try {
      // Get gradient stops
      const gsLst = this.getFirstElement(gradFill, 'a:gsLst')
      if (!gsLst) return undefined

      const stops = this.getElements(gsLst, 'a:gs')
      if (stops.length < 2) return undefined

      const gradientStops: Array<{ position: number; color: string }> = []

      for (const stop of stops) {
        const pos = this.getAttributeNumber(stop, 'pos', 0)
        const position = pos / 100000 // PPTX uses percentage * 1000

        // Get color from stop
        let color = '#000000'
        const srgbClr = this.getFirstElement(stop, 'a:srgbClr')
        const schemeClr = this.getFirstElement(stop, 'a:schemeClr')
        const sysClr = this.getFirstElement(stop, 'a:sysClr')

        if (srgbClr || schemeClr || sysClr) {
          color = parseColor(stop, themeColors)
        }

        gradientStops.push({ position, color })
      }

      if (gradientStops.length < 2) return undefined

      // Check if linear or radial
      const lin = this.getFirstElement(gradFill, 'a:lin')

      if (lin) {
        // Linear gradient
        const ang = this.getAttributeNumber(lin, 'ang', 0)
        const angleDeg = ang / 60000 // PPTX uses 1/60000 degrees

        return {
          kind: 'linearGradient',
          startColor: gradientStops[0].color,
          endColor: gradientStops[gradientStops.length - 1].color,
          angleDeg,
        }
      }

      // Default to linear gradient
      return {
        kind: 'linearGradient',
        startColor: gradientStops[0].color,
        endColor: gradientStops[gradientStops.length - 1].color,
        angleDeg: 0,
      }
    } catch (error) {
      this.error('Error parsing gradient fill:', error)
      return undefined
    }
  }

  /**
   * Parse stroke/line
   */
  private parseStroke(
    ln: Element,
    themeColors?: ThemeColors
  ): { color: string; width: number } {
    // Get width (in EMUs)
    const w = this.getAttributeNumber(ln, 'w', 12700) // Default: 1pt = 12700 EMUs
    const widthPt = w / 12700 // Convert to points

    // Get color
    const solidFill = this.getFirstElement(ln, 'a:solidFill')
    let color = '#000000'

    if (solidFill) {
      color = parseColor(solidFill, themeColors)
    } else {
      // Check for no fill
      const noFill = this.getFirstElement(ln, 'a:noFill')
      if (noFill) {
        color = 'transparent'
      }
    }

    return { color, width: widthPt }
  }

  /**
   * Parse shadow effects
   */
  private parseShadow(
    effectLst: Element,
    themeColors?: ThemeColors
  ): Shadow | undefined {
    try {
      // Parse outer shadow
      const outerShdw = this.getFirstElement(effectLst, 'a:outerShdw')
      if (outerShdw) {
        return this.parseOuterShadow(outerShdw, themeColors)
      }

      // Parse inner shadow (treat similarly to outer)
      const innerShdw = this.getFirstElement(effectLst, 'a:innerShdw')
      if (innerShdw) {
        return this.parseOuterShadow(innerShdw, themeColors)
      }

      return undefined
    } catch (error) {
      this.error('Error parsing shadow:', error)
      return undefined
    }
  }

  /**
   * Parse outer shadow
   */
  private parseOuterShadow(
    outerShdw: Element,
    themeColors?: ThemeColors
  ): Shadow {
    // Get blur radius
    const blurRad = this.getAttributeNumber(outerShdw, 'blurRad', 0)
    const blur = blurRad / 12700 // Convert EMUs to points (approx pixels)

    // Get distance (offset)
    const dist = this.getAttributeNumber(outerShdw, 'dist', 0)
    const distance = dist / 12700 // Convert EMUs to points

    // Get angle/direction
    const dir = this.getAttributeNumber(outerShdw, 'dir', 0)
    const angle = dir / 60000 // Convert to degrees

    // Calculate X and Y offsets from angle and distance
    const angleRad = (angle * Math.PI) / 180
    const offsetX = Math.cos(angleRad) * distance
    const offsetY = Math.sin(angleRad) * distance

    // Get color
    let color = 'rgba(0, 0, 0, 0.5)'
    const srgbClr = this.getFirstElement(outerShdw, 'a:srgbClr')
    const schemeClr = this.getFirstElement(outerShdw, 'a:schemeClr')
    const prstClr = this.getFirstElement(outerShdw, 'a:prstClr')

    if (srgbClr || schemeClr || prstClr) {
      const baseColor = parseColor(outerShdw, themeColors)

      // Get alpha/opacity
      let alpha = 1.0
      const alphaElem = this.getFirstElement(outerShdw, 'a:alpha')
      if (alphaElem) {
        const alphaVal = this.getAttributeNumber(alphaElem, 'val', 100000)
        alpha = alphaVal / 100000
      }

      // Convert hex color to rgba
      const rgb = this.hexToRgb(baseColor)
      if (rgb) {
        color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
      }
    }

    return {
      color,
      blur: Math.max(0, blur),
      offsetX,
      offsetY,
      opacity: 1, // Opacity is already in the color
    }
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  /**
   * Parse shape geometry type
   */
  public parseShapeGeometry(spPr: Element | null): string | undefined {
    if (!spPr) return undefined

    const prstGeom = this.getFirstElement(spPr, 'a:prstGeom')
    if (prstGeom) {
      const prst = this.getAttribute(prstGeom, 'prst')
      return prst || undefined
    }

    // Check for custom geometry
    const custGeom = this.getFirstElement(spPr, 'a:custGeom')
    if (custGeom) {
      return 'custom'
    }

    return undefined
  }

  /**
   * Map PPTX shape types to our shape catalog types
   */
  public mapShapeType(pptxShapeType: string | undefined): string {
    if (!pptxShapeType) return 'rect'

    // Map common PPTX shape types to our shape catalog
    const shapeMap: Record<string, string> = {
      'rect': 'rect',
      'ellipse': 'ellipse',
      'roundRect': 'roundRect',
      'triangle': 'triangle',
      'rtTriangle': 'triangle',
      'diamond': 'diamond',
      'pentagon': 'pentagon',
      'hexagon': 'hexagon',
      'octagon': 'octagon',
      'star5': 'star',
      'star6': 'star',
      'star': 'star',
      'leftArrow': 'arrow',
      'rightArrow': 'arrow',
      'upArrow': 'arrow',
      'downArrow': 'arrow',
      'line': 'line',
      'plus': 'plus',
      'heart': 'heart',
      'moon': 'moon',
      'cloud': 'cloud',
      'sun': 'sun',
      'smileyFace': 'smileyFace',
    }

    return shapeMap[pptxShapeType] || 'rect'
  }
}
