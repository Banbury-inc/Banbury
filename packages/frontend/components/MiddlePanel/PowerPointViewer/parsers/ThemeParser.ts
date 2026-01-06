import { BaseParser } from './BaseParser'
import type { ThemeColors, FontScheme } from '../types/pptx-types'
import { SYSTEM_COLOR_MAP } from '../types/pptx-types'

/**
 * ThemeParser - Parses PPTX theme files to extract color schemes and fonts
 *
 * Handles:
 * - Color scheme extraction from ppt/theme/theme1.xml
 * - Font scheme extraction
 * - System color mapping
 * - Theme color resolution
 */
export class ThemeParser extends BaseParser {
  /**
   * Parse theme file and extract colors and fonts
   */
  public async parseTheme(themeFile: string = 'ppt/theme/theme1.xml'): Promise<{
    colors: ThemeColors | null
    fonts: FontScheme | null
  }> {
    const doc = await this.getXml(themeFile)
    if (!doc) {
      this.warn(`Theme file not found: ${themeFile}`)
      return { colors: null, fonts: null }
    }

    const colors = this.parseColorScheme(doc)
    const fonts = this.parseFontScheme(doc)

    return { colors, fonts }
  }

  /**
   * Parse color scheme from theme
   */
  private parseColorScheme(doc: Document): ThemeColors | null {
    try {
      const colorScheme = this.getFirstElement(doc, 'a:clrScheme')
      if (!colorScheme) {
        this.warn('No color scheme found in theme')
        return null
      }

      const colors: ThemeColors = {
        dk1: this.parseColorElement(colorScheme, 'a:dk1') || '#000000',
        lt1: this.parseColorElement(colorScheme, 'a:lt1') || '#FFFFFF',
        dk2: this.parseColorElement(colorScheme, 'a:dk2') || '#44546A',
        lt2: this.parseColorElement(colorScheme, 'a:lt2') || '#E7E6E6',
        accent1: this.parseColorElement(colorScheme, 'a:accent1') || '#4472C4',
        accent2: this.parseColorElement(colorScheme, 'a:accent2') || '#ED7D31',
        accent3: this.parseColorElement(colorScheme, 'a:accent3') || '#A5A5A5',
        accent4: this.parseColorElement(colorScheme, 'a:accent4') || '#FFC000',
        accent5: this.parseColorElement(colorScheme, 'a:accent5') || '#5B9BD5',
        accent6: this.parseColorElement(colorScheme, 'a:accent6') || '#70AD47',
        hyperlink: this.parseColorElement(colorScheme, 'a:hlink') || '#0563C1',
        followedHyperlink: this.parseColorElement(colorScheme, 'a:folHlink') || '#954F72',
      }

      this.debug('Parsed theme colors:', colors)
      return colors
    } catch (error) {
      this.error('Error parsing color scheme:', error)
      return null
    }
  }

  /**
   * Parse a single color element from the color scheme
   */
  private parseColorElement(parent: Element, tagName: string): string | null {
    const elem = this.getFirstElement(parent, tagName)
    if (!elem) return null

    // Try RGB color first (<a:srgbClr val="FF0000"/>)
    const srgbClr = this.getFirstElement(elem, 'a:srgbClr')
    if (srgbClr) {
      const val = this.getAttribute(srgbClr, 'val')
      if (val) {
        return `#${val}`
      }
    }

    // Try system color (<a:sysClr val="windowText"/>)
    const sysClr = this.getFirstElement(elem, 'a:sysClr')
    if (sysClr) {
      const val = this.getAttribute(sysClr, 'val')
      if (val && SYSTEM_COLOR_MAP[val]) {
        return SYSTEM_COLOR_MAP[val]
      }
      // Check for lastClr attribute (actual RGB value)
      const lastClr = this.getAttribute(sysClr, 'lastClr')
      if (lastClr) {
        return `#${lastClr}`
      }
    }

    // Try HSL color (<a:hslClr>)
    const hslClr = this.getFirstElement(elem, 'a:hslClr')
    if (hslClr) {
      const hue = this.getAttributeNumber(hslClr, 'hue', 0)
      const sat = this.getAttributeNumber(hslClr, 'sat', 100000)
      const lum = this.getAttributeNumber(hslClr, 'lum', 50000)
      // Convert to RGB (simplified)
      return this.hslToRgb(hue / 60000, sat / 100000, lum / 100000)
    }

    // Try scheme color (reference to another theme color)
    const schemeClr = this.getFirstElement(elem, 'a:schemeClr')
    if (schemeClr) {
      const val = this.getAttribute(schemeClr, 'val')
      // This is a reference, we'll need to resolve it later
      // For now, return a placeholder
      this.debug(`Found scheme color reference: ${val}`)
    }

    return null
  }

  /**
   * Parse font scheme from theme
   */
  private parseFontScheme(doc: Document): FontScheme | null {
    try {
      const fontScheme = this.getFirstElement(doc, 'a:fontScheme')
      if (!fontScheme) {
        this.warn('No font scheme found in theme')
        return null
      }

      // Parse major font (headings)
      const majorFont = this.getFirstElement(fontScheme, 'a:majorFont')
      const majorLatin = majorFont ? this.getFirstElement(majorFont, 'a:latin') : null
      const majorFontName = this.getAttribute(majorLatin, 'typeface', 'Calibri Light')

      // Parse minor font (body)
      const minorFont = this.getFirstElement(fontScheme, 'a:minorFont')
      const minorLatin = minorFont ? this.getFirstElement(minorFont, 'a:latin') : null
      const minorFontName = this.getAttribute(minorLatin, 'typeface', 'Calibri')

      const fonts: FontScheme = {
        majorFont: majorFontName,
        minorFont: minorFontName,
      }

      this.debug('Parsed font scheme:', fonts)
      return fonts
    } catch (error) {
      this.error('Error parsing font scheme:', error)
      return null
    }
  }

  /**
   * Convert HSL to RGB hex color
   * Simplified conversion for theme colors
   */
  private hslToRgb(h: number, s: number, l: number): string {
    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  /**
   * Get default theme colors (fallback)
   */
  public static getDefaultThemeColors(): ThemeColors {
    return {
      dk1: '#000000',
      lt1: '#FFFFFF',
      dk2: '#44546A',
      lt2: '#E7E6E6',
      accent1: '#4472C4',
      accent2: '#ED7D31',
      accent3: '#A5A5A5',
      accent4: '#FFC000',
      accent5: '#5B9BD5',
      accent6: '#70AD47',
      hyperlink: '#0563C1',
      followedHyperlink: '#954F72',
    }
  }
}
