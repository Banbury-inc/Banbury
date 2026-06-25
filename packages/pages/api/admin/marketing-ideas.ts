import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateTerminalUser } from '../terminal/handlers/authenticateTerminalUser'
import { fetchGoogleGenerativeLanguageModels, type GoogleListModelRow } from '../assistant/handlers/fetchGoogleGenerativeLanguageModels'
import { formatOpenAIModelDisplayName, isOpenAIChatModelId } from '../../../frontend/utils/openAIChatModelId'

export { API_CONFIG as config } from '../assistant/langgraph-stream/constants'

const MAX_MODEL_DESCRIPTION_LENGTH = 240
const MARKETING_IDEA_LIMIT = 20
const MARKETING_IDEA_MAX_TOKENS = 8192
const RECENT_COMMIT_LIMIT = 50

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

interface IntegratedModelContext {
  provider: 'Anthropic' | 'OpenAI' | 'Google'
  id: string
  name: string
  description?: string
  created?: string
}

interface AnthropicModelRow {
  id: string
  display_name: string
}

interface OpenAIModelRow {
  id: string
  created?: number
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

function getConfiguredGoogleApiKey(): string | undefined {
  return process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
}

function stripModelsPrefix(name: string): string {
  return name.startsWith('models/') ? name.slice('models/'.length) : name
}

function getBoundedModelDescription(description: unknown): string | undefined {
  if (typeof description !== 'string') return undefined

  const trimmedDescription = description.trim()
  if (trimmedDescription.length <= MAX_MODEL_DESCRIPTION_LENGTH) return trimmedDescription

  return `${trimmedDescription.slice(0, MAX_MODEL_DESCRIPTION_LENGTH - 3)}...`
}

function readGoogleGenerationMethods(model: GoogleListModelRow): string[] {
  const raw = model.supportedGenerationMethods ?? model.supported_generation_methods ?? []
  return Array.isArray(raw) ? raw.map((method) => String(method)) : []
}

function supportsGoogleGenerateContent(methods: string[]): boolean {
  return methods.some((method) => method.toLowerCase().replace(/_/g, '') === 'generatecontent')
}

function getGoogleModelContext(row: GoogleListModelRow): IntegratedModelContext | null {
  const baseModelId = (row.baseModelId && row.baseModelId.trim()) || (row.base_model_id && row.base_model_id.trim()) || ''
  const id = baseModelId || (row.name ? stripModelsPrefix(row.name) : '')
  if (!id) return null

  const lowerId = id.toLowerCase()
  if (lowerId.includes('embed')) return null

  const methods = readGoogleGenerationMethods(row)
  const looksLikeGemini = /^gemini/i.test(id) || /^learnlm/i.test(id)
  if (!supportsGoogleGenerateContent(methods) && (!looksLikeGemini || methods.length > 0)) return null

  const displayName = (row.displayName && row.displayName.trim()) || (row.display_name && row.display_name.trim()) || id
  return {
    provider: 'Google',
    id,
    name: displayName,
    description: getBoundedModelDescription(row.description)
  }
}

async function fetchAnthropicModelContext(): Promise<IntegratedModelContext[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
  const models: IntegratedModelContext[] = []

  for await (const model of client.models.list({ limit: 1000 })) {
    if (!model.id.startsWith('claude-')) continue

    const row = model as unknown as AnthropicModelRow
    models.push({
      provider: 'Anthropic',
      id: model.id,
      name: row.display_name || model.id
    })
  }

  return models
}

async function fetchOpenAIModelContext(): Promise<IntegratedModelContext[]> {
  if (!process.env.OPENAI_API_KEY) return []

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    }
  })

  if (!response.ok) throw new Error(`OpenAI returned ${response.status}`)

  const body = await response.json() as { data?: OpenAIModelRow[] }
  const rows = Array.isArray(body.data) ? body.data : []

  return rows
    .filter((model) => model.id && isOpenAIChatModelId(model.id))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
    .map((model) => ({
      provider: 'OpenAI' as const,
      id: model.id,
      name: formatOpenAIModelDisplayName(model.id),
      created: typeof model.created === 'number' ? new Date(model.created * 1000).toISOString() : undefined
    }))
}

async function fetchGoogleModelContext(): Promise<IntegratedModelContext[]> {
  const apiKey = getConfiguredGoogleApiKey()
  if (!apiKey) return []

  const result = await fetchGoogleGenerativeLanguageModels(apiKey)
  if (!result.ok) throw new Error(`Google returned ${result.status}: ${result.message}`)

  const byId = new Map<string, IntegratedModelContext>()
  for (const row of result.models) {
    const model = getGoogleModelContext(row)
    if (model && !byId.has(model.id)) byId.set(model.id, model)
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

async function getIntegratedModelPromptContext() {
  const providerResults = await Promise.all([
    fetchAnthropicModelContext().catch((error) => {
      console.warn('Failed to fetch Anthropic models for marketing ideas:', error)
      return []
    }),
    fetchOpenAIModelContext().catch((error) => {
      console.warn('Failed to fetch OpenAI models for marketing ideas:', error)
      return []
    }),
    fetchGoogleModelContext().catch((error) => {
      console.warn('Failed to fetch Google models for marketing ideas:', error)
      return []
    })
  ])

  return providerResults.flatMap((models) => models.slice(0, 8))
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
  const response = await fetch(`https://api.github.com/repos/Banbury-inc/Banbury/commits?per_page=${RECENT_COMMIT_LIMIT}`, {
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

async function generateMarketingIdeas(commits: CommitPromptContext[], integratedModels: IntegratedModelContext[]) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const systemPrompt = `You are a growth-focused product marketing strategist for Banbury. Review recent repository commits and identify changes that could become high-performing social media posts or email campaign ideas.

Focus on user-facing product improvements, workflows, reliability wins that customers can understand, feature launches, and newly available AI models that Banbury is currently integrated with. Ignore dependency bumps, formatting, chores, internal refactors, and vague changes unless there is a clear customer benefit.

Use the integrated model catalog to spot timely model-launch angles, model availability announcements, or upgrade messaging. Only suggest a model-related post when the model is present in the catalog and there is a clear customer-facing benefit.

Optimize for reach, not just completeness. Prefer ideas with a strong hook, novelty, clear before/after contrast, pain-point resonance, founder/build-in-public angle, developer productivity angle, AI trend relevance, or demo potential. Avoid generic launch announcements that would likely get low engagement.

Return concise, practical ideas. The description should lead with the audience-facing hook and explain the feature or benefit. The action should recommend the channel, creative format, opening angle, and next step.`

  const userPrompt = `Analyze these recent commits from https://github.com/Banbury-inc/Banbury:

${JSON.stringify(commits, null, 2)}

Also consider these currently integrated AI models from live provider catalogs:

${JSON.stringify(integratedModels, null, 2)}

Return a JSON object with ${MARKETING_IDEA_LIMIT} ideas in the ideas array. Each idea must include description and action. Prioritize the ideas by expected view potential, with the strongest ideas first.`

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
                description: 'A concise customer-facing hook that explains the feature or benefit and why people would care.'
              },
              action: {
                type: 'string',
                description: 'A recommended marketing action with channel, format, opening angle, and campaign next step.'
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
    max_tokens: MARKETING_IDEA_MAX_TOKENS,
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

  if (message.stop_reason === 'max_tokens') {
    throw new Error('Marketing idea generation reached the token limit before finishing. Please retry.')
  }

  const ideas = normalizeMarketingIdeas(parseAnthropicJsonResponse(message)).slice(0, MARKETING_IDEA_LIMIT)
  if (ideas.length === 0) throw new Error('No marketing ideas were returned. Please retry.')

  return ideas
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
    const integratedModels = await getIntegratedModelPromptContext()
    const ideas = await generateMarketingIdeas(commitContext, integratedModels)

    res.status(200).json({ success: true, ideas })
  } catch (error) {
    console.error('Marketing ideas generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('token') ? 401 : 500
    res.status(statusCode).json({ error: errorMessage })
  }
}
