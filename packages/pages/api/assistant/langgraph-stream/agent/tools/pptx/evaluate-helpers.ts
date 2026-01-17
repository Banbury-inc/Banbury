/**
 * Extract text content from slide XML
 */
export function extractTextFromSlideXml(xml: string): string[] {
  const texts: string[] = []
  
  // Match all <a:t>...</a:t> text elements
  const textRegex = /<a:t>([^<]*)<\/a:t>/g
  let match
  
  // Group texts by paragraph
  let currentParagraph = ''
  let lastIndex = 0
  
  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1]
    
    // Check if there's a paragraph break between last match and this one
    const between = xml.substring(lastIndex, match.index)
    const hasParagraphBreak = between.includes('</a:p>') || between.includes('<a:p>')
    
    if (hasParagraphBreak && currentParagraph.trim()) {
      texts.push(currentParagraph.trim())
      currentParagraph = ''
    }
    
    currentParagraph += text
    lastIndex = match.index + match[0].length
  }
  
  // Don't forget the last paragraph
  if (currentParagraph.trim()) {
    texts.push(currentParagraph.trim())
  }
  
  // Filter out empty strings and very short strings that are likely noise
  return texts.filter(t => t.length > 0)
}

/**
 * Extract images from slide XML
 */
export function extractImagesFromSlideXml(xml: string): number {
  // Count image references in the slide
  const imageRegex = /<p:pic|<a:blip/g
  const matches = xml.match(imageRegex)
  return matches ? matches.length : 0
}

/**
 * Extract shapes from slide XML
 */
export function extractShapesFromSlideXml(xml: string): number {
  // Count shape elements (excluding text boxes which are handled separately)
  const shapeRegex = /<p:sp[^>]*>(?!.*<p:txBody)/g
  const matches = xml.match(shapeRegex)
  return matches ? matches.length : 0
}

/**
 * Standard PowerPoint slide dimensions (in points)
 * Widescreen (16:9): 960 x 540 points = 10 x 5.625 inches
 * Standard (4:3): 960 x 720 points = 10 x 7.5 inches
 */
export const STANDARD_SLIDE_WIDTH_POINTS = 960
export const STANDARD_SLIDE_HEIGHT_POINTS = 720
export const WIDESCREEN_SLIDE_HEIGHT_POINTS = 540

/**
 * Extract element position and size from slide XML
 * Returns array of element boundaries in EMU (English Metric Units)
 */
export function extractElementBoundaries(xml: string): Array<{
  leftEmu: number
  topEmu: number
  widthEmu: number
  heightEmu: number
  rightEmu: number
  bottomEmu: number
  type: 'text' | 'shape' | 'image' | 'table'
}> {
  const elements: Array<{
    leftEmu: number
    topEmu: number
    widthEmu: number
    heightEmu: number
    rightEmu: number
    bottomEmu: number
    type: 'text' | 'shape' | 'image' | 'table'
  }> = []

  // Regular expression to match <p:sp> (shapes/text boxes), <p:pic> (images), <p:graphicFrame> (tables)
  const elementRegex = /<(p:sp|p:pic|p:graphicFrame)[^>]*>(.*?)<\/\1>/gs
  
  let match
  while ((match = elementRegex.exec(xml)) !== null) {
    const elementXml = match[0]
    const elementType = match[1] === 'p:sp' ? 'text' : match[1] === 'p:pic' ? 'image' : 'table'
    
    // Extract transform information
    const xfrmMatch = elementXml.match(/<p:xfrm[^>]*>(.*?)<\/p:xfrm>/s)
    if (!xfrmMatch) continue
    
    const xfrmXml = xfrmMatch[0]
    
    // Extract offset (position)
    const offMatch = xfrmXml.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*\/>/)
    if (!offMatch) continue
    
    const leftEmu = parseInt(offMatch[1], 10)
    const topEmu = parseInt(offMatch[2], 10)
    
    // Extract extent (size)
    const extMatch = xfrmXml.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*\/>/)
    if (!extMatch) continue
    
    const widthEmu = parseInt(extMatch[1], 10)
    const heightEmu = parseInt(extMatch[2], 10)
    
    const rightEmu = leftEmu + widthEmu
    const bottomEmu = topEmu + heightEmu
    
    elements.push({
      leftEmu,
      topEmu,
      widthEmu,
      heightEmu,
      rightEmu,
      bottomEmu,
      type: elementType
    })
  }
  
  return elements
}

/**
 * Get slide dimensions from presentation XML
 * Returns width and height in EMU
 */
export function extractSlideDimensions(presentationXml: string): { widthEmu: number; heightEmu: number } | null {
  // Look for <p:sldSz> element
  const sldSzMatch = presentationXml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*\/>/)
  if (sldSzMatch) {
    return {
      widthEmu: parseInt(sldSzMatch[1], 10),
      heightEmu: parseInt(sldSzMatch[2], 10)
    }
  }
  return null
}

/**
 * Convert EMU to inches (1 inch = 914400 EMU)
 */
export function emuToInches(emu: number): number {
  return emu / 914400
}

/**
 * Check if elements overflow slide boundaries
 * Returns layout issues found
 */
export function checkLayoutIssues(
  slideXml: string,
  slideWidthEmu: number,
  slideHeightEmu: number
): {
  hasOverflow: boolean
  overflowIssues: Array<{
    type: 'right_overflow' | 'bottom_overflow' | 'negative_position'
    severity: 'error' | 'warning'
    message: string
    elementIndex: number
    overflowAmountInches: number
  }>
} {
  const elements = extractElementBoundaries(slideXml)
  const overflowIssues: Array<{
    type: 'right_overflow' | 'bottom_overflow' | 'negative_position'
    severity: 'error' | 'warning'
    message: string
    elementIndex: number
    overflowAmountInches: number
  }> = []

  elements.forEach((element, index) => {
    // Check for negative positions (element off left/top edge)
    if (element.leftEmu < 0) {
      overflowIssues.push({
        type: 'negative_position',
        severity: 'error',
        message: `Element ${index + 1} is positioned off the left edge of the slide`,
        elementIndex: index,
        overflowAmountInches: Math.abs(emuToInches(element.leftEmu))
      })
    }
    if (element.topEmu < 0) {
      overflowIssues.push({
        type: 'negative_position',
        severity: 'error',
        message: `Element ${index + 1} is positioned off the top edge of the slide`,
        elementIndex: index,
        overflowAmountInches: Math.abs(emuToInches(element.topEmu))
      })
    }

    // Check right overflow
    if (element.rightEmu > slideWidthEmu) {
      const overflowEmu = element.rightEmu - slideWidthEmu
      const overflowInches = emuToInches(overflowEmu)
      overflowIssues.push({
        type: 'right_overflow',
        severity: overflowInches > 0.1 ? 'error' : 'warning',
        message: `Element ${index + 1} (${element.type}) extends ${overflowInches.toFixed(2)} inches beyond the right edge of the slide`,
        elementIndex: index,
        overflowAmountInches: overflowInches
      })
    }

    // Check bottom overflow
    if (element.bottomEmu > slideHeightEmu) {
      const overflowEmu = element.bottomEmu - slideHeightEmu
      const overflowInches = emuToInches(overflowEmu)
      overflowIssues.push({
        type: 'bottom_overflow',
        severity: overflowInches > 0.1 ? 'error' : 'warning',
        message: `Element ${index + 1} (${element.type}) extends ${overflowInches.toFixed(2)} inches beyond the bottom edge of the slide`,
        elementIndex: index,
        overflowAmountInches: overflowInches
      })
    }
  })

  return {
    hasOverflow: overflowIssues.length > 0,
    overflowIssues
  }
}

/**
 * Check if text overflows its text box frame
 * This is a simplified check - in a real implementation, you'd need font metrics
 */
export function checkTextOverflow(slideXml: string): {
  hasTextOverflow: boolean
  overflowIssues: Array<{
    elementIndex: number
    message: string
  }>
} {
  const overflowIssues: Array<{
    elementIndex: number
    message: string
  }> = []

  // Find text boxes with text content
  const textBoxRegex = /<p:sp[^>]*>.*?<p:txBody>.*?<\/p:txBody>.*?<\/p:sp>/gs
  const textBoxes = slideXml.match(textBoxRegex) || []

  textBoxes.forEach((textBoxXml, index) => {
    // Extract text content
    const textMatches = textBoxXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || []
    const totalTextLength = textMatches.reduce((sum, match) => {
      const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/)
      return sum + (textMatch ? textMatch[1].length : 0)
    }, 0)

    // Extract text box dimensions
    const xfrmMatch = textBoxXml.match(/<p:xfrm[^>]*>(.*?)<\/p:xfrm>/s)
    if (!xfrmMatch) return

    const xfrmXml = xfrmMatch[0]
    const extMatch = xfrmXml.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*\/>/)
    if (!extMatch) return

    const widthEmu = parseInt(extMatch[1], 10)
    const heightEmu = parseInt(extMatch[2], 10)
    const widthInches = emuToInches(widthEmu)
    const heightInches = emuToInches(heightEmu)

    // Simple heuristic: if text is very long relative to box size, it might overflow
    // Assuming ~40 characters per inch width and ~6 lines per inch height
    const estimatedCharactersPerLine = Math.floor(widthInches * 40)
    const estimatedLines = Math.floor(heightInches * 6)
    const estimatedCapacity = estimatedCharactersPerLine * estimatedLines

    if (totalTextLength > estimatedCapacity * 1.2) {
      overflowIssues.push({
        elementIndex: index,
        message: `Text box ${index + 1} contains ${totalTextLength} characters but only has space for approximately ${estimatedCapacity} characters. Text may be cut off or fall outside the visible area.`
      })
    }
  })

  return {
    hasTextOverflow: overflowIssues.length > 0,
    overflowIssues
  }
}
