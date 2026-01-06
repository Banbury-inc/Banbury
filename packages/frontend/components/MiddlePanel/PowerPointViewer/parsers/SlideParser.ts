import { BaseParser } from './BaseParser'
import type { ThemeColors, GradientFill, GradientStop } from '../types/pptx-types'
import { parseColor, parseAlpha } from '../utils/color-resolver'
import type { FillStyle } from '../PowerPointViewer'

/**
 * SlideParser - Parses slide-level properties
 *
 * Handles:
 * - Slide backgrounds (solid fills, gradients, images)
 * - Slide dimensions
 * - Slide layouts and masters
 */
export class SlideParser extends BaseParser {
  /**
   * Parse slide background from slide XML
   */
  public parseBackground(
    slideDoc: Document,
    themeColors?: ThemeColors
  ): {
    background?: string
    backgroundStyle?: FillStyle
    backgroundImage?: string
  } {
    try {
      // Find background element (<p:bg>)
      const bg = this.getFirstElement(slideDoc, 'p:bg')
      if (!bg) {
        return {}
      }

      // Get background properties (<p:bgPr>)
      const bgPr = this.getFirstElement(bg, 'p:bgPr')
      if (!bgPr) {
        return {}
      }

      // Check for solid fill
      const solidFill = this.getFirstElement(bgPr, 'a:solidFill')
      if (solidFill) {
        const color = parseColor(solidFill, themeColors)
        return {
          background: color,
          backgroundStyle: { kind: 'solid', color },
        }
      }

      // Check for gradient fill
      const gradFill = this.getFirstElement(bgPr, 'a:gradFill')
      if (gradFill) {
        const gradient = this.parseGradientFill(gradFill, themeColors)
        if (gradient) {
          return {
            backgroundStyle: gradient,
          }
        }
      }

      // Check for image fill
      const blipFill = this.getFirstElement(bgPr, 'a:blipFill')
      if (blipFill) {
        const blip = this.getFirstElement(blipFill, 'a:blip')
        if (blip) {
          const relationshipId = this.getAttribute(blip, 'r:embed')
          if (relationshipId) {
            return {
              backgroundImage: relationshipId, // Will be resolved later
            }
          }
        }
      }

      // Check for pattern fill
      const pattFill = this.getFirstElement(bgPr, 'a:pattFill')
      if (pattFill) {
        // For now, treat pattern fills as solid colors
        const fgClr = this.getFirstElement(pattFill, 'a:fgClr')
        if (fgClr) {
          const color = parseColor(fgClr, themeColors)
          return {
            background: color,
            backgroundStyle: { kind: 'solid', color },
          }
        }
      }

      return {}
    } catch (error) {
      this.error('Error parsing background:', error)
      return {}
    }
  }

  /**
   * Parse gradient fill
   */
  private parseGradientFill(
    gradFill: Element,
    themeColors?: ThemeColors
  ): FillStyle | null {
    try {
      // Get gradient stops
      const gsLst = this.getFirstElement(gradFill, 'a:gsLst')
      if (!gsLst) return null

      const stops = this.getElements(gsLst, 'a:gs')
      if (stops.length < 2) return null

      const gradientStops: GradientStop[] = []

      for (const stop of stops) {
        const pos = this.getAttributeNumber(stop, 'pos', 0)
        const position = pos / 1000 // PPTX uses percentage * 1000

        // Parse color
        const srgbClr = this.getFirstElement(stop, 'a:srgbClr')
        const schemeClr = this.getFirstElement(stop, 'a:schemeClr')
        const sysClr = this.getFirstElement(stop, 'a:sysClr')
        const colorElem = srgbClr || schemeClr || sysClr

        if (colorElem) {
          const color = parseColor(colorElem, themeColors)
          gradientStops.push({ position, color })
        }
      }

      if (gradientStops.length < 2) return null

      // Check if linear or radial
      const lin = this.getFirstElement(gradFill, 'a:lin')
      const path = this.getFirstElement(gradFill, 'a:path')

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
      } else if (path) {
        // Radial gradient (approximate as linear for now)
        // TODO: Properly implement radial gradients
        return {
          kind: 'linearGradient',
          startColor: gradientStops[0].color,
          endColor: gradientStops[gradientStops.length - 1].color,
          angleDeg: 90,
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
      return null
    }
  }

  /**
   * Parse slide dimensions from presentation.xml
   */
  public async parseSlideDimensions(): Promise<{
    width: number
    height: number
  } | null> {
    try {
      const doc = await this.getXml('ppt/presentation.xml')
      if (!doc) return null

      const sldSz = this.getFirstElement(doc, 'p:sldSz')
      if (!sldSz) return null

      const cx = this.getAttributeNumber(sldSz, 'cx', 9144000) // Default: 10 inches
      const cy = this.getAttributeNumber(sldSz, 'cy', 6858000) // Default: 7.5 inches

      return { width: cx, height: cy }
    } catch (error) {
      this.error('Error parsing slide dimensions:', error)
      return null
    }
  }

  /**
   * Parse slide layout reference
   */
  public parseSlideLayout(slideDoc: Document): string | null {
    try {
      const sldLayout = this.getFirstElement(slideDoc, 'p:sldLayout')
      if (!sldLayout) return null

      // Get relationship ID
      const rId = this.getAttribute(sldLayout, 'r:id')
      return rId
    } catch (error) {
      this.error('Error parsing slide layout:', error)
      return null
    }
  }

  /**
   * Check if slide has custom background
   */
  public hasCustomBackground(slideDoc: Document): boolean {
    const bg = this.getFirstElement(slideDoc, 'p:bg')
    return bg !== null
  }
}
