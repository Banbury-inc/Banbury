import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../src/config/config"
import { getServerContextValue } from "../../../../../../src/assistant/langraph/serverContext"

// X API tools (proxy to Banbury API). Respects user toolPreferences via server context
export const xApiGetUserInfoTool = tool(
  async (input: { username?: string; userId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean }
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams()
    if (input.username) params.append('username', input.username)
    if (input.userId) params.append('user_id', input.userId)

    const url = `${apiBase}/authentication/x_api/user_info/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "x_api_get_user_info",
    description: "Get X (Twitter) user information by username or user ID",
    schema: z.object({
      username: z.string().optional().describe("X username (without @)"),
      userId: z.string().optional().describe("X user ID"),
    }),
  }
)

export const xApiGetUserTweetsTool = tool(
  async (input: { username?: string; userId?: string; maxResults?: number; excludeRetweets?: boolean; excludeReplies?: boolean; useAppBearer?: boolean }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean }
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const maxResults = Math.min(Number(input?.maxResults || 10), 100) // Cap at 100
    const params = new URLSearchParams({
      max_results: String(maxResults),
      exclude_retweets: String(input?.excludeRetweets || false),
      exclude_replies: String(input?.excludeReplies || false)
    })
    if (input.username) params.append('username', input.username)
    if (input.userId) params.append('user_id', input.userId)
    if (typeof input.useAppBearer === 'undefined' || input.useAppBearer === true) params.append('use_app_bearer', 'true')

    const url = `${apiBase}/authentication/x_api/user_tweets/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "x_api_get_user_tweets",
    description: "Get recent tweets from an X (Twitter) user by username or user ID",
    schema: z.object({
      username: z.string().optional().describe("X username (without @)"),
      userId: z.string().optional().describe("X user ID"),
      maxResults: z.number().optional().describe("Maximum number of tweets to return (default 10, max 100)"),
      excludeRetweets: z.boolean().optional().describe("Exclude retweets from results (default false)"),
      excludeReplies: z.boolean().optional().describe("Exclude replies from results (default false)"),
      useAppBearer: z.boolean().optional().describe("Force app bearer for arbitrary public accounts (default true)"),
    }),
  }
)

export const xApiSearchTweetsTool = tool(
  async (input: { query: string; maxResults?: number; language?: string; resultType?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean }
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const maxResults = Math.min(Number(input?.maxResults || 10), 100) // Cap at 100
    const params = new URLSearchParams({
      query: input.query,
      max_results: String(maxResults),
      language: input?.language || 'en',
      result_type: input?.resultType || 'recent'
    })

    const url = `${apiBase}/authentication/x_api/search_tweets/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "x_api_search_tweets",
    description: "Search for tweets using X (Twitter) search API",
    schema: z.object({
      query: z.string().describe("Search query for tweets"),
      maxResults: z.number().optional().describe("Maximum number of tweets to return (default 10, max 100)"),
      language: z.string().optional().describe("Language code for search (default 'en')"),
      resultType: z.string().optional().describe("Result type: 'recent', 'popular', or 'mixed' (default 'recent')"),
    }),
  }
)

export const xApiGetTrendingTopicsTool = tool(
  async (input: { woeid?: number; count?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean }
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const count = Math.min(Number(input?.count || 10), 50) // Cap at 50
    const params = new URLSearchParams({
      count: String(count)
    })
    if (input.woeid) params.append('woeid', String(input.woeid))

    const url = `${apiBase}/authentication/x_api/trending_topics/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "x_api_get_trending_topics",
    description: "Get trending topics on X (Twitter) for a specific location",
    schema: z.object({
      woeid: z.number().optional().describe("Where On Earth ID for location (default: worldwide)"),
      count: z.number().optional().describe("Number of trending topics to return (default 10, max 50)"),
    }),
  }
)

export const xApiPostTweetTool = tool(
  async (input: { text: string; replyToTweetId?: string; mediaIds?: string[] }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean }
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const payload: any = { text: input.text }
    if (input.replyToTweetId) payload.reply_to_tweet_id = input.replyToTweetId
    if (input.mediaIds && input.mediaIds.length > 0) payload.media_ids = input.mediaIds

    const url = `${apiBase}/authentication/x_api/post_tweet/`
    const resp = await fetch(url, { 
      method: 'POST', 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: "x_api_post_tweet",
    description: "Post a new tweet to X (Twitter) using your connected account",
    schema: z.object({
      text: z.string().describe("Tweet text content (max 280 characters)"),
      replyToTweetId: z.string().optional().describe("Tweet ID to reply to"),
      mediaIds: z.array(z.string()).optional().describe("Array of media IDs to attach to the tweet"),
    }),
  }
)

