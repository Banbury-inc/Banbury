import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { formatColor } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const createSlideTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    layout?: 'title' | 'content' | 'twoColumn' | 'blank'
    background?: string
  }, context: any) => {
    try {
      const sendEvent = getServerContextValue<Function>("sendEvent")
      const token = getServerContextValue<string>("authToken")

      if (!token) {
        throw new Error("Missing auth token in server context")
      }

      const presentationName = input.presentationName || 'Presentation'
      const { pptx, slides, id } = getOrCreatePresentation(input.presentationId, presentationName, input.fileId)

      const slide = pptx.addSlide()

      if (input.background) {
        slide.background = { color: formatColor(input.background) }
      }

      if (input.slideIndex !== undefined && input.slideIndex < slides.length) {
        slides.splice(input.slideIndex, 0, slide)
      } else {
        slides.push(slide)
      }

      const actualSlideIndex = input.slideIndex !== undefined && input.slideIndex < slides.length
        ? input.slideIndex
        : slides.length - 1

      // Send live update event (presentation must be open in viewer)
      if (sendEvent) {
        // Normalize background color to always include # prefix for frontend consistency
        const normalizedBackground = input.background 
          ? (input.background.startsWith('#') ? input.background : `#${input.background}`)
          : undefined
        
        sendEvent({
          type: "pptx-live-update",
          presentationId: id,
          fileId: input.fileId,
          operation: "create_slide",
          operationData: {
            slideIndex: actualSlideIndex,
            layout: input.layout || 'blank',
            background: normalizedBackground
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Slide created`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create slide: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_create_slide',
    description: 'Create a new blank slide in a presentation. IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After creating a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation to add slide to. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional().describe('Position to insert slide (0-indexed). If not provided, adds at end'),
      layout: z.enum(['title', 'content', 'twoColumn', 'blank']).optional().describe('Slide layout type (currently not used, all slides are blank)'),
      background: z.string().optional().describe('Background color as hex (e.g., "#ffffff" or "ffffff")'),
    }),
  }
)
