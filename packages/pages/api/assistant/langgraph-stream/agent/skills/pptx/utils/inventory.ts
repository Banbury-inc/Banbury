/**
 * Extract structured text content from PowerPoint presentations.
 *
 * This module provides functionality to:
 * - Extract all text content from PowerPoint shapes
 * - Preserve paragraph formatting (alignment, bullets, fonts, spacing)
 * - Handle nested GroupShapes recursively with correct absolute positions
 * - Sort shapes by visual position on slides
 * - Filter out slide numbers and non-content placeholders
 * - Export to JSON with clean, structured data
 */

import { DOMParser } from '@xmldom/xmldom'
import * as JSZip from 'jszip'

// Type definitions
export interface ParagraphDict {
  text: string
  bullet?: boolean
  level?: number
  alignment?: string
  space_before?: number
  space_after?: number
  font_name?: string
  font_size?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  theme_color?: string
  line_spacing?: number
}

export interface ShapeDataDict {
  left: number
  top: number
  width: number
  height: number
  placeholder_type?: string
  default_font_size?: number
  overflow?: {
    frame?: { overflow_bottom: number }
    slide?: { overflow_right?: number; overflow_bottom?: number }
  }
  overlap?: { overlapping_shapes: Record<string, number> }
  warnings?: string[]
  paragraphs: ParagraphDict[]
}

export interface InventoryData {
  [slideId: string]: {
    [shapeId: string]: ShapeData
  }
}

export interface ShapeWithPosition {
  shapeElement: Element
  absoluteLeft: number // in EMUs
  absoluteTop: number // in EMUs
}

// OOXML namespaces
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main'

/**
 * Convert EMUs (English Metric Units) to inches
 */
function emuToInches(emu: number): number {
  return emu / 914400.0
}

/**
 * Get attribute value as number from XML element
 */
function getAttributeNumber(element: Element | null, attributeName: string, defaultValue: number = 0): number {
  if (!element) return defaultValue
  const value = element.getAttribute(attributeName)
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Get child element by local name (ignoring namespace prefix)
 */
function getChildByLocalName(parent: Element, localName: string): Element | null {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i]
    if (child.nodeType === 1 && (child as Element).localName === localName) {
      return child as Element
    }
  }
  return null
}

/**
 * Get all child elements by local name
 */
function getChildrenByLocalName(parent: Element, localName: string): Element[] {
  const result: Element[] = []
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i]
    if (child.nodeType === 1 && (child as Element).localName === localName) {
      result.push(child as Element)
    }
  }
  return result
}

/**
 * ParagraphData class representing paragraph properties
 */
export class ParagraphData {
  text: string
  bullet?: boolean
  level?: number
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'
  space_before?: number
  space_after?: number
  font_name?: string
  font_size?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  theme_color?: string
  line_spacing?: number

  constructor(paragraphElement: Element) {
    // Extract text from all <a:t> elements in the paragraph
    const textRuns = paragraphElement.getElementsByTagNameNS(NS_A, 't')
    this.text = Array.from(textRuns)
      .map((run) => run.textContent || '')
      .join('')
      .trim()

    // Check for bullet formatting
    const pPr = getChildByLocalName(paragraphElement, 'pPr')
    if (pPr) {
      const buChar = getChildByLocalName(pPr, 'buChar')
      const buAutoNum = getChildByLocalName(pPr, 'buAutoNum')
      if (buChar || buAutoNum) {
        this.bullet = true
        const level = getAttributeNumber(pPr, 'lvl')
        if (level !== undefined) this.level = level
      }

      // Check alignment
      const al = pPr.getAttribute('al')
      if (al) {
        const alignmentMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'> = {
          'ctr': 'CENTER',
          'r': 'RIGHT',
          'just': 'JUSTIFY',
          'l': 'LEFT',
        }
        this.alignment = alignmentMap[al] || 'LEFT'
      }

      // Check spacing
      const spcBef = getChildByLocalName(pPr, 'spcBef')
      if (spcBef) {
        const spcPts = getChildByLocalName(spcBef, 'spcPts')
        if (spcPts) {
          const val = getAttributeNumber(spcPts, 'val')
          if (val) this.space_before = val / 100 // Convert from 1/100th of a point to points
        }
      }

      const spcAft = getChildByLocalName(pPr, 'spcAft')
      if (spcAft) {
        const spcPts = getChildByLocalName(spcAft, 'spcPts')
        if (spcPts) {
          const val = getAttributeNumber(spcPts, 'val')
          if (val) this.space_after = val / 100
        }
      }

      // Get line spacing
      const lnSpc = getChildByLocalName(pPr, 'lnSpc')
      if (lnSpc) {
        const spcPts = getChildByLocalName(lnSpc, 'spcPts')
        if (spcPts) {
          const val = getAttributeNumber(spcPts, 'val')
          if (val) this.line_spacing = val / 100
        }
      }
    }

    // Extract font properties from first run
    const firstRun = paragraphElement.getElementsByTagNameNS(NS_A, 'r')[0]
    if (firstRun) {
      const rPr = getChildByLocalName(firstRun, 'rPr')
      if (rPr) {
        const latin = getChildByLocalName(rPr, 'latin')
        if (latin) {
          this.font_name = latin.getAttribute('typeface') || undefined
        }

        const sz = getAttributeNumber(rPr, 'sz')
        if (sz) this.font_size = sz / 100 // Convert from 1/100th of a point to points

        if (rPr.getAttribute('b') === '1') this.bold = true
        if (rPr.getAttribute('i') === '1') this.italic = true
        if (rPr.getAttribute('u') !== undefined) this.underline = true

        // Get color
        const solidFill = getChildByLocalName(rPr, 'solidFill')
        if (solidFill) {
          const srgbClr = getChildByLocalName(solidFill, 'srgbClr')
          if (srgbClr) {
            const val = srgbClr.getAttribute('val')
            if (val) this.color = val
          }
          const schemeClr = getChildByLocalName(solidFill, 'schemeClr')
          if (schemeClr) {
            const val = schemeClr.getAttribute('val')
            if (val) this.theme_color = val
          }
        }
      }
    }
  }

  toDict(): ParagraphDict {
    const result: ParagraphDict = { text: this.text }

    if (this.bullet) result.bullet = this.bullet
    if (this.level !== undefined) result.level = this.level
    if (this.alignment) result.alignment = this.alignment
    if (this.space_before !== undefined) result.space_before = this.space_before
    if (this.space_after !== undefined) result.space_after = this.space_after
    if (this.font_name) result.font_name = this.font_name
    if (this.font_size !== undefined) result.font_size = this.font_size
    if (this.bold !== undefined) result.bold = this.bold
    if (this.italic !== undefined) result.italic = this.italic
    if (this.underline !== undefined) result.underline = this.underline
    if (this.color) result.color = this.color
    if (this.theme_color) result.theme_color = this.theme_color
    if (this.line_spacing !== undefined) result.line_spacing = this.line_spacing

    return result
  }
}

/**
 * ShapeData class representing shape properties
 */
export class ShapeData {
  shapeElement: Element
  shapeId: string = ''
  
  // Position and size (in inches)
  left: number
  top: number
  width: number
  height: number
  
  // Position and size (in EMUs)
  leftEmu: number
  topEmu: number
  widthEmu: number
  heightEmu: number
  
  // Slide dimensions (in EMUs)
  slideWidthEmu?: number
  slideHeightEmu?: number
  
  // Placeholder information
  placeholderType?: string
  defaultFontSize?: number
  
  // Overflow detection
  frameOverflowBottom?: number
  slideOverflowRight?: number
  slideOverflowBottom?: number
  overlappingShapes: Record<string, number> = {}
  warnings: string[] = []

  constructor(
    shapeElement: Element,
    absoluteLeft?: number,
    absoluteTop?: number,
    slideDocument?: Document
  ) {
    this.shapeElement = shapeElement
    
    // Get slide dimensions
    if (slideDocument) {
      const sldSz = slideDocument.getElementsByTagNameNS(NS_P, 'sldSz')[0]
      if (sldSz) {
        const cx = getAttributeNumber(sldSz, 'cx')
        const cy = getAttributeNumber(sldSz, 'cy')
        if (cx && cy) {
          this.slideWidthEmu = cx
          this.slideHeightEmu = cy
        }
      }
    }

    // Get position from shape element
    const xfrm = getChildByLocalName(shapeElement, 'xfrm')
    if (xfrm) {
      const off = getChildByLocalName(xfrm, 'off')
      const ext = getChildByLocalName(xfrm, 'ext')
      
      if (off) {
        this.leftEmu = absoluteLeft !== undefined ? absoluteLeft : getAttributeNumber(off, 'x')
        this.topEmu = absoluteTop !== undefined ? absoluteTop : getAttributeNumber(off, 'y')
      } else {
        this.leftEmu = absoluteLeft || 0
        this.topEmu = absoluteTop || 0
      }
      
      if (ext) {
        this.widthEmu = getAttributeNumber(ext, 'cx')
        this.heightEmu = getAttributeNumber(ext, 'cy')
      } else {
        this.widthEmu = 0
        this.heightEmu = 0
      }
    } else {
      this.leftEmu = absoluteLeft || 0
      this.topEmu = absoluteTop || 0
      this.widthEmu = 0
      this.heightEmu = 0
    }

    // Convert to inches
    this.left = Math.round(emuToInches(this.leftEmu) * 100) / 100
    this.top = Math.round(emuToInches(this.topEmu) * 100) / 100
    this.width = Math.round(emuToInches(this.widthEmu) * 100) / 100
    this.height = Math.round(emuToInches(this.heightEmu) * 100) / 100

    // Get placeholder type
    const nvSpPr = getChildByLocalName(shapeElement, 'nvSpPr')
    if (nvSpPr) {
      const nvPr = getChildByLocalName(nvSpPr, 'nvPr')
      if (nvPr) {
        const ph = getChildByLocalName(nvPr, 'ph')
        if (ph) {
          const type = ph.getAttribute('type')
          if (type) this.placeholderType = type
        }
      }
    }

    // Calculate overflow
    this.calculateFrameOverflow()
    this.calculateSlideOverflow()
    this.detectBulletIssues()
  }

  /**
   * Get paragraphs from text frame
   */
  get paragraphs(): ParagraphData[] {
    const txBody = getChildByLocalName(this.shapeElement, 'txBody')
    if (!txBody) return []

    const paragraphs: ParagraphData[] = []
    const pElements = getChildrenByLocalName(txBody, 'p')
    
    for (const pElement of pElements) {
      const paraData = new ParagraphData(pElement)
      if (paraData.text) {
        paragraphs.push(paraData)
      }
    }

    return paragraphs
  }

  /**
   * Estimate if text overflows the shape bounds
   */
  private calculateFrameOverflow(): void {
    const paragraphs = this.paragraphs
    if (paragraphs.length === 0) return

    const estimatedHeight = paragraphs.length * (this.defaultFontSize || 14) * 1.2
    const availableHeight = this.height * 72

    if (estimatedHeight > availableHeight) {
      this.frameOverflowBottom = Math.round((estimatedHeight - availableHeight) / 72 * 100) / 100
    }
  }

  /**
   * Calculate if shape overflows slide boundaries
   */
  private calculateSlideOverflow(): void {
    if (this.slideWidthEmu === undefined || this.slideHeightEmu === undefined) return

    // Check right overflow
    const rightEdgeEmu = this.leftEmu + this.widthEmu
    if (rightEdgeEmu > this.slideWidthEmu) {
      const overflowEmu = rightEdgeEmu - this.slideWidthEmu
      const overflowInches = Math.round(emuToInches(overflowEmu) * 100) / 100
      if (overflowInches > 0.01) {
        this.slideOverflowRight = overflowInches
      }
    }

    // Check bottom overflow
    const bottomEdgeEmu = this.topEmu + this.heightEmu
    if (bottomEdgeEmu > this.slideHeightEmu) {
      const overflowEmu = bottomEdgeEmu - this.slideHeightEmu
      const overflowInches = Math.round(emuToInches(overflowEmu) * 100) / 100
      if (overflowInches > 0.01) {
        this.slideOverflowBottom = overflowInches
      }
    }
  }

  /**
   * Detect bullet point formatting issues
   */
  private detectBulletIssues(): void {
    const paragraphs = this.paragraphs
    const bulletSymbols = ['•', '●', '○']

    for (const para of paragraphs) {
      const text = para.text.trim()
      if (text && bulletSymbols.some(symbol => text.startsWith(symbol + ' '))) {
        this.warnings.push('manual_bullet_symbol: use proper bullet formatting')
        break
      }
    }
  }

  /**
   * Check if shape has any issues
   */
  get hasAnyIssues(): boolean {
    return !!(
      this.frameOverflowBottom ||
      this.slideOverflowRight ||
      this.slideOverflowBottom ||
      Object.keys(this.overlappingShapes).length > 0 ||
      this.warnings.length > 0
    )
  }

  /**
   * Convert to dictionary for JSON serialization
   */
  toDict(): ShapeDataDict {
    const result: ShapeDataDict = {
      left: this.left,
      top: this.top,
      width: this.width,
      height: this.height,
      paragraphs: this.paragraphs.map(p => p.toDict()),
    }

    if (this.placeholderType) result.placeholder_type = this.placeholderType
    if (this.defaultFontSize) result.default_font_size = this.defaultFontSize

    const overflowData: any = {}
    if (this.frameOverflowBottom) {
      overflowData.frame = { overflow_bottom: this.frameOverflowBottom }
    }

    const slideOverflow: any = {}
    if (this.slideOverflowRight) slideOverflow.overflow_right = this.slideOverflowRight
    if (this.slideOverflowBottom) slideOverflow.overflow_bottom = this.slideOverflowBottom
    if (Object.keys(slideOverflow).length > 0) {
      overflowData.slide = slideOverflow
    }

    if (Object.keys(overflowData).length > 0) {
      result.overflow = overflowData
    }

    if (Object.keys(this.overlappingShapes).length > 0) {
      result.overlap = { overlapping_shapes: this.overlappingShapes }
    }

    if (this.warnings.length > 0) {
      result.warnings = this.warnings
    }

    return result
  }
}

/**
 * Check if a shape contains meaningful text content
 */
function isValidShape(shapeElement: Element): boolean {
  const txBody = getChildByLocalName(shapeElement, 'txBody')
  if (!txBody) return false

  // Get text content
  const textRuns = txBody.getElementsByTagNameNS(NS_A, 't')
  const text = Array.from(textRuns)
    .map((run) => run.textContent || '')
    .join('')
    .trim()

  if (!text) return false

  // Check if it's a slide number or numeric footer
  const nvSpPr = getChildByLocalName(shapeElement, 'nvSpPr')
  if (nvSpPr) {
    const nvPr = getChildByLocalName(nvSpPr, 'nvPr')
    if (nvPr) {
      const ph = getChildByLocalName(nvPr, 'ph')
      if (ph) {
        const type = ph.getAttribute('type')
        if (type === 'sldNum' || type === 'ftr') {
          if (/^\d+$/.test(text)) return false
        }
      }
    }
  }

  return true
}

/**
 * Recursively collect all shapes with valid text, calculating absolute positions
 */
function collectShapesWithAbsolutePositions(
  shapeElement: Element,
  parentLeft: number = 0,
  parentTop: number = 0
): ShapeWithPosition[] {
  // Check if it's a group shape (grpSp element)
  if (shapeElement.localName === 'grpSp') {
    const result: ShapeWithPosition[] = []
    const xfrm = getChildByLocalName(shapeElement, 'xfrm')
    let groupLeft = 0
    let groupTop = 0

    if (xfrm) {
      const off = getChildByLocalName(xfrm, 'off')
      if (off) {
        groupLeft = getAttributeNumber(off, 'x')
        groupTop = getAttributeNumber(off, 'y')
      }
    }

    const absGroupLeft = parentLeft + groupLeft
    const absGroupTop = parentTop + groupTop

    // Process children (both sp and nested grpSp)
    const spChildren = getChildrenByLocalName(shapeElement, 'sp')
    for (const child of spChildren) {
      result.push(...collectShapesWithAbsolutePositions(child, absGroupLeft, absGroupTop))
    }
    
    const grpSpChildren = getChildrenByLocalName(shapeElement, 'grpSp')
    for (const child of grpSpChildren) {
      result.push(...collectShapesWithAbsolutePositions(child, absGroupLeft, absGroupTop))
    }

    return result
  }

  // Regular shape (sp element) - check if it has valid text
  if (isValidShape(shapeElement)) {
    const xfrm = getChildByLocalName(shapeElement, 'xfrm')
    let shapeLeft = 0
    let shapeTop = 0

    if (xfrm) {
      const off = getChildByLocalName(xfrm, 'off')
      if (off) {
        shapeLeft = getAttributeNumber(off, 'x')
        shapeTop = getAttributeNumber(off, 'y')
      }
    }

    return [
      {
        shapeElement,
        absoluteLeft: parentLeft + shapeLeft,
        absoluteTop: parentTop + shapeTop,
      },
    ]
  }

  return []
}

/**
 * Sort shapes by visual position (top-to-bottom, left-to-right)
 */
function sortShapesByPosition(shapes: ShapeData[]): ShapeData[] {
  if (shapes.length === 0) return shapes

  // Sort by top position first
  const sorted = [...shapes].sort((a, b) => {
    if (Math.abs(a.top - b.top) > 0.5) {
      return a.top - b.top
    }
    return a.left - b.left
  })

  return sorted
}

/**
 * Calculate if two rectangles overlap
 */
function calculateOverlap(
  rect1: [number, number, number, number], // left, top, width, height
  rect2: [number, number, number, number],
  tolerance: number = 0.05
): [boolean, number] {
  const [left1, top1, w1, h1] = rect1
  const [left2, top2, w2, h2] = rect2

  const overlapWidth = Math.min(left1 + w1, left2 + w2) - Math.max(left1, left2)
  const overlapHeight = Math.min(top1 + h1, top2 + h2) - Math.max(top1, top2)

  if (overlapWidth > tolerance && overlapHeight > tolerance) {
    const overlapArea = Math.round(overlapWidth * overlapHeight * 100) / 100
    return [true, overlapArea]
  }

  return [false, 0]
}

/**
 * Detect overlapping shapes
 */
function detectOverlaps(shapes: ShapeData[]): void {
  const n = shapes.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const shape1 = shapes[i]
      const shape2 = shapes[j]

      if (!shape1.shapeId || !shape2.shapeId) continue

      const rect1: [number, number, number, number] = [shape1.left, shape1.top, shape1.width, shape1.height]
      const rect2: [number, number, number, number] = [shape2.left, shape2.top, shape2.width, shape2.height]

      const [overlaps, overlapArea] = calculateOverlap(rect1, rect2)

      if (overlaps) {
        shape1.overlappingShapes[shape2.shapeId] = overlapArea
        shape2.overlappingShapes[shape1.shapeId] = overlapArea
      }
    }
  }
}

/**
 * Extract text inventory from a PowerPoint presentation
 */
export async function extractTextInventory(
  pptxPathOrBuffer: string | Buffer,
  issuesOnly: boolean = false
): Promise<InventoryData> {
  const zip = await JSZip.loadAsync(pptxPathOrBuffer)

  const inventory: InventoryData = {}

  // Find all slide XML files
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
      return numA - numB
    })

  const parser = new DOMParser()

  for (let slideIdx = 0; slideIdx < slideFiles.length; slideIdx++) {
    const slideFile = slideFiles[slideIdx]
    const slideXml = await zip.file(slideFile)?.async('string')
    
    if (!slideXml) continue

    const slideDoc = parser.parseFromString(slideXml, 'application/xml')
    const sld = slideDoc.documentElement

    // Get all shape elements from the slide
    const spTree = getChildByLocalName(sld, 'cSld')
    if (!spTree) continue

    const spTreeElement = getChildByLocalName(spTree, 'spTree')
    if (!spTreeElement) continue

    // Collect all shapes with absolute positions (both sp and grpSp elements)
    const shapesWithPositions: ShapeWithPosition[] = []
    const shapeElements = getChildrenByLocalName(spTreeElement, 'sp')
    
    for (const shapeElement of shapeElements) {
      shapesWithPositions.push(...collectShapesWithAbsolutePositions(shapeElement))
    }

    // Also process group shapes at root level
    const grpSpElements = getChildrenByLocalName(spTreeElement, 'grpSp')
    for (const grpSpElement of grpSpElements) {
      shapesWithPositions.push(...collectShapesWithAbsolutePositions(grpSpElement))
    }

    if (shapesWithPositions.length === 0) continue

    // Convert to ShapeData
    const shapeDataList = shapesWithPositions.map((swp) => {
      return new ShapeData(swp.shapeElement, swp.absoluteLeft, swp.absoluteTop, slideDoc)
    })

    // Sort by visual position and assign stable IDs
    const sortedShapes = sortShapesByPosition(shapeDataList)
    for (let idx = 0; idx < sortedShapes.length; idx++) {
      sortedShapes[idx].shapeId = `shape-${idx}`
    }

    // Detect overlaps
    if (sortedShapes.length > 1) {
      detectOverlaps(sortedShapes)
    }

    // Filter for issues only if requested
    let finalShapes = sortedShapes
    if (issuesOnly) {
      finalShapes = sortedShapes.filter((sd) => sd.hasAnyIssues)
    }

    if (finalShapes.length === 0) continue

    // Create slide inventory
    const slideId = `slide-${slideIdx}`
    inventory[slideId] = {}
    for (const shapeData of finalShapes) {
      inventory[slideId][shapeData.shapeId] = shapeData
    }
  }

  return inventory
}

/**
 * Get inventory as dictionary (JSON-serializable)
 */
export async function getInventoryAsDict(
  pptxPathOrBuffer: string | Buffer,
  issuesOnly: boolean = false
): Promise<Record<string, Record<string, ShapeDataDict>>> {
  const inventory = await extractTextInventory(pptxPathOrBuffer, issuesOnly)

  const dictInventory: Record<string, Record<string, ShapeDataDict>> = {}
  for (const [slideKey, shapes] of Object.entries(inventory)) {
    dictInventory[slideKey] = {}
    for (const [shapeKey, shapeData] of Object.entries(shapes)) {
      dictInventory[slideKey][shapeKey] = shapeData.toDict()
    }
  }

  return dictInventory
}

/**
 * Save inventory to JSON file
 */
export async function saveInventory(
  inventory: InventoryData,
  outputPath: string
): Promise<void> {
  const fs = await import('fs/promises')
  
  const jsonInventory: Record<string, Record<string, ShapeDataDict>> = {}
  for (const [slideKey, shapes] of Object.entries(inventory)) {
    jsonInventory[slideKey] = {}
    for (const [shapeKey, shapeData] of Object.entries(shapes)) {
      jsonInventory[slideKey][shapeKey] = shapeData.toDict()
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(jsonInventory, null, 2), 'utf-8')
}
