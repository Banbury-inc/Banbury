import { SlideElement, FillStyle, BorderStyle, HighlightRange } from '../PowerPointViewer'

/**
 * Set text box background fill (solid color)
 */
export function setTextFillSolid(element: SlideElement, color: string): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  return {
    textFill: { kind: 'solid', color }
  }
}

/**
 * Set text box background fill (linear gradient)
 */
export function setTextFillGradient(
  element: SlideElement,
  startColor: string,
  endColor: string,
  angleDeg: number
): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  return {
    textFill: { kind: 'linearGradient', startColor, endColor, angleDeg }
  }
}

/**
 * Clear text box background fill
 */
export function clearTextFill(element: SlideElement): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  return { textFill: undefined }
}

/**
 * Set shape fill (solid color)
 */
export function setShapeFillSolid(element: SlideElement, color: string): Partial<SlideElement> {
  if (element.type !== 'shape') return {}
  return {
    fill: { kind: 'solid', color }
  }
}

/**
 * Set shape fill (linear gradient)
 */
export function setShapeFillGradient(
  element: SlideElement,
  startColor: string,
  endColor: string,
  angleDeg: number
): Partial<SlideElement> {
  if (element.type !== 'shape') return {}
  return {
    fill: { kind: 'linearGradient', startColor, endColor, angleDeg }
  }
}

/**
 * Set text box border
 */
export function setTextBorder(element: SlideElement, color: string, width: number): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  return {
    border: { color, width }
  }
}

/**
 * Clear text box border
 */
export function clearTextBorder(element: SlideElement): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  return { border: undefined }
}

/**
 * Add highlight to text range
 */
export function addHighlight(
  element: SlideElement,
  start: number,
  end: number,
  color: string
): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  
  const highlights = element.highlights || []
  
  // Remove overlapping highlights in the same range
  const filtered = highlights.filter(h => 
    h.end <= start || h.start >= end
  )
  
  return {
    highlights: [...filtered, { start, end, color }].sort((a, b) => a.start - b.start)
  }
}

/**
 * Remove highlights in a range
 */
export function removeHighlightsInRange(
  element: SlideElement,
  start: number,
  end: number
): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  
  const highlights = element.highlights || []
  
  return {
    highlights: highlights.filter(h => 
      h.end <= start || h.start >= end
    )
  }
}

/**
 * Clear all highlights
 */
export function clearAllHighlights(element: SlideElement): Partial<SlideElement> {
  if (element.type !== 'text') return {}
  return { highlights: [] }
}

/**
 * Find highlights by substring (for AI operations)
 */
export function findSubstringRanges(content: string, substring: string, occurrence?: number): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  
  if (!substring || !content) return ranges
  
  let index = 0
  let count = 0
  
  while ((index = content.indexOf(substring, index)) !== -1) {
    count++
    if (!occurrence || count === occurrence) {
      ranges.push({ start: index, end: index + substring.length })
      if (occurrence) break
    }
    index += substring.length
  }
  
  return ranges
}

/**
 * Apply highlight to substring
 */
export function highlightSubstring(
  element: SlideElement,
  substring: string,
  color: string,
  occurrence?: number
): Partial<SlideElement> {
  if (element.type !== 'text' || !element.content) return {}
  
  const ranges = findSubstringRanges(element.content, substring, occurrence)
  
  if (ranges.length === 0) return {}
  
  let highlights = element.highlights || []
  
  for (const range of ranges) {
    // Remove overlapping highlights
    highlights = highlights.filter(h => 
      h.end <= range.start || h.start >= range.end
    )
    highlights.push({ ...range, color })
  }
  
  return {
    highlights: highlights.sort((a, b) => a.start - b.start)
  }
}

