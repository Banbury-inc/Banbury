import type { NextApiRequest, NextApiResponse } from "next"
import { isOpenAIChatModelId } from "../../../frontend/utils/openAIChatModelId"

interface OpenAIModelRow {
  id: string
  created?: number
  owned_by?: string
}

interface OpenAIModelDto {
  id: string
  created?: number
  ownedBy?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: "OpenAI API key not configured" })
  }

  let response: Response
  try {
    response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  } catch (e) {
    console.error("openai-models fetch failed", e)
    return res.status(502).json({ error: "Failed to reach OpenAI" })
  }

  if (!response.ok) {
    console.error("openai-models list failed", response.status, await response.text().catch(() => ""))
    return res.status(502).json({ error: "Failed to list OpenAI models" })
  }

  const body = (await response.json()) as { data?: OpenAIModelRow[] }
  const rows = Array.isArray(body.data) ? body.data : []

  const filtered = rows.filter((m) => m.id && isOpenAIChatModelId(m.id))
  filtered.sort((a, b) => (b.created ?? 0) - (a.created ?? 0))

  const models: OpenAIModelDto[] = filtered.map((m) => ({
    id: m.id,
    created: typeof m.created === "number" ? m.created : undefined,
    ownedBy: typeof m.owned_by === "string" ? m.owned_by : undefined,
  }))

  return res.status(200).json({ models })
}
