import type { NextApiRequest, NextApiResponse } from 'next'
import { env } from '../../../utils/env'

interface GenerateSummaryRequest {
  transcriptionText: string
}

interface GenerateSummaryResponse {
  success: boolean
  summary?: {
    summary_id: string
    summary: string
    key_points: string[]
    decisions: string[]
    next_steps: string[]
    generated_at: string
    action_items: any[]
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateSummaryResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { transcriptionText }: GenerateSummaryRequest = req.body

    if (!transcriptionText || transcriptionText.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No transcription provided' 
      })
    }

    const apiKey = env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      })
    }

    const prompt = `Please analyze the following meeting transcription and provide a comprehensive summary.

TRANSCRIPTION:
${transcriptionText}

Please provide:
1. A brief summary of the meeting
2. Key points discussed
3. Decisions made
4. Next steps identified

Format your response as JSON with the following structure:
{
  "summary": "Brief meeting summary",
  "key_points": ["Point 1", "Point 2", ...],
  "decisions": ["Decision 1", "Decision 2", ...],
  "next_steps": ["Step 1", "Step 2", ...]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert meeting analyst. Analyze meeting transcriptions and provide structured summaries in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ 
        success: false, 
        error: `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}` 
      })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return res.status(500).json({ 
        success: false, 
        error: 'No response from OpenAI API' 
      })
    }

    try {
      const summaryData = JSON.parse(content)
      const summary = {
        summary_id: `summary_${Date.now()}`,
        summary: summaryData.summary || '',
        key_points: summaryData.key_points || [],
        decisions: summaryData.decisions || [],
        next_steps: summaryData.next_steps || [],
        generated_at: new Date().toISOString(),
        action_items: []
      }

      return res.status(200).json({ success: true, summary })
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const summary = {
        summary_id: `summary_${Date.now()}`,
        summary: content,
        key_points: [],
        decisions: [],
        next_steps: [],
        generated_at: new Date().toISOString(),
        action_items: []
      }

      return res.status(200).json({ success: true, summary })
    }
  } catch (error) {
    console.error('Error generating summary:', error)
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate summary' 
    })
  }
}
