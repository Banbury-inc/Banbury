import { tool } from "@langchain/core/tools"
import { z } from "zod"
import PptxGenJS from 'pptxgenjs'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { CONFIG } from '@/lib/config'
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Fill style types
type FillStyle = 
  | { kind: 'solid'; color: string }
  | { kind: 'linearGradient'; startColor: string; endColor: string; angleDeg: number }

type BorderStyle = { color: string; width: number }

type HighlightRange = { start: number; end: number; color: string }

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileInfo: any
}

/**
 * Upload a file to S3
 */
async function uploadFileToS3(filePath: string, token: string, folder: string = 'presentations'): Promise<UploadedFile | null> {
  const apiBase = CONFIG.url
  const fileName = path.basename(filePath)
  
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const blob = new Blob([fileBuffer])
    
    const formData = new FormData()
    formData.append('file', blob, fileName)
    formData.append('device_name', 'ai-assistant')
    formData.append('file_path', `${folder}/${fileName}`)
    formData.append('file_parent', folder)

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!resp.ok) {
      console.error(`Failed to upload ${fileName}: HTTP ${resp.status}`)
      return null
    }

    const data = await resp.json()
    return {
      fileName,
      fileUrl: data?.file_url,
      fileInfo: data?.file_info
    }
  } catch (err) {
    console.error(`Error uploading ${fileName}:`, err)
    return null
  }
}

/**
 * Convert percentage (0-100) to inches for 16:9 layout (10" x 5.625")
 */
function percentToInches(percent: number, dimension: 'width' | 'height'): number {
  const slideWidth = 10
  const slideHeight = 5.625
  
  if (dimension === 'width') {
    return (percent / 100) * slideWidth
  } else {
    return (percent / 100) * slideHeight
  }
}

/**
 * Convert hex color to pptxgenjs format (without #)
 */
function formatColor(color: string): string {
  return color.replace('#', '').toUpperCase()
}

/**
 * Apply operations to a pptxgenjs presentation
 */
function applyOperationsToPptx(pptx: PptxGenJS, operations: any[]): void {
  const slides: any[] = []
  
  for (const op of operations) {
    let targetSlide: any
    
    switch (op.type) {
      case 'createSlide': {
        const slide = pptx.addSlide()
        
        if (op.background) {
          slide.background = { color: formatColor(op.background) }
        }
        
        slides.push(slide)
        break
      }
      
      case 'addText': {
        // Determine target slide
        if (op.slideIndex !== undefined && slides[op.slideIndex]) {
          targetSlide = slides[op.slideIndex]
        } else if (slides.length > 0) {
          targetSlide = slides[slides.length - 1] // Last slide
        } else {
          // No slides exist, create one
          targetSlide = pptx.addSlide()
          slides.push(targetSlide)
        }
        
        const elem = op.element
        const textOptions: any = {
          x: percentToInches(elem.x, 'width'),
          y: percentToInches(elem.y, 'height'),
          w: percentToInches(elem.width, 'width'),
          h: percentToInches(elem.height, 'height'),
        }
        
        if (elem.fontSize) textOptions.fontSize = elem.fontSize
        if (elem.fontFace) textOptions.fontFace = elem.fontFace
        if (elem.color) textOptions.color = formatColor(elem.color)
        if (elem.bold) textOptions.bold = elem.bold
        if (elem.italic) textOptions.italic = elem.italic
        if (elem.align) textOptions.align = elem.align
        if (elem.valign) textOptions.valign = elem.valign
        
        // Handle text fill (background)
        if (elem.textFill) {
          if (elem.textFill.kind === 'solid') {
            textOptions.fill = { color: formatColor(elem.textFill.color) }
          } else if (elem.textFill.kind === 'linearGradient') {
            textOptions.fill = {
              type: 'solid',
              color: formatColor(elem.textFill.startColor)
            }
          }
        }
        
        // Handle border
        if (elem.border) {
          textOptions.line = {
            color: formatColor(elem.border.color),
            width: elem.border.width
          }
        }
        
        targetSlide.addText(elem.content, textOptions)
        break
      }
      
      case 'addShape': {
        if (op.slideIndex !== undefined && slides[op.slideIndex]) {
          targetSlide = slides[op.slideIndex]
        } else if (slides.length > 0) {
          targetSlide = slides[slides.length - 1]
        } else {
          targetSlide = pptx.addSlide()
          slides.push(targetSlide)
        }
        
        const elem = op.element
        const shapeOptions: any = {
          x: percentToInches(elem.x, 'width'),
          y: percentToInches(elem.y, 'height'),
          w: percentToInches(elem.width, 'width'),
          h: percentToInches(elem.height, 'height'),
        }
        
        // Handle fill
        if (elem.fill) {
          if (typeof elem.fill === 'string') {
            shapeOptions.fill = { color: formatColor(elem.fill) }
          } else if (elem.fill.kind === 'solid') {
            shapeOptions.fill = { color: formatColor(elem.fill.color) }
          } else if (elem.fill.kind === 'linearGradient') {
            shapeOptions.fill = {
              type: 'solid',
              color: formatColor(elem.fill.startColor)
            }
          }
        }
        
        // Handle stroke
        if (elem.stroke) {
          shapeOptions.line = {
            color: formatColor(elem.stroke),
            width: elem.strokeWidth || 1
          }
        }
        
        // Map shape types
        let pptxShape = pptx.ShapeType.rect
        switch (elem.shapeType) {
          case 'rect': pptxShape = pptx.ShapeType.rect; break
          case 'ellipse': pptxShape = pptx.ShapeType.ellipse; break
          case 'triangle': pptxShape = pptx.ShapeType.triangle; break
          case 'arrow': pptxShape = pptx.ShapeType.rightArrow; break
          case 'line': pptxShape = pptx.ShapeType.line; break
        }
        
        targetSlide.addShape(pptxShape, shapeOptions)
        break
      }
      
      case 'addImage': {
        if (op.slideIndex !== undefined && slides[op.slideIndex]) {
          targetSlide = slides[op.slideIndex]
        } else if (slides.length > 0) {
          targetSlide = slides[slides.length - 1]
        } else {
          targetSlide = pptx.addSlide()
          slides.push(targetSlide)
        }
        
        const elem = op.element
        const imageOptions: any = {
          x: percentToInches(elem.x, 'width'),
          y: percentToInches(elem.y, 'height'),
          w: percentToInches(elem.width, 'width'),
          h: percentToInches(elem.height, 'height'),
        }
        
        if (elem.imageUrl) {
          imageOptions.path = elem.imageUrl
        }
        
        targetSlide.addImage(imageOptions)
        break
      }
      
      case 'setSlideBackground': {
        if (op.slideIndex !== undefined && slides[op.slideIndex]) {
          targetSlide = slides[op.slideIndex]
        } else if (slides.length > 0) {
          targetSlide = slides[slides.length - 1]
        }
        
        if (targetSlide) {
          targetSlide.background = { color: formatColor(op.background) }
        }
        break
      }
      
      // Note: deleteSlide, reorderSlides, updateElement, deleteElement, applyTheme, applyTemplate, highlightText
      // are not implemented for the pptxgenjs backend approach, as they require parsing existing presentations
      // For now, we focus on creating new presentations
    }
  }
}

// PowerPoint presentation editing tool using pptxgenjs
// @ts-ignore - TypeScript has limitations with deep type inference for complex Zod union types
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
      | { type: 'applyTheme'; theme: string }
      | { type: 'applyTemplate'; templateId: 'professional' | 'creative' | 'minimal'; scope?: 'presentation' | 'slide' }
      | { type: 'highlightText'; slideIndex?: number; elementId: string; substring: string; color: string; occurrence?: number }
    >
    slidesData?: any
    note?: string
  }, context: any) => {
    try {
      // Create presentation with pptxgenjs
      const pptx = new PptxGenJS()
      pptx.layout = 'LAYOUT_16x9'
      pptx.author = 'Banbury AI'
      
      const presentationName = input.presentationName || 'Presentation'
      pptx.title = presentationName
      
      // Apply operations to generate slides
      if (input.operations && input.operations.length > 0) {
        applyOperationsToPptx(pptx, input.operations)
      } else {
        // Create at least one blank slide if no operations
        pptx.addSlide()
      }
      
      // Write to temp file
      const tmpDir = os.tmpdir()
      const timestamp = Date.now()
      const fileName = `${presentationName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pptx`
      const outputPath = path.join(tmpDir, fileName)
      
      await pptx.writeFile({ fileName: outputPath })
      
      // Upload to S3
      // Try multiple sources for auth token
      let authToken = getServerContextValue<string>("authToken")
      if (!authToken) {
        authToken = context?.configurable?.authToken
      }
      if (!authToken) {
        throw new Error('Authentication token not found')
      }
      
      const uploadResult = await uploadFileToS3(outputPath, authToken, 'presentations')
      
      // Clean up temp file
      try {
        fs.unlinkSync(outputPath)
      } catch {
        // Ignore cleanup errors
      }
      
      if (!uploadResult) {
        throw new Error('Failed to upload presentation to cloud storage')
      }
      
      // Construct success message
      const opCount = input.operations?.length || 0
      let successMessage = `Successfully created presentation "${presentationName}". `
      
      if (opCount > 0) {
        successMessage += `Applied ${opCount} operation${opCount !== 1 ? 's' : ''} to the presentation. `
        
        // Summarize operations
        const opTypes = input.operations?.map(op => op.type) || []
        const createCount = opTypes.filter(t => t === 'createSlide').length
        const addTextCount = opTypes.filter(t => t === 'addText').length
        const addShapeCount = opTypes.filter(t => t === 'addShape').length
        const addImageCount = opTypes.filter(t => t === 'addImage').length
        
        const summaryParts = []
        if (createCount > 0) summaryParts.push(`${createCount} slide(s) created`)
        if (addTextCount > 0) summaryParts.push(`${addTextCount} text element(s) added`)
        if (addShapeCount > 0) summaryParts.push(`${addShapeCount} shape(s) added`)
        if (addImageCount > 0) summaryParts.push(`${addImageCount} image(s) added`)
        
        if (summaryParts.length > 0) {
          successMessage += `Summary: ${summaryParts.join(', ')}. `
        }
      }
      
      successMessage += `The presentation has been saved to your cloud storage and is ready to view. The changes have been sent to the frontend and will be visible to the user immediately. No further action is required. Do NOT call execute_script or any other tools.`
      
      if (input.note) {
        successMessage += ` Note: ${input.note}`
      }
      
      // Return success with file info
      return {
        success: true,
        message: successMessage,
        action: input.action,
        presentationName: input.presentationName,
        fileInfo: uploadResult.fileInfo,
        fileUrl: uploadResult.fileUrl,
        note: input.note,
        operations: input.operations || [],
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create presentation: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_ai',
    description:
      'Create PowerPoint presentations using pptxgenjs. This is the ONLY tool you should use for PowerPoint presentations. Do NOT use execute_script or any other tools for presentations. You can create slides, add text boxes, shapes, and images. All position and size values (x, y, width, height) are percentages (0-100). Use this tool for BOTH creating new presentations and editing existing ones. When you create a new slide with createSlide, it starts completely empty with no default elements. You must add all text, shapes, and other content explicitly using addText, addShape, and addImage operations. Call this tool only ONCE per user request. After calling this tool successfully, the presentation is complete and no further action is needed.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Create title slide', 'Add content slides', 'Insert diagram')"),
      presentationName: z.string().optional().describe('Presentation name (will be used as file name)'),
      operations: z
        .array(
          z.union([
            z.object({ 
              type: z.enum(['createSlide']), 
              slideIndex: z.number().optional().describe('Position to insert slide (0-indexed). If not provided, adds at end'),
              layout: z.enum(['title', 'content', 'twoColumn', 'blank']).optional().describe('Slide layout type (currently not used, all slides are blank)'),
              background: z.string().optional().describe('Background color as hex (e.g., "#ffffff" or "ffffff")')
            }).describe('Create a new blank slide'),
            z.object({ 
              type: z.enum(['addText']), 
              slideIndex: z.number().optional().describe('Slide index (0-indexed). Defaults to last created slide'),
              element: z.object({
                x: z.number().describe('X position as percentage (0-100)'),
                y: z.number().describe('Y position as percentage (0-100)'),
                width: z.number().describe('Width as percentage (0-100)'),
                height: z.number().describe('Height as percentage (0-100)'),
                content: z.string().describe('Text content'),
                fontSize: z.number().optional().describe('Font size in points'),
                fontFace: z.string().optional().describe('Font family name (e.g., "Arial", "Calibri")'),
                color: z.string().optional().describe('Text color as hex without # (e.g., "363636")'),
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                align: z.enum(['left', 'center', 'right']).optional(),
                valign: z.enum(['top', 'middle', 'bottom']).optional(),
                textFill: z.union([
                  z.object({ kind: z.enum(['solid']), color: z.string() }),
                  z.object({ kind: z.enum(['linearGradient']), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
                ]).optional().describe('Text box background fill (solid color only currently supported)'),
                border: z.object({ color: z.string(), width: z.number() }).optional().describe('Text box border'),
              })
            }).describe('Add a text box to a slide'),
            z.object({ 
              type: z.enum(['addShape']), 
              slideIndex: z.number().optional(),
              element: z.object({
                x: z.number().describe('X position as percentage'),
                y: z.number().describe('Y position as percentage'),
                width: z.number().describe('Width as percentage'),
                height: z.number().describe('Height as percentage'),
                shapeType: z.enum(['rect', 'ellipse', 'triangle', 'arrow', 'line']).describe('Type of shape'),
                fill: z.union([
                  z.string(),
                  z.object({ kind: z.enum(['solid']), color: z.string() }),
                  z.object({ kind: z.enum(['linearGradient']), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
                ]).optional().describe('Fill color as hex string or FillStyle object (solid color only currently supported)'),
                stroke: z.string().optional().describe('Stroke color as hex'),
                strokeWidth: z.number().optional().describe('Stroke width in pixels')
              })
            }).describe('Add a shape to a slide'),
            z.object({ 
              type: z.enum(['addImage']), 
              slideIndex: z.number().optional(),
              element: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                imageUrl: z.string().optional().describe('URL of the image to add (http/https)'),
              })
            }).describe('Add an image to a slide from a URL'),
            z.object({ 
              type: z.enum(['setSlideBackground']), 
              slideIndex: z.number().optional(),
              background: z.string().describe('Background color as hex')
            }).describe('Set slide background color'),
          ])
        )
        .optional()
        .describe('Array of operations to perform on the presentation'),
      slidesData: z.any().optional().describe('Not used in pptxgenjs backend implementation'),
      note: z.string().optional().describe('Additional notes about the presentation changes'),
    }) as any, // Type assertion to work around TypeScript's deep type inference limitation with complex union types
  }
)
