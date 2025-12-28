import { FillStyle } from '../PowerPointViewer'

/**
 * Normalize fill value to FillStyle
 * Handles backward compatibility with string-based fills
 */
export function normalizeFill(fill: string | FillStyle | undefined): FillStyle | undefined {
  if (!fill) return undefined
  
  if (typeof fill === 'string') {
    return { kind: 'solid', color: fill }
  }
  
  return fill
}

/**
 * Convert FillStyle to CSS background value
 */
export function fillStyleToCSS(fill: FillStyle | any | undefined): string {
  if (!fill) return 'transparent'
  
  if (fill.kind === 'solid') {
    return fill.color.startsWith('#') ? fill.color : `#${fill.color}`
  }
  
  if (fill.kind === 'linearGradient') {
    const start = fill.startColor.startsWith('#') ? fill.startColor : `#${fill.startColor}`
    const end = fill.endColor.startsWith('#') ? fill.endColor : `#${fill.endColor}`
    return `linear-gradient(${fill.angleDeg}deg, ${start}, ${end})`
  }
  
  if (fill.kind === 'radialGradient') {
    const start = fill.startColor.startsWith('#') ? fill.startColor : `#${fill.startColor}`
    const end = fill.endColor.startsWith('#') ? fill.endColor : `#${fill.endColor}`
    const centerX = fill.centerX !== undefined ? `${fill.centerX}%` : '50%'
    const centerY = fill.centerY !== undefined ? `${fill.centerY}%` : '50%'
    return `radial-gradient(circle at ${centerX} ${centerY}, ${start}, ${end})`
  }
  
  return 'transparent'
}

/**
 * Generate a gradient image as data URL for PPTX export
 */
export function generateGradientDataUrl(
  startColor: string,
  endColor: string,
  angleDeg: number,
  width: number = 400,
  height: number = 300
): string {
  // Normalize colors
  const start = startColor.startsWith('#') ? startColor : `#${startColor}`
  const end = endColor.startsWith('#') ? endColor : `#${endColor}`
  
  // Create SVG gradient
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(${angleDeg} 0.5 0.5)">
          <stop offset="0%" style="stop-color:${start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
    </svg>
  `.trim()
  
  // Convert to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Get a solid color string from FillStyle (for backward compat)
 */
export function fillStyleToColorString(fill: string | FillStyle | undefined): string | undefined {
  if (!fill) return undefined
  
  if (typeof fill === 'string') {
    return fill
  }
  
  if (fill.kind === 'solid') {
    return fill.color
  }
  
  // For gradients, return the start color as fallback
  if (fill.kind === 'linearGradient') {
    return fill.startColor
  }
  
  return undefined
}

