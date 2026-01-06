import { BaseParser } from './BaseParser'
import { TextParser } from './TextParser'
import { emuToPercent } from '../utils/emu-converter'
import { parseColor } from '../utils/color-resolver'
import type { ThemeColors, Paragraph } from '../types/pptx-types'
import type { TableCell, SlideElement } from '../PowerPointViewer'

/**
 * Enhanced TableCell with rich text support
 */
interface EnhancedTableCell extends TableCell {
  paragraphs?: Paragraph[]
  valign?: 'top' | 'middle' | 'bottom'
  borders?: {
    top?: { color: string; width: number }
    right?: { color: string; width: number }
    bottom?: { color: string; width: number }
    left?: { color: string; width: number }
  }
  colspan?: number
  rowspan?: number
}

/**
 * TableParser - Parses table elements from PPTX slides
 *
 * Handles:
 * - <p:graphicFrame> elements containing tables
 * - <a:tbl> table structure
 * - Table rows (<a:tr>) and cells (<a:tc>)
 * - Cell formatting (background, borders, alignment)
 * - Cell text with formatting
 */
export class TableParser extends BaseParser {
  private textParser: TextParser

  constructor(zip: any) {
    super(zip)
    this.textParser = new TextParser(zip)
  }

  /**
   * Parse all table elements from a slide's shape tree
   */
  public parseTables(
    spTree: Element,
    themeColors?: ThemeColors,
    elementIdPrefix: string = 'table'
  ): SlideElement[] {
    const tables: SlideElement[] = []

    try {
      // Get all graphic frame elements (<p:graphicFrame>)
      const graphicFrames = this.getElements(spTree, 'p:graphicFrame')

      for (let i = 0; i < graphicFrames.length; i++) {
        const frame = graphicFrames[i]
        const table = this.parseTable(frame, themeColors, `${elementIdPrefix}-${i + 1}`)
        if (table) {
          tables.push(table)
        }
      }

      this.debug(`Parsed ${tables.length} tables`)
    } catch (error) {
      this.error('Error parsing tables:', error)
    }

    return tables
  }

  /**
   * Parse a single table element (<p:graphicFrame> containing <a:tbl>)
   */
  private parseTable(
    graphicFrame: Element,
    themeColors?: ThemeColors,
    elementId: string = 'table'
  ): SlideElement | null {
    try {
      // Parse transform (position and size)
      const xfrm = this.getFirstElement(graphicFrame, 'p:xfrm')
      if (!xfrm) {
        this.warn('No transform found in graphic frame')
        return null
      }

      const off = this.getFirstElement(xfrm, 'a:off')
      const ext = this.getFirstElement(xfrm, 'a:ext')
      if (!off || !ext) {
        this.warn('No offset or extent found in transform')
        return null
      }

      // Get position and size in EMUs
      const xEmu = this.getAttributeNumber(off, 'x', 0)
      const yEmu = this.getAttributeNumber(off, 'y', 0)
      const cxEmu = this.getAttributeNumber(ext, 'cx', 0)
      const cyEmu = this.getAttributeNumber(ext, 'cy', 0)

      // Convert to percentages
      const x = emuToPercent(xEmu, true)
      const y = emuToPercent(yEmu, false)
      const width = emuToPercent(cxEmu, true)
      const height = emuToPercent(cyEmu, false)

      // Find the table element
      const graphic = this.getFirstElement(graphicFrame, 'a:graphic')
      if (!graphic) {
        this.warn('No graphic element found in graphic frame')
        return null
      }

      const graphicData = this.getFirstElement(graphic, 'a:graphicData')
      if (!graphicData) {
        this.warn('No graphicData found in graphic')
        return null
      }

      // Check if this is a table
      const uri = this.getAttribute(graphicData, 'uri')
      if (!uri.includes('table')) {
        // Not a table, skip
        return null
      }

      const tbl = this.getFirstElement(graphicData, 'a:tbl')
      if (!tbl) {
        this.warn('No table element found in graphicData')
        return null
      }

      // Parse table structure
      const { cells, rows, columns, borderColor, borderWidth, headerRow } =
        this.parseTableStructure(tbl, themeColors)

      if (cells.length === 0) {
        this.warn('No cells found in table')
        return null
      }

      this.debug(`Parsed table with ${rows} rows x ${columns} columns at (${x.toFixed(1)}%, ${y.toFixed(1)}%)`)

      return {
        id: elementId,
        type: 'table',
        x,
        y,
        width,
        height,
        rows,
        columns,
        cells,
        borderColor,
        borderWidth,
        headerRow,
      }
    } catch (error) {
      this.error('Error parsing table element:', error)
      return null
    }
  }

  /**
   * Parse table structure (rows, columns, cells)
   */
  private parseTableStructure(
    tbl: Element,
    themeColors?: ThemeColors
  ): {
    cells: EnhancedTableCell[][]
    rows: number
    columns: number
    borderColor?: string
    borderWidth?: number
    headerRow?: boolean
  } {
    const cells: EnhancedTableCell[][] = []
    let columns = 0
    let borderColor: string | undefined
    let borderWidth: number | undefined
    let headerRow = false

    // Get table properties
    const tblPr = this.getFirstElement(tbl, 'a:tblPr')
    if (tblPr) {
      // Check for first row as header
      const firstRow = this.getFirstElement(tblPr, 'a:firstRow')
      headerRow = firstRow !== null
    }

    // Parse table grid (column widths)
    const tblGrid = this.getFirstElement(tbl, 'a:tblGrid')
    if (tblGrid) {
      const gridCols = this.getElements(tblGrid, 'a:gridCol')
      columns = gridCols.length
    }

    // Parse rows
    const rows = this.getElements(tbl, 'a:tr')

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const rowCells: EnhancedTableCell[] = []

      // Parse cells in this row
      const tcs = this.getElements(row, 'a:tc')

      for (let colIndex = 0; colIndex < tcs.length; colIndex++) {
        const tc = tcs[colIndex]
        const cell = this.parseTableCell(tc, themeColors, rowIndex === 0 && headerRow)

        rowCells.push(cell)

        // Extract border color/width from first cell if not set
        if (rowIndex === 0 && colIndex === 0 && !borderColor) {
          if (cell.borders?.top?.color) {
            borderColor = cell.borders.top.color
            borderWidth = cell.borders.top.width
          }
        }
      }

      cells.push(rowCells)

      // Update column count if this row has more columns
      if (rowCells.length > columns) {
        columns = rowCells.length
      }
    }

    return {
      cells,
      rows: cells.length,
      columns,
      borderColor,
      borderWidth,
      headerRow,
    }
  }

  /**
   * Parse a single table cell (<a:tc>)
   */
  private parseTableCell(
    tc: Element,
    themeColors?: ThemeColors,
    isHeader: boolean = false
  ): EnhancedTableCell {
    const cell: EnhancedTableCell = {
      content: '',
      align: 'left',
      valign: 'top',
    }

    try {
      // Parse text content
      const txBody = this.getFirstElement(tc, 'a:txBody')
      if (txBody) {
        const paragraphs = this.textParser.parseTextBody(txBody, themeColors)
        if (paragraphs.length > 0) {
          cell.paragraphs = paragraphs
          cell.content = this.textParser.extractPlainText(paragraphs)

          // Get formatting from first run
          const firstRun = paragraphs[0]?.runs[0]
          if (firstRun) {
            cell.fontSize = firstRun.fontSize
            cell.fontFace = firstRun.fontFace
            cell.color = firstRun.color?.replace('#', '')
            cell.bold = firstRun.bold || isHeader
            cell.italic = firstRun.italic
          }

          // Get alignment from first paragraph
          const alignment = paragraphs[0]?.alignment
          if (alignment) {
            cell.align = alignment as 'left' | 'center' | 'right'
          }
        }
      }

      // Parse cell properties
      const tcPr = this.getFirstElement(tc, 'a:tcPr')
      if (tcPr) {
        // Vertical alignment
        const anchor = this.getAttribute(tcPr, 'anchor')
        if (anchor === 't') cell.valign = 'top'
        else if (anchor === 'ctr') cell.valign = 'middle'
        else if (anchor === 'b') cell.valign = 'bottom'

        // Background color
        const solidFill = this.getFirstElement(tcPr, 'a:solidFill')
        if (solidFill) {
          const bgColor = parseColor(solidFill, themeColors)
          cell.backgroundColor = bgColor
        }

        // Borders
        cell.borders = this.parseCellBorders(tcPr, themeColors)

        // Grid span (colspan/rowspan)
        const gridSpan = this.getAttributeNumber(tcPr, 'gridSpan', -1)
        if (gridSpan > 1) {
          cell.colspan = gridSpan
        }

        const rowSpan = this.getAttributeNumber(tcPr, 'rowSpan', -1)
        if (rowSpan > 1) {
          cell.rowspan = rowSpan
        }
      }
    } catch (error) {
      this.error('Error parsing table cell:', error)
    }

    return cell
  }

  /**
   * Parse cell borders
   */
  private parseCellBorders(
    tcPr: Element,
    themeColors?: ThemeColors
  ): {
    top?: { color: string; width: number }
    right?: { color: string; width: number }
    bottom?: { color: string; width: number }
    left?: { color: string; width: number }
  } {
    const borders: {
      top?: { color: string; width: number }
      right?: { color: string; width: number }
      bottom?: { color: string; width: number }
      left?: { color: string; width: number }
    } = {}

    try {
      // Parse left border
      const lnL = this.getFirstElement(tcPr, 'a:lnL')
      if (lnL) {
        const border = this.parseBorder(lnL, themeColors)
        if (border) borders.left = border
      }

      // Parse right border
      const lnR = this.getFirstElement(tcPr, 'a:lnR')
      if (lnR) {
        const border = this.parseBorder(lnR, themeColors)
        if (border) borders.right = border
      }

      // Parse top border
      const lnT = this.getFirstElement(tcPr, 'a:lnT')
      if (lnT) {
        const border = this.parseBorder(lnT, themeColors)
        if (border) borders.top = border
      }

      // Parse bottom border
      const lnB = this.getFirstElement(tcPr, 'a:lnB')
      if (lnB) {
        const border = this.parseBorder(lnB, themeColors)
        if (border) borders.bottom = border
      }
    } catch (error) {
      this.error('Error parsing cell borders:', error)
    }

    return borders
  }

  /**
   * Parse a single border line
   */
  private parseBorder(
    ln: Element,
    themeColors?: ThemeColors
  ): { color: string; width: number } | null {
    try {
      // Get width (in EMUs)
      const w = this.getAttributeNumber(ln, 'w', 12700) // Default: 1pt = 12700 EMUs
      const widthPx = w / 12700 // Convert to points (approximately pixels)

      // Get color
      const solidFill = this.getFirstElement(ln, 'a:solidFill')
      if (solidFill) {
        const color = parseColor(solidFill, themeColors)
        return { color, width: widthPx }
      }

      // No fill means no border
      const noFill = this.getFirstElement(ln, 'a:noFill')
      if (noFill) {
        return null
      }

      // Default border
      return { color: '#000000', width: widthPx }
    } catch (error) {
      this.error('Error parsing border:', error)
      return null
    }
  }
}
