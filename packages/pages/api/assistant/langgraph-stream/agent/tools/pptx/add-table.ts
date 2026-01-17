import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { percentToInches, formatColor } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const addTableTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    x: number
    y: number
    width: number
    height: number
    rows: string[][] | Array<Array<{
      text: string
      fontSize?: number
      fontFace?: string
      color?: string
      bold?: boolean
      italic?: boolean
      align?: 'left' | 'center' | 'right'
      valign?: 'top' | 'middle' | 'bottom'
      fill?: string
      colspan?: number
      rowspan?: number
    }>>
    borderColor?: string
    borderWidth?: number
    headerRow?: boolean
    align?: 'left' | 'center' | 'right'
    valign?: 'top' | 'middle' | 'bottom'
    fontSize?: number
    fontFace?: string
  }, context: any) => {
    try {
      const sendEvent = getServerContextValue<Function>("sendEvent")
      const token = getServerContextValue<string>("authToken")

      if (!token) {
        throw new Error("Missing auth token in server context")
      }

      const presentationName = input.presentationName || 'Presentation'
      const { pptx, slides, id } = getOrCreatePresentation(input.presentationId, presentationName, input.fileId)

      // Determine target slide
      let targetSlide: any
      if (input.slideIndex !== undefined && slides[input.slideIndex]) {
        targetSlide = slides[input.slideIndex]
      } else if (slides.length > 0) {
        targetSlide = slides[slides.length - 1]
      } else {
        targetSlide = pptx.addSlide()
        slides.push(targetSlide)
      }

      // Convert rows to pptxgenjs table format
      const tableData: any[][] = []
      const headerRow = input.headerRow ?? false
      const defaultFontSize = input.fontSize ?? 14
      const defaultFontFace = input.fontFace ?? 'Arial'
      const defaultColor = '363636'
      const borderColor = formatColor(input.borderColor || 'CCCCCC')
      const borderWidth = input.borderWidth || 1

      for (let rowIndex = 0; rowIndex < input.rows.length; rowIndex++) {
        const row = input.rows[rowIndex]
        const isHeader = headerRow && rowIndex === 0
        const rowData: any[] = []

        for (const cell of row) {
          if (typeof cell === 'string') {
            // Simple string cell
            rowData.push({
              text: cell,
              options: {
                fontSize: defaultFontSize,
                fontFace: defaultFontFace,
                color: defaultColor,
                bold: isHeader,
                align: input.align || 'left',
                valign: input.valign || 'middle',
                fill: isHeader ? { color: '4472C4' } : undefined,
              }
            })
          } else {
            // Cell with formatting options
            rowData.push({
              text: cell.text,
              options: {
                fontSize: cell.fontSize ?? defaultFontSize,
                fontFace: cell.fontFace ?? defaultFontFace,
                color: cell.color ? formatColor(cell.color) : (isHeader ? 'FFFFFF' : defaultColor),
                bold: cell.bold ?? isHeader,
                italic: cell.italic ?? false,
                align: cell.align ?? input.align ?? 'left',
                valign: cell.valign ?? input.valign ?? 'middle',
                fill: cell.fill ? { color: formatColor(cell.fill) } : (isHeader ? { color: '4472C4' } : undefined),
                colspan: cell.colspan,
                rowspan: cell.rowspan,
              }
            })
          }
        }
        tableData.push(rowData)
      }

      // Table options for pptxgenjs
      const tableOptions: any = {
        x: percentToInches(input.x, 'width'),
        y: percentToInches(input.y, 'height'),
        w: percentToInches(input.width, 'width'),
        h: percentToInches(input.height, 'height'),
        border: {
          type: 'solid',
          color: borderColor,
          pt: borderWidth
        },
        fill: { color: 'FFFFFF' },
        align: input.align || 'left',
        valign: input.valign || 'middle',
      }

      if (input.fontSize) {
        tableOptions.fontSize = input.fontSize
      }
      if (input.fontFace) {
        tableOptions.fontFace = input.fontFace
      }

      targetSlide.addTable(tableData, tableOptions)

      // Determine actual slide index
      const actualSlideIndex = input.slideIndex !== undefined && slides[input.slideIndex]
        ? input.slideIndex
        : slides.length - 1

      // Convert table data to frontend format for live update
      const frontendCells: Array<Array<{
        content: string
        fontSize?: number
        fontFace?: string
        color?: string
        bold?: boolean
        italic?: boolean
        align?: 'left' | 'center' | 'right'
        valign?: 'top' | 'middle' | 'bottom'
        backgroundColor?: string
        colspan?: number
        rowspan?: number
      }>> = []

      for (let rowIndex = 0; rowIndex < input.rows.length; rowIndex++) {
        const row = input.rows[rowIndex]
        const isHeader = headerRow && rowIndex === 0
        const frontendRow: any[] = []

        for (const cell of row) {
          if (typeof cell === 'string') {
            frontendRow.push({
              content: cell,
              fontSize: defaultFontSize,
              fontFace: defaultFontFace,
              color: defaultColor,
              bold: isHeader,
              align: input.align || 'left',
              backgroundColor: isHeader ? '#4472C4' : undefined,
            })
          } else {
            frontendRow.push({
              content: cell.text,
              fontSize: cell.fontSize ?? defaultFontSize,
              fontFace: cell.fontFace ?? defaultFontFace,
              color: cell.color || (isHeader ? 'FFFFFF' : defaultColor),
              bold: cell.bold ?? isHeader,
              italic: cell.italic,
              align: cell.align ?? input.align ?? 'left',
              valign: cell.valign ?? input.valign ?? 'middle',
              backgroundColor: cell.fill || (isHeader ? '#4472C4' : undefined),
              colspan: cell.colspan,
              rowspan: cell.rowspan,
            })
          }
        }
        frontendCells.push(frontendRow)
      }

      // Send live update event (presentation must be open in viewer)
      if (sendEvent) {
        sendEvent({
          type: "pptx-live-update",
          presentationId: id,
          fileId: input.fileId,
          operation: "add_table",
          operationData: {
            slideIndex: actualSlideIndex,
            element: {
              id: `table-${Date.now()}`,
              type: 'table',
              x: input.x,
              y: input.y,
              width: input.width,
              height: input.height,
              rows: input.rows.length,
              columns: input.rows[0]?.length || 0,
              cells: frontendCells,
              borderColor: input.borderColor || '#CCCCCC',
              borderWidth: borderWidth,
              headerRow: headerRow,
            }
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Table added with ${input.rows.length} row(s) and ${input.rows[0]?.length || 0} column(s)`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add table: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_add_table',
    description: 'Add a table to a slide. All position and size values (x, y, width, height) are percentages (0-100). The rows parameter is a 2D array where each row is an array of cells. Each cell can be a simple string or an object with formatting options (text, fontSize, fontFace, color, bold, italic, align, valign, fill/backgroundColor, colspan, rowspan). If headerRow is true, the first row will be styled as a header with blue background and white text. IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After adding a table to a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional().describe('Slide index (0-indexed). Defaults to last created slide'),
      x: z.number().describe('X position as percentage (0-100)'),
      y: z.number().describe('Y position as percentage (0-100)'),
      width: z.number().describe('Width as percentage (0-100)'),
      height: z.number().describe('Height as percentage (0-100)'),
      rows: z.array(z.array(z.union([
        z.string(),
        z.object({
          text: z.string(),
          fontSize: z.number().optional(),
          fontFace: z.string().optional(),
          color: z.string().optional().describe('Text color as hex without # (e.g., "363636")'),
          bold: z.boolean().optional(),
          italic: z.boolean().optional(),
          align: z.enum(['left', 'center', 'right']).optional(),
          valign: z.enum(['top', 'middle', 'bottom']).optional(),
          fill: z.string().optional().describe('Background color as hex without # (e.g., "4472C4")'),
          colspan: z.number().optional(),
          rowspan: z.number().optional(),
        })
      ]))).describe('Table rows as 2D array. Each row is an array of cells. Each cell can be a string or an object with formatting options.'),
      borderColor: z.string().optional().describe('Border color as hex without # (e.g., "CCCCCC"). Defaults to "CCCCCC"'),
      borderWidth: z.number().optional().describe('Border width in points. Defaults to 1'),
      headerRow: z.boolean().optional().describe('Whether the first row is a header row (will be styled with blue background and white text). Defaults to false'),
      align: z.enum(['left', 'center', 'right']).optional().describe('Default text alignment for all cells'),
      valign: z.enum(['top', 'middle', 'bottom']).optional().describe('Default vertical alignment for all cells'),
      fontSize: z.number().optional().describe('Default font size in points for all cells (defaults to 14)'),
      fontFace: z.string().optional().describe('Default font family name for all cells (defaults to "Arial")'),
    }),
  }
)
