/**
 * Apply text replacements to PowerPoint presentation.
 * 
 * This module provides functionality to:
 * - Clear all text shapes in a presentation
 * - Apply replacement text with formatting (bullets, alignment, fonts, colors)
 * - Validate replacements against inventory
 * - Detect and report text overflow issues
 * 
 * Usage:
 *   const result = await applyReplacements(pptxBuffer, replacements, inventory)
 */

import JSZip from 'jszip'
import { parseString, Builder } from 'xml2js'
import * as fs from 'fs'

// Type definitions
export interface ParagraphDict {
  text: string
  bullet?: boolean
  level?: number
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'
  space_before?: number
  space_after?: number
  line_spacing?: number
  font_name?: string
  font_size?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string  // Hex color (e.g., "FF0000" or "#FF0000")
  theme_color?: string  // Theme color name (e.g., "DARK_1", "ACCENT_1")
}

export interface ShapeReplacement {
  paragraphs?: ParagraphDict[]
}

export interface ReplacementData {
  [slideKey: string]: {
    [shapeKey: string]: ShapeReplacement
  }
}

export interface InventoryData {
  [slideKey: string]: {
    [shapeKey: string]: {
      frame_overflow_bottom?: number
      warnings?: string[]
      [key: string]: any
    }
  }
}

export interface ApplyReplacementsResult {
  success: boolean
  message: string
  shapesProcessed: number
  shapesCleared: number
  shapesReplaced: number
  errors?: string[]
  warnings?: string[]
  buffer?: Buffer  // Modified PPTX buffer
}

// XML namespace constants
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main'

/**
 * Convert points to EMUs (English Metric Units)
 * 1 point = 12700 EMUs
 */
function pointsToEmu(points: number): number {
  return Math.round(points * 12700)
}

/**
 * Convert hex color string to RGB components
 * Accepts formats: "FF0000", "#FF0000", "RGB(255,0,0)"
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let cleanHex = hex.replace('#', '').trim()
  
  // Handle RGB format
  if (cleanHex.startsWith('RGB(')) {
    const match = cleanHex.match(/RGB\((\d+),(\d+),(\d+)\)/)
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
      }
    }
  }
  
  // Handle hex format
  if (cleanHex.length === 6) {
    return {
      r: parseInt(cleanHex.substring(0, 2), 16),
      g: parseInt(cleanHex.substring(2, 4), 16),
      b: parseInt(cleanHex.substring(4, 6), 16)
    }
  }
  
  return null
}

/**
 * Clear all text from a text frame XML element
 */
function clearTextFrame(xmlObj: any): void {
  if (!xmlObj || typeof xmlObj !== 'object') return
  
  // Find the text body (a:txBody or p:txBody)
  const txBody = xmlObj['a:txBody'] || xmlObj['p:txBody']
  if (!txBody || !Array.isArray(txBody) || txBody.length === 0) return
  
  const body = txBody[0]
  
  // Clear all paragraphs but keep the structure
  if (body['a:p']) {
    // Keep only the first paragraph, clear its content
    const firstPara = body['a:p'][0]
    if (firstPara) {
      // Remove all runs
      if (firstPara['a:r']) {
        delete firstPara['a:r']
      }
      // Clear paragraph properties or reset them
      if (firstPara['a:pPr']) {
        // Keep pPr but we'll modify it in applyParagraphProperties
      }
    }
    
    // Remove all other paragraphs
    body['a:p'] = [firstPara]
  }
}

/**
 * Apply paragraph properties to XML paragraph element
 */
function applyParagraphProperties(xmlPara: any, paraData: ParagraphDict): void {
  if (!xmlPara || typeof xmlPara !== 'object') return
  
  // Get or create paragraph properties
  if (!xmlPara['a:pPr']) {
    xmlPara['a:pPr'] = [{}]
  }
  const pPr = xmlPara['a:pPr'][0]
  
  // Clear existing bullet elements
  const bulletKeys = ['a:buChar', 'a:buNone', 'a:buAutoNum', 'a:buFont']
  for (const key of bulletKeys) {
    if (pPr[key]) {
      delete pPr[key]
    }
  }
  
  // Handle bullet formatting
  if (paraData.bullet) {
    const level = paraData.level || 0
    const fontSize = paraData.font_size || 18.0
    
    // Calculate font-proportional indentation
    const levelIndentEmu = Math.round((fontSize * (1.6 + level * 1.6)) * 12700)
    const hangingIndentEmu = Math.round(-fontSize * 0.8 * 12700)
    
    // Set indentation
    pPr['$'] = pPr['$'] || {}
    pPr['$']['marL'] = String(levelIndentEmu)
    pPr['$']['indent'] = String(hangingIndentEmu)
    
    // Add bullet character
    pPr['a:buChar'] = [{
      '$': { 'char': '•' }
    }]
    
    // Default to left alignment for bullets if not specified
    if (!paraData.alignment) {
      pPr['$']['algn'] = 'l'  // left
    }
  } else {
    // Remove indentation for non-bullet text
    pPr['$'] = pPr['$'] || {}
    pPr['$']['marL'] = '0'
    pPr['$']['indent'] = '0'
    
    // Add buNone element
    pPr['a:buNone'] = [{}]
  }
  
  // Apply alignment
  if (paraData.alignment) {
    const alignmentMap: Record<string, string> = {
      'LEFT': 'l',
      'CENTER': 'ctr',
      'RIGHT': 'r',
      'JUSTIFY': 'just'
    }
    if (alignmentMap[paraData.alignment]) {
      pPr['$'] = pPr['$'] || {}
      pPr['$']['algn'] = alignmentMap[paraData.alignment]
    }
  }
  
  // Apply spacing
  if (paraData.space_before !== undefined) {
    pPr['$'] = pPr['$'] || {}
    pPr['$']['spcBef'] = String(pointsToEmu(paraData.space_before))
  }
  if (paraData.space_after !== undefined) {
    pPr['$'] = pPr['$'] || {}
    pPr['$']['spcAft'] = String(pointsToEmu(paraData.space_after))
  }
  if (paraData.line_spacing !== undefined) {
    pPr['$'] = pPr['$'] || {}
    pPr['$']['lnSpc'] = String(pointsToEmu(paraData.line_spacing))
  }
  
  // Create or get the first run
  if (!xmlPara['a:r']) {
    xmlPara['a:r'] = []
  }
  
  let run = xmlPara['a:r'][0]
  if (!run) {
    run = {}
    xmlPara['a:r'] = [run]
  }
  
  // Set text
  if (!run['a:t']) {
    run['a:t'] = []
  }
  run['a:t'][0] = {
    '_': paraData.text || '',
    '$': { 'xml:space': 'preserve' }
  }
  
  // Apply font properties
  applyFontProperties(run, paraData)
}

/**
 * Apply font properties to XML run element
 */
function applyFontProperties(xmlRun: any, paraData: ParagraphDict): void {
  if (!xmlRun || typeof xmlRun !== 'object') return
  
  // Get or create run properties
  if (!xmlRun['a:rPr']) {
    xmlRun['a:rPr'] = [{}]
  }
  const rPr = xmlRun['a:rPr'][0]
  rPr['$'] = rPr['$'] || {}
  
  // Apply font properties
  if (paraData.bold !== undefined) {
    rPr['$']['b'] = paraData.bold ? '1' : '0'
  }
  if (paraData.italic !== undefined) {
    rPr['$']['i'] = paraData.italic ? '1' : '0'
  }
  if (paraData.underline !== undefined) {
    rPr['$']['u'] = paraData.underline ? 'sng' : 'none'
  }
  if (paraData.font_size !== undefined) {
    rPr['$']['sz'] = String(Math.round(paraData.font_size * 100))  // Convert to hundredths of points
  }
  if (paraData.font_name) {
    rPr['a:latin'] = [{
      '$': { 'typeface': paraData.font_name }
    }]
  }
  
  // Apply color - prefer RGB, fall back to theme_color
  if (paraData.color) {
    const rgb = hexToRgb(paraData.color)
    if (rgb) {
      // Create solidFill with RGB color
      rPr['a:solidFill'] = [{
        'a:srgbClr': [{
          '$': {
            'val': `${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`
          }
        }]
      }]
    }
  } else if (paraData.theme_color) {
    // Map theme color names to theme color indices
    const themeColorMap: Record<string, string> = {
      'DARK_1': 'dk1',
      'LIGHT_1': 'lt1',
      'DARK_2': 'dk2',
      'LIGHT_2': 'lt2',
      'ACCENT_1': 'accent1',
      'ACCENT_2': 'accent2',
      'ACCENT_3': 'accent3',
      'ACCENT_4': 'accent4',
      'ACCENT_5': 'accent5',
      'ACCENT_6': 'accent6',
      'HYPERLINK': 'hlink',
      'FOLLOWED_HYPERLINK': 'folHlink'
    }
    
    const themeColor = themeColorMap[paraData.theme_color]
    if (themeColor) {
      rPr['a:solidFill'] = [{
        'a:schemeClr': [{
          '$': { 'val': themeColor }
        }]
      }]
    }
  }
}

/**
 * Detect text overflow in shapes from inventory
 */
function detectFrameOverflow(inventory: InventoryData): Record<string, Record<string, number>> {
  const overflowMap: Record<string, Record<string, number>> = {}
  
  for (const [slideKey, shapesDict] of Object.entries(inventory)) {
    for (const [shapeKey, shapeData] of Object.entries(shapesDict)) {
      // Check for frame overflow (text exceeding shape bounds)
      if (shapeData.frame_overflow_bottom !== undefined) {
        if (!overflowMap[slideKey]) {
          overflowMap[slideKey] = {}
        }
        overflowMap[slideKey][shapeKey] = shapeData.frame_overflow_bottom
      }
    }
  }
  
  return overflowMap
}

/**
 * Validate that all shapes in replacements exist in inventory
 */
export function validateReplacements(
  inventory: InventoryData,
  replacements: ReplacementData
): string[] {
  const errors: string[] = []
  
  for (const [slideKey, shapesData] of Object.entries(replacements)) {
    if (!slideKey.startsWith('slide-')) {
      continue
    }
    
    // Check if slide exists
    if (!inventory[slideKey]) {
      errors.push(`Slide '${slideKey}' not found in inventory`)
      continue
    }
    
    // Check each shape
    for (const shapeKey of Object.keys(shapesData)) {
      if (!inventory[slideKey][shapeKey]) {
        // Find shapes without replacements defined and show their content
        const unusedWithContent: string[] = []
        for (const k of Object.keys(inventory[slideKey])) {
          if (!(k in shapesData)) {
            const shapeData = inventory[slideKey][k]
            // Get text from paragraphs as preview
            const paragraphs = (shapeData as any).paragraphs
            if (paragraphs && Array.isArray(paragraphs) && paragraphs.length > 0 && paragraphs[0].text) {
              let firstText = paragraphs[0].text.substring(0, 50)
              if (paragraphs[0].text.length > 50) {
                firstText += '...'
              }
              unusedWithContent.push(`${k} ('${firstText}')`)
            } else {
              unusedWithContent.push(k)
            }
          }
        }
        
        errors.push(
          `Shape '${shapeKey}' not found on '${slideKey}'. ` +
          `Shapes without replacements: ${unusedWithContent.length > 0 ? unusedWithContent.sort().join(', ') : 'none'}`
        )
      }
    }
  }
  
  return errors
}

/**
 * Find all text shapes in a slide XML and return them in order
 * This matches shapes by their position in the XML structure
 * Only includes shapes that have text frames
 */
function getAllTextShapesInSlide(slideXml: any): any[] {
  const shapes: any[] = []
  
  if (!slideXml || typeof slideXml !== 'object') return shapes
  
  // Find the spTree (shape tree)
  const spTree = slideXml['p:cSld']?.[0]?.['p:spTree']?.[0]
  if (!spTree) return shapes
  
  // Recursively collect all shapes with text frames
  function collectShapes(element: any): void {
    // Regular shapes (p:sp)
    if (element['p:sp']) {
      for (const sp of element['p:sp']) {
        // Check if shape has a text frame
        if (sp['p:txBody'] || sp['a:txBody']) {
          shapes.push(sp)
        }
      }
    }
    
    // Grouped shapes (p:grpSp)
    if (element['p:grpSp']) {
      for (const grpSp of element['p:grpSp']) {
        collectShapes(grpSp)
      }
    }
  }
  
  collectShapes(spTree)
  return shapes
}

/**
 * Apply text replacements to a PowerPoint presentation
 */
export async function applyReplacements(
  pptxFile: string | Buffer,
  replacements: ReplacementData,
  inventory: InventoryData
): Promise<ApplyReplacementsResult> {
  // Load PPTX file
  let pptxBuffer: Buffer
  if (typeof pptxFile === 'string') {
    pptxBuffer = fs.readFileSync(pptxFile)
  } else {
    pptxBuffer = pptxFile
  }
  
  // Load PPTX as ZIP
  const zip = await JSZip.loadAsync(pptxBuffer)
  
  // Detect text overflow in original presentation
  const originalOverflow = detectFrameOverflow(inventory)
  
  // Validate replacements
  const validationErrors = validateReplacements(inventory, replacements)
  if (validationErrors.length > 0) {
    return {
      success: false,
      message: `Found ${validationErrors.length} validation error(s)`,
      shapesProcessed: 0,
      shapesCleared: 0,
      shapesReplaced: 0,
      errors: validationErrors
    }
  }
  
  // Track statistics
  let shapesProcessed = 0
  let shapesCleared = 0
  let shapesReplaced = 0
  
  // Process each slide from inventory
  for (const [slideKey, shapesDict] of Object.entries(inventory)) {
    if (!slideKey.startsWith('slide-')) {
      continue
    }
    
    const slideIndex = parseInt(slideKey.split('-')[1], 10)
    const slidePath = `ppt/slides/slide${slideIndex + 1}.xml`
    
    // Load slide XML
    const slideFile = zip.file(slidePath)
    if (!slideFile) {
      console.warn(`Warning: Slide ${slideIndex} not found`)
      continue
    }
    
    const slideXmlStr = await slideFile.async('string')
    let slideXml: any
    
    // Parse XML
    try {
      slideXml = await new Promise((resolve, reject) => {
        parseString(slideXmlStr, { explicitArray: true }, (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
    } catch (error) {
      console.error(`Error parsing slide ${slideIndex}:`, error)
      continue
    }
    
    // Get all text shapes in order
    const textShapes = getAllTextShapesInSlide(slideXml)
    
    // Process each shape from inventory (in order)
    const sortedShapeKeys = Object.keys(shapesDict).sort((a, b) => {
      const aIndex = parseInt(a.match(/shape-(\d+)/)?.[1] || '0', 10)
      const bIndex = parseInt(b.match(/shape-(\d+)/)?.[1] || '0', 10)
      return aIndex - bIndex
    })
    
    for (let i = 0; i < sortedShapeKeys.length; i++) {
      const shapeKey = sortedShapeKeys[i]
      const shapeData = shapesDict[shapeKey]
      
      // Match shape by index (shapes are sorted in inventory)
      if (i >= textShapes.length) {
        console.warn(`Warning: Shape ${shapeKey} index ${i} exceeds available shapes`)
        continue
      }
      
      const shape = textShapes[i]
      shapesProcessed++
      
      // Clear text frame
      clearTextFrame(shape)
      shapesCleared++
      
      // Check for replacement paragraphs
      const replacementShapeData = replacements[slideKey]?.[shapeKey]
      if (!replacementShapeData?.paragraphs) {
        continue
      }
      
      shapesReplaced++
      
      // Get or create text body
      if (!shape['p:txBody'] && !shape['a:txBody']) {
        // Create text body if it doesn't exist
        shape['p:txBody'] = [{
          '$': { 'xmlns:a': NS_A }
        }]
      }
      
      const txBody = shape['p:txBody']?.[0] || shape['a:txBody']?.[0]
      if (!txBody) {
        console.warn(`Warning: Could not find or create text body for ${shapeKey}`)
        continue
      }
      
      // Clear existing paragraphs
      txBody['a:p'] = []
      
      // Add replacement paragraphs
      for (let i = 0; i < replacementShapeData.paragraphs.length; i++) {
        const paraData = replacementShapeData.paragraphs[i]
        const para: any = {}
        
        applyParagraphProperties(para, paraData)
        
        txBody['a:p'].push(para)
      }
    }
    
    // Convert XML back to string
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8', standalone: true },
      renderOpts: { pretty: false }
    })
    
    const updatedSlideXmlStr = builder.buildObject(slideXml)
    
    // Update ZIP
    zip.file(slidePath, updatedSlideXmlStr)
  }
  
  // Generate updated PPTX buffer
  const updatedPptxBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })
  
  return {
    success: true,
    message: `Successfully applied replacements. Processed ${shapesProcessed} shapes, cleared ${shapesCleared}, replaced ${shapesReplaced}.`,
    shapesProcessed,
    shapesCleared,
    shapesReplaced,
    buffer: updatedPptxBuffer
  }
}

/**
 * Apply replacements and save to output file
 */
export async function applyReplacementsToFile(
  inputFile: string,
  replacements: ReplacementData,
  inventory: InventoryData,
  outputFile: string
): Promise<ApplyReplacementsResult> {
  const result = await applyReplacements(inputFile, replacements, inventory)
  
  if (result.success && result.buffer) {
    // Save the modified buffer to output file
    fs.writeFileSync(outputFile, result.buffer)
    return {
      ...result,
      message: `Saved updated presentation to: ${outputFile}. ${result.message}`
    }
  }
  
  return result
}
