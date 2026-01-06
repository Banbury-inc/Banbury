import { BaseParser } from './BaseParser'
import type { Paragraph, TextRun, ThemeColors, ColorDefinition } from '../types/pptx-types'

/**
 * TextParser - Parses rich text from PPTX <p:txBody> elements
 *
 * Handles:
 * - Multiple paragraphs (<a:p>)
 * - Multiple runs per paragraph (<a:r>)
 * - Text formatting (font, size, color, bold, italic, underline, etc.)
 * - Paragraph formatting (alignment, line spacing, bullets)
 * - Theme color resolution
 */
export class TextParser extends BaseParser {
  /**
   * Parse text body (<p:txBody> or <a:txBody>) into paragraphs
   */
  public parseTextBody(
    txBody: Element | null,
    themeColors?: ThemeColors
  ): Paragraph[] {
    if (!txBody) return []

    const paragraphs: Paragraph[] = []
    const paragraphElements = this.getElements(txBody, 'a:p')

    for (let i = 0; i < paragraphElements.length; i++) {
      const pElem = paragraphElements[i]
      const paragraph = this.parseParagraph(pElem, i, themeColors)
      if (paragraph) {
        paragraphs.push(paragraph)
      }
    }

    return paragraphs
  }

  /**
   * Parse a single paragraph (<a:p>)
   */
  private parseParagraph(
    pElem: Element,
    index: number,
    themeColors?: ThemeColors
  ): Paragraph | null {
    try {
      // Parse paragraph properties (<a:pPr>)
      const pPr = this.getFirstElement(pElem, 'a:pPr')
      const paragraphProps = this.parseParagraphProperties(pPr)

      // Parse runs (<a:r>)
      const runElements = this.getElements(pElem, 'a:r')
      const runs: TextRun[] = []

      for (const runElem of runElements) {
        const run = this.parseRun(runElem, themeColors)
        if (run && run.text) {
          runs.push(run)
        }
      }

      // If no runs but has direct text, create a single run
      if (runs.length === 0) {
        const textElements = this.getElements(pElem, 'a:t')
        if (textElements.length > 0) {
          const text = textElements.map(t => t.textContent || '').join('')
          if (text) {
            runs.push({ text })
          }
        }
      }

      // Skip empty paragraphs
      if (runs.length === 0) {
        return null
      }

      return {
        id: `paragraph-${index}-${Date.now()}`,
        ...paragraphProps,
        runs,
      }
    } catch (error) {
      this.error('Error parsing paragraph:', error)
      return null
    }
  }

  /**
   * Parse paragraph properties (<a:pPr>)
   */
  private parseParagraphProperties(pPr: Element | null): Partial<Paragraph> {
    if (!pPr) return {}

    const props: Partial<Paragraph> = {}

    // Alignment
    const algn = this.getAttribute(pPr, 'algn')
    if (algn) {
      if (algn === 'l') props.alignment = 'left'
      else if (algn === 'ctr') props.alignment = 'center'
      else if (algn === 'r') props.alignment = 'right'
      else if (algn === 'just' || algn === 'justLow') props.alignment = 'justify'
    }

    // Indentation level
    const lvl = this.getAttributeNumber(pPr, 'lvl', -1)
    if (lvl >= 0) {
      props.indentLevel = lvl
    }

    // Line spacing
    const lnSpc = this.getFirstElement(pPr, 'a:lnSpc')
    if (lnSpc) {
      const spcPct = this.getFirstElement(lnSpc, 'a:spcPct')
      if (spcPct) {
        const val = this.getAttributeNumber(spcPct, 'val', 100000)
        // PPTX uses percentage * 1000 (100000 = 100% = single spacing)
        props.lineSpacing = val / 100000
      }
    }

    // Space before
    const spcBef = this.getFirstElement(pPr, 'a:spcBef')
    if (spcBef) {
      const spcPts = this.getFirstElement(spcBef, 'a:spcPts')
      if (spcPts) {
        const val = this.getAttributeNumber(spcPts, 'val', 0)
        // PPTX uses 1/100 points
        props.spaceBefore = val / 100
      }
    }

    // Space after
    const spcAft = this.getFirstElement(pPr, 'a:spcAft')
    if (spcAft) {
      const spcPts = this.getFirstElement(spcAft, 'a:spcPts')
      if (spcPts) {
        const val = this.getAttributeNumber(spcPts, 'val', 0)
        props.spaceAfter = val / 100
      }
    }

    // Bullet/numbering
    const buNone = this.getFirstElement(pPr, 'a:buNone')
    const buChar = this.getFirstElement(pPr, 'a:buChar')
    const buAutoNum = this.getFirstElement(pPr, 'a:buAutoNum')

    if (buNone) {
      props.bulletType = 'none'
    } else if (buChar) {
      props.bulletType = 'bullet'
      props.bulletChar = this.getAttribute(buChar, 'char', '•')
    } else if (buAutoNum) {
      props.bulletType = 'number'
    }

    return props
  }

  /**
   * Parse a text run (<a:r>)
   */
  private parseRun(
    runElem: Element,
    themeColors?: ThemeColors
  ): TextRun | null {
    try {
      // Get text content (<a:t>)
      const textElem = this.getFirstElement(runElem, 'a:t')
      if (!textElem) return null

      const text = textElem.textContent || ''
      if (!text) return null

      // Parse run properties (<a:rPr>)
      const rPr = this.getFirstElement(runElem, 'a:rPr')
      const runProps = this.parseRunProperties(rPr, themeColors)

      return {
        text,
        ...runProps,
      }
    } catch (error) {
      this.error('Error parsing run:', error)
      return null
    }
  }

  /**
   * Parse run properties (<a:rPr>)
   */
  private parseRunProperties(
    rPr: Element | null,
    themeColors?: ThemeColors
  ): Partial<TextRun> {
    if (!rPr) return {}

    const props: Partial<TextRun> = {}

    // Font size (in 1/100 points)
    const sz = this.getAttributeNumber(rPr, 'sz', -1)
    if (sz > 0) {
      props.fontSize = sz / 100
    }

    // Bold
    const b = this.getAttribute(rPr, 'b')
    if (b === '1' || b === 'true') {
      props.bold = true
    }

    // Italic
    const i = this.getAttribute(rPr, 'i')
    if (i === '1' || i === 'true') {
      props.italic = true
    }

    // Underline
    const u = this.getAttribute(rPr, 'u')
    if (u) {
      if (u === 'none') {
        props.underline = false
      } else if (u === 'sng') {
        props.underline = 'single'
      } else if (u === 'dbl') {
        props.underline = 'double'
      } else if (u === 'wave') {
        props.underline = 'wave'
      } else {
        props.underline = true
      }
    }

    // Strikethrough
    const strike = this.getAttribute(rPr, 'strike')
    if (strike === 'sngStrike' || strike === 'dblStrike') {
      props.strikethrough = true
    }

    // Baseline (superscript/subscript)
    const baseline = this.getAttributeNumber(rPr, 'baseline', 0)
    if (baseline > 0) {
      props.superscript = true
    } else if (baseline < 0) {
      props.subscript = true
    }

    // Font face
    const latin = this.getFirstElement(rPr, 'a:latin')
    if (latin) {
      props.fontFace = this.getAttribute(latin, 'typeface')
    }

    // Text color
    const solidFill = this.getFirstElement(rPr, 'a:solidFill')
    if (solidFill) {
      props.color = this.parseColor(solidFill, themeColors)
    }

    // Highlight (background color)
    const highlight = this.getFirstElement(rPr, 'a:highlight')
    if (highlight) {
      props.highlight = this.parseColor(highlight, themeColors)
    }

    // Hyperlink
    const hlinkClick = this.getFirstElement(rPr, 'a:hlinkClick')
    if (hlinkClick) {
      const href = this.getAttribute(hlinkClick, 'r:id')
      if (href) {
        props.link = href // Will need to resolve relationship later
      }
    }

    return props
  }

  /**
   * Parse color from fill element
   */
  private parseColor(
    fillElem: Element,
    themeColors?: ThemeColors
  ): string {
    // RGB color (<a:srgbClr val="FF0000"/>)
    const srgbClr = this.getFirstElement(fillElem, 'a:srgbClr')
    if (srgbClr) {
      const val = this.getAttribute(srgbClr, 'val')
      if (val) {
        return `#${val}`
      }
    }

    // Scheme color (<a:schemeClr val="accent1"/>)
    const schemeClr = this.getFirstElement(fillElem, 'a:schemeClr')
    if (schemeClr && themeColors) {
      const val = this.getAttribute(schemeClr, 'val') as keyof ThemeColors
      if (val && themeColors[val]) {
        return themeColors[val]
      }
    }

    // System color (<a:sysClr val="windowText"/>)
    const sysClr = this.getFirstElement(fillElem, 'a:sysClr')
    if (sysClr) {
      const val = this.getAttribute(sysClr, 'val')
      // Map system colors to defaults
      const systemColorMap: Record<string, string> = {
        'windowText': '#000000',
        'window': '#FFFFFF',
        'captionText': '#000000',
        'menuText': '#000000',
        'btnText': '#000000',
      }
      return systemColorMap[val] || '#000000'
    }

    // Default to black
    return '#000000'
  }

  /**
   * Extract plain text from paragraphs (for backward compatibility)
   */
  public extractPlainText(paragraphs: Paragraph[]): string {
    return paragraphs
      .map(p => p.runs.map(r => r.text).join(''))
      .join('\n')
  }

  /**
   * Get default font size from paragraph (first run's font size)
   */
  public getDefaultFontSize(paragraphs: Paragraph[]): number {
    for (const p of paragraphs) {
      for (const r of p.runs) {
        if (r.fontSize) {
          return r.fontSize
        }
      }
    }
    return 18 // Default fallback
  }

  /**
   * Get default font face from paragraph (first run's font)
   */
  public getDefaultFontFace(paragraphs: Paragraph[]): string {
    for (const p of paragraphs) {
      for (const r of p.runs) {
        if (r.fontFace) {
          return r.fontFace
        }
      }
    }
    return 'Arial' // Default fallback
  }
}
