import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { SkillsStreamRequestBody, FileGeneratedEvent, FileUpdateEvent } from './types'
import { extractFileIds } from './handlers/extractFileIds'
import { downloadFromContainer } from './handlers/downloadFromContainer'
import { uploadToS3 } from './utils/uploadToS3'
import { API_CONFIG } from '../langgraph-stream/constants'

export const config = API_CONFIG

/**
 * Claude Skills streaming endpoint
 * Uses Claude Messages API with Agent Skills for document generation
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end()
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  // Do not set "Connection" header on HTTP/2; it causes protocol errors

  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    const body = req.body as SkillsStreamRequestBody
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      send({ type: 'error', error: 'Missing authorization token' })
      res.end()
      return
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      send({ type: 'error', error: 'Anthropic API key not configured' })
      res.end()
      return
    }

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Extract model preferences
    const modelId = body.toolPreferences?.model_id || 'claude-sonnet-4-5-20250929'

    const messagesApi = (client as any)?.beta?.messages ?? (client as any)?.messages

    if (!messagesApi || typeof (messagesApi as any).create !== 'function') {
      send({ type: 'error', error: 'Anthropic SDK: messages.create is not available on this client version' })
      res.end()
      return
    }

    // Convert messages to Claude format
    const messages = body.messages.map((msg: any) => {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content
        }
      }

      // Handle complex content with attachments
      const content = Array.isArray(msg.content)
        ? msg.content.map((part: any) => {
            if (part.type === 'text') {
              return { type: 'text', text: part.text }
            }
            // Add support for other content types as needed
            return part
          })
        : msg.content

      return {
        role: msg.role,
        content
      }
    })

    // Start assistant message
    send({ type: 'message-start', role: 'assistant' })
    try { res.flushHeaders?.() } catch {}

    // Keep-alive: prevent intermediaries from closing an idle SSE connection while we wait on the Skills job.
    // This is intentionally *not* a "delay fix"—it just keeps the stream open and the UI informed.
    const keepAlive = setInterval(() => {
      try {
        // SSE comment line; clients should ignore but it keeps bytes flowing
        res.write(`: ping ${Date.now()}\n\n`)
      } catch {}
    }, 15000)

    // Low-frequency progress hint for UIs that show status off `thinking` events
    const progress = setInterval(() => {
      try {
        send({ type: 'thinking', message: 'Generating with Claude Skills…' })
      } catch {}
    }, 30000)

    // Create message with Skills
    // IMPORTANT: Skills beta requires the code execution tool to be explicitly enabled.
    const anthropicBetaHeader = 'code-execution-2025-08-25,skills-2025-10-02'

    // Send an initial status hint immediately (once) so users don't see a "silent" pending state.
    send({ type: 'thinking', message: 'Generating with Claude Skills…' })

    let response: any
    let fullTextContent = ''
    const contentBlocks: any[] = []
    const processedFileIds = new Set<string>()
    let currentBlockIndex = -1

    try {
      const stream = await messagesApi.create({
        model: modelId,
        max_tokens: 4096,
        stream: true,
        container: {
          skills: [
            {
              type: 'anthropic',
              skill_id: 'pptx',
              version: 'latest'
            },
            {
              type: 'anthropic',
              skill_id: 'docx',
              version: 'latest'
            },
            {
              type: 'anthropic',
              skill_id: 'xlsx',
              version: 'latest'
            },
            {
              type: 'anthropic',
              skill_id: 'pdf',
              version: 'latest'
            }
          ]
        },
        messages: messages,
        tools: [{
          type: 'code_execution_20250825',
          name: 'code_execution'
        }]
      } as any, { headers: { 'anthropic-beta': anthropicBetaHeader } } as any)

      // Process streaming events
      for await (const event of stream) {
        console.log('[Skills] Stream event:', event.type)

        switch (event.type) {
          case 'message_start':
            // Message started
            break

          case 'content_block_start':
            // New content block started
            currentBlockIndex++
            contentBlocks[currentBlockIndex] = {
              type: event.content_block?.type,
              index: event.index ?? currentBlockIndex
            }
            if (event.content_block) {
              Object.assign(contentBlocks[currentBlockIndex], event.content_block)
            }
            break

          case 'content_block_delta':
            // Streaming content delta
            if (event.delta?.type === 'text_delta' && event.delta?.text) {
              const text = event.delta.text
              fullTextContent += text
              send({
                type: 'text-delta',
                text: text
              })

              // Update content block
              const blockIdx = event.index ?? currentBlockIndex
              if (contentBlocks[blockIdx]) {
                if (!contentBlocks[blockIdx].text) {
                  contentBlocks[blockIdx].text = ''
                }
                contentBlocks[blockIdx].text += text
              }
            }
            break

          case 'content_block_stop':
            // Content block ended - check for files
            const blockIdx = event.index ?? currentBlockIndex
            const block = contentBlocks[blockIdx]

            if (block) {
              console.log('[Skills] Content block stopped:', JSON.stringify(block, null, 2))

              // Try to extract file IDs from this block
              const tempResponse = { content: [block] }
              const fileIds = extractFileIds(tempResponse)

              if (fileIds.length > 0) {
                console.log('[Skills] Found file IDs in intermediate block:', fileIds)

                // Process files immediately (live updates)
                for (const fileId of fileIds) {
                  if (!processedFileIds.has(fileId)) {
                    processedFileIds.add(fileId)
                    await processGeneratedFiles([fileId], client, token, send, true) // true = isIntermediate
                  }
                }
              }
            }
            break

          case 'message_delta':
            // Message metadata update (usage, etc.)
            break

          case 'message_stop':
            // Final message event - contains the complete response
            response = event.message || (stream as any).finalMessage
            break
        }
      }

      // If response wasn't set in message_stop, try to get it from the stream
      if (!response) {
        response = (stream as any).finalMessage || (stream as any).message
      }

      // If response still doesn't have content, reconstruct from blocks
      if (!response?.content && contentBlocks.length > 0) {
        response = { content: contentBlocks }
      }

    } finally {
      clearInterval(keepAlive)
      clearInterval(progress)
    }

    // Log full response structure for debugging
    console.log('[Skills] Full response:', JSON.stringify(response, null, 2))
    console.log('[Skills] Response content blocks:', response?.content?.map((b: any) => ({ type: b.type, hasContent: !!b.content })))

    // Check for generated files (final check, might have already been processed during streaming)
    const fileIds = extractFileIds(response)
    console.log('[Skills] Extracted file IDs from final response:', fileIds)

    // Filter out already-processed files
    const newFileIds = fileIds.filter(id => !processedFileIds.has(id))

    if (newFileIds.length > 0) {
      console.log('[Skills] Processing remaining files:', newFileIds)
      // Process files (final, not intermediate)
      await processGeneratedFiles(newFileIds, client, token, send, false)
    } else if (fileIds.length > 0) {
      console.log('[Skills] All files were already processed during streaming')
    } else {
      console.log('[Skills] No file IDs found in response')
    }

    // Send completion
    send({
      type: 'message-end',
      status: { type: 'complete' }
    })

    send({ type: 'done' })
    res.end()

  } catch (error) {
    console.error('Skills stream error:', error)

    // Check if Skills are not available
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const isSkillsUnavailable = errorMessage.includes('skills') || errorMessage.includes('container') || errorMessage.includes('code_execution')

    if (isSkillsUnavailable) {
      // Auto-fallback: Import and redirect to legacy mode
      send({
        type: 'text-delta',
        text: '⚠️ Skills API not available. Falling back to legacy mode...\n\n'
      })

      // Import legacy handler and forward the request
      const langgraphHandler = require('../langgraph-stream').default

      // Disable skills in the request body to prevent infinite loop
      const modifiedBody = {
        ...req.body,
        toolPreferences: {
          ...req.body.toolPreferences,
          use_skills: false
        }
      }
      req.body = modifiedBody

      // Forward to legacy handler
      return langgraphHandler(req, res)
    } else {
      send({
        type: 'error',
        error: errorMessage
      })
      res.end()
    }
  }
}

/**
 * Process generated files: download from container and upload to S3
 * @param isIntermediate - If true, sends file-update events for live preview. If false, sends file-generated events for final version.
 */
async function processGeneratedFiles(
  fileIds: string[],
  client: Anthropic,
  authToken: string,
  send: (event: any) => void,
  isIntermediate: boolean = false
) {
  for (const fileId of fileIds) {
    console.log(`[Skills] Processing file ${fileId} (intermediate: ${isIntermediate})`)
    try {
      // Download file from container
      console.log(`[Skills] Downloading file ${fileId} from container`)
      const { blob, metadata } = await downloadFromContainer(client, fileId)
      console.log(`[Skills] Downloaded file:`, metadata)

      // Determine file type and folder
      const ext = metadata.filename.split('.').pop()?.toLowerCase() || ''
      const fileType = ext as 'pptx' | 'docx' | 'xlsx' | 'pdf'

      const folderMap: Record<string, string> = {
        pptx: 'presentations',
        docx: 'documents',
        xlsx: 'spreadsheets',
        pdf: 'documents'
      }
      const folder = folderMap[ext] || 'documents'

      // Upload to S3
      console.log(`[Skills] Uploading ${metadata.filename} to S3 in folder ${folder}`)
      const uploadResult = await uploadToS3(
        blob,
        metadata.filename,
        folder,
        authToken,
        metadata
      )
      console.log(`[Skills] Upload result:`, uploadResult)

      if (uploadResult.ok && uploadResult.file_info) {
        if (isIntermediate) {
          // Send file-update event for live preview
          const event: FileUpdateEvent = {
            type: 'file-update',
            fileType,
            fileId: uploadResult.file_info.file_id || fileId,
            fileName: uploadResult.file_info.file_name,
            downloadUrl: uploadResult.file_info.file_path,
            isIntermediate: true
          }
          console.log(`[Skills] Sending file-update event (intermediate):`, event)
          send(event)
        } else {
          // Send file-generated event for final version
          const event: FileGeneratedEvent = {
            type: 'file-generated',
            fileType,
            fileId: uploadResult.file_info.file_id || fileId,
            fileName: uploadResult.file_info.file_name,
            downloadUrl: uploadResult.file_info.file_path
          }
          console.log(`[Skills] Sending file-generated event (final):`, event)
          send(event)
        }
      } else {
        send({
          type: 'error',
          error: uploadResult.error || 'Failed to upload file to S3'
        })
      }
    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error)
      send({
        type: 'error',
        error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
}
