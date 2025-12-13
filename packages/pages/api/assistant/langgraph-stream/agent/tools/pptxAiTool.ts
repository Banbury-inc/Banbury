import { tool } from "@langchain/core/tools"
import { z } from "zod"

// PowerPoint presentation editing tool to apply AI-driven slide operations
export const pptxAiTool = tool(
  async (input: {
    action: string
    presentationName?: string
    operations?: Array<
      | { type: 'createSlide'; slideIndex?: number; layout?: 'title' | 'content' | 'twoColumn' | 'blank'; background?: string }
      | { type: 'deleteSlide'; slideIndex: number }
      | { type: 'reorderSlides'; fromIndex: number; toIndex: number }
      | { type: 'addText'; slideIndex?: number; element: { x: number; y: number; width: number; height: number; content: string; fontSize?: number; fontFace?: string; color?: string; bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'; valign?: 'top' | 'middle' | 'bottom' } }
      | { type: 'addShape'; slideIndex?: number; element: { x: number; y: number; width: number; height: number; shapeType: 'rect' | 'ellipse' | 'triangle' | 'arrow' | 'line'; fill?: string; stroke?: string; strokeWidth?: number } }
      | { type: 'addImage'; slideIndex?: number; element: { x: number; y: number; width: number; height: number; imageUrl: string } }
      | { type: 'updateElement'; slideIndex?: number; elementId: string; element: { x?: number; y?: number; width?: number; height?: number; content?: string; fontSize?: number; color?: string; bold?: boolean; italic?: boolean; fill?: string; stroke?: string } }
      | { type: 'deleteElement'; slideIndex?: number; elementId: string }
      | { type: 'setSlideBackground'; slideIndex?: number; background: string }
      | { type: 'applyTheme'; theme: 'default' | 'dark' | 'light' | 'corporate' | 'creative' }
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
      'Use this tool to create, edit, and modify PowerPoint presentations. You can create slides, add/update/delete elements (text, shapes, images), reorder slides, set backgrounds, and apply themes. IMPORTANT: Call this tool only ONCE per user request. After calling this tool, the changes are immediately applied to the presentation in the frontend. Do not call this tool multiple times for the same edit request. All position and size values (x, y, width, height) are percentages (0-100). NOTE: When you create a new slide with createSlide, it starts completely empty with no default elements. You must add all text, shapes, and other content explicitly using addText, addShape, and addImage operations.',
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
                fontFace: z.string().optional().describe('Font family name'),
                color: z.string().optional().describe('Text color as hex without # (e.g., "363636")'),
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                align: z.enum(['left', 'center', 'right']).optional(),
                valign: z.enum(['top', 'middle', 'bottom']).optional()
              })
            }).describe('Add a text box to a slide'),
            z.object({ 
              type: z.literal('addShape'), 
              slideIndex: z.number().optional(),
              element: z.object({
                x: z.number().describe('X position as percentage'),
                y: z.number().describe('Y position as percentage'),
                width: z.number().describe('Width as percentage'),
                height: z.number().describe('Height as percentage'),
                shapeType: z.enum(['rect', 'ellipse', 'triangle', 'arrow', 'line']).describe('Type of shape'),
                fill: z.string().optional().describe('Fill color as hex (e.g., "#4a90d9")'),
                stroke: z.string().optional().describe('Stroke color as hex'),
                strokeWidth: z.number().optional().describe('Stroke width in pixels')
              })
            }).describe('Add a shape to a slide'),
            z.object({ 
              type: z.literal('addImage'), 
              slideIndex: z.number().optional(),
              element: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                imageUrl: z.string().describe('URL of the image to add')
              })
            }).describe('Add an image to a slide'),
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
                color: z.string().optional(),
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                fill: z.string().optional(),
                stroke: z.string().optional()
              })
            }).describe('Update an existing element'),
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
          ])
        )
        .optional()
        .describe('Array of operations to perform on the presentation'),
      slidesData: z.any().optional().describe('Full slides data for complex operations (replaces all slides)'),
      note: z.string().optional().describe('Additional notes about the presentation changes'),
    }),
  }
)

