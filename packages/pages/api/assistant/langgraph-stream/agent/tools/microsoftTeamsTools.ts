import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

interface TeamsToolPreferences {
  teams?: boolean
}

function ensureTeamsEnabled() {
  const prefs = (getServerContextValue<any>("toolPreferences") || {}) as TeamsToolPreferences
  if (prefs.teams === false) return "Microsoft Teams access is disabled by user preference"
  return null
}

function getAuthContext() {
  const token = getServerContextValue<string>("authToken")
  if (!token) throw new Error("Missing auth token in server context")

  return {
    apiBase: CONFIG.url,
    headers: { Authorization: `Bearer ${token}` },
  }
}

async function readJsonResponse(resp: Response) {
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    return {
      success: false,
      error: data?.error || data?.message || `HTTP ${resp.status}: ${resp.statusText}`,
    }
  }

  return { success: true, ...data }
}

function appendOptionalParams(params: URLSearchParams, input: { maxResults?: number; pageToken?: string }) {
  if (typeof input.maxResults === "number") params.set("maxResults", String(input.maxResults))
  if (input.pageToken) params.set("pageToken", input.pageToken)
}

export const msTeamsListTeamsTool = tool(
  async (input: { maxResults?: number; pageToken?: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const params = new URLSearchParams()
    appendOptionalParams(params, input)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/teams/${queryString ? `?${queryString}` : ""}`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_list_teams",
    description: "List Microsoft Teams joined by the connected Microsoft account",
    schema: z.object({
      maxResults: z.number().optional().describe("Maximum teams to return"),
      pageToken: z.string().optional().describe("Pagination token for the next page"),
    }),
  }
)

export const msTeamsListChannelsTool = tool(
  async (input: { teamId: string; maxResults?: number; pageToken?: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const params = new URLSearchParams()
    appendOptionalParams(params, input)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/channels/${queryString ? `?${queryString}` : ""}`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_list_channels",
    description: "List channels in a Microsoft Team",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      maxResults: z.number().optional().describe("Maximum channels to return"),
      pageToken: z.string().optional().describe("Pagination token for the next page"),
    }),
  }
)

export const msTeamsListChannelMessagesTool = tool(
  async (input: { teamId: string; channelId: string; maxResults?: number; pageToken?: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const params = new URLSearchParams()
    appendOptionalParams(params, input)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/channels/${encodeURIComponent(input.channelId)}/messages/${queryString ? `?${queryString}` : ""}`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_list_channel_messages",
    description: "Read recent messages from a Microsoft Teams channel",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      channelId: z.string().describe("Microsoft Teams channel ID"),
      maxResults: z.number().optional().describe("Maximum messages to return"),
      pageToken: z.string().optional().describe("Pagination token for the next page"),
    }),
  }
)

export const msTeamsGetChannelMessageTool = tool(
  async (input: { teamId: string; channelId: string; messageId: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/channels/${encodeURIComponent(input.channelId)}/messages/${encodeURIComponent(input.messageId)}/`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_get_channel_message",
    description: "Get details for a specific Microsoft Teams channel message",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      channelId: z.string().describe("Microsoft Teams channel ID"),
      messageId: z.string().describe("Microsoft Teams channel message ID"),
    }),
  }
)

export const msTeamsSendChannelMessageTool = tool(
  async (input: { teamId: string; channelId: string; content: string; contentType?: "text" | "html" }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/channels/${encodeURIComponent(input.channelId)}/messages/`
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: input.content,
        contentType: input.contentType || "text",
      }),
    })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_send_channel_message",
    description: "Send a message to a Microsoft Teams channel from the connected Microsoft account",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      channelId: z.string().describe("Microsoft Teams channel ID"),
      content: z.string().describe("Message body to send"),
      contentType: z.enum(["text", "html"]).optional().describe("Message body format"),
    }),
  }
)

export const msTeamsListMessageRepliesTool = tool(
  async (input: { teamId: string; channelId: string; messageId: string; maxResults?: number; pageToken?: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const params = new URLSearchParams()
    appendOptionalParams(params, input)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/channels/${encodeURIComponent(input.channelId)}/messages/${encodeURIComponent(input.messageId)}/replies/${queryString ? `?${queryString}` : ""}`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_list_message_replies",
    description: "Read replies for a Microsoft Teams channel message",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      channelId: z.string().describe("Microsoft Teams channel ID"),
      messageId: z.string().describe("Microsoft Teams channel message ID"),
      maxResults: z.number().optional().describe("Maximum replies to return"),
      pageToken: z.string().optional().describe("Pagination token for the next page"),
    }),
  }
)

export const msTeamsReplyToMessageTool = tool(
  async (input: { teamId: string; channelId: string; messageId: string; content: string; contentType?: "text" | "html" }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/channels/${encodeURIComponent(input.channelId)}/messages/${encodeURIComponent(input.messageId)}/replies/`
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: input.content,
        contentType: input.contentType || "text",
      }),
    })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_reply_to_message",
    description: "Reply to a Microsoft Teams channel message from the connected Microsoft account",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      channelId: z.string().describe("Microsoft Teams channel ID"),
      messageId: z.string().describe("Microsoft Teams channel message ID"),
      content: z.string().describe("Reply body to send"),
      contentType: z.enum(["text", "html"]).optional().describe("Reply body format"),
    }),
  }
)

export const msTeamsListMembersTool = tool(
  async (input: { teamId: string; maxResults?: number; pageToken?: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const params = new URLSearchParams()
    appendOptionalParams(params, input)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/teams/${encodeURIComponent(input.teamId)}/members/${queryString ? `?${queryString}` : ""}`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_list_members",
    description: "List members of a Microsoft Team",
    schema: z.object({
      teamId: z.string().describe("Microsoft Team ID"),
      maxResults: z.number().optional().describe("Maximum members to return"),
      pageToken: z.string().optional().describe("Pagination token for the next page"),
    }),
  }
)

export const msTeamsListChatsTool = tool(
  async (input: { maxResults?: number; pageToken?: string }) => {
    const preferenceError = ensureTeamsEnabled()
    if (preferenceError) return JSON.stringify({ success: false, error: preferenceError })

    const { apiBase, headers } = getAuthContext()
    const params = new URLSearchParams()
    appendOptionalParams(params, input)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/teams/chats/${queryString ? `?${queryString}` : ""}`
    const resp = await fetch(url, { method: "GET", headers })
    return JSON.stringify(await readJsonResponse(resp))
  },
  {
    name: "ms_teams_list_chats",
    description: "List Microsoft Teams chats available to the connected Microsoft account",
    schema: z.object({
      maxResults: z.number().optional().describe("Maximum chats to return"),
      pageToken: z.string().optional().describe("Pagination token for the next page"),
    }),
  }
)
