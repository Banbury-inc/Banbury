import type { ThemeColors, ColorDefinition } from '../types/pptx-types'
import { SYSTEM_COLOR_MAP } from '../types/pptx-types'

/**
 * Color Resolver - Resolves PPTX color definitions to hex colors
 *
 * Handles:
 * - RGB colors (<a:srgbClr>)
 * - Scheme colors (<a:schemeClr>) - theme color references
 * - System colors (<a:sysClr>)
 * - Color transformations (tint, shade, satMod, lumMod, alpha)
 */

/**
 * Parse color from a fill element
 * @param fillElem - The fill element (<a:solidFill>, <a:gradFill>, etc.)
 * @param themeColors - Theme color scheme for resolving references
 * @returns Hex color string (#RRGGBB)
 */
export function parseColor(
  fillElem: Element | null,
  themeColors?: ThemeColors
): string {
  if (!fillElem) return '#000000'

  // Try RGB color first (<a:srgbClr val="FF0000"/>)
  const srgbClr = fillElem.getElementsByTagName('a:srgbClr')[0]
  if (srgbClr) {
    return resolveRgbColor(srgbClr)
  }

  // Try scheme color (<a:schemeClr val="accent1"/>)
  const schemeClr = fillElem.getElementsByTagName('a:schemeClr')[0]
  if (schemeClr && themeColors) {
    return resolveSchemeColor(schemeClr, themeColors)
  }

  // Try system color (<a:sysClr val="windowText"/>)
  const sysClr = fillElem.getElementsByTagName('a:sysClr')[0]
  if (sysClr) {
    return resolveSystemColor(sysClr)
  }

  // Try HSL color
  const hslClr = fillElem.getElementsByTagName('a:hslClr')[0]
  if (hslClr) {
    return resolveHslColor(hslClr)
  }

  // Default to black
  return '#000000'
}

/**
 * Resolve RGB color with transformations
 */
function resolveRgbColor(srgbClr: Element): string {
  const val = srgbClr.getAttribute('val')
  if (!val) return '#000000'

  let color = `#${val}`

  // Apply color transformations
  color = applyColorTransformations(color, srgbClr)

  return color
}

/**
 * Resolve scheme color (theme color reference)
 */
function resolveSchemeColor(
  schemeClr: Element,
  themeColors: ThemeColors
): string {
  const val = schemeClr.getAttribute('val') as keyof ThemeColors
  if (!val || !themeColors[val]) {
    console.warn(`[ColorResolver] Unknown scheme color: ${val}`)
    return '#000000'
  }

  let color = themeColors[val]

  // Apply color transformations
  color = applyColorTransformations(color, schemeClr)

  return color
}

/**
 * Resolve system color
 */
function resolveSystemColor(sysClr: Element): string {
  const val = sysClr.getAttribute('val')
  if (!val) return '#000000'

  // Check for lastClr attribute (actual RGB value)
  const lastClr = sysClr.getAttribute('lastClr')
  if (lastClr) {
    return `#${lastClr}`
  }

  // Map system color name
  if (SYSTEM_COLOR_MAP[val]) {
    let color = SYSTEM_COLOR_MAP[val]
    // Apply transformations
    color = applyColorTransformations(color, sysClr)
    return color
  }

  return '#000000'
}

/**
 * Resolve HSL color
 */
function resolveHslColor(hslClr: Element): string {
  const hue = parseInt(hslClr.getAttribute('hue') || '0')
  const sat = parseInt(hslClr.getAttribute('sat') || '100000')
  const lum = parseInt(hslClr.getAttribute('lum') || '50000')

  // Convert from PPTX units to 0-1 range
  const h = hue / 60000 // hue is in 1/60000 degrees
  const s = sat / 100000 // saturation is percentage * 1000
  const l = lum / 100000 // luminance is percentage * 1000

  return hslToRgb(h, s, l)
}

/**
 * Apply color transformations (tint, shade, satMod, lumMod, alpha)
 */
function applyColorTransformations(color: string, elem: Element): string {
  // Parse original color
  const rgb = hexToRgb(color)
  if (!rgb) return color

  let { r, g, b } = rgb

  // Convert to HSL for easier manipulation
  let { h, s, l } = rgbToHsl(r, g, b)

  // Apply tint (lighten)
  const tint = elem.getElementsByTagName('a:tint')[0]
  if (tint) {
    const val = parseInt(tint.getAttribute('val') || '0')
    const tintAmount = val / 100000 // percentage * 1000
    l = l + (1 - l) * tintAmount
  }

  // Apply shade (darken)
  const shade = elem.getElementsByTagName('a:shade')[0]
  if (shade) {
    const val = parseInt(shade.getAttribute('val') || '0')
    const shadeAmount = val / 100000
    l = l * (1 - shadeAmount)
  }

  // Apply saturation modulation
  const satMod = elem.getElementsByTagName('a:satMod')[0]
  if (satMod) {
    const val = parseInt(satMod.getAttribute('val') || '100000')
    s = s * (val / 100000)
  }

  // Apply luminance modulation
  const lumMod = elem.getElementsByTagName('a:lumMod')[0]
  if (lumMod) {
    const val = parseInt(lumMod.getAttribute('val') || '100000')
    l = l * (val / 100000)
  }

  // Apply luminance offset
  const lumOff = elem.getElementsByTagName('a:lumOff')[0]
  if (lumOff) {
    const val = parseInt(lumOff.getAttribute('val') || '0')
    l = l + (val / 100000)
  }

  // Clamp values
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))

  // Convert back to RGB
  return hslToRgb(h, s, l)
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h, s, l }
}

/**
 * Convert HSL to RGB hex color
 */
function hslToRgb(h: number, s: number, l: number): string {
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
 * Parse alpha (opacity) from color element
 * @returns Alpha value from 0-1 (0 = transparent, 1 = opaque)
 */
export function parseAlpha(colorElem: Element | null): number {
  if (!colorElem) return 1

  const alpha = colorElem.getElementsByTagName('a:alpha')[0]
  if (alpha) {
    const val = parseInt(alpha.getAttribute('val') || '100000')
    return val / 100000 // percentage * 1000
  }

  return 1
}

/**
 * Create color definition object for deferred resolution
 */
export function createColorDefinition(colorElem: Element): ColorDefinition | null {
  if (!colorElem) return null

  // RGB color
  const srgbClr = colorElem.getElementsByTagName('a:srgbClr')[0]
  if (srgbClr) {
    const val = srgbClr.getAttribute('val')
    if (val) {
      return { type: 'srgb', value: val }
    }
  }

  // Scheme color
  const schemeClr = colorElem.getElementsByTagName('a:schemeClr')[0]
  if (schemeClr) {
    const val = schemeClr.getAttribute('val')
    if (val) {
      return { type: 'scheme', value: val }
    }
  }

  // System color
  const sysClr = colorElem.getElementsByTagName('a:sysClr')[0]
  if (sysClr) {
    const val = sysClr.getAttribute('val')
    if (val) {
      return { type: 'system', value: val }
    }
  }

  return null
}
