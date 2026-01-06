import { BaseParser } from './BaseParser'
import { emuToPercent } from '../utils/emu-converter'
import { parseColor } from '../utils/color-resolver'
import type { ThemeColors, Shadow, GradientFill, StrokeStyle } from '../types/pptx-types'
import type { SlideElement, FillStyle } from '../PowerPointViewer'
import { mapDashPattern, mapLineCap, mapLineJoin, mapCompoundLine, mapStrokeAlignment } from '../utils/stroke-utils'

/**
 * Comprehensive mapping from PPTX preset geometry to app ShapeType
 * Based on Office Open XML ECMA-376 standard
 */
const PPTX_TO_APP_SHAPE_MAP: Record<string, string> = {
  // Basic shapes
  'rect': 'rect',
  'rectangle': 'rect',
  'roundRect': 'round-rect',
  'ellipse': 'ellipse',
  'circle': 'circle',

  // Triangles
  'triangle': 'triangle',
  'rtTriangle': 'right-triangle',

  // Polygons
  'diamond': 'diamond',
  'pentagon': 'pentagon',
  'hexagon': 'hexagon',
  'octagon': 'octagon',
  'decagon': 'decagon',
  'dodecagon': 'dodecagon',

  // Directional arrows (CRITICAL FIX)
  'rightArrow': 'arrow-right',
  'leftArrow': 'arrow-left',
  'upArrow': 'arrow-up',
  'downArrow': 'arrow-down',
  'leftRightArrow': 'double-arrow',
  'upDownArrow': 'double-arrow',
  'bentArrow': 'bent-arrow',
  'bentUpArrow': 'bent-arrow',
  'curvedRightArrow': 'curved-arrow',
  'curvedLeftArrow': 'curved-arrow',
  'curvedUpArrow': 'curved-arrow',
  'curvedDownArrow': 'curved-arrow',

  // Arrow callouts → closest arrow type
  'rightArrowCallout': 'arrow-right',
  'leftArrowCallout': 'arrow-left',
  'upArrowCallout': 'arrow-up',
  'downArrowCallout': 'arrow-down',

  // Parallelograms and trapezoids
  'parallelogram': 'parallelogram-right',
  'trapezoid': 'trapezoid',
  'chevron': 'chevron',

  // Stars (CRITICAL FIX)
  'star4': 'star-4',
  'star5': 'star-5',
  'star6': 'star-6',
  'star7': 'star-7',
  'star8': 'star-8',
  'star10': 'star-10',
  'star12': 'star-12',
  'star16': 'star-12',  // Fallback
  'star24': 'star-12',  // Fallback

  // Decorative
  'heart': 'heart',
  'smileyFace': 'smiley',
  'lightningBolt': 'lightning',
  'sun': 'sun',
  'moon': 'moon',
  'cloud': 'cloud',
  'cloudCallout': 'cloud',

  // Pie and donut
  'donut': 'donut',
  'pie': 'pie-quarter',
  'pieWedge': 'pie-quarter',
  'arc': 'donut',
  'chord': 'pie-quarter',
  'blockArc': 'donut',

  // 3D shapes
  'cylinder': 'cylinder',
  'can': 'cylinder',
  'cube': 'cube',

  // Frames
  'frame': 'frame',
  'halfFrame': 'frame',
  'plaque': 'plaque',
  'foldedCorner': 'folded-corner',

  // Brackets
  'leftBracket': 'bracket-left',
  'rightBracket': 'bracket-right',
  'leftBrace': 'bracket-left',
  'rightBrace': 'bracket-right',
  'bracketPair': 'bracket-left',
  'bracePair': 'bracket-left',

  // Callouts
  'callout1': 'callout',
  'callout2': 'callout',
  'callout3': 'callout',
  'accentCallout1': 'callout',
  'accentCallout2': 'callout',
  'accentCallout3': 'callout',
  'borderCallout1': 'callout',
  'borderCallout2': 'callout',
  'borderCallout3': 'callout',
  'wedgeRectCallout': 'callout',
  'wedgeRRectCallout': 'callout',
  'wedgeEllipseCallout': 'callout',

  // Lines and plus
  'line': 'line',
  'straightConnector1': 'line',
  'plus': 'plus',
  'mathPlus': 'plus',
  'cross': 'cross',

  // Snipped rectangles
  'snip1Rectangle': 'snip-top-right',
  'snip2SameRectangle': 'snip-top-both',
  'snip2DiagonalRectangle': 'snip-top-both',
  'snipRoundRectangle': 'snip-top-right',

  // Rounded rectangles (variants)
  'round1Rectangle': 'round-rect',
  'round2SameRectangle': 'round-rect',
  'round2DiagonalRectangle': 'round-rect',

  // Flowchart shapes → basic shapes
  'flowChartProcess': 'rect',
  'flowChartDecision': 'diamond',
  'flowChartInputOutput': 'parallelogram-right',
  'flowChartPredefinedProcess': 'rect',
  'flowChartInternalStorage': 'rect',
  'flowChartDocument': 'rect',
  'flowChartMultidocument': 'rect',
  'flowChartTerminator': 'round-rect',
  'flowChartPreparation': 'hexagon',
  'flowChartManualInput': 'trapezoid',
  'flowChartManualOperation': 'trapezoid',
  'flowChartConnector': 'circle',
  'flowChartOffpageConnector': 'pentagon',
  'flowChartPunchedCard': 'rect',
  'flowChartPunchedTape': 'rect',
  'flowChartSummingJunction': 'circle',
  'flowChartOr': 'circle',
  'flowChartCollate': 'triangle',
  'flowChartSort': 'diamond',
  'flowChartExtract': 'triangle',
  'flowChartMerge': 'triangle',
  'flowChartOnlineStorage': 'cylinder',
  'flowChartDelay': 'round-rect',
  'flowChartMagneticDisk': 'cylinder',
  'flowChartMagneticDrum': 'cylinder',
  'flowChartDisplay': 'round-rect',
  'flowChartAlternateProcess': 'round-rect',

  // Action buttons → round rect
  'actionButtonBlank': 'round-rect',
  'actionButtonHome': 'round-rect',
  'actionButtonHelp': 'round-rect',
  'actionButtonInformation': 'round-rect',
  'actionButtonForwardNext': 'round-rect',
  'actionButtonBackPrevious': 'round-rect',
  'actionButtonEnd': 'round-rect',
  'actionButtonBeginning': 'round-rect',
  'actionButtonReturn': 'round-rect',
  'actionButtonDocument': 'round-rect',
  'actionButtonSound': 'round-rect',
  'actionButtonMovie': 'round-rect',

  // Special shapes → closest match
  'teardrop': 'ellipse',
  'homePlate': 'pentagon',
  'corner': 'right-triangle',
  'diagStripe': 'parallelogram-right',
  'diagonalStripe': 'parallelogram-right',
  'funnel': 'trapezoid',
  'gear6': 'hexagon',
  'gear9': 'octagon',
  'heptagon': 'hexagon',
  'irregularSeal1': 'star-8',
  'irregularSeal2': 'star-10',
  'ribbon': 'rect',
  'ribbon2': 'rect',
  'ellipseRibbon': 'ellipse',
  'ellipseRibbon2': 'ellipse',
  'leftRightRibbon': 'rect',
  'verticalScroll': 'round-rect',
  'horizontalScroll': 'round-rect',
  'wave': 'round-rect',
  'doubleWave': 'round-rect',
  'bevel': 'octagon',

  // Math symbols
  'mathEqual': 'line',
  'mathMinus': 'line',
  'mathMultiply': 'x-mark',
  'mathDivide': 'line',
  'mathNotEqual': 'line',

  // Special arrow types
  'notchedRightArrow': 'arrow-right',
  'stripedRightArrow': 'arrow-right',
  'quadArrow': 'double-arrow',
  'leftUpArrow': 'bent-arrow',
  'leftRightUpArrow': 'double-arrow',
  'uturnArrow': 'curved-arrow',
  'circularArrow': 'curved-arrow',
  'leftCircularArrow': 'curved-arrow',
  'swooshArrow': 'curved-arrow',

  // Other
  'noSmoking': 'no-symbol',
}

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
    stroke?: string | StrokeStyle
    strokeWidth?: number
    shadow?: Shadow
  } {
    const result: {
      fill?: string | FillStyle
      stroke?: string | StrokeStyle
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
      if (strokeInfo) {
        result.stroke = strokeInfo
        result.strokeWidth = strokeInfo.width
      }
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
   * Parse stroke/line with comprehensive PPTX stroke properties
   */
  private parseStroke(
    ln: Element,
    themeColors?: ThemeColors
  ): StrokeStyle | undefined {
    if (!ln) return undefined

    // Check for no fill first
    const noFill = this.getFirstElement(ln, 'a:noFill')
    if (noFill) {
      return undefined // No stroke
    }

    // Get width (in EMUs)
    const w = this.getAttributeNumber(ln, 'w', 12700) // Default: 1pt = 12700 EMUs
    const widthPt = w / 12700 // Convert to points

    // Get color
    const solidFill = this.getFirstElement(ln, 'a:solidFill')
    let color = '#000000'
    let alpha: number | undefined

    if (solidFill) {
      color = parseColor(solidFill, themeColors)

      // Check for alpha modifier
      const alphaElem = this.getFirstElement(solidFill, 'a:alpha')
      if (alphaElem) {
        const alphaVal = this.getAttributeNumber(alphaElem, 'val', 100000)
        alpha = alphaVal / 100000 // Convert to 0-1 range
      }
    }

    const result: StrokeStyle = {
      color,
      width: widthPt,
    }

    // Add alpha if present
    if (alpha !== undefined) {
      result.alpha = alpha
    }

    // Parse dash pattern
    const prstDash = this.getFirstElement(ln, 'a:prstDash')
    if (prstDash) {
      const val = this.getAttribute(prstDash, 'val')
      result.dashPattern = mapDashPattern(val)
    }

    // Parse line cap
    const cap = this.getAttribute(ln, 'cap')
    if (cap) {
      result.lineCap = mapLineCap(cap)
    }

    // Parse line join
    const join = this.getAttribute(ln, 'algn')
    if (join) {
      result.lineJoin = mapLineJoin(join)
    }

    // Parse compound type
    const cmpd = this.getAttribute(ln, 'cmpd')
    if (cmpd) {
      result.compound = mapCompoundLine(cmpd)
    }

    // Parse alignment
    const algn = this.getAttribute(ln, 'algn')
    if (algn) {
      result.alignment = mapStrokeAlignment(algn)
    }

    return result
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
   * Uses the comprehensive PPTX_TO_APP_SHAPE_MAP constant defined at the top of this file
   */
  public mapShapeType(pptxShapeType: string | undefined): string {
    if (!pptxShapeType) return 'rect'

    if (pptxShapeType === 'custom') {
      console.warn('Custom geometry shape detected, defaulting to rect')
      return 'rect'
    }

    const mappedType = PPTX_TO_APP_SHAPE_MAP[pptxShapeType]

    if (!mappedType) {
      console.warn(`Unmapped PPTX shape type: ${pptxShapeType}, defaulting to rect`)
      return 'rect'
    }

    return mappedType
  }
}
