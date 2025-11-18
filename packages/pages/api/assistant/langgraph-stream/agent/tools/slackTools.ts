import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Slack tools (proxy to Banbury API). Respects user toolPreferences via server context
export const slackListChannelsTool = tool(
  async () => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/slack/channels/`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, channels: data.channels || [] })
  },
  {
    name: "slack_list_channels",
    description: "List all Slack channels the user has access to",
    schema: z.object({})
  }
)

export const slackSendMessageTool = tool(
  async (input: { channel: string; text: string; threadTs?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/slack/send_message/`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: input.channel,
        text: input.text,
        thread_ts: input.threadTs
      })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, message: data })
  },
  {
    name: "slack_send_message",
    description: "Send a message to a Slack channel. Can optionally reply to a thread.",
    schema: z.object({
      channel: z.string().describe("Channel ID or channel name (e.g., 'C1234567890' or '#general')"),
      text: z.string().describe("Message text to send"),
      threadTs: z.string().optional().describe("Optional thread timestamp to reply to a specific thread")
    })
  }
)

export const slackGetChannelHistoryTool = tool(
  async (input: { channel: string; limit?: number; oldest?: string; latest?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      channel: input.channel,
      limit: String(input.limit || 20)
    })
    if (input.oldest) params.append('oldest', input.oldest)
    if (input.latest) params.append('latest', input.latest)

    const url = `${apiBase}/authentication/slack/channel_history/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, messages: data.messages || [] })
  },
  {
    name: "slack_get_channel_history",
    description: "Get message history from a Slack channel",
    schema: z.object({
      channel: z.string().describe("Channel ID or channel name"),
      limit: z.number().optional().describe("Number of messages to retrieve (default 20, max 100)"),
      oldest: z.string().optional().describe("Start of time range (Unix timestamp)"),
      latest: z.string().optional().describe("End of time range (Unix timestamp)")
    })
  }
)

export const slackGetThreadRepliesTool = tool(
  async (input: { channel: string; threadTs: string; limit?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      channel: input.channel,
      thread_ts: input.threadTs,
      limit: String(input.limit || 20)
    })

    const url = `${apiBase}/authentication/slack/thread_replies/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, messages: data.messages || [] })
  },
  {
    name: "slack_get_thread_replies",
    description: "Get all replies in a specific Slack thread",
    schema: z.object({
      channel: z.string().describe("Channel ID or channel name"),
      threadTs: z.string().describe("Thread timestamp of the parent message"),
      limit: z.number().optional().describe("Number of replies to retrieve (default 20)")
    })
  }
)

export const slackSearchMessagesTool = tool(
  async (input: { query: string; count?: number; sort?: 'score' | 'timestamp' }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      query: input.query,
      count: String(input.count || 20),
      sort: input.sort || 'timestamp'
    })

    const url = `${apiBase}/authentication/slack/search/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, messages: data.messages || [], total: data.total || 0 })
  },
  {
    name: "slack_search_messages",
    description: "Search for messages across all Slack channels using query syntax",
    schema: z.object({
      query: z.string().describe("Search query (e.g., 'from:@user in:#channel keyword')"),
      count: z.number().optional().describe("Number of results (default 20, max 100)"),
      sort: z.enum(['score', 'timestamp']).optional().describe("Sort results by relevance or time (default 'timestamp')")
    })
  }
)

export const slackGetUserInfoTool = tool(
  async (input: { userId: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/slack/user_info/?user_id=${encodeURIComponent(input.userId)}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, user: data.user || {} })
  },
  {
    name: "slack_get_user_info",
    description: "Get information about a Slack user by their user ID",
    schema: z.object({
      userId: z.string().describe("Slack user ID (e.g., 'U1234567890')")
    })
  }
)

export const slackSetChannelTopicTool = tool(
  async (input: { channel: string; topic: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/slack/set_channel_topic/`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: input.channel,
        topic: input.topic
      })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "slack_set_channel_topic",
    description: "Set or update the topic for a Slack channel",
    schema: z.object({
      channel: z.string().describe("Channel ID or channel name"),
      topic: z.string().describe("New topic text for the channel")
    })
  }
)

export const slackAddReactionTool = tool(
  async (input: { channel: string; timestamp: string; name: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { slack?: boolean }
    if (prefs.slack === false) {
      return JSON.stringify({ success: false, error: "Slack access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/slack/add_reaction/`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: input.channel,
        timestamp: input.timestamp,
        name: input.name
      })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "slack_add_reaction",
    description: "Add an emoji reaction to a Slack message",
    schema: z.object({
      channel: z.string().describe("Channel ID where the message is located"),
      timestamp: z.string().describe("Timestamp of the message to react to"),
      name: z.string().describe("Emoji name without colons (e.g., 'thumbsup', 'heart', 'eyes')")
    })
  }
)

