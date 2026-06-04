import type { Dispatch, SetStateAction } from 'react'

export interface MarketingIdea {
  description: string
  action: string
}

export interface MarketingAssetFile {
  file_id?: string
  file_name: string
  file_path: string
  file_size?: number
}

export interface MarketingAssetResult {
  postText: string
  screenshotPreview?: string
  videoPreview?: string
  captureUrl?: string
  screenshotFile?: MarketingAssetFile
  videoFile?: MarketingAssetFile
  postTextFile?: MarketingAssetFile
}

export interface MarketingAssetState {
  isCreating: boolean
  error: string | null
  result: MarketingAssetResult | null
}

interface RunMarketingIdeasGenerationParams {
  setIdeas: Dispatch<SetStateAction<MarketingIdea[]>>
  setError: Dispatch<SetStateAction<string | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

interface CreateMarketingAssetsParams {
  idea: MarketingIdea
  rowKey: string
  setAssetStates: Dispatch<SetStateAction<Record<string, MarketingAssetState>>>
}

interface MarketingIdeasResponse {
  success?: boolean
  ideas?: MarketingIdea[]
  error?: string
}

interface MarketingAssetsResponse {
  success?: boolean
  asset?: MarketingAssetResult
  error?: string
}

function isMarketingIdea(value: unknown): value is MarketingIdea {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<MarketingIdea>
  return typeof candidate.description === 'string' && typeof candidate.action === 'string'
}

function updateAssetState(
  rowKey: string,
  setAssetStates: Dispatch<SetStateAction<Record<string, MarketingAssetState>>>,
  state: Partial<MarketingAssetState>
) {
  setAssetStates((current) => ({
    ...current,
    [rowKey]: {
      isCreating: false,
      error: null,
      result: null,
      ...current[rowKey],
      ...state
    }
  }))
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

export async function createMarketingAssets({
  idea,
  rowKey,
  setAssetStates
}: CreateMarketingAssetsParams) {
  updateAssetState(rowKey, setAssetStates, {
    isCreating: true,
    error: null
  })

  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/admin/marketing-assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        idea,
        captureUrl: globalThis.location.href,
        origin: globalThis.location.origin
      })
    })

    const data = await response.json() as MarketingAssetsResponse

    if (!response.ok || !data.success || !data.asset) {
      updateAssetState(rowKey, setAssetStates, {
        isCreating: false,
        error: data.error || 'Unable to create marketing assets.'
      })
      return
    }

    updateAssetState(rowKey, setAssetStates, {
      isCreating: false,
      result: data.asset
    })
  } catch (error) {
    console.error('Failed to create marketing assets:', error)
    updateAssetState(rowKey, setAssetStates, {
      isCreating: false,
      error: 'Unable to create marketing assets.'
    })
  }
}

export function handleMarketingCreateClick(params: CreateMarketingAssetsParams) {
  void createMarketingAssets(params)
}
