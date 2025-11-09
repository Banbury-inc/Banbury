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
    // Construct detailed success message
    const sheetName = input.sheetName || 'the spreadsheet'
    const opCount = input.operations?.length || 0
    const hasCsvContent = Boolean(input.csvContent && input.csvContent.trim().length > 0)
    
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
      'Use this tool to deliver AI-generated spreadsheet edits. Provide either a list of operations (preferred) or full csvContent to replace the sheet. IMPORTANT: Call this tool only ONCE per user request. After calling this tool, the changes are immediately applied to the spreadsheet in the frontend. Do not call this tool multiple times for the same edit request.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Clean data', 'Normalize columns', 'Apply formula')"),
      sheetName: z.string().optional().describe('Optional sheet name for multi-sheet contexts'),
      operations: z
        .array(
          z.union([
            z.object({ type: z.literal('setCell'), row: z.number(), col: z.number(), value: z.union([z.string(), z.number()]) }),
            z.object({
              type: z.literal('setRange'),
              range: z.object({ startRow: z.number(), startCol: z.number(), endRow: z.number(), endCol: z.number() }),
              values: z.array(z.array(z.union([z.string(), z.number()]))),
            }),
            z.object({ type: z.literal('insertRows'), index: z.number(), count: z.number().optional() }),
            z.object({ type: z.literal('deleteRows'), index: z.number(), count: z.number().optional() }),
            z.object({ type: z.literal('insertCols'), index: z.number(), count: z.number().optional() }),
            z.object({ type: z.literal('deleteCols'), index: z.number(), count: z.number().optional() }),
          ])
        )
        .optional()
        .describe('List of spreadsheet operations to apply'),
      csvContent: z.string().optional().describe('Optional full CSV content to replace the current sheet'),
      note: z.string().optional().describe('Optional notes/instructions for the user'),
    }),
  }
)

