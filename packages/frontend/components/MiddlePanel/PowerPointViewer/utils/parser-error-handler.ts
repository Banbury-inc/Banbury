/**
 * Parser Error Handler - Provides graceful degradation and logging
 */

export interface ParserError {
  parser: string
  operation: string
  error: Error
  context?: any
}

const parserErrors: ParserError[] = []
const unsupportedFeatures: Set<string> = new Set()

/**
 * Log parser error for debugging
 */
export function logParserError(parser: string, operation: string, error: Error, context?: any): void {
  const parserError: ParserError = { parser, operation, error, context }
  parserErrors.push(parserError)

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${parser}] Error in ${operation}:`, error, context)
  }
}

/**
 * Log unsupported feature for tracking
 */
export function logUnsupportedFeature(feature: string): void {
  if (!unsupportedFeatures.has(feature)) {
    unsupportedFeatures.add(feature)
    // Feature tracking enabled - console logging removed to avoid lint warnings
  }
}

/**
 * Get all parser errors (for debugging)
 */
export function getParserErrors(): ParserError[] {
  return [...parserErrors]
}

/**
 * Get unsupported features
 */
export function getUnsupportedFeatures(): string[] {
  return Array.from(unsupportedFeatures)
}

/**
 * Clear error logs
 */
export function clearParserErrors(): void {
  parserErrors.length = 0
  unsupportedFeatures.clear()
}

/**
 * Wrap parser function with error handling
 */
export function withErrorHandling<T>(
  parser: string,
  operation: string,
  fn: () => T,
  fallback: T,
  context?: any
): T {
  try {
    return fn()
  } catch (error) {
    logParserError(parser, operation, error as Error, context)
    return fallback
  }
}

/**
 * Wrap async parser function with error handling
 */
export async function withAsyncErrorHandling<T>(
  parser: string,
  operation: string,
  fn: () => Promise<T>,
  fallback: T,
  context?: any
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logParserError(parser, operation, error as Error, context)
    return fallback
  }
}

/**
 * Check if PPTX is likely from Google Slides
 */
export function detectGoogleSlidesExport(zip: any): boolean {
  try {
    // Google Slides exports often have specific characteristics
    // We can check for specific files or metadata
    const hasGoogleMetadata = zip.file('docProps/app.xml') !== null

    // This is a heuristic - we could improve this by checking content
    return hasGoogleMetadata
  } catch {
    return false
  }
}

/**
 * Validate XML document
 */
export function validateXmlDocument(doc: Document, expectedRoot?: string): boolean {
  if (!doc) return false

  // Check for parser errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    logParserError('XMLParser', 'parse', new Error('XML parsing error'), {
      error: parserError.textContent
    })
    return false
  }

  // Check expected root element
  if (expectedRoot && doc.documentElement.tagName !== expectedRoot) {
    return false
  }

  return true
}

/**
 * Safe XML element access
 */
export function safeGetElement(parent: Element | Document, tagName: string): Element | null {
  try {
    const elements = parent.getElementsByTagName(tagName)
    return elements.length > 0 ? elements[0] : null
  } catch (error) {
    logParserError('XMLParser', 'getElement', error as Error, { tagName })
    return null
  }
}

/**
 * Safe attribute access
 */
export function safeGetAttribute(element: Element | null, attributeName: string, defaultValue: string = ''): string {
  try {
    if (!element) return defaultValue
    return element.getAttribute(attributeName) || defaultValue
  } catch (error) {
    logParserError('XMLParser', 'getAttribute', error as Error, { attributeName })
    return defaultValue
  }
}

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private startTime: number
  private marks: Map<string, number>

  constructor() {
    this.startTime = performance.now()
    this.marks = new Map()
  }

  mark(label: string): void {
    this.marks.set(label, performance.now())
  }

  getDuration(fromLabel?: string): number {
    const endTime = performance.now()
    const startTime = fromLabel ? (this.marks.get(fromLabel) || this.startTime) : this.startTime
    return endTime - startTime
  }

  log(operation: string, fromLabel?: string): void {
    const duration = this.getDuration(fromLabel)
  }
}
