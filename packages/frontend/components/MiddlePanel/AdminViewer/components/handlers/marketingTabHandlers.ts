import type { Dispatch, SetStateAction } from 'react'

export interface MarketingIdea {
  description: string
  action: string
}

interface RunMarketingIdeasGenerationParams {
  setIdeas: Dispatch<SetStateAction<MarketingIdea[]>>
  setError: Dispatch<SetStateAction<string | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

interface MarketingIdeasResponse {
  success?: boolean
  ideas?: MarketingIdea[]
  error?: string
}

function isMarketingIdea(value: unknown): value is MarketingIdea {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<MarketingIdea>
  return typeof candidate.description === 'string' && typeof candidate.action === 'string'
}

export async function runMarketingIdeasGeneration({
  setIdeas,
  setError,
  setIsLoading
}: RunMarketingIdeasGenerationParams) {
  setIsLoading(true)
  setError(null)

  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/admin/marketing-ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })

    const data = await response.json() as MarketingIdeasResponse

    if (!response.ok || !data.success) {
      setError(data.error || 'Unable to generate marketing ideas right now.')
      return
    }

    const ideas = Array.isArray(data.ideas) ? data.ideas.filter(isMarketingIdea) : []
    setIdeas(ideas)
  } catch (error) {
    console.error('Failed to generate marketing ideas:', error)
    setError('Unable to generate marketing ideas right now.')
  } finally {
    setIsLoading(false)
  }
}

export function handleMarketingRunClick(params: RunMarketingIdeasGenerationParams) {
  void runMarketingIdeasGeneration(params)
}
