import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_IMAGE_GENERATION_MODEL_ID } from '../../../frontend/components/RightPanel/composer/handlers/getMediaModelDisplayName'

interface GenerateImageRequestBody {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024'
  model?: string
}

interface GenerateImageResponseBody {
  imageBase64: string
  revisedPrompt?: string
}

function isGoogleImageModel(model: string): boolean {
  return model.startsWith('gemini') || model === 'gemini-2.5-flash-image'
}

async function generateImageWithGoogle(prompt: string, model: string): Promise<{ imageBase64: string; revisedPrompt?: string }> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured')
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`Google API error: ${err || response.statusText}`)
  }

  const data = await response.json() as any
  
  // Extract image from Google's response format
  // Google returns images in the candidate's content parts
  const candidate = data.candidates?.[0]
  const content = candidate?.content
  const parts = content?.parts || []
  
  // Find the image part (Google returns base64 encoded images)
  const imagePart = parts.find((part: any) => part.inlineData)
  if (!imagePart?.inlineData?.data) {
    throw new Error('No image returned by Google API')
  }

  // Google returns base64 without the data:image prefix, just the base64 string
  const imageBase64 = imagePart.inlineData.data
  
  return { imageBase64 }
}

async function generateImageWithOpenAI(prompt: string, model: string, size: string): Promise<{ imageBase64: string; revisedPrompt?: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size,
      response_format: 'b64_json',
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`OpenAI API error: ${err || response.statusText}`)
  }

  const data = (await response.json()) as any
  const imageBase64 = data?.data?.[0]?.b64_json
  const revisedPrompt = data?.data?.[0]?.revised_prompt

  if (!imageBase64) {
    throw new Error('No image returned by OpenAI API')
  }

  return { imageBase64, revisedPrompt }
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

  try {
    const { prompt, size, model }: GenerateImageRequestBody = req.body || {}
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Prompt is required' })
      return
    }

    const chosenModel = model || DEFAULT_IMAGE_GENERATION_MODEL_ID
    const chosenSize = size || '1024x1024'

    let result: { imageBase64: string; revisedPrompt?: string }
    
    if (isGoogleImageModel(chosenModel)) {
      result = await generateImageWithGoogle(prompt, chosenModel)
    } else {
      result = await generateImageWithOpenAI(prompt, chosenModel, chosenSize)
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate image' })
  }
}


