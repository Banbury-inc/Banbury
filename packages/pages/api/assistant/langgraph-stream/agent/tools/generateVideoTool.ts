import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"
import { DEFAULT_VIDEO_GENERATION_MODEL_ID } from "../../../../../../frontend/components/RightPanel/composer/handlers/getMediaModelDisplayName"

function isOpenAIModel(model: string): boolean {
  return model.startsWith('sora')
}

function isRunwayModel(model: string): boolean {
  return model.startsWith('runway')
}

function isLumaModel(model: string): boolean {
  return model.includes('luma')
}

function isGoogleVeoModel(model: string): boolean {
  return model.startsWith('veo')
}


async function generateVideoWithOpenAI(
  prompt: string,
  model: string,
  duration: number,
  resolution: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  // Create video generation job with only supported parameters
  const response = await fetch('https://api.openai.com/v1/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`OpenAI API error: ${err || response.statusText}`)
  }

  const data = (await response.json()) as any
  const videoId = data?.id

  if (!videoId) {
    throw new Error('No video ID returned by OpenAI API')
  }

  // Poll for completion
  const videoUrl = await pollOpenAIVideo(videoId, apiKey)
  return videoUrl
}

async function pollOpenAIVideo(videoId: string, apiKey: string): Promise<string> {
  const maxAttempts = 120 // 10 minutes max
  const delayMs = 5000

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs))

    const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check OpenAI video status')
    }

    const data = await response.json() as any

    if (data.status === 'completed') {
      // Get the download URL
      return `https://api.openai.com/v1/videos/${videoId}/content`
    } else if (data.status === 'failed') {
      throw new Error(`OpenAI video generation failed: ${data.error || 'Unknown error'}`)
    }
  }

  throw new Error('OpenAI video generation timed out')
}

async function generateVideoWithRunway(
  prompt: string,
  model: string
): Promise<string> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY is not configured')
  }

  const runwayModel = model === 'runway-gen3-turbo' ? 'gen3a_turbo' : 'gen3a_alpha'

  const response = await fetch('https://api.runwayml.com/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: runwayModel,
      prompt,
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`Runway API error: ${err || response.statusText}`)
  }

  const data = (await response.json()) as any
  const taskId = data?.id

  if (!taskId) {
    throw new Error('No task ID returned by Runway API')
  }

  // Poll for completion
  const videoUrl = await pollRunwayTask(taskId, apiKey)
  return videoUrl
}

async function pollRunwayTask(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60
  const delayMs = 5000

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs))

    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check Runway task status')
    }

    const data = await response.json() as any

    if (data.status === 'SUCCEEDED') {
      return data.output?.url || data.url
    } else if (data.status === 'FAILED') {
      throw new Error('Runway video generation failed')
    }
  }

  throw new Error('Runway video generation timed out')
}

async function generateVideoWithLuma(prompt: string): Promise<string> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) {
    throw new Error('LUMA_API_KEY is not configured')
  }

  const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`Luma API error: ${err || response.statusText}`)
  }

  const data = (await response.json()) as any
  const taskId = data?.id

  if (!taskId) {
    throw new Error('No task ID returned by Luma API')
  }

  // Poll for completion
  const videoUrl = await pollLumaTask(taskId, apiKey)
  return videoUrl
}

async function pollLumaTask(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60
  const delayMs = 5000

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs))

    const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check Luma task status')
    }

    const data = await response.json() as any

    if (data.state === 'completed') {
      return data.video?.url || data.assets?.video
    } else if (data.state === 'failed') {
      throw new Error('Luma video generation failed')
    }
  }

  throw new Error('Luma video generation timed out')
}

async function generateVideoWithGoogle(
  prompt: string,
  model: string,
  duration: number,
  resolution: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured')
  }

  // Map duration to valid values (4, 6, or 8 seconds)
  const validDuration = duration <= 4 ? 4 : duration <= 6 ? 6 : 8

  // Map resolution
  const aspectRatio = resolution === '1080p' ? '16:9' : '9:16'

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [
          {
            prompt,
          },
        ],
        parameters: {
          aspectRatio,
          durationSeconds: validDuration.toString(),
          resolution: resolution === '1080p' ? '1080p' : '720p',
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`Google API error: ${err || response.statusText}`)
  }

  const data = (await response.json()) as any
  const operationName = data?.name

  if (!operationName) {
    throw new Error('No operation name returned by Google API')
  }

  // Poll for completion
  const videoUrl = await pollGoogleVeoOperation(operationName, apiKey)
  return videoUrl
}

async function pollGoogleVeoOperation(operationName: string, apiKey: string): Promise<string> {
  const maxAttempts = 120 // 10 minutes max
  const delayMs = 5000

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      {
        headers: {
          'x-goog-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to check Google Veo operation status')
    }

    const data = await response.json() as any

    if (data.done) {
      const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri

      if (!videoUri) {
        throw new Error('No video URI returned by Google API')
      }

      // Return the video URI with API key for authenticated download
      return `${videoUri}?key=${apiKey}`
    }

    if (data.error) {
      throw new Error(`Google Veo generation failed: ${JSON.stringify(data.error)}`)
    }
  }

  throw new Error('Google Veo video generation timed out')
}


// Video generation tool that generates videos and uploads to S3
export const generateVideoTool = tool(
  async (input: {
    prompt: string
    duration?: number
    resolution?: '720p' | '1080p'
    folder?: string
    fileBaseName?: string
  }) => {
    const token = getServerContextValue<string>('authToken')
    if (!token) {
      return JSON.stringify({ ok: false, error: 'Missing auth token in server context' })
    }

    const toolPreferences = getServerContextValue<any>('toolPreferences') || {}
    const videoModel = toolPreferences.video_generation_model || DEFAULT_VIDEO_GENERATION_MODEL_ID

    try {
      const prompt = (input?.prompt || '').toString().trim()
      if (!prompt) return JSON.stringify({ ok: false, error: 'Missing prompt' })

      const duration = input?.duration || 5
      const resolution = input?.resolution || '1080p'
      const folder = (input?.folder || 'videos').replace(/^\/+|\/+$/g, '')
      const baseName = (input?.fileBaseName || 'Generated Video').toString().trim()

      let videoUrl: string

      if (isOpenAIModel(videoModel)) {
        videoUrl = await generateVideoWithOpenAI(prompt, videoModel, duration, resolution)
      } else if (isRunwayModel(videoModel)) {
        videoUrl = await generateVideoWithRunway(prompt, videoModel)
      } else if (isLumaModel(videoModel)) {
        videoUrl = await generateVideoWithLuma(prompt)
      } else if (isGoogleVeoModel(videoModel)) {
        videoUrl = await generateVideoWithGoogle(prompt, videoModel, duration, resolution)
      } else {
        throw new Error(`Unknown video generation model: ${videoModel}`)
      }

      // Download the video from the URL with auth if needed
      const token = getServerContextValue<string>('authToken')
      const headers: Record<string, string> = {}

      // Add auth for OpenAI video downloads
      if (isOpenAIModel(videoModel)) {
        const apiKey = process.env.OPENAI_API_KEY
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      }

      const videoResponse = await fetch(videoUrl, { headers })
      if (!videoResponse.ok) {
        throw new Error('Failed to download generated video')
      }

      const videoBuffer = await videoResponse.arrayBuffer()
      const blob = new Blob([videoBuffer], { type: 'video/mp4' })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${baseName} ${timestamp}.mp4`
      const filePath = `${folder}/${fileName}`

      const apiBase = CONFIG.url
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

      let provider = 'unknown'
      if (isOpenAIModel(videoModel)) provider = 'openai'
      else if (isRunwayModel(videoModel)) provider = 'runway'
      else if (isLumaModel(videoModel)) provider = 'luma'
      else if (isGoogleVeoModel(videoModel)) provider = 'google'

      return JSON.stringify({
        ok: true,
        file_info: uploaded?.file_info || { file_name: fileName, file_path: filePath },
        provider,
        duration,
        resolution,
        message: 'Video generated and uploaded successfully',
      })
    } catch (e: any) {
      return JSON.stringify({ ok: false, error: e?.message || 'Failed to generate video' })
    }
  },
  {
    name: 'generate_video',
    description: 'Generate a video from a text prompt and save it to the user\'s cloud storage. This tool supports multiple video generation models including OpenAI Sora 2, Google Veo, Runway Gen-3, and Luma Dream Machine. Note: OpenAI Sora determines video duration and resolution automatically. Google Veo supports 4-8 second durations and 720p/1080p resolutions.',
    schema: z.object({
      prompt: z.string().describe('Video description prompt'),
      duration: z.number().optional().describe('Video duration in seconds - may not be supported by all providers (default: 5)'),
      resolution: z.enum(['720p', '1080p']).optional().describe('Video resolution - may not be supported by all providers (default: 1080p)'),
      folder: z.string().optional().describe('Target folder (default: videos)'),
      fileBaseName: z.string().optional().describe('Base filename (default: Generated Video)'),
    }),
  }
)
