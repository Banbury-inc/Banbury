import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateTerminalUser } from '../terminal/handlers/authenticateTerminalUser'

export { API_CONFIG as config } from '../assistant/langgraph-stream/constants'

interface GitHubCommitResponse {
  sha: string
  html_url: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    } | null
  }
}

interface CommitPromptContext {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

interface MarketingIdea {
  description: string
  action: string
}

interface MarketingIdeasOutput {
  ideas: MarketingIdea[]
}

function isMarketingIdea(value: unknown): value is MarketingIdea {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<MarketingIdea>
  return typeof candidate.description === 'string' && typeof candidate.action === 'string'
}

function normalizeMarketingIdeas(value: unknown): MarketingIdea[] {
  if (!value || typeof value !== 'object') return []

  const output = value as Partial<MarketingIdeasOutput>
  if (!Array.isArray(output.ideas)) return []

  return output.ideas
    .filter(isMarketingIdea)
    .map((idea) => ({
      description: idea.description.trim(),
      action: idea.action.trim()
    }))
    .filter((idea) => idea.description.length > 0 && idea.action.length > 0)
}

function getCommitPromptContext(commits: GitHubCommitResponse[]): CommitPromptContext[] {
  return commits.map((commit) => ({
    sha: commit.sha.slice(0, 7),
    message: commit.commit.message,
    author: commit.commit.author?.name || 'Unknown',
    date: commit.commit.author?.date || '',
    url: commit.html_url
  }))
}

function parseAnthropicJsonResponse(message: Anthropic.Messages.Message): unknown {
  const structuredOutput = (message as unknown as { structured_output?: unknown }).structured_output
  if (structuredOutput) return structuredOutput

  for (const block of message.content) {
    if (block.type !== 'text') continue

    try {
      return JSON.parse(block.text)
    } catch (error) {
      console.warn('Failed to parse marketing ideas response block:', error)
    }
  }

  return null
}

async function fetchRecentCommits() {
  const response = await fetch('https://api.github.com/repos/Banbury-inc/Banbury/commits?per_page=25', {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Banbury-Admin-Marketing'
    }
  })

  if (!response.ok) throw new Error(`GitHub returned ${response.status}`)

  const commits = await response.json() as GitHubCommitResponse[]
  if (!Array.isArray(commits)) throw new Error('GitHub returned an invalid commits response')

  return commits
}

async function generateMarketingIdeas(commits: CommitPromptContext[]) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const systemPrompt = `You are a product marketing strategist for Banbury. Review recent repository commits and identify changes that could become useful social media posts or email campaign ideas.

Focus on user-facing product improvements, workflows, reliability wins that customers can understand, and feature launches. Ignore dependency bumps, formatting, chores, internal refactors, and vague changes unless there is a clear customer benefit.

Return concise, practical ideas. The description should explain the feature or benefit. The action should recommend the marketing channel or next step.`

  const userPrompt = `Analyze these recent commits from https://github.com/Banbury-inc/Banbury:

${JSON.stringify(commits, null, 2)}

Return a JSON object with an ideas array. Each idea must include description and action.`

  const outputFormat = {
    type: 'json_schema' as const,
    schema: {
      type: 'object',
      properties: {
        ideas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'A concise customer-facing description of the feature or benefit.'
              },
              action: {
                type: 'string',
                description: 'A recommended marketing action, channel, or campaign next step.'
              }
            },
            required: ['description', 'action'],
            additionalProperties: false
          }
        }
      },
      required: ['ideas'],
      additionalProperties: false
    }
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
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

  return normalizeMarketingIdeas(parseAnthropicJsonResponse(message)).slice(0, 10)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Anthropic API key not configured' })
    return
  }

  try {
    const username = await authenticateTerminalUser(req)
    const isAdmin = username === 'mmills' || username === 'mmills6060@gmail.com'

    if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const commits = await fetchRecentCommits()
    const commitContext = getCommitPromptContext(commits)
    const ideas = await generateMarketingIdeas(commitContext)

    res.status(200).json({ success: true, ideas })
  } catch (error) {
    console.error('Marketing ideas generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('token') ? 401 : 500
    res.status(statusCode).json({ error: errorMessage })
  }
}
