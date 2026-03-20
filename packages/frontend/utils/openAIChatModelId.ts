const EXCLUDE_SUBSTRINGS = [
  "embedding",
  "whisper",
  "davinci",
  "moderation",
  "dall-e",
  "tts",
  "transcribe",
  "realtime",
  "audio",
  "speech",
  "sora",
  "gpt-image",
  "babbage",
  "curie",
  "cushman",
]

/**
 * Heuristic: chat / reasoning models suitable for the composer (excludes embeddings, audio, images, etc.).
 * Keep in sync with GET /api/assistant/openai-models filtering.
 */
export function isOpenAIChatModelId(id: string): boolean {
  const lower = id.toLowerCase()
  for (const sub of EXCLUDE_SUBSTRINGS) {
    if (lower.includes(sub)) return false
  }
  if (id.startsWith("gpt-")) return true
  if (/^o[0-9]/.test(id)) return true
  return false
}

/** Human-readable label from model id (OpenAI list API has no display_name). */
export function formatOpenAIModelDisplayName(id: string): string {
  if (/^o[0-9]/.test(id)) {
    return id
      .split("-")
      .map((part, i) =>
        i === 0 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join(" ")
  }
  if (!id.startsWith("gpt-")) return id
  const body = id.slice(4)
  const segments = body.split("-")
  const head = segments[0] ?? ""
  const tail = segments
    .slice(1)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
  return tail ? `GPT-${head} ${tail}` : `GPT-${head}`
}
