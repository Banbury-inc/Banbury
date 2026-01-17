import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { percentToInches, formatColor } from '../pptxUtils'
import { FillStyle } from './types'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const addShapeTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    x: number
    y: number
    width: number
    height: number
    shapeType: 'rect' | 'ellipse' | 'triangle' | 'arrow' | 'line'
    fill?: string | FillStyle
    stroke?: string
    strokeWidth?: number
  }, context: any) => {
    try {
      const sendEvent = getServerContextValue<Function>("sendEvent")
      const token = getServerContextValue<string>("authToken")

      if (!token) {
        throw new Error("Missing auth token in server context")
      }

      const presentationName = input.presentationName || 'Presentation'
      const { pptx, slides, id } = getOrCreatePresentation(input.presentationId, presentationName, input.fileId)

      let targetSlide: any
      if (input.slideIndex !== undefined && slides[input.slideIndex]) {
        targetSlide = slides[input.slideIndex]
      } else if (slides.length > 0) {
        targetSlide = slides[slides.length - 1]
      } else {
        targetSlide = pptx.addSlide()
        slides.push(targetSlide)
      }

      const shapeOptions: any = {
        x: percentToInches(input.x, 'width'),
        y: percentToInches(input.y, 'height'),
        w: percentToInches(input.width, 'width'),
        h: percentToInches(input.height, 'height'),
      }

      if (input.fill) {
        if (typeof input.fill === 'string') {
          shapeOptions.fill = { color: formatColor(input.fill) }
        } else if (input.fill.kind === 'solid') {
          shapeOptions.fill = { color: formatColor(input.fill.color) }
        } else if (input.fill.kind === 'linearGradient') {
          shapeOptions.fill = {
            type: 'solid',
            color: formatColor(input.fill.startColor)
          }
        }
      }

      if (input.stroke) {
        shapeOptions.line = {
          color: formatColor(input.stroke),
          width: input.strokeWidth || 1
        }
      }

      let pptxShape = pptx.ShapeType.rect
      switch (input.shapeType) {
        case 'rect': pptxShape = pptx.ShapeType.rect; break
        case 'ellipse': pptxShape = pptx.ShapeType.ellipse; break
        case 'triangle': pptxShape = pptx.ShapeType.triangle; break
        case 'arrow': pptxShape = pptx.ShapeType.rightArrow; break
        case 'line': pptxShape = pptx.ShapeType.line; break
      }

      targetSlide.addShape(pptxShape, shapeOptions)

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
          operation: "add_shape",
          operationData: {
            slideIndex: actualSlideIndex,
            element: {
              id: `shape-${Date.now()}`,
              type: 'shape',
              x: input.x,
              y: input.y,
              width: input.width,
              height: input.height,
              shapeType: input.shapeType,
              fill: input.fill,
              stroke: input.stroke,
              strokeWidth: input.strokeWidth
            }
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Shape added`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add shape: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_add_shape',
    description: 'Add a shape to a slide. All position and size values are percentages (0-100). IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After adding a shape to a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional(),
      x: z.number().describe('X position as percentage'),
      y: z.number().describe('Y position as percentage'),
      width: z.number().describe('Width as percentage'),
      height: z.number().describe('Height as percentage'),
      shapeType: z.enum(['rect', 'ellipse', 'triangle', 'arrow', 'line']).describe('Type of shape'),
      fill: z.union([
        z.string(),
        z.object({ kind: z.enum(['solid']), color: z.string() }),
        z.object({ kind: z.enum(['linearGradient']), startColor: z.string(), endColor: z.string(), angleDeg: z.number() })
      ]).optional().describe('Fill color as hex string or FillStyle object'),
      stroke: z.string().optional().describe('Stroke color as hex'),
      strokeWidth: z.number().optional().describe('Stroke width in pixels'),
    }),
  }
)
