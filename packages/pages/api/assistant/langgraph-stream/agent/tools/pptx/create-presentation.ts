import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation, refreshFilesList, mapFileIdToPresentationId } from './utils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'
import { CONFIG } from '../../../../../../../frontend/config/config'

export const createPresentationTool = tool(
  async (input: {
    presentationName: string
    fileId?: string
  }) => {
    try {
      const token = getServerContextValue<string>("authToken")

      if (!token) {
        throw new Error("Missing auth token in server context")
      }

      const { pptx, slides, id } = getOrCreatePresentation(undefined, input.presentationName)

      // Create at least one blank slide
      const slide = pptx.addSlide()
      slides.push(slide)

      const fileBuffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
      const fileBlob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })

      // Ensure filename has .pptx extension
      const fileName = input.presentationName.endsWith('.pptx') 
        ? input.presentationName 
        : `${input.presentationName}.pptx`

      // Upload using fetch directly (works better in Node.js than ApiService)
      const formData = new FormData()
      formData.append('file', fileBlob, fileName)
      formData.append('device_name', 'web-editor')
      formData.append('file_path', `presentations/${fileName}`)
      formData.append('file_parent', 'presentations')

      const uploadResp = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadResp.ok) {
        const errorText = await uploadResp.text().catch(() => uploadResp.statusText)
        throw new Error(`Failed to upload presentation to S3: ${uploadResp.status} ${errorText}`)
      }

      const uploadData = await uploadResp.json()
      console.log('[create-presentation] Upload response:', uploadData)

      if (uploadData.result !== 'success') {
        throw new Error(uploadData.error || 'Failed to upload presentation to S3')
      }

      // Extract fileId from upload response
      let fileId = uploadData.file_info?.file_id ||
                   uploadData.file_info?._id ||
                   uploadData.file_id ||
                   null

      console.log('[create-presentation] Extracted fileId:', fileId)
      console.log('[create-presentation] file_info:', uploadData.file_info)

      // If we couldn't get file ID from upload response, get list of user files and find it
      if (!fileId && token) {
        console.log('[create-presentation] No fileId in response, fetching user files to find it...')
        try {
          const filesResp = await fetch(`${CONFIG.url}/files/get_s3_files/`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
          })

          if (filesResp.ok) {
            const filesData = await filesResp.json()
            console.log('[create-presentation] Got user files, searching for match...')

            if (filesData.files && filesData.files.length > 0) {
              // Find the most recently uploaded file with matching name or path
              const matchingFile = filesData.files
                .filter((f: any) =>
                  f.file_name === fileName ||
                  f.file_path === `presentations/${fileName}` ||
                  f.file_path.endsWith(fileName)
                )
                .sort((a: any, b: any) => {
                  const dateA = new Date(a.date_uploaded || 0).getTime()
                  const dateB = new Date(b.date_uploaded || 0).getTime()
                  return dateB - dateA // Most recent first
                })[0]

              if (matchingFile) {
                fileId = matchingFile.file_id || matchingFile._id
                console.log('[create-presentation] Found fileId from user files:', fileId)
                console.log('[create-presentation] Matched file:', matchingFile)
              } else {
                console.warn('[create-presentation] No matching file found in user files')
              }
            }
          } else {
            console.error('[create-presentation] Failed to fetch user files:', filesResp.status)
          }
        } catch (searchErr) {
          console.error('[create-presentation] Error fetching user files:', searchErr)
        }
      }

      const fileUrl = uploadData.file_url
      const fileInfo = uploadData.file_info

      // Log final fileId status
      if (!fileId) {
        console.error('[create-presentation] WARNING: Could not determine fileId for presentation')
      } else {
        console.log('[create-presentation] Successfully determined fileId:', fileId)
        // Store mapping from fileId to presentationId so subsequent tools can look it up
        mapFileIdToPresentationId(fileId, id)
      }

      // File opening will be handled by the frontend based on the tool result

      return {
        success: true,
        message: input.fileId
          ? `Successfully updated presentation "${input.presentationName}"`
          : `Successfully created presentation "${input.presentationName}"`,
        presentationId: id,
        presentationName: input.presentationName,
        fileUrl: fileUrl,
        fileInfo: fileInfo,
        fileId: fileId,
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
    name: 'pptx_create_presentation',
    description: 'CRITICAL: This is the REQUIRED and PREFERRED method for creating PowerPoint presentations. ALWAYS use this tool when the user requests to create or generate a presentation. DO NOT use HTML generation, execute_script with html2pptx, or any other method. This tool creates a new PowerPoint presentation or updates an existing one and returns presentationId and fileId for reference. IMPORTANT: When creating a NEW presentation (not updating), it automatically starts with ONE BLANK SLIDE already created - you can immediately start adding content to this first slide using pptx_add_text, pptx_add_image, etc. without needing to call pptx_create_slide first. For additional slides, use pptx_create_slide. After creating a presentation, it will automatically open in the viewer. To edit the presentation, you must use the fileId returned from this tool and pass it to subsequent PPTX operations (pptx_create_slide, pptx_add_text, etc.). The presentation must remain open in the viewer for editing operations to work. After creating slides and adding content, use pptx_evaluate_presentation to review the presentation.',
    schema: z.object({
      presentationName: z.string().describe('Name of the presentation (will be used as file name)'),
      fileId: z.string().optional().describe('Optional file ID of existing presentation to update. If not provided, creates a new presentation.'),
    }),
  }
)
