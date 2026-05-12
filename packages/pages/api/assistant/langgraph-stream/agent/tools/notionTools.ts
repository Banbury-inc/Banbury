import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

type HttpMethod = "GET" | "POST"

function getNotionToolContext() {
  const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { notion?: boolean }
  if (prefs.notion === false) {
    return { error: "Notion access is disabled by user preference" }
  }

  const token = getServerContextValue<string>("authToken")
  if (!token) throw new Error("Missing auth token in server context")

  return { apiBase: CONFIG.url, token }
}

async function callNotionBackend(method: HttpMethod, endpoint: string, body?: unknown) {
  const context = getNotionToolContext()
  if ("error" in context) return { success: false, error: context.error }

  const resp = await fetch(`${context.apiBase}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${context.token}`,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(body || {}) } : {}),
  })

  if (!resp.ok) return { success: false, error: `HTTP ${resp.status}: ${resp.statusText}` }

  const data = await resp.json()
  return { success: true, data }
}

export const notionSearchTool = tool(
  async (input: { query?: string; filter?: string; limit?: number; cursor?: string }) => {
    const params = new URLSearchParams()
    if (input.query) params.append("query", input.query)
    if (input.filter) params.append("filter", input.filter)
    if (input.limit) params.append("limit", String(Math.min(input.limit, 100)))
    if (input.cursor) params.append("cursor", input.cursor)

    const queryString = params.toString()
    const result = await callNotionBackend(
      "GET",
      queryString ? `/authentication/notion/search/?${queryString}` : "/authentication/notion/search/"
    )

    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, results: result.data.results || [], nextCursor: result.data.nextCursor || null })
  },
  {
    name: "notion_search",
    description: "Search connected Notion pages and data sources. Returns matching resources with IDs, titles, URLs, and pagination cursor.",
    schema: z.object({
      query: z.string().optional().describe("Search query text"),
      filter: z.string().optional().describe("Optional backend-supported resource filter such as page, database, or data_source"),
      limit: z.number().optional().describe("Number of results to retrieve (default backend value, max 100)"),
      cursor: z.string().optional().describe("Pagination cursor from a previous search response"),
    }),
  }
)

export const notionGetPageTool = tool(
  async (input: { pageId: string }) => {
    const result = await callNotionBackend("GET", `/authentication/notion/pages/${encodeURIComponent(input.pageId)}/`)
    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, page: result.data })
  },
  {
    name: "notion_get_page",
    description: "Get metadata and properties for a connected Notion page by page ID.",
    schema: z.object({
      pageId: z.string().describe("Notion page ID"),
    }),
  }
)

export const notionGetPageBlocksTool = tool(
  async (input: { pageId: string; pageSize?: number; cursor?: string }) => {
    const params = new URLSearchParams()
    params.append("page_size", String(Math.min(input.pageSize || 100, 100)))
    if (input.cursor) params.append("cursor", input.cursor)

    const result = await callNotionBackend(
      "GET",
      `/authentication/notion/pages/${encodeURIComponent(input.pageId)}/blocks/?${params.toString()}`
    )

    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, blocks: result.data.results || [], nextCursor: result.data.nextCursor || null })
  },
  {
    name: "notion_get_page_blocks",
    description: "Read block children for a connected Notion page with pagination.",
    schema: z.object({
      pageId: z.string().describe("Notion page ID"),
      pageSize: z.number().optional().describe("Number of blocks to retrieve (default 100, max 100)"),
      cursor: z.string().optional().describe("Pagination cursor from a previous block response"),
    }),
  }
)

export const notionQueryDataSourceTool = tool(
  async (input: { dataSourceId: string; filter?: Record<string, unknown>; sorts?: Array<Record<string, unknown>>; pageSize?: number; startCursor?: string }) => {
    const result = await callNotionBackend(
      "POST",
      `/authentication/notion/data_sources/${encodeURIComponent(input.dataSourceId)}/query/`,
      {
        filter: input.filter,
        sorts: input.sorts,
        pageSize: input.pageSize,
        startCursor: input.startCursor,
      }
    )

    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, pages: result.data.results || [], nextCursor: result.data.nextCursor || null })
  },
  {
    name: "notion_query_data_source",
    description: "Query pages from a connected Notion data source using backend-supported Notion filters and sorts.",
    schema: z.object({
      dataSourceId: z.string().describe("Notion data source ID"),
      filter: z.record(z.unknown()).optional().describe("Notion data source filter object"),
      sorts: z.array(z.record(z.unknown())).optional().describe("Notion sort objects"),
      pageSize: z.number().optional().describe("Number of pages to retrieve"),
      startCursor: z.string().optional().describe("Pagination cursor from a previous query response"),
    }),
  }
)

export const notionListTemplatesTool = tool(
  async (input: { dataSourceId: string; name?: string; pageSize?: number; cursor?: string }) => {
    const params = new URLSearchParams()
    if (input.name) params.append("name", input.name)
    params.append("page_size", String(Math.min(input.pageSize || 100, 100)))
    if (input.cursor) params.append("start_cursor", input.cursor)

    const result = await callNotionBackend(
      "GET",
      `/authentication/notion/data_sources/${encodeURIComponent(input.dataSourceId)}/templates/?${params.toString()}`
    )

    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, templates: result.data.results || result.data.templates || [], nextCursor: result.data.nextCursor || null })
  },
  {
    name: "notion_list_templates",
    description: "List templates for a connected Notion data source, optionally filtered by template name.",
    schema: z.object({
      dataSourceId: z.string().describe("Notion data source ID"),
      name: z.string().optional().describe("Case-insensitive template name substring"),
      pageSize: z.number().optional().describe("Number of templates to retrieve (default 100, max 100)"),
      cursor: z.string().optional().describe("Pagination cursor from a previous template response"),
    }),
  }
)

export const notionCreatePageTool = tool(
  async (input: { parent: Record<string, unknown>; properties?: Record<string, unknown>; children?: Array<Record<string, unknown>>; icon?: Record<string, unknown>; cover?: Record<string, unknown> }) => {
    const result = await callNotionBackend("POST", "/authentication/notion/pages/", input)
    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, page: result.data, message: "Notion page created successfully" })
  },
  {
    name: "notion_create_page",
    description: "Create a Notion page under a parent page or data source. Requires explicit parent and property payloads.",
    schema: z.object({
      parent: z.record(z.unknown()).describe("Notion parent object, such as { page_id } or { data_source_id }"),
      properties: z.record(z.unknown()).optional().describe("Notion page properties"),
      children: z.array(z.record(z.unknown())).optional().describe("Optional Notion block children"),
      icon: z.record(z.unknown()).optional().describe("Optional Notion icon object"),
      cover: z.record(z.unknown()).optional().describe("Optional Notion cover object"),
    }),
  }
)

export const notionCreatePageFromTemplateTool = tool(
  async (input: { dataSourceId: string; templateId: string; parent?: Record<string, unknown>; properties?: Record<string, unknown> }) => {
    const result = await callNotionBackend(
      "POST",
      `/authentication/notion/data_sources/${encodeURIComponent(input.dataSourceId)}/pages_from_template/`,
      {
        templateId: input.templateId,
        parent: input.parent,
        properties: input.properties,
      }
    )

    if (!result.success) return JSON.stringify(result)
    return JSON.stringify({ success: true, page: result.data, message: "Notion page created from template successfully" })
  },
  {
    name: "notion_create_page_from_template",
    description: "Create a Notion page from a data source template. Use notion_list_templates first to choose the template ID.",
    schema: z.object({
      dataSourceId: z.string().describe("Notion data source ID"),
      templateId: z.string().describe("Notion template ID"),
      parent: z.record(z.unknown()).optional().describe("Optional parent override"),
      properties: z.record(z.unknown()).optional().describe("Optional page properties to apply during creation"),
    }),
  }
)
