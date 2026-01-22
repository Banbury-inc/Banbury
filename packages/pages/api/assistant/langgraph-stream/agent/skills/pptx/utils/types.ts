/**
 * TypeScript type definitions for PPTX utilities
 * 
 * These types are used across all PPTX utility functions:
 * - html2pptx: HTML to PPTX conversion
 * - inventory: Extract text inventory from PPTX
 * - rearrange: Rearrange/duplicate slides
 * - replace: Replace text in PPTX
 * - ooxml: Unpack/pack PPTX files
 */

// ============================================================================
// HTML to PPTX Types
// ============================================================================

/**
 * Options for html2pptx conversion
 */
export interface Html2PptxOptions {
  /** Temporary directory for file operations */
  tmpDir?: string
  /** Existing slide to add content to (if null, creates new slide) */
  slide?: any // PptxGenJS Slide type
}

/**
 * Placeholder element extracted from HTML
 */
export interface Placeholder {
  /** Placeholder ID */
  id: string
  /** X position in inches */
  x: number
  /** Y position in inches */
  y: number
  /** Width in inches */
  w: number
  /** Height in inches */
  h: number
}

/**
 * Result from html2pptx conversion
 */
export interface Html2PptxResult {
  /** The created or modified slide */
  slide: any // PptxGenJS Slide type
  /** Array of placeholder elements found in HTML */
  placeholders: Placeholder[]
}

/**
 * Body dimensions from HTML page
 */
export interface BodyDimensions {
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Scroll width in pixels */
  scrollWidth: number
  /** Scroll height in pixels */
  scrollHeight: number
  /** Validation errors */
  errors?: string[]
}

// ============================================================================
// Inventory Types (from inventory.py)
// ============================================================================

/**
 * Paragraph properties extracted from PowerPoint
 */
export interface ParagraphData {
  /** Paragraph text content */
  text: string
  /** Whether paragraph has bullet formatting */
  bullet?: boolean
  /** Bullet level (0-based) */
  level?: number
  /** Text alignment: LEFT, CENTER, RIGHT, JUSTIFY */
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'
  /** Space before paragraph in points */
  space_before?: number
  /** Space after paragraph in points */
  space_after?: number
  /** Font name */
  font_name?: string
  /** Font size in points */
  font_size?: number
  /** Bold formatting */
  bold?: boolean
  /** Italic formatting */
  italic?: boolean
  /** Underline formatting */
  underline?: boolean
  /** RGB color (hex string, e.g., "FF0000") */
  color?: string
  /** Theme color name (e.g., "DARK_1", "ACCENT_1") */
  theme_color?: string
  /** Line spacing in points */
  line_spacing?: number
}

/**
 * Overflow information for a shape
 */
export interface OverflowData {
  /** Frame overflow (text exceeding shape bounds) */
  frame?: {
    /** Overflow at bottom in inches */
    overflow_bottom: number
  }
  /** Slide overflow (shape exceeding slide bounds) */
  slide?: {
    /** Overflow at right edge in inches */
    overflow_right?: number
    /** Overflow at bottom edge in inches */
    overflow_bottom?: number
  }
}

/**
 * Overlap information for a shape
 */
export interface OverlapData {
  /** Dictionary of overlapping shape IDs to overlap area (square inches) */
  overlapping_shapes: Record<string, number>
}

/**
 * NOTE: ShapeData class and InventoryData interface are defined in inventory.ts
 * to avoid conflicts, these types are not re-exported here.
 * 
 * For ShapeData class instance: import { ShapeData } from './inventory'
 * For ShapeDataDict (serialized form): import { ShapeDataDict } from './inventory'
 * For InventoryData: import { InventoryData } from './inventory'
 */

// ============================================================================
// Replace Types (from replace.py)
// ============================================================================

/**
 * Replacement data for a single shape
 */
export interface ShapeReplacementData {
  /** Array of paragraph replacements */
  paragraphs?: ParagraphData[]
}

/**
 * Replacement data structure: slide_id -> { shape_id -> ShapeReplacementData }
 * 
 * All shapes identified by inventory will have their text cleared unless
 * "paragraphs" is specified in the replacement data for that shape.
 */
export type ReplacementData = Record<string, Record<string, ShapeReplacementData>>

/**
 * Validation result for replacements
 */
export interface ReplacementValidationResult {
  /** Array of error messages */
  errors: string[]
  /** Whether validation passed */
  isValid: boolean
}

/**
 * Overflow detection result
 */
export interface OverflowDetectionResult {
  /** slide_id -> { shape_id -> overflow_inches } */
  overflowMap: Record<string, Record<string, number>>
}

// ============================================================================
// Rearrange Types
// ============================================================================

/**
 * Options for rearranging slides
 */
export interface RearrangeOptions {
  /** Sequence of slide indices (0-based) defining new order */
  slideSequence: number[]
  /** Whether to validate slide indices */
  validate?: boolean
}

/**
 * Result from slide duplication
 */
export interface DuplicateSlideResult {
  /** New slide index */
  newSlideIndex: number
  /** Whether duplication was successful */
  success: boolean
}

// ============================================================================
// OOXML Types
// ============================================================================

/**
 * Options for unpacking PPTX
 */
export interface UnpackOptions {
  /** Whether to pretty-print XML files */
  prettyPrint?: boolean
  /** Output directory (defaults to input file name without extension) */
  outputDir?: string
}

/**
 * Options for packing PPTX
 */
export interface PackOptions {
  /** Whether to validate the packed file */
  validate?: boolean
  /** Whether to condense XML (remove pretty-printing) */
  condenseXml?: boolean
}

/**
 * OOXML file entry
 */
export interface OoxmlFileEntry {
  /** File path within PPTX */
  path: string
  /** File content */
  content: string | Buffer
  /** Whether file is XML */
  isXml?: boolean
}

/**
 * OOXML directory structure
 */
export interface OoxmlDirectory {
  /** Map of file paths to file entries */
  files: Record<string, OoxmlFileEntry>
  /** Relationships data */
  relationships?: Record<string, any>
}

// ============================================================================
// Common Utility Types
// ============================================================================

/**
 * Position and dimensions in inches
 */
export interface Position {
  /** X position in inches */
  x: number
  /** Y position in inches */
  y: number
  /** Width in inches */
  w: number
  /** Height in inches */
  h: number
}

/**
 * Position and dimensions in EMUs (English Metric Units)
 */
export interface PositionEmu {
  /** X position in EMUs */
  x: number
  /** Y position in EMUs */
  y: number
  /** Width in EMUs */
  w: number
  /** Height in EMUs */
  h: number
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error message */
  message: string
  /** Error code (optional) */
  code?: string
  /** Related file or element (optional) */
  source?: string
}

/**
 * Result with validation errors
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Array of validation errors */
  errors: ValidationError[]
}

// ============================================================================
// PptxGenJS Type Helpers
// ============================================================================

/**
 * Type for PptxGenJS presentation instance
 * (This is a placeholder - actual type would come from @types/pptxgenjs)
 */
export type PptxGenJSPresentation = any

/**
 * Type for PptxGenJS slide instance
 * (This is a placeholder - actual type would come from @types/pptxgenjs)
 */
export type PptxGenJSSlide = any

// ============================================================================
// Operation Types (for PPTX tools)
// ============================================================================

/**
 * Operation types for pptx_ai tool
 */
export type PptxOperation =
  | { type: 'useTemplate'; templatePath: string }
  | { type: 'extractInventory'; slideIndex?: number }
  | { type: 'rearrangeSlides'; sequence: number[] }
  | { type: 'replaceText'; replacements: ReplacementData }
