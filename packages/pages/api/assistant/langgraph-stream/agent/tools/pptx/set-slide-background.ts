import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { formatColor } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const setSlideBackgroundTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    background: string
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
        throw new Error('No slides exist. Create a slide first.')
      }

      if (targetSlide) {
        targetSlide.background = { color: formatColor(input.background) }
      }

      // Determine actual slide index
      const actualSlideIndex = input.slideIndex !== undefined && slides[input.slideIndex]
        ? input.slideIndex
        : slides.length - 1

      // Send live update event (presentation must be open in viewer)
      if (sendEvent) {
        // Normalize background color to always include # prefix for frontend consistency
        const normalizedBackground = input.background.startsWith('#') 
          ? input.background 
          : `#${input.background}`
        
        sendEvent({
          type: "pptx-live-update",
          presentationId: id,
          fileId: input.fileId,
          operation: "set_slide_background",
          operationData: {
            slideIndex: actualSlideIndex,
            background: normalizedBackground
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Slide background set`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to set slide background: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_set_slide_background',
    description: 'Set the background color of a slide. IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After setting the slide background, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional(),
      background: z.string().describe('Background color as hex'),
    }),
  }
)
