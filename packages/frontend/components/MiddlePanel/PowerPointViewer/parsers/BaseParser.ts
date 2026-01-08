import JSZip from 'jszip'

/**
 * Base parser class providing common functionality for all PPTX parsers
 */
export abstract class BaseParser {
  protected zip: JSZip
  protected cache: Map<string, Document>

  constructor(zip: JSZip) {
    this.zip = zip
    this.cache = new Map()
  }

  /**
   * Get and parse an XML file from the PPTX archive
   * Results are cached for performance
   */
  protected async getXml(path: string): Promise<Document | null> {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path)!
    }

    try {
      // Get file from ZIP
      const file = this.zip.file(path)
      if (!file) {
        console.warn(`[BaseParser] File not found: ${path}`)
        return null
      }

      // Read as string
      const xmlStr = await file.async('string')
      if (!xmlStr) {
        console.warn(`[BaseParser] Empty file: ${path}`)
        return null
      }

      // Parse XML
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlStr, 'application/xml')

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        console.error(`[BaseParser] XML parsing error in ${path}:`, parserError.textContent)
        return null
      }

      // Cache and return
      this.cache.set(path, doc)
      return doc
    } catch (error) {
      console.error(`[BaseParser] Error loading XML from ${path}:`, error)
      return null
    }
  }

  /**
   * Get text content from an element by tag name
   */
  protected getElementText(parent: Element, tagName: string): string {
    const elements = parent.getElementsByTagName(tagName)
    return elements.length > 0 ? elements[0].textContent || '' : ''
  }

  /**
   * Get first element by tag name
   */
  protected getFirstElement(parent: Element | Document, tagName: string): Element | null {
    const elements = parent.getElementsByTagName(tagName)
    return elements.length > 0 ? elements[0] : null
  }

  /**
   * Get all elements by tag name
   */
  protected getElements(parent: Element | Document, tagName: string): Element[] {
    const elements = parent.getElementsByTagName(tagName)
    return Array.from(elements)
  }

  /**
   * Get attribute value with fallback
   */
  protected getAttribute(element: Element | null, attributeName: string, defaultValue: string = ''): string {
    if (!element) return defaultValue
    return element.getAttribute(attributeName) || defaultValue
  }

  /**
   * Get attribute value as number with fallback
   */
  protected getAttributeNumber(element: Element | null, attributeName: string, defaultValue: number = 0): number {
    if (!element) return defaultValue
    const value = element.getAttribute(attributeName)
    if (!value) return defaultValue
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * Check if element has attribute
   */
  protected hasAttribute(element: Element | null, attributeName: string): boolean {
    return element?.hasAttribute(attributeName) || false
  }

  /**
   * Get child element by local name (ignoring namespace)
   * Useful for handling different namespace prefixes
   */
  protected getChildByLocalName(parent: Element, localName: string): Element | null {
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i]
      if (child.localName === localName) {
        return child
      }
    }
    return null
  }

  /**
   * Get all children by local name (ignoring namespace)
   */
  protected getChildrenByLocalName(parent: Element, localName: string): Element[] {
    const result: Element[] = []
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i]
      if (child.localName === localName) {
        result.push(child)
      }
    }
    return result
  }

  /**
   * Check if element exists and has children
   */
  protected hasChildren(element: Element | null): boolean {
    return element ? element.children.length > 0 : false
  }

  /**
   * Clear the cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Log debug information if needed
   */
  protected debug(message: string, ...args: any[]): void {
  }

  /**
   * Log warning
   */
  protected warn(message: string, ...args: any[]): void {
    console.warn(`[${this.constructor.name}] ${message}`, ...args)
  }

  /**
   * Log error
   */
  protected error(message: string, ...args: any[]): void {
    console.error(`[${this.constructor.name}] ${message}`, ...args)
  }
}
