import type { NextApiRequest, NextApiResponse } from "next"
import {
  fetchGoogleGenerativeLanguageModels,
  type GoogleListModelRow,
} from "./handlers/fetchGoogleGenerativeLanguageModels"

interface GoogleModelDto {
  id: string
  displayName: string
  description?: string
  maxInputTokens?: number
  maxOutputTokens?: number
}

function stripModelsPrefix(name: string): string {
  return name.startsWith("models/") ? name.slice("models/".length) : name
}

function readMethods(m: GoogleListModelRow): string[] {
  const raw = m.supportedGenerationMethods ?? m.supported_generation_methods ?? []
  return Array.isArray(raw) ? raw.map((x) => String(x)) : []
}

function supportsGenerateContent(methods: string[]): boolean {
  return methods.some((x) => {
    const n = x.toLowerCase().replace(/_/g, "")
    return n === "generatecontent"
  })
}

function rowToDto(m: GoogleListModelRow): GoogleModelDto | null {
  const baseId =
    (m.baseModelId && m.baseModelId.trim()) ||
    (m.base_model_id && m.base_model_id.trim()) ||
    ""
  const id = baseId || (m.name ? stripModelsPrefix(m.name) : "")
  if (!id) return null
  const lower = id.toLowerCase()
  if (lower.includes("embed")) return null

  const methods = readMethods(m)
  const looksLikeGemini = /^gemini/i.test(id) || /^learnlm/i.test(id)
  if (!supportsGenerateContent(methods)) {
    if (!looksLikeGemini || methods.length > 0) return null
  }

  const displayName =
    (m.displayName && m.displayName.trim()) ||
    (m.display_name && m.display_name.trim()) ||
    id
  const inLimit =
    typeof m.inputTokenLimit === "number"
      ? m.inputTokenLimit
      : typeof m.input_token_limit === "number"
        ? m.input_token_limit
        : undefined
  const outLimit =
    typeof m.outputTokenLimit === "number"
      ? m.outputTokenLimit
      : typeof m.output_token_limit === "number"
        ? m.output_token_limit
        : undefined

  return {
    id,
    displayName,
    description: typeof m.description === "string" ? m.description : undefined,
    maxInputTokens: inLimit,
    maxOutputTokens: outLimit,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: "Google API key not configured" })
  }

  let listResult: Awaited<ReturnType<typeof fetchGoogleGenerativeLanguageModels>>
  try {
    listResult = await fetchGoogleGenerativeLanguageModels(apiKey)
  } catch (e) {
    console.error("google-models unexpected error", e)
    return res.status(502).json({
      error: "Failed to list Google models",
      details: e instanceof Error ? e.message : String(e),
    })
  }

  if (!listResult.ok) {
    console.error("google-models list failed", listResult.status, listResult.message)
    return res.status(502).json({
      error: "Failed to list Google models",
      googleStatus: listResult.status,
      details: listResult.message,
    })
  }

  const byId = new Map<string, GoogleModelDto>()
  for (const row of listResult.models) {
    const dto = rowToDto(row)
    if (!dto) continue
    if (!byId.has(dto.id)) byId.set(dto.id, dto)
  }

  const models = [...byId.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))

  return res.status(200).json({ models })
}
