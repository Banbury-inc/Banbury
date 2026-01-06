/**
 * Enhanced types for PPTX parsing and rendering
 * These types extend the existing Slide and SlideElement interfaces
 * to support full PPTX formatting fidelity
 */

/**
 * Text run - a segment of text with consistent formatting
 * Corresponds to <a:r> elements in PPTX XML
 */
export interface TextRun {
  text: string
  fontSize?: number // In points (PPTX uses 1/100 points, we convert)
  fontFace?: string // Font family name
  color?: string // Hex color (#RRGGBB)
  bold?: boolean
  italic?: boolean
  underline?: boolean | 'single' | 'double' | 'wave'
  strikethrough?: boolean
  superscript?: boolean
  subscript?: boolean
  highlight?: string // Background color for text highlight
  link?: string // URL for hyperlinks
}

/**
 * Paragraph - contains one or more text runs with paragraph-level formatting
 * Corresponds to <a:p> elements in PPTX XML
 */
export interface Paragraph {
  id: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  lineSpacing?: number // Line spacing multiplier (1.0 = single, 1.5 = 1.5x, etc.)
  spaceBefore?: number // Space before paragraph in points
  spaceAfter?: number // Space after paragraph in points
  indentLevel?: number // Indentation level (0 = no indent)
  bulletType?: 'none' | 'bullet' | 'number' | 'custom'
  bulletChar?: string // Custom bullet character
  runs: TextRun[] // Text runs within this paragraph
}

/**
 * PPTX Theme Colors
 * Extracted from ppt/theme/theme1.xml <a:clrScheme>
 */
export interface ThemeColors {
  dk1: string // Dark 1 (usually text)
  lt1: string // Light 1 (usually background)
  dk2: string // Dark 2
  lt2: string // Light 2
  accent1: string
  accent2: string
  accent3: string
  accent4: string
  accent5: string
  accent6: string
  hyperlink: string
  followedHyperlink: string
}

/**
 * PPTX Font Scheme
 * Extracted from theme
 */
export interface FontScheme {
  majorFont: string // Heading font
  minorFont: string // Body font
}

/**
 * Shadow definition
 */
export interface Shadow {
  color: string
  blur: number // Blur radius in pixels
  offsetX: number // X offset in pixels
  offsetY: number // Y offset in pixels
  opacity: number // 0-1
}

/**
 * Enhanced table cell with rich formatting
 */
export interface EnhancedTableCell {
  content?: string // Legacy plain text content
  paragraphs?: Paragraph[] // Rich text content
  fontSize?: number
  fontFace?: string
  color?: string
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  backgroundColor?: string
  borders?: {
    top?: BorderStyle
    right?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
  }
  colspan?: number
  rowspan?: number
}

/**
 * Comprehensive stroke style for borders and lines
 * Supports full PPTX stroke properties including dash patterns, caps, joins, and transparency
 */
export interface StrokeStyle {
  color: string
  width: number // In points
  dashPattern?: 'solid' | 'dash' | 'dot' | 'dashDot' | 'dashDotDot' | 'lgDash' | 'lgDashDot' | 'lgDashDotDot' | 'sysDash' | 'sysDot'
  lineCap?: 'flat' | 'round' | 'square'
  lineJoin?: 'bevel' | 'miter' | 'round'
  alpha?: number  // 0-1 for transparency (0 = fully transparent, 1 = fully opaque)
  compound?: 'single' | 'double' | 'thickThin' | 'thinThick' | 'triple'
  alignment?: 'center' | 'inset' | 'outset'
}

/**
 * Border style (legacy, use StrokeStyle for new code)
 * @deprecated Use StrokeStyle instead for full feature support
 */
export interface BorderStyle {
  color: string
  width: number // In pixels
  style?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Color definition as parsed from XML
 * Used during parsing before resolving to hex colors
 */
export interface ColorDefinition {
  type: 'srgb' | 'scheme' | 'system'
  value: string // RGB hex (for srgb), scheme name (for scheme), system color name (for system)
  alpha?: number // 0-100 (0 = transparent, 100 = opaque)
  tint?: number // -100 to 100 (lightness adjustment)
  shade?: number // -100 to 100 (darkness adjustment)
  satMod?: number // Saturation modulation percentage
  lumMod?: number // Luminance modulation percentage
}

/**
 * Gradient stop for gradient fills
 */
export interface GradientStop {
  position: number // 0-100 (percentage along gradient)
  color: string // Hex color
}

/**
 * Gradient fill definition
 */
export interface GradientFill {
  type: 'linear' | 'radial'
  angle?: number // For linear gradients (degrees)
  stops: GradientStop[]
  // For radial gradients:
  centerX?: number // 0-100 (percentage)
  centerY?: number // 0-100 (percentage)
}

/**
 * Image reference with relationship ID
 */
export interface ImageReference {
  relationshipId: string // From <a:blip r:embed="rId1"/>
  imageData?: string // Base64 encoded image data
  imagePath?: string // Path in PPTX archive (ppt/media/image1.png)
}

/**
 * Shape geometry definition
 */
export interface ShapeGeometry {
  type: 'preset' | 'custom'
  preset?: string // Preset shape name (rect, ellipse, roundRect, etc.)
  path?: string // SVG path for custom shapes
}

/**
 * Relationship mapping (from _rels/*.xml.rels files)
 */
export interface Relationship {
  id: string // Relationship ID (rId1, rId2, etc.)
  type: string // Relationship type
  target: string // Target path
}

/**
 * Parsed PPTX metadata
 */
export interface PptxMetadata {
  slideWidth?: number // In EMUs
  slideHeight?: number // In EMUs
  theme?: ThemeColors
  fontScheme?: FontScheme
  relationships?: Map<string, Relationship>
}

/**
 * System color mappings (for <a:sysClr> elements)
 */
export const SYSTEM_COLOR_MAP: Record<string, string> = {
  'windowText': '#000000',
  'window': '#FFFFFF',
  'captionText': '#000000',
  'activeCaption': '#0078D7',
  'inactiveCaption': '#99ABB4',
  'menu': '#F0F0F0',
  'menuText': '#000000',
  'activeBorder': '#B4B4B4',
  'inactiveBorder': '#F0F0F0',
  'appWorkspace': '#ABABAB',
  'highlight': '#0078D7',
  'highlightText': '#FFFFFF',
  'btnFace': '#F0F0F0',
  'btnShadow': '#707070',
  'grayText': '#6D6D6D',
  'btnText': '#000000',
  'inactiveCaptionText': '#000000',
  'btnHighlight': '#FFFFFF',
  '3dDkShadow': '#000000',
  '3dLight': '#E3E3E3',
  'infoText': '#000000',
  'infoBk': '#FFFFE1',
  'hotLight': '#0066CC',
  'gradientActiveCaption': '#B9D1EA',
  'gradientInactiveCaption': '#D7E4F2',
  'menuHighlight': '#0078D7',
  'menuBar': '#F0F0F0',
}

/**
 * Preset shape mappings
 */
export const PRESET_SHAPES = [
  'rect', 'ellipse', 'roundRect', 'triangle', 'rtTriangle', 'parallelogram',
  'trapezoid', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star4', 'star5',
  'star6', 'star7', 'star8', 'star10', 'star12', 'star16', 'star24', 'star32',
  'line', 'straightConnector1', 'bentConnector2', 'bentConnector3', 'bentConnector4',
  'bentConnector5', 'curvedConnector2', 'curvedConnector3', 'curvedConnector4',
  'curvedConnector5', 'notchedRightArrow', 'bentUpArrow', 'curvedRightArrow',
  'curvedLeftArrow', 'curvedUpArrow', 'curvedDownArrow', 'stripedRightArrow',
  'leftArrow', 'rightArrow', 'upArrow', 'downArrow', 'leftRightArrow',
  'upDownArrow', 'quadArrow', 'leftRightUpArrow', 'bentArrow', 'uturnArrow',
  'leftUpArrow', 'leftCircularArrow', 'circularArrow', 'swooshArrow',
  'leftRightCircularArrow', 'rightBrace', 'leftBrace', 'leftBracket',
  'rightBracket', 'blockArc', 'smileyFace', 'heart', 'lightningBolt', 'sun',
  'moon', 'cloud', 'gear6', 'gear9', 'funnel', 'plus', 'mathPlus', 'mathMinus',
  'mathMultiply', 'mathDivide', 'mathEqual', 'mathNotEqual', 'corner',
  'diagStripe', 'chord', 'arc', 'leftCircle', 'rightCircle', 'plaque',
  'ellipseRibbon', 'ribbon2', 'ribbon', 'verticalScroll', 'horizontalScroll',
  'wave', 'doubleWave', 'cloudCallout', 'wedgeRectCallout', 'wedgeRoundRectCallout',
  'wedgeEllipseCallout', 'borderCallout1', 'borderCallout2', 'borderCallout3',
  'accentCallout1', 'accentCallout2', 'accentCallout3', 'callout1', 'callout2',
  'callout3', 'accentBorderCallout1', 'accentBorderCallout2', 'accentBorderCallout3',
] as const

export type PresetShapeType = typeof PRESET_SHAPES[number]
