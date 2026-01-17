import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { percentToInches } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

/**
 * Download an image from a URL and convert it to a base64 data URL
 */
async function downloadImageAsDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: HTTP ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (error: any) {
    throw new Error(`Failed to download image from URL: ${error.message}`)
  }
}

export const downloadAndAddImageTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    imageUrl: string
    x: number
    y: number
    width: number
    height: number
  }, context: any) => {
    try {
      const sendEvent = getServerContextValue<Function>("sendEvent")
      const token = getServerContextValue<string>("authToken")

      if (!token) {
        throw new Error("Missing auth token in server context")
      }

      if (!input.imageUrl) {
        throw new Error("imageUrl is required")
      }

      // Validate URL format
      try {
        new URL(input.imageUrl)
      } catch {
        throw new Error(`Invalid image URL: ${input.imageUrl}`)
      }

      // Download the image and convert to data URL
      const imageDataUrl = await downloadImageAsDataUrl(input.imageUrl)

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

      const imageOptions: any = {
        x: percentToInches(input.x, 'width'),
        y: percentToInches(input.y, 'height'),
        w: percentToInches(input.width, 'width'),
        h: percentToInches(input.height, 'height'),
        data: imageDataUrl, // Use data property for base64 data URL
      }

      targetSlide.addImage(imageOptions)

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
          operation: "add_image",
          operationData: {
            slideIndex: actualSlideIndex,
            element: {
              id: `image-${Date.now()}`,
              type: 'image',
              x: input.x,
              y: input.y,
              width: input.width,
              height: input.height,
              imageUrl: input.imageUrl, // Keep original URL for reference
            }
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Successfully downloaded and added image from ${input.imageUrl}`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to download and add image: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_download_and_add_image',
    description: 'Download an image from a web URL and add it to a PowerPoint slide. This tool automatically downloads the image from the provided URL and embeds it in the presentation. All position and size values are percentages (0-100). IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After adding an image to a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional().describe('Index of the slide to add the image to (0-based). If not provided, adds to the last slide.'),
      imageUrl: z.string().describe('URL of the image to download and add (must be a valid http/https URL)'),
      x: z.number().describe('X position as percentage (0-100)'),
      y: z.number().describe('Y position as percentage (0-100)'),
      width: z.number().describe('Width as percentage (0-100)'),
      height: z.number().describe('Height as percentage (0-100)'),
    }),
  }
)
