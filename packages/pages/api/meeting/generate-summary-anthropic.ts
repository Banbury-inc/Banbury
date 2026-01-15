import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { API_CONFIG } from '../assistant/langgraph-stream/constants'

export const config = API_CONFIG

interface GenerateSummaryRequest {
  sessionId: string
  transcriptionText: string
}

/**
 * Meeting summary generation endpoint using Anthropic API directly
 * Returns structured JSON output (non-streaming)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { sessionId, transcriptionText }: GenerateSummaryRequest = req.body

    if (!sessionId || !transcriptionText || transcriptionText.trim().length === 0) {
      res.status(400).json({ error: 'Missing sessionId or transcriptionText' })
      return
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'Anthropic API key not configured' })
      return
    }

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Use Claude Sonnet 4.5 or fallback to 4
    const modelId = 'claude-sonnet-4-5-20250929'

    // Create prompt for meeting summary generation
    const systemPrompt = `You are an expert meeting analyst. Analyze meeting transcriptions and generate comprehensive structured summaries.

Extract and organize the following information:
1. A main summary (2-3 paragraphs describing the meeting's purpose and main outcomes)
2. Key points (5-10 main discussion points)
3. Decisions made during the meeting
4. Next steps identified
5. Action items with assignees when mentioned

For action items, extract the task description and assignee name if mentioned. Use "medium" as the default priority.`

    const userPrompt = `Please analyze the following meeting transcription and generate a comprehensive structured summary:

TRANSCRIPTION:
${transcriptionText}

Respond with a JSON object containing: summary, keyPoints (array), decisions (array), nextSteps (array), and actionItems (array of objects with description, assignee, priority, status).`

    // Define structured output schema for JSON
    const outputFormat = {
      type: 'json_schema' as const,
      schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'A 2-3 paragraph overview of the meeting'
          },
          keyPoints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of 5-10 key discussion points'
          },
          decisions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of decisions made during the meeting'
          },
          nextSteps: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of next steps or follow-up actions'
          },
          actionItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                assignee: { type: 'string', description: 'Person name or null if not mentioned' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], description: 'Status' }
              },
              required: ['description', 'priority', 'status'],
              additionalProperties: false
            },
            description: 'Array of action items with assignees when mentioned'
          }
        },
        required: ['summary', 'keyPoints', 'decisions', 'nextSteps', 'actionItems'],
        additionalProperties: false
      }
    }

    // Make non-streaming API call with structured outputs
    const message = await client.messages.create({
      model: modelId,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      output_format: outputFormat
    }, {
      headers: {
        'anthropic-beta': 'structured-outputs-2025-11-13',
        'anthropic-version': '2023-06-01'
      }
    } as any)

    // Extract structured data from output
    let finalData: any = null

    if ((message as any).structured_output) {
      // Direct structured output access
      finalData = (message as any).structured_output
    } else if (message.content && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'text') {
          try {
            // The structured output should be JSON
            finalData = JSON.parse(block.text)
            break
          } catch (e) {
            console.warn('Failed to parse structured output:', e)
          }
        }
      }
    }

    // Ensure we have valid data structure
    if (!finalData) {
      res.status(500).json({ error: 'Failed to extract structured output from AI response' })
      return
    }

    // Ensure actionItems have required fields
    if (Array.isArray(finalData.actionItems)) {
      finalData.actionItems = finalData.actionItems.map((item: any) => ({
        description: item.description || '',
        assignee: item.assignee || null,
        priority: item.priority || 'medium',
        status: item.status || 'pending'
      }))
    }

    // Return the structured data
    res.status(200).json({ success: true, data: finalData })

  } catch (error) {
    console.error('Anthropic summary generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({ error: errorMessage })
  }
}
