import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { percentToInches, formatColor } from '../pptxUtils'
import { FillStyle, BorderStyle } from './types'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const addTextTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    x: number
    y: number
    width: number
    height: number
    content: string
    fontSize?: number
    fontFace?: string
    color?: string
    bold?: boolean
    italic?: boolean
    align?: 'left' | 'center' | 'right'
    valign?: 'top' | 'middle' | 'bottom'
    textFill?: FillStyle
    border?: BorderStyle
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

      const textOptions: any = {
        x: percentToInches(input.x, 'width'),
        y: percentToInches(input.y, 'height'),
        w: percentToInches(input.width, 'width'),
        h: percentToInches(input.height, 'height'),
      }

      if (input.fontSize) textOptions.fontSize = input.fontSize
      if (input.fontFace) textOptions.fontFace = input.fontFace
      if (input.color) textOptions.color = formatColor(input.color)
      if (input.bold !== undefined) textOptions.bold = input.bold
      if (input.italic !== undefined) textOptions.italic = input.italic
      if (input.align) textOptions.align = input.align
      if (input.valign) textOptions.valign = input.valign

      if (input.textFill) {
        if (input.textFill.kind === 'solid') {
          textOptions.fill = { color: formatColor(input.textFill.color) }
        } else if (input.textFill.kind === 'linearGradient') {
          textOptions.fill = {
            type: 'solid',
            color: formatColor(input.textFill.startColor)
          }
        }
      }

      if (input.border) {
        textOptions.line = {
          color: formatColor(input.border.color),
          width: input.border.width
        }
      }

      targetSlide.addText(input.content, textOptions)

      // Determine actual slide index
      const actualSlideIndex = input.slideIndex !== undefined && slides[input.slideIndex]
        ? input.slideIndex
        : slides.length - 1

      // Send live update event (presentation must be open in viewer)
      if (sendEvent) {
        sendEvent({
          type: "pptx-live-update",
          presentationId: id,
          fileId: input.fileId,
          operation: "add_text",
          operationData: {
            slideIndex: actualSlideIndex,
            element: {
              id: `text-${Date.now()}`,
              type: 'text',
              x: input.x,
              y: input.y,
              width: input.width,
              height: input.height,
              content: input.content,
              fontSize: input.fontSize,
              fontFace: input.fontFace,
              color: input.color,
              bold: input.bold,
              italic: input.italic,
              align: input.align,
              valign: input.valign,
              textFill: input.textFill,
              border: input.border
            }
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Text added`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add text: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_add_text',
    description: 'Add a text box to a slide. All position and size values (x, y, width, height) are percentages (0-100). IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After adding text to a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional().describe('Slide index (0-indexed). Defaults to last created slide'),
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
      ]).optional().describe('Text box background fill'),
      border: z.object({ color: z.string(), width: z.number() }).optional().describe('Text box border'),
    }),
  }
)
