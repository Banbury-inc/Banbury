import type { NextApiRequest, NextApiResponse } from "next"
import {
  FALLBACK_VIDEO_GENERATION_MODELS,
  type MediaModelConfig,
} from "../../../frontend/components/RightPanel/composer/handlers/getMediaModelDisplayName"
import {
  fetchGoogleGenerativeLanguageModels,
  type GoogleListModelRow,
} from "./handlers/fetchGoogleGenerativeLanguageModels"

interface OpenAIModelRow {
  id: string
  created?: number
}

function getConfiguredGoogleKey(): string | undefined {
  return process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
}

function stripModelsPrefix(name: string): string {
  return name.startsWith("models/") ? name.slice("models/".length) : name
}

function getGoogleModelId(model: GoogleListModelRow): string {
  const baseId =
    (model.baseModelId && model.baseModelId.trim()) ||
    (model.base_model_id && model.base_model_id.trim()) ||
    ""
  return baseId || (model.name ? stripModelsPrefix(model.name) : "")
}

function getGoogleDisplayName(model: GoogleListModelRow, id: string): string {
  return (
    (model.displayName && model.displayName.trim()) ||
    (model.display_name && model.display_name.trim()) ||
    id
  )
}

function isOpenAIVideoModelId(modelId: string): boolean {
  return modelId.toLowerCase().startsWith("sora")
}

function isGoogleVideoModelId(modelId: string): boolean {
  return modelId.toLowerCase().startsWith("veo")
}

function formatModelName(modelId: string): string {
  return modelId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function mergeModels(models: MediaModelConfig[]): MediaModelConfig[] {
  const byId = new Map<string, MediaModelConfig>()
  for (const model of FALLBACK_VIDEO_GENERATION_MODELS) byId.set(model.id, model)
  for (const model of models) {
    if (!byId.has(model.id)) byId.set(model.id, model)
  }
  return [...byId.values()]
}

async function fetchOpenAIVideoModels(): Promise<MediaModelConfig[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return []

  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to list OpenAI video models: ${response.statusText}`)
  }

  const body = (await response.json()) as { data?: OpenAIModelRow[] }
  const rows = Array.isArray(body.data) ? body.data : []

  return rows
    .filter((model) => model.id && isOpenAIVideoModelId(model.id))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
    .map((model) => ({
      id: model.id,
      name: formatModelName(model.id),
      provider: "openai" as const,
      kind: "video" as const,
    }))
}

async function fetchGoogleVideoModels(): Promise<MediaModelConfig[]> {
  const apiKey = getConfiguredGoogleKey()
  if (!apiKey) return []

  const listResult = await fetchGoogleGenerativeLanguageModels(apiKey)
  if (!listResult.ok) {
    throw new Error(`Failed to list Google video models: ${listResult.message}`)
  }

  return listResult.models
    .map((model) => {
      const id = getGoogleModelId(model)
      if (!id || !isGoogleVideoModelId(id)) return null

      return {
        id,
        name: getGoogleDisplayName(model, id),
        provider: "google" as const,
        kind: "video" as const,
        description: typeof model.description === "string" ? model.description : undefined,
      }
    })
    .filter((model): model is MediaModelConfig => Boolean(model))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  const results = await Promise.allSettled([
    fetchOpenAIVideoModels(),
    fetchGoogleVideoModels(),
  ])

  for (const result of results) {
    if (result.status === "rejected") console.error("video-generation-models fetch failed", result.reason)
  }

  const discovered = results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
  return res.status(200).json({ models: mergeModels(discovered) })
}
