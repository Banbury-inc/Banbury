import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Fill style types
type FillStyle = 
  | { kind: 'solid'; color: string }
  | { kind: 'linearGradient'; startColor: string; endColor: string; angleDeg: number }

type BorderStyle = { color: string; width: number }

type HighlightRange = { start: number; end: number; color: string }

// PowerPoint presentation editing tool to apply AI-driven slide operations
export const pptxAiTool = tool(
  async (input: {
    action: string
    presentationName?: string
    operations?: Array<
      | { type: 'createSlide'; slideIndex?: number; layout?: 'title' | 'content' | 'twoColumn' | 'blank'; background?: string }
      | { type: 'deleteSlide'; slideIndex: number }
      | { type: 'reorderSlides'; fromIndex: number; toIndex: number }
      | { type: 'addText'; slideIndex?: number; element: { x: number; y: number; width: number; height: number; content: string; fontSize?: number; fontFace?: string; color?: string; bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'; valign?: 'top' | 'middle' | 'bottom'; textFill?: FillStyle; border?: BorderStyle; highlights?: HighlightRange[] } }
      | { type: 'addShape'; slideIndex?: number; element: { x: number; y: number; width: number; height: number; shapeType: 'rect' | 'ellipse' | 'triangle' | 'arrow' | 'line'; fill?: string | FillStyle; stroke?: string; strokeWidth?: number } }
      | { type: 'addImage'; slideIndex?: number; element: { x: number; y: number; width: number; height: number; imageUrl?: string; driveFileId?: string; s3FileId?: string; s3FileName?: string } }
      | { type: 'updateElement'; slideIndex?: number; elementId: string; element: { x?: number; y?: number; width?: number; height?: number; content?: string; fontSize?: number; fontFace?: string; color?: string; bold?: boolean; italic?: boolean; fill?: string | FillStyle; stroke?: string; textFill?: FillStyle; border?: BorderStyle; highlights?: HighlightRange[] } }
      | { type: 'deleteElement'; slideIndex?: number; elementId: string }
      | { type: 'setSlideBackground'; slideIndex?: number; background: string }
      | { type: 'applyTheme'; theme: 'default' | 'dark' | 'light' | 'corporate' | 'creative' }
      | { type: 'applyTemplate'; templateId: 'professional' | 'creative' | 'minimal'; scope?: 'presentation' | 'slide' }
      | { type: 'highlightText'; slideIndex?: number; elementId: string; substring: string; color: string; occurrence?: number }
    >
    slidesData?: any
    note?: string
  }) => {
    // Construct detailed success message
    const presentationName = input.presentationName || 'the presentation'
    const opCount = input.operations?.length || 0
    const hasSlidesData = Boolean(input.slidesData)
    
    let successMessage = `Successfully applied changes to ${presentationName}. `
    
    if (hasSlidesData) {
      successMessage += `The presentation slides have been updated. `
    } else if (opCount > 0) {
      successMessage += `Applied ${opCount} operation${opCount !== 1 ? 's' : ''} to the presentation. `
      
      // Summarize operations
      const opTypes = input.operations?.map(op => op.type) || []
      const createCount = opTypes.filter(t => t === 'createSlide').length
      const deleteCount = opTypes.filter(t => t === 'deleteSlide').length
      const addTextCount = opTypes.filter(t => t === 'addText').length
      const addShapeCount = opTypes.filter(t => t === 'addShape').length
      const addImageCount = opTypes.filter(t => t === 'addImage').length
      
      const summaryParts = []
      if (createCount > 0) summaryParts.push(`${createCount} slide(s) created`)
      if (deleteCount > 0) summaryParts.push(`${deleteCount} slide(s) deleted`)
      if (addTextCount > 0) summaryParts.push(`${addTextCount} text element(s) added`)
      if (addShapeCount > 0) summaryParts.push(`${addShapeCount} shape(s) added`)
      if (addImageCount > 0) summaryParts.push(`${addImageCount} image(s) added`)
      
      if (summaryParts.length > 0) {
        successMessage += `Summary: ${summaryParts.join(', ')}. `
      }
    }
    
    successMessage += `The changes have been sent to the frontend editor and will be visible to the user immediately. No further action is required.`
    
    if (input.note) {
      successMessage += ` Note: ${input.note}`
    }
    
    // Return payload for the frontend PowerPoint editor to apply
    return {
      success: true,
      message: successMessage,
      action: input.action,
      presentationName: input.presentationName,
      operations: input.operations || [],
      slidesData: input.slidesData,
      note: input.note,
    }
  },
  {
    name: 'pptx_ai',
    description:
      'Use this tool to create, edit, and modify PowerPoint presentations. You can create slides, add/update/delete elements (text, shapes, images), reorder slides, set backgrounds, apply themes, and apply complete templates. Available templates: "professional" (clean business style), "creative" (bold and vibrant), "minimal" (elegant minimalist). Templates apply comprehensive design including colors, fonts, and layouts across the entire presentation while preserving content. IMPORTANT: Call this tool only ONCE per user request. After calling this tool, the changes are immediately applied to the presentation in the frontend. Do not call this tool multiple times for the same edit request. All position and size values (x, y, width, height) are percentages (0-100). NOTE: When you create a new slide with createSlide, it starts completely empty with no default elements. You must add all text, shapes, and other content explicitly using addText, addShape, and addImage operations.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Create title slide', 'Add content slides', 'Insert diagram', 'Apply corporate theme')"),
      presentationName: z.string().optional().describe('Optional presentation name for context'),
      operations: z
        .array(
          z.union([
            z.object({ 
              type: z.literal('createSlide'), 
              slideIndex: z.number().optional().describe('Position to insert slide (0-indexed). If not provided, adds at end'),
              layout: z.enum(['title', 'content', 'twoColumn', 'blank']).optional().describe('Slide layout type'),
              background: z.string().optional().describe('Background color as hex (e.g., "#ffffff")')
            }).describe('Create a new slide'),
            z.object({ 
              type: z.literal('deleteSlide'), 
              slideIndex: z.number().describe('Index of slide to delete (0-indexed)')
            }).describe('Delete a slide'),
            z.object({ 
              type: z.literal('reorderSlides'), 
              fromIndex: z.number().describe('Current index of slide'), 
              toIndex: z.number().describe('New index position')
            }).describe('Move a slide to a new position'),
            z.object({ 
              type: z.literal('addText'), 
              slideIndex: z.number().optional().describe('Slide index (0-indexed). Defaults to current slide'),
              element: z.object({
                x: z.number().describe('X position as percentage (0-100)'),
                y: z.number().describe('Y position as percentage (0-100)'),
                width: z.number().describe('Width as percentage (0-100)'),
                height: z.number().describe('Height as percentage (0-100)'),
                content: z.string().describe('Text content'),
                fontSize: z.number().optional().describe('Font size in points'),
                fontFace: z.string().optional().describe('Font family name (e.g., "Arial", "Times New Roman")'),
                color: z.string().optional().describe('Text color as hex without # (e.g., "363636")'),
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                align: z.enum(['left', 'center', 'right']).optional(),
                valign: z.enum(['top', 'middle', 'bottom']).optional(),
                textFill: z.union([
                  z.object({ kind: z.literal('solid'), color: z.string() }),
                  z.object({ kind: z.literal('linearGradient'), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
                ]).optional().describe('Text box background fill (solid or gradient)'),
                border: z.object({ color: z.string(), width: z.number() }).optional().describe('Text box border'),
                highlights: z.array(z.object({ start: z.number(), end: z.number(), color: z.string() })).optional().describe('Text highlight ranges')
              })
            }).describe('Add a text box to a slide with advanced formatting options'),
            z.object({ 
              type: z.literal('addShape'), 
              slideIndex: z.number().optional(),
              element: z.object({
                x: z.number().describe('X position as percentage'),
                y: z.number().describe('Y position as percentage'),
                width: z.number().describe('Width as percentage'),
                height: z.number().describe('Height as percentage'),
                shapeType: z.enum(['rect', 'ellipse', 'triangle', 'arrow', 'line']).describe('Type of shape'),
                fill: z.union([
                  z.string(),
                  z.object({ kind: z.literal('solid'), color: z.string() }),
                  z.object({ kind: z.literal('linearGradient'), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
                ]).optional().describe('Fill color as hex string or FillStyle object (solid or gradient)'),
                stroke: z.string().optional().describe('Stroke color as hex'),
                strokeWidth: z.number().optional().describe('Stroke width in pixels')
              })
            }).describe('Add a shape to a slide with optional gradient fill'),
            z.object({ 
              type: z.literal('addImage'), 
              slideIndex: z.number().optional(),
              element: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                imageUrl: z.string().optional().describe('URL of the image to add (http/https)'),
                driveFileId: z.string().optional().describe('Google Drive file ID for Drive images'),
                s3FileId: z.string().optional().describe('S3 file ID for uploaded files'),
                s3FileName: z.string().optional().describe('File name for S3 images (required when using s3FileId)')
              })
            }).describe('Add an image to a slide. Use imageUrl for web images, driveFileId for Google Drive images (from attached files with drive:// path), or s3FileId+s3FileName for S3 files (from attached files without drive:// path). At least one image source must be provided.'),
            z.object({ 
              type: z.literal('updateElement'), 
              slideIndex: z.number().optional(),
              elementId: z.string().describe('ID of the element to update'),
              element: z.object({
                x: z.number().optional(),
                y: z.number().optional(),
                width: z.number().optional(),
                height: z.number().optional(),
                content: z.string().optional(),
                fontSize: z.number().optional(),
                fontFace: z.string().optional(),
                color: z.string().optional(),
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                fill: z.union([
                  z.string(),
                  z.object({ kind: z.literal('solid'), color: z.string() }),
                  z.object({ kind: z.literal('linearGradient'), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
                ]).optional(),
                stroke: z.string().optional(),
                textFill: z.union([
                  z.object({ kind: z.literal('solid'), color: z.string() }),
                  z.object({ kind: z.literal('linearGradient'), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
                ]).optional(),
                border: z.object({ color: z.string(), width: z.number() }).optional(),
                highlights: z.array(z.object({ start: z.number(), end: z.number(), color: z.string() })).optional()
              })
            }).describe('Update an existing element with new properties'),
            z.object({ 
              type: z.literal('deleteElement'), 
              slideIndex: z.number().optional(),
              elementId: z.string().describe('ID of the element to delete')
            }).describe('Delete an element from a slide'),
            z.object({ 
              type: z.literal('setSlideBackground'), 
              slideIndex: z.number().optional(),
              background: z.string().describe('Background color as hex')
            }).describe('Set slide background color'),
            z.object({ 
              type: z.literal('applyTheme'), 
              theme: z.enum(['default', 'dark', 'light', 'corporate', 'creative']).describe('Theme to apply')
            }).describe('Apply a theme to the entire presentation'),
            z.object({ 
              type: z.literal('applyTemplate'), 
              templateId: z.enum(['professional', 'creative', 'minimal']).describe('Template ID to apply. Available templates: "professional" (clean business template), "creative" (bold and vibrant), "minimal" (elegant minimalist)'),
              scope: z.enum(['presentation', 'slide']).optional().describe('Scope of template application. "presentation" applies to all slides (default), "slide" applies to current slide only')
            }).describe('Apply a complete template (design, colors, fonts, and layouts) to the presentation. This preserves content while applying consistent styling.'),
            z.object({ 
              type: z.literal('highlightText'), 
              slideIndex: z.number().optional(),
              elementId: z.string().describe('ID of the text element'),
              substring: z.string().describe('Text substring to highlight'),
              color: z.string().describe('Highlight color as hex'),
              occurrence: z.number().optional().describe('Which occurrence to highlight (1-indexed). If not provided, highlights all occurrences')
            }).describe('Highlight specific text within a text element by substring'),
          ])
        )
        .optional()
        .describe('Array of operations to perform on the presentation'),
      slidesData: z.any().optional().describe('Full slides data for complex operations (replaces all slides)'),
      note: z.string().optional().describe('Additional notes about the presentation changes'),
    }),
  }
)

