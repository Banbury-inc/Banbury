const LIST_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export interface GoogleListModelRow {
  name?: string
  baseModelId?: string
  displayName?: string
  description?: string
  inputTokenLimit?: number
  outputTokenLimit?: number
  supportedGenerationMethods?: string[]
  supported_generation_methods?: string[]
  input_token_limit?: number
  output_token_limit?: number
  base_model_id?: string
  display_name?: string
}

function parseGoogleErrorBody(text: string): string {
  try {
    const j = JSON.parse(text) as { error?: { message?: string; status?: string } }
    if (j?.error?.message) return j.error.message
  } catch {
    // ignore
  }
  return text.slice(0, 800)
}

type AuthMode = "header" | "query"

async function fetchModelsPage(
  trimmedKey: string,
  pageToken: string | undefined,
  mode: AuthMode,
): Promise<Response> {
  const url = new URL(LIST_BASE)
  url.searchParams.set("pageSize", "100")
  if (pageToken) url.searchParams.set("pageToken", pageToken)
  if (mode === "query") url.searchParams.set("key", trimmedKey)

  if (mode === "header") {
    return fetch(url.toString(), {
      headers: { "x-goog-api-key": trimmedKey },
    })
  }
  return fetch(url.toString())
}

export type FetchGoogleModelsResult =
  | { ok: true; models: GoogleListModelRow[] }
  | { ok: false; status: number; message: string }

export async function fetchGoogleGenerativeLanguageModels(apiKey: string): Promise<FetchGoogleModelsResult> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    return { ok: false, status: 400, message: "API key is empty (check for quotes/whitespace in .env)" }
  }

  let mode: AuthMode = "header"
  let first = await fetchModelsPage(trimmedKey, undefined, "header")
  if (!first.ok) {
    const headerErr = await first.text()
    const second = await fetchModelsPage(trimmedKey, undefined, "query")
    if (!second.ok) {
      const queryErr = await second.text()
      return {
        ok: false,
        status: second.status,
        message:
          parseGoogleErrorBody(queryErr) ||
          parseGoogleErrorBody(headerErr) ||
          `HTTP ${second.status}`,
      }
    }
    first = second
    mode = "query"
  }

  const aggregated: GoogleListModelRow[] = []

  let body = (await first.json()) as {
    models?: GoogleListModelRow[]
    nextPageToken?: string
  }
  if (Array.isArray(body.models)) aggregated.push(...body.models)
  let pageToken = body.nextPageToken

  while (pageToken) {
    const r = await fetchModelsPage(trimmedKey, pageToken, mode)
    if (!r.ok) {
      const t = await r.text()
      return {
        ok: false,
        status: r.status,
        message: parseGoogleErrorBody(t) || `HTTP ${r.status}`,
      }
    }
    body = (await r.json()) as { models?: GoogleListModelRow[]; nextPageToken?: string }
    if (Array.isArray(body.models)) aggregated.push(...body.models)
    pageToken = body.nextPageToken
  }

  return { ok: true, models: aggregated }
}
