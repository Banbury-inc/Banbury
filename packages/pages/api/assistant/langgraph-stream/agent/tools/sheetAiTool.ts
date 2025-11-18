import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Spreadsheet editing tool to apply AI-driven spreadsheet operations
export const sheetAiTool = tool(
  async (input: {
    action: string
    sheetName?: string
    operations?: Array<
      | { type: 'setCell'; row: number; col: number; value: string | number }
      | { type: 'setRange'; range: { startRow: number; startCol: number; endRow: number; endCol: number }; values: (string | number)[][] }
      | { type: 'insertRows'; index: number; count?: number }
      | { type: 'deleteRows'; index: number; count?: number }
      | { type: 'insertCols'; index: number; count?: number }
      | { type: 'deleteCols'; index: number; count?: number }
    >
    csvContent?: string
    note?: string
  }) => {
    // Validate that at least one of operations or csvContent is provided
    const opCount = input.operations?.length || 0
    const hasCsvContent = Boolean(input.csvContent && input.csvContent.trim().length > 0)
    
    if (!hasCsvContent && opCount === 0) {
      return {
        success: false,
        message: 'ERROR: No operations or csvContent provided. You must provide either a list of operations or csvContent to apply changes to the spreadsheet. Without these, no changes can be applied.',
        action: input.action,
        sheetName: input.sheetName,
        operations: [],
        csvContent: undefined,
        note: input.note,
      }
    }
    
    // Construct detailed success message
    const sheetName = input.sheetName || 'the spreadsheet'
    
    let successMessage = `Successfully applied changes to ${sheetName}. `
    
    if (hasCsvContent) {
      successMessage += `The spreadsheet content has been updated with the new CSV content. `
    } else if (opCount > 0) {
      successMessage += `Applied ${opCount} operation${opCount !== 1 ? 's' : ''} to the spreadsheet. `
    }
    
    successMessage += `The changes have been sent to the frontend editor and will be visible to the user immediately. No further action is required.`
    
    if (input.note) {
      successMessage += ` Note: ${input.note}`
    }
    
    // Return payload for the frontend spreadsheet editor to apply, along with success message
    return {
      success: true,
      message: successMessage,
      action: input.action,
      sheetName: input.sheetName,
      operations: input.operations || [],
      csvContent: input.csvContent,
      note: input.note,
    }
  },
  {
    name: 'sheet_ai',
    description:
      'Use this tool to deliver AI-generated spreadsheet edits. REQUIRED: You MUST provide either a list of operations (preferred) OR full csvContent to replace the sheet. Without operations or csvContent, no changes will be applied. IMPORTANT: Call this tool only ONCE per user request. After calling this tool, the changes are immediately applied to the spreadsheet in the frontend. Do not call this tool multiple times for the same edit request.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Clean data', 'Normalize columns', 'Apply formula')"),
      sheetName: z.string().optional().describe('Optional sheet name for multi-sheet contexts'),
      operations: z
        .array(
          z.union([
            z.object({ 
              type: z.literal('setCell'), 
              row: z.number().describe('Row index (0-indexed, where 0 is the first row)'), 
              col: z.number().describe('Column index (0-indexed, where 0 is column A)'), 
              value: z.union([z.string(), z.number()]).describe('The value to set in the cell')
            }).describe('Set a single cell value. Example: {type: "setCell", row: 0, col: 0, value: "Header"} sets cell A1 to "Header"'),
            z.object({
              type: z.literal('setRange'),
              range: z.object({ 
                startRow: z.number().describe('Starting row index (0-indexed)'), 
                startCol: z.number().describe('Starting column index (0-indexed)'), 
                endRow: z.number().describe('Ending row index (0-indexed, inclusive)'), 
                endCol: z.number().describe('Ending column index (0-indexed, inclusive)')
              }),
              values: z.array(z.array(z.union([z.string(), z.number()]))).describe('2D array of values to set. Each inner array represents a row. Example: [["A", "B"], ["1", "2"]] sets two rows with two columns each'),
            }).describe('Set values for a range of cells. Example: {type: "setRange", range: {startRow: 0, startCol: 0, endRow: 1, endCol: 1}, values: [["A", "B"], ["C", "D"]]} sets a 2x2 range'),
            z.object({ 
              type: z.literal('insertRows'), 
              index: z.number().describe('Row index where to insert (0-indexed, rows will be inserted before this index)'), 
              count: z.number().optional().describe('Number of rows to insert (default: 1)')
            }).describe('Insert one or more empty rows. Example: {type: "insertRows", index: 1, count: 2} inserts 2 empty rows before row 2'),
            z.object({ 
              type: z.literal('deleteRows'), 
              index: z.number().describe('Row index where to start deleting (0-indexed)'), 
              count: z.number().optional().describe('Number of rows to delete (default: 1)')
            }).describe('Delete one or more rows. Example: {type: "deleteRows", index: 1, count: 2} deletes 2 rows starting from row 2'),
            z.object({ 
              type: z.literal('insertCols'), 
              index: z.number().describe('Column index where to insert (0-indexed, columns will be inserted before this index)'), 
              count: z.number().optional().describe('Number of columns to insert (default: 1)')
            }).describe('Insert one or more empty columns. Example: {type: "insertCols", index: 0, count: 1} inserts 1 empty column at the beginning (before column A)'),
            z.object({ 
              type: z.literal('deleteCols'), 
              index: z.number().describe('Column index where to start deleting (0-indexed)'), 
              count: z.number().optional().describe('Number of columns to delete (default: 1)')
            }).describe('Delete one or more columns. Example: {type: "deleteCols", index: 1, count: 1} deletes column B'),
          ])
        )
        .optional()
        .describe('REQUIRED if csvContent is not provided. List of spreadsheet operations to apply. Each operation modifies the spreadsheet. Row and column indices are 0-indexed (0 = first row/column A). Example: [{type: "insertCols", index: 0, count: 1}, {type: "setCell", row: 0, col: 0, value: "URL"}] inserts a column and sets its header'),
      csvContent: z.string().optional().describe('REQUIRED if operations is not provided. Full CSV content to replace the entire sheet. Use this when you need to replace all data. Format: comma-separated values with newlines between rows. Example: "Name,Age\\nJohn,30\\nJane,25"'),
      note: z.string().optional().describe('Optional notes/instructions for the user'),
    }),
  }
)

