import type { NextApiRequest, NextApiResponse } from "next"
import Anthropic from "@anthropic-ai/sdk"

interface AnthropicModelDto {
  id: string
  displayName: string
  maxInputTokens?: number
  maxOutputTokens?: number
}

interface ExtendedModelRow {
  id: string
  display_name: string
  max_input_tokens?: number
  max_tokens?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: "Anthropic API key not configured" })
  }

  const client = new Anthropic({ apiKey })
  const out: AnthropicModelDto[] = []

  try {
    for await (const model of client.models.list({ limit: 1000 })) {
      if (!model.id.startsWith("claude-")) continue
      const ext = model as unknown as ExtendedModelRow
      out.push({
        id: model.id,
        displayName: model.display_name,
        maxInputTokens: typeof ext.max_input_tokens === "number" ? ext.max_input_tokens : undefined,
        maxOutputTokens: typeof ext.max_tokens === "number" ? ext.max_tokens : undefined,
      })
    }
  } catch (e) {
    console.error("anthropic-models list failed", e)
    return res.status(502).json({ error: "Failed to list Anthropic models" })
  }

  return res.status(200).json({ models: out })
}
