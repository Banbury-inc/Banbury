import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import type { SkillsStreamRequestBody, FileGeneratedEvent } from './types'
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
    try {
      response = await messagesApi.create({
        model: modelId,
        max_tokens: 4096,
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
    } finally {
      clearInterval(keepAlive)
      clearInterval(progress)
    }

    // Log full response structure for debugging
    console.log('[Skills] Full response:', JSON.stringify(response, null, 2))
    console.log('[Skills] Response content blocks:', response.content?.map((b: any) => ({ type: b.type, hasContent: !!b.content })))

    // Stream text content
    for (const block of response.content) {
      if (block.type === 'text') {
        send({
          type: 'text-delta',
          text: block.text
        })
      }
    }

    // Check for generated files
    const fileIds = extractFileIds(response)
    console.log('[Skills] Extracted file IDs:', fileIds)

    if (fileIds.length > 0) {
      console.log('[Skills] Processing generated files:', fileIds)
      // Process files
      await processGeneratedFiles(fileIds, client, token, send)
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
 */
async function processGeneratedFiles(
  fileIds: string[],
  client: Anthropic,
  authToken: string,
  send: (event: any) => void
) {
  for (const fileId of fileIds) {
    console.log(`[Skills] Processing file ${fileId}`)
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
        const event: FileGeneratedEvent = {
          type: 'file-generated',
          fileType,
          fileId: uploadResult.file_info.file_id || fileId,
          fileName: uploadResult.file_info.file_name,
          downloadUrl: uploadResult.file_info.file_path
        }
        console.log(`[Skills] Sending file-generated event:`, event)
        send(event)
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
