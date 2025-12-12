import type { NextApiRequest, NextApiResponse } from 'next'

interface GenerateImageRequestBody {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024'
  model?: string
}

interface GenerateImageResponseBody {
  imageBase64: string
  revisedPrompt?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateImageResponseBody | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured' })
    return
  }

  try {
    const { prompt, size, model }: GenerateImageRequestBody = req.body || {}
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Prompt is required' })
      return
    }

    const chosenModel = model || 'dall-e-3'
    const chosenSize = size || '1024x1024'

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        prompt,
        n: 1,
        size: chosenSize,
        response_format: 'b64_json',
      }),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      res.status(response.status).json({ error: `Provider error: ${err || response.statusText}` })
      return
    }

    const data = (await response.json()) as any
    const imageBase64 = data?.data?.[0]?.b64_json
    const revisedPrompt = data?.data?.[0]?.revised_prompt

    if (!imageBase64) {
      res.status(500).json({ error: 'No image returned by provider' })
      return
    }

    res.status(200).json({ imageBase64, revisedPrompt })
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate image' })
  }
}


