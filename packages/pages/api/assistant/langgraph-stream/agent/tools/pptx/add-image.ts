import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { percentToInches } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const addImageTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    x: number
    y: number
    width: number
    height: number
    imageUrl?: string
    driveFileId?: string
    s3FileId?: string
    s3FileName?: string
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

      const imageOptions: any = {
        x: percentToInches(input.x, 'width'),
        y: percentToInches(input.y, 'height'),
        w: percentToInches(input.width, 'width'),
        h: percentToInches(input.height, 'height'),
      }

      if (input.imageUrl) {
        imageOptions.path = input.imageUrl
      } else if (input.driveFileId) {
        // Handle drive file ID (would need additional implementation)
        throw new Error('Drive file ID support not yet implemented')
      } else if (input.s3FileId) {
        // Handle S3 file ID (would need additional implementation)
        throw new Error('S3 file ID support not yet implemented')
      } else {
        throw new Error('Must provide imageUrl, driveFileId, or s3FileId')
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
              imageUrl: input.imageUrl,
              driveFileId: input.driveFileId,
              s3FileId: input.s3FileId,
              s3FileName: input.s3FileName
            }
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Image added`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add image: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_add_image',
    description: 'Add an image to a slide from a URL. All position and size values are percentages (0-100). IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After adding an image to a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      imageUrl: z.string().optional().describe('URL of the image to add (http/https)'),
      driveFileId: z.string().optional().describe('Google Drive file ID'),
      s3FileId: z.string().optional().describe('S3 file ID'),
      s3FileName: z.string().optional().describe('S3 file name (required with s3FileId)'),
    }),
  }
)
