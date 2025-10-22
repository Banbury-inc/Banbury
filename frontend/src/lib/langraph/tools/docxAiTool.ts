import { tool } from "@langchain/core/tools"
import { z } from "zod"

// DOCX editing tool to apply AI-driven document operations
export const docxAiTool = tool(
  async (input: {
    action: string
    documentName?: string
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
    // Return payload for the frontend DOCX editor to apply
    return {
      action: input.action,
      documentName: input.documentName,
      operations: input.operations || [],
      htmlContent: input.htmlContent,
      note: input.note,
    }
  },
  {
    name: 'docx_ai',
    description:
      'Use this tool to deliver AI-generated DOCX document edits. Provide either a list of operations (preferred) or full htmlContent to replace the document.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Add heading', 'Format text', 'Insert table', 'Restructure document')"),
      documentName: z.string().optional().describe('Optional document name for context'),
      operations: z
        .array(
          z.union([
            z.object({ type: z.literal('insertText'), position: z.number(), text: z.string() }),
            z.object({ type: z.literal('replaceText'), startPosition: z.number(), endPosition: z.number(), text: z.string() }),
            z.object({ type: z.literal('insertParagraph'), position: z.number(), text: z.string(), style: z.string().optional() }),
            z.object({ type: z.literal('replaceParagraph'), paragraphIndex: z.number(), text: z.string(), style: z.string().optional() }),
            z.object({ type: z.literal('insertHeading'), position: z.number(), text: z.string(), level: z.number() }),
            z.object({ type: z.literal('replaceHeading'), headingIndex: z.number(), text: z.string(), level: z.number().optional() }),
            z.object({ type: z.literal('insertList'), position: z.number(), items: z.array(z.string()), listType: z.enum(['bulleted', 'numbered']) }),
            z.object({ type: z.literal('insertTable'), position: z.number(), rows: z.array(z.array(z.string())), hasHeaders: z.boolean().optional() }),
            z.object({ 
              type: z.literal('formatText'), 
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
            z.object({ type: z.literal('insertImage'), position: z.number(), imageUrl: z.string(), alt: z.string().optional(), width: z.number().optional(), height: z.number().optional() }),
            z.object({ 
              type: z.literal('setPageSettings'), 
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

