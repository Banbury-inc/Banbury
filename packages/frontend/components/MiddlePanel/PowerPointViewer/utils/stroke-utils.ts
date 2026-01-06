/**
 * Stroke/Border Utility Functions
 * Converts between PPTX stroke styles and CSS/SVG formats
 */

import type { StrokeStyle } from '../types/pptx-types'

/**
 * Convert dash pattern to CSS border-style value
 */
export function dashPatternToCSS(pattern?: string): string {
  const map: Record<string, string> = {
    'solid': 'solid',
    'dash': 'dashed',
    'dot': 'dotted',
    'dashDot': 'dashed',
    'dashDotDot': 'dashed',
    'lgDash': 'dashed',
    'lgDashDot': 'dashed',
    'lgDashDotDot': 'dashed',
    'sysDash': 'dashed',
    'sysDot': 'dotted',
  }
  return map[pattern || 'solid'] || 'solid'
}

/**
 * Convert dash pattern to SVG strokeDasharray value
 */
export function dashPatternToSVGArray(pattern: string): string {
  const map: Record<string, string> = {
    'dash': '5,5',
    'dot': '2,2',
    'dashDot': '5,2,2,2',
    'dashDotDot': '5,2,2,2,2,2',
    'lgDash': '10,5',
    'lgDashDot': '10,5,2,5',
    'lgDashDotDot': '10,5,2,5,2,5',
    'sysDash': '4,4',
    'sysDot': '1,1',
  }
  return map[pattern] || '1,0'
}

/**
 * Convert StrokeStyle to CSS border string
 */
export function strokeStyleToCSS(stroke: string | StrokeStyle, width: number): string {
  if (typeof stroke === 'string') {
    return `${width}px solid ${stroke}`
  }

  const dashStyle = dashPatternToCSS(stroke.dashPattern)
  const color = stroke.alpha !== undefined
    ? hexToRgba(stroke.color, stroke.alpha)
    : stroke.color

  return `${width}px ${dashStyle} ${color}`
}

/**
 * Convert hex color and alpha to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex

  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Get SVG stroke attributes from StrokeStyle
 */
export function getStrokeSVGAttributes(
  stroke: string | StrokeStyle | undefined,
  width?: number
): Record<string, any> {
  if (!stroke) return {}

  if (typeof stroke === 'string') {
    return {
      stroke,
      strokeWidth: width || 2,
    }
  }

  const attrs: Record<string, any> = {
    stroke: stroke.color,
    strokeWidth: width || stroke.width || 2,
  }

  // Add dash array
  if (stroke.dashPattern && stroke.dashPattern !== 'solid') {
    attrs.strokeDasharray = dashPatternToSVGArray(stroke.dashPattern)
  }

  // Add line cap
  if (stroke.lineCap) {
    attrs.strokeLinecap = stroke.lineCap === 'round' ? 'round' : stroke.lineCap === 'square' ? 'square' : 'butt'
  }

  // Add line join
  if (stroke.lineJoin) {
    attrs.strokeLinejoin = stroke.lineJoin
  }

  // Add opacity for alpha
  if (stroke.alpha !== undefined) {
    attrs.strokeOpacity = stroke.alpha
  }

  return attrs
}

/**
 * PPTX dash pattern mapping functions
 */
export function mapDashPattern(pptxVal: string | null): StrokeStyle['dashPattern'] {
  const map: Record<string, StrokeStyle['dashPattern']> = {
    'solid': 'solid',
    'sysDot': 'dot',
    'sysDash': 'dash',
    'dash': 'dash',
    'dashDot': 'dashDot',
    'lgDash': 'lgDash',
    'lgDashDot': 'lgDashDot',
    'lgDashDotDot': 'lgDashDotDot',
  }
  return map[pptxVal || ''] || 'solid'
}

export function mapLineCap(cap: string | null): 'flat' | 'round' | 'square' {
  const map: Record<string, 'flat' | 'round' | 'square'> = {
    'flat': 'flat',
    'rnd': 'round',
    'sq': 'square',
  }
  return map[cap || ''] || 'flat'
}

export function mapLineJoin(join: string | null): 'bevel' | 'miter' | 'round' {
  const map: Record<string, 'bevel' | 'miter' | 'round'> = {
    'bevel': 'bevel',
    'miter': 'miter',
    'round': 'round',
  }
  return map[join || ''] || 'miter'
}

export function mapCompoundLine(cmpd: string | null): 'single' | 'double' | 'thickThin' | 'thinThick' | 'triple' {
  const map: Record<string, StrokeStyle['compound']> = {
    'sng': 'single',
    'dbl': 'double',
    'thickThin': 'thickThin',
    'thinThick': 'thinThick',
    'tri': 'triple',
  }
  return map[cmpd || ''] || 'single'
}

export function mapStrokeAlignment(algn: string | null): 'center' | 'inset' | 'outset' {
  const map: Record<string, 'center' | 'inset' | 'outset'> = {
    'ctr': 'center',
    'in': 'inset',
    'out': 'outset',
  }
  return map[algn || ''] || 'center'
}
