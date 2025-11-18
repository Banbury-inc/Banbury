import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Tavily web search input parameters
interface TavilySearchInput {
  query: string
  searchDepth?: "basic" | "advanced"
  maxResults?: number
  includeAnswer?: boolean
  includeRawContent?: boolean
  includeImages?: boolean
  includeImageDescriptions?: boolean
  topic?: string
  timeRange?: "day" | "week" | "month" | "year"
  includeDomains?: string[]
  excludeDomains?: string[]
}

// Web search result shape
interface WebSearchResult { title: string; url: string; snippet: string }

// Create tools following athena-intelligence patterns
export const webSearchTool = tool(
  async (input: TavilySearchInput) => {

    const normalizeUrl = (raw: string | undefined): string | null => {
      if (!raw) return null
      try {
        const u = new URL(raw)
        return u.toString()
      } catch {
        return null
      }
    }

    const fetchWithTimeout = async (url: string, ms: number): Promise<string | null> => {
      const controller = new AbortController()
      const to = setTimeout(() => controller.abort(), ms)
      try {
        const resp = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0" } })
        if (!resp.ok) return null
        const text = await resp.text()
        return text || null
      } catch {
        return null
      } finally {
        clearTimeout(to)
      }
    }

    const extractMeta = (html: string, name: string): string | null => {
      const rx = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i")
      const m = html.match(rx)
      return m?.[1] || null
    }

    const extractTitle = (html: string): string | null => {
      const og = extractMeta(html, "og:title")
      if (og) return og
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return m?.[1] || null
    }

    const extractDescription = (html: string): string | null => {
      const ogd = extractMeta(html, "og:description") || extractMeta(html, "twitter:description") || extractMeta(html, "description")
      if (ogd) return ogd
      const p = html.match(/<p[^>]*>(.*?)<\/p>/i)
      if (p?.[1]) return p[1].replace(/<[^>]+>/g, "").trim()
      return null
    }

    // Merge defaults from server context (if provided) with input
    const defaultOptions = (getServerContextValue<any>("webSearchDefaults") || {}) as Partial<TavilySearchInput>
    const merged = { ...defaultOptions, ...input } as TavilySearchInput

    // Prefer Tavily if available for high-quality, content-rich results
    const results: WebSearchResult[] = []
    const maxResults = Math.max(1, Math.min(Number(merged?.maxResults ?? 5), 10))
    const tavilyKey = process.env.TAVILY_API_KEY || "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"
    if (tavilyKey) {
      try {
        const tavilyResp = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${tavilyKey}` },
          body: JSON.stringify({
            query: input.query,
            search_depth: merged.searchDepth || "advanced",
            include_answer: merged.includeAnswer ?? true,
            include_raw_content: merged.includeRawContent ?? true,
            include_images: merged.includeImages ?? false,
            include_image_descriptions: merged.includeImageDescriptions ?? false,
            topic: merged.topic || "general",
            time_range: merged.timeRange,
            include_domains: Array.isArray(merged.includeDomains) && merged.includeDomains.length ? merged.includeDomains : undefined,
            exclude_domains: Array.isArray(merged.excludeDomains) && merged.excludeDomains.length ? merged.excludeDomains : undefined,
            max_results: maxResults,
          }),
        })
        if (tavilyResp.ok) {
          const data: any = await tavilyResp.json()
          const items: any[] = Array.isArray(data?.results) ? data.results : []
          for (const r of items) {
            const url = normalizeUrl(r?.url)
            const title = (r?.title || "Result").toString()
            const snippet = (r?.content || r?.raw_content || "").toString().slice(0, 500)
            if (url) results.push({ title, url, snippet })
            if (results.length >= maxResults) break
          }
        }
      } catch {}
    }

    // Fallback to DuckDuckGo + enrichment if Tavily is unavailable or returned nothing
    if (results.length === 0) {
      try {
        const mod: any = await import("duck-duck-scrape")
        const search = mod.search || mod.default?.search || mod
        const ddg: any = await search(input.query, { maxResults: Math.min(maxResults * 2, 20) })
        const items: any[] = Array.isArray(ddg?.results) ? ddg.results : Array.isArray(ddg) ? ddg : []
        for (const r of items) {
          const url = normalizeUrl(r.url || r.link || r.href)
          if (!url) continue
          const title = (r.title || r.name || r.text || "Result").toString()
          const snippet = (r.description || r.snippet || r.text || "").toString()
          results.push({ title, url, snippet })
          if (results.length >= maxResults) break
        }
      } catch {}
    }

    // Enrich results by fetching page content
    const enrichPromises: Array<Promise<WebSearchResult>> = results.map(async (r) => {
      const html = await fetchWithTimeout(r.url, 4500)
      if (!html) return r
      const title = extractTitle(html) || r.title
      const desc = extractDescription(html) || r.snippet || ""
      return { title, url: r.url, snippet: desc } as WebSearchResult
    })
    const enriched = await Promise.all(enrichPromises).catch(() => results)

    if (enriched.length === 0) {
      const fallbackUrl = `https://duckduckgo.com/?q=${encodeURIComponent(input.query)}`
      return JSON.stringify({
        results: [
          { title: `Search Results for "${input.query}"`, url: fallbackUrl, snippet: `Click to view search results for "${input.query}" on DuckDuckGo.` },
        ],
        query: input.query,
      })
    }

    return JSON.stringify({ results: enriched, query: input.query })
  },
  {
    name: "web_search",
    description: "Search the web and read page content for summaries",
    schema: z.object({
      query: z.string(),
      searchDepth: z.enum(["basic", "advanced"]).optional(),
      maxResults: z.number().int().min(1).max(10).optional(),
      includeAnswer: z.boolean().optional(),
      includeRawContent: z.boolean().optional(),
      includeImages: z.boolean().optional(),
      includeImageDescriptions: z.boolean().optional(),
      topic: z.string().optional(),
      timeRange: z.enum(["day", "week", "month", "year"]).optional(),
      includeDomains: z.array(z.string()).optional(),
      excludeDomains: z.array(z.string()).optional(),
    })
  }
)

