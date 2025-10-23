import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../src/config/config"
import { getServerContextValue } from "../../../../../../src/assistant/langraph/serverContext"

// Image generation tool using OpenAI Images API, then upload to S3 via Banbury API
export const generateImageTool = tool(
  async (input: { prompt: string; size?: '256x256' | '512x512' | '1024x1024'; folder?: string; fileBaseName?: string }) => {
    const openaiKey = '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'
    if (!openaiKey) {
      return JSON.stringify({ ok: false, error: 'OPENAI_API_KEY not configured' })
    }

    const token = getServerContextValue<string>('authToken')
    if (!token) {
      return JSON.stringify({ ok: false, error: 'Missing auth token in server context' })
    }

    try {
      const prompt = (input?.prompt || '').toString().trim()
      if (!prompt) return JSON.stringify({ ok: false, error: 'Missing prompt' })
      const size = input?.size || '1024x1024'
      const folder = (input?.folder || 'images').replace(/^\/+|\/+$/g, '')
      const baseName = (input?.fileBaseName || 'Generated Image').toString().trim()

      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, response_format: 'b64_json' }),
      })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        return JSON.stringify({ ok: false, error: `Provider error: ${text || resp.statusText}` })
      }
      const data: any = await resp.json()
      const b64 = data?.data?.[0]?.b64_json as string | undefined
      if (!b64) return JSON.stringify({ ok: false, error: 'No image returned by provider' })

      const apiBase = CONFIG.url
      const buffer = Buffer.from(b64, 'base64')
      const blob = new Blob([buffer], { type: 'image/png' })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${baseName} ${timestamp}.png`
      const filePath = `${folder}/${fileName}`

      const form = new FormData()
      form.append('file', blob, fileName)
      form.append('device_name', 'web-editor')
      form.append('file_path', filePath)
      form.append('file_parent', folder)

      const uploadResp = await fetch(`${apiBase}/files/upload_to_s3/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as any,
        body: form as any,
      })
      if (!uploadResp.ok) {
        const text = await uploadResp.text().catch(() => '')
        return JSON.stringify({ ok: false, error: `Upload failed: ${text || uploadResp.statusText}` })
      }
      const uploaded: any = await uploadResp.json()

      return JSON.stringify({
        ok: true,
        file_info: uploaded?.file_info || { file_name: fileName, file_path: filePath },
        provider: 'openai',
        size,
        message: 'Image generated and uploaded successfully',
      })
    } catch (e: any) {
      return JSON.stringify({ ok: false, error: e?.message || 'Failed to generate image' })
    }
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a prompt and save it to the user\'s cloud storage.',
    schema: z.object({
      prompt: z.string().describe('Image description prompt'),
      size: z.enum(['256x256', '512x512', '1024x1024']).optional(),
      folder: z.string().optional().describe('Target folder (default: images)'),
      fileBaseName: z.string().optional().describe('Base filename (default: Generated Image)'),
    }),
  }
)

