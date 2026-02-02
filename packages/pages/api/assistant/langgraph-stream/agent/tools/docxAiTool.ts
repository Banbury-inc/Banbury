import { tool } from "@langchain/core/tools"
import { z } from "zod"

// DOCX editing tool to apply AI-driven document operations
export const docxAiTool = tool(
  async (input: {
    action: string
    documentName?: string
    fileId: string
    operations?: Array<
      | { type: 'insertText'; position: number; text: string }
      | { type: 'replaceText'; startPosition: number; endPosition: number; text: string }
      | { type: 'insertParagraph'; position: number; text: string; style?: string }
      | { type: 'replaceParagraph'; paragraphIndex: number; text: string; style?: string }
      | { type: 'insertHeading'; position: number; text: string; level: number }
      | { type: 'replaceHeading'; headingIndex: number; text: string; level?: number }
      | { type: 'insertList'; position: number; items: string[]; listType: 'bulleted' | 'numbered' }
      | { type: 'insertTable'; position: number; rows: string[][]; hasHeaders?: boolean }
      | { type: 'formatText'; startPosition: number; endPosition: number; formatting: { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number; color?: string } }
      | { type: 'insertImage'; position: number; imageUrl: string; alt?: string; width?: number; height?: number }
      | { type: 'setPageSettings'; margins?: { top: number; bottom: number; left: number; right: number }; orientation?: 'portrait' | 'landscape' }
    >
    htmlContent?: string
    note?: string
  }) => {
    // Construct detailed success message
    const docName = input.documentName || 'the document'
    const opCount = input.operations?.length || 0
    const hasHtmlContent = Boolean(input.htmlContent && input.htmlContent.trim().length > 0)
    
    let successMessage = `Successfully applied changes to ${docName}. `
    
    if (hasHtmlContent) {
      successMessage += `The document content has been updated with the new HTML content. `
    } else if (opCount > 0) {
      successMessage += `Applied ${opCount} operation${opCount !== 1 ? 's' : ''} to the document. `
    }
    
    successMessage += `The changes have been sent to the frontend editor and will be visible to the user immediately. No further action is required.`
    
    if (input.note) {
      successMessage += ` Note: ${input.note}`
    }
    
    // Return payload for the frontend DOCX editor to apply, along with success message
    return {
      success: true,
      message: successMessage,
      action: input.action,
      documentName: input.documentName,
      fileId: input.fileId,
      operations: input.operations || [],
      htmlContent: input.htmlContent,
      note: input.note,
    }
  },
  {
    name: 'docx_ai',
    description:
      'Use this tool to deliver AI-generated DOCX document edits. Provide either a list of operations (preferred) or full htmlContent to replace the document. IMPORTANT: Call this tool only ONCE per user request. After calling this tool, the changes are immediately applied to the document in the frontend. Do not call this tool multiple times for the same edit request.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Add heading', 'Format text', 'Insert table', 'Restructure document')"),
      documentName: z.string().optional().describe('Optional document name for context'),
      fileId: z.string().describe('The ID of the document to edit'),
      operations: z
        .array(
          z.union([
            z.object({ type: z.enum(['insertText']), position: z.number(), text: z.string() }),
            z.object({ type: z.enum(['replaceText']), startPosition: z.number(), endPosition: z.number(), text: z.string() }),
            z.object({ type: z.enum(['insertParagraph']), position: z.number(), text: z.string(), style: z.string().optional() }),
            z.object({ type: z.enum(['replaceParagraph']), paragraphIndex: z.number(), text: z.string(), style: z.string().optional() }),
            z.object({ type: z.enum(['insertHeading']), position: z.number(), text: z.string(), level: z.number() }),
            z.object({ type: z.enum(['replaceHeading']), headingIndex: z.number(), text: z.string(), level: z.number().optional() }),
            z.object({ type: z.enum(['insertList']), position: z.number(), items: z.array(z.string()), listType: z.enum(['bulleted', 'numbered']) }),
            z.object({ type: z.enum(['insertTable']), position: z.number(), rows: z.array(z.array(z.string())), hasHeaders: z.boolean().optional() }),
            z.object({ 
              type: z.enum(['formatText']), 
              startPosition: z.number(), 
              endPosition: z.number(), 
              formatting: z.object({
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                underline: z.boolean().optional(),
                fontSize: z.number().optional(),
                color: z.string().optional()
              })
            }),
            z.object({ type: z.enum(['insertImage']), position: z.number(), imageUrl: z.string(), alt: z.string().optional(), width: z.number().optional(), height: z.number().optional() }),
            z.object({ 
              type: z.enum(['setPageSettings']), 
              margins: z.object({ top: z.number(), bottom: z.number(), left: z.number(), right: z.number() }).optional(),
              orientation: z.enum(['portrait', 'landscape']).optional()
            }),
          ])
        )
        .optional()
        .describe('List of document operations to apply'),
      htmlContent: z.string().optional().describe('Optional full HTML content to replace the current document'),
      note: z.string().optional().describe('Optional notes/instructions for the user'),
    }),
  }
)

