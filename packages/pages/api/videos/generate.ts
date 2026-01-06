import type { NextApiRequest, NextApiResponse } from 'next'

interface GenerateVideoRequestBody {
  prompt: string
  duration?: number
  resolution?: '720p' | '1080p'
  model?: string
}

interface GenerateVideoResponseBody {
  videoUrl: string
  taskId?: string
  revisedPrompt?: string
}

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
): Promise<{ videoUrl: string; revisedPrompt?: string }> {
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
  return { videoUrl }
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
      // Download the video content
      const contentResponse = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!contentResponse.ok) {
        throw new Error('Failed to download video content')
      }

      // Return the content URL or convert to data URL
      const videoBlob = await contentResponse.blob()
      return URL.createObjectURL(videoBlob)
    } else if (data.status === 'failed') {
      throw new Error(`OpenAI video generation failed: ${data.error || 'Unknown error'}`)
    }
  }

  throw new Error('OpenAI video generation timed out')
}

async function generateVideoWithRunway(
  prompt: string,
  model: string
): Promise<{ videoUrl: string; taskId: string }> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY is not configured')
  }

  // Determine which Runway model to use
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
  const videoUrl = data?.url || data?.output?.url

  if (!taskId) {
    throw new Error('No task ID returned by Runway API')
  }

  return { videoUrl: videoUrl || '', taskId }
}

async function generateVideoWithLuma(
  prompt: string
): Promise<{ videoUrl: string; taskId: string }> {
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
  const videoUrl = data?.video?.url

  if (!taskId) {
    throw new Error('No task ID returned by Luma API')
  }

  return { videoUrl: videoUrl || '', taskId }
}

async function generateVideoWithGoogle(
  prompt: string,
  model: string,
  duration: number,
  resolution: string
): Promise<{ videoUrl: string; taskId: string }> {
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
  return { videoUrl, taskId: operationName }
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


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateVideoResponseBody | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    const { prompt, duration, resolution, model }: GenerateVideoRequestBody = req.body || {}
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Prompt is required' })
      return
    }

    const chosenModel = model || 'sora-1.0'
    const chosenDuration = duration || 5
    const chosenResolution = resolution || '1080p'

    let result: { videoUrl: string; taskId?: string; revisedPrompt?: string }

    if (isOpenAIModel(chosenModel)) {
      result = await generateVideoWithOpenAI(prompt, chosenModel, chosenDuration, chosenResolution)
    } else if (isRunwayModel(chosenModel)) {
      result = await generateVideoWithRunway(prompt, chosenModel)
    } else if (isLumaModel(chosenModel)) {
      result = await generateVideoWithLuma(prompt)
    } else if (isGoogleVeoModel(chosenModel)) {
      result = await generateVideoWithGoogle(prompt, chosenModel, chosenDuration, chosenResolution)
    } else {
      throw new Error(`Unknown video generation model: ${chosenModel}`)
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate video' })
  }
}
