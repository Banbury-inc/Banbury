import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../config/config"
import { getServerContextValue } from "../../serverContext"

// Utility function to truncate Gmail message content to prevent token limit issues
const truncateGmailResponse = (messages: any[], maxTokensPerMessage: number = 2000, maxTotalMessages: number = 10) => {
  const truncatedMessages = messages.slice(0, maxTotalMessages).map(msg => {
    if (!msg || typeof msg !== 'object') return msg
    
    const truncated = { ...msg }
    
    // Truncate body content if it exists and is too long
    if (truncated.body && typeof truncated.body === 'string') {
      const bodyLength = truncated.body.length
      if (bodyLength > maxTokensPerMessage) {
        // Rough estimate: 1 token ≈ 4 characters
        const maxChars = maxTokensPerMessage * 4
        truncated.body = truncated.body.substring(0, maxChars) + '... [truncated]'
        truncated.bodyTruncated = true
        truncated.originalBodyLength = bodyLength
      }
    }
    
    // Truncate snippet if it exists and is too long
    if (truncated.snippet && typeof truncated.snippet === 'string') {
      const snippetLength = truncated.snippet.length
      if (snippetLength > 500) { // 500 chars for snippet
        truncated.snippet = truncated.snippet.substring(0, 500) + '... [truncated]'
        truncated.snippetTruncated = true
      }
    }
    
    return truncated
  })
  
  return {
    messages: truncatedMessages,
    totalCount: messages.length,
    truncated: messages.length > maxTotalMessages,
    maxMessagesReturned: maxTotalMessages,
    note: messages.length > maxTotalMessages ? 
      `Showing first ${maxTotalMessages} messages. Use gmail_get_message for full content of specific messages.` : 
      undefined
  }
}

// Helper function to extract only essential email data
const extractEssentialEmailData = (messageData: any, messageId: string, threadId?: string) => {
  // Extract headers from Gmail API response
  const headers = messageData.payload?.headers || []
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  
  // Extract body content
  let body = ''
  if (messageData.payload?.body?.data) {
    body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8')
  } else if (messageData.payload?.parts) {
    const textPart = messageData.payload.parts.find((part: any) => part.mimeType === 'text/plain')
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
    }
  }
  
  // Return only essential data
  return {
    id: messageId,
    threadId: threadId || messageData.threadId,
    subject: getHeader('subject') || '(No Subject)',
    from: getHeader('from') || 'Unknown',
    to: getHeader('to') || '',
    date: getHeader('date') || '',
    snippet: messageData.snippet || '',
    body: body
  }
}

// Gmail tools (proxy to Banbury API). Respects user toolPreferences via server context
export const gmailGetRecentTool = tool(
  async (input: { maxResults?: number; labelIds?: string[] }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean }
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const maxResults = Math.min(Number(input?.maxResults || 20), 10) // Cap at 10 to prevent token limit issues
    const labelIds = (input?.labelIds && input.labelIds.length > 0 ? input.labelIds : ["INBOX"]).join(",")

    // First, get the list of message IDs
    const listUrl = `${apiBase}/authentication/gmail/list_messages/?labelIds=${encodeURIComponent(labelIds)}&maxResults=${encodeURIComponent(String(maxResults))}`
    const listResp = await fetch(listUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
    if (!listResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${listResp.status}: ${listResp.statusText}` })
    }
    const listData = await listResp.json()
    
    if (!listData.messages || !Array.isArray(listData.messages)) {
      return JSON.stringify({ success: false, error: "No messages found or invalid response format" })
    }

    // Extract message IDs and fetch full message content using batch endpoint
    const messageIds = listData.messages.slice(0, maxResults).map((msg: any) => msg.id)
    let successfulMessages: any[] = []
    
    try {
      const batchUrl = `${apiBase}/authentication/gmail/messages/batch`
      const batchResp = await fetch(batchUrl, { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      })
      
      if (batchResp.ok) {
        const batchData = await batchResp.json()
        successfulMessages = (batchData.messages || []).map((messageData: any) => 
          extractEssentialEmailData(messageData, messageData.id, messageData.threadId)
        )
      } else {
        // Fallback to individual requests if batch fails
        const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
          try {
            const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`
            const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
            if (getResp.ok) {
              const messageData = await getResp.json()
              return extractEssentialEmailData(messageData, msg.id, msg.threadId)
            } else {
              return {
                id: msg.id,
                threadId: msg.threadId,
                error: `Failed to fetch message: ${getResp.status}`
              }
            }
          } catch (error) {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          }
        })

        const messages = await Promise.allSettled(messagePromises)
        successfulMessages = messages
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
      }
    } catch (error) {
      // Fallback to individual requests if batch fails
      const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
        try {
          const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`
          const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
          if (getResp.ok) {
            const messageData = await getResp.json()
            return extractEssentialEmailData(messageData, msg.id, msg.threadId)
          } else {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Failed to fetch message: ${getResp.status}`
            }
          }
        } catch (error) {
          return {
            id: msg.id,
            threadId: msg.threadId,
            error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      })

      const messages = await Promise.allSettled(messagePromises)
      successfulMessages = messages
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
    }

    // Truncate the response to prevent token limit issues
    const truncatedResponse = truncateGmailResponse(successfulMessages)

    return JSON.stringify({ 
      success: true, 
      ...truncatedResponse,
      nextPageToken: listData.nextPageToken
    })
  },
  {
    name: "gmail_get_recent",
    description: "Get recent Gmail messages with content (subject, sender, body, timestamp, attachments) from the INBOX. Long messages are automatically truncated to prevent token limit issues.",
    schema: z.object({
      maxResults: z.number().optional().describe("Maximum number of results to return (default 20, max 10 to prevent token limits)"),
      labelIds: z.array(z.string()).optional().describe("Optional Gmail labelIds (default ['INBOX'])"),
    }),
  }
)

export const gmailSearchTool = tool(
  async (input: { query: string; maxResults?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean }
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const maxResults = Math.min(Number(input?.maxResults || 20), 10) // Cap at 10 to prevent token limit issues
    // Backend supports Gmail-style q param if implemented; pass-through
    const listUrl = `${apiBase}/authentication/gmail/list_messages/?labelIds=${encodeURIComponent("INBOX")}&maxResults=${encodeURIComponent(String(maxResults))}&q=${encodeURIComponent(input.query)}`
    const listResp = await fetch(listUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
    if (!listResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${listResp.status}: ${listResp.statusText}` })
    }
    const listData = await listResp.json()
    
    if (!listData.messages || !Array.isArray(listData.messages)) {
      return JSON.stringify({ success: false, error: "No messages found or invalid response format" })
    }

    // Extract message IDs and fetch full message content using batch endpoint
    const messageIds = listData.messages.slice(0, maxResults).map((msg: any) => msg.id)
    let successfulMessages: any[] = []
    
    try {
      const batchUrl = `${apiBase}/authentication/gmail/messages/batch`
      const batchResp = await fetch(batchUrl, { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      })
      
      if (batchResp.ok) {
        const batchData = await batchResp.json()
        successfulMessages = (batchData.messages || []).map((messageData: any) => 
          extractEssentialEmailData(messageData, messageData.id, messageData.threadId)
        )
      } else {
        // Fallback to individual requests if batch fails
        const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
          try {
            const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`
            const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
            if (getResp.ok) {
              const messageData = await getResp.json()
              return extractEssentialEmailData(messageData, msg.id, msg.threadId)
            } else {
              return {
                id: msg.id,
                threadId: msg.threadId,
                error: `Failed to fetch message: ${getResp.status}`
              }
            }
          } catch (error) {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          }
        })

        const messages = await Promise.allSettled(messagePromises)
        successfulMessages = messages
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
      }
    } catch (error) {
      // Fallback to individual requests if batch fails
      const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
        try {
          const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`
          const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
          if (getResp.ok) {
            const messageData = await getResp.json()
            return extractEssentialEmailData(messageData, msg.id, msg.threadId)
          } else {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Failed to fetch message: ${getResp.status}`
            }
          }
        } catch (error) {
          return {
            id: msg.id,
            threadId: msg.threadId,
            error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      })

      const messages = await Promise.allSettled(messagePromises)
      successfulMessages = messages
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
    }

    // Truncate the response to prevent token limit issues
    const truncatedResponse = truncateGmailResponse(successfulMessages)

    return JSON.stringify({ 
      success: true, 
      ...truncatedResponse,
      query: input.query,
      nextPageToken: listData.nextPageToken
    })
  },
  {
    name: "gmail_search",
    description:
      "Search Gmail messages using Gmail search syntax. Examples: 'from:john@example.com', 'subject:meeting', 'is:unread', 'after:2024/01/01'. Returns message metadata and content.",
    schema: z.object({
      query: z.string().describe("Gmail search query, e.g., 'from:john@example.com is:unread'"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default 20, max 10 to prevent token limits)"),
    }),
  }
)

export const gmailGetMessageTool = tool(
  async (input: { messageId: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean }
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(input.messageId)}/`
    const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
    if (!getResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${getResp.status}: ${getResp.statusText}` })
    }
    const messageData = await getResp.json()
    
    // Extract only essential data
    const essentialData = extractEssentialEmailData(messageData, input.messageId)
    
    // Truncate single message content if it's too long
    const truncatedMessage = truncateGmailResponse([essentialData], 5000, 1)
    
    return JSON.stringify({ 
      success: true, 
      message: truncatedMessage.messages[0],
      note: truncatedMessage.messages[0].bodyTruncated ? 
        "Message body was truncated due to length. Full content available in Gmail." : 
        undefined
    })
  },
  {
    name: "gmail_get_message",
    description: "Get a specific Gmail message by its ID with full content. Use this to get complete message details after finding messages with gmail_get_recent or gmail_search.",
    schema: z.object({
      messageId: z.string().describe("The Gmail message ID"),
    }),
  }
)

export const gmailSendMessageTool = tool(
  async (input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean }
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const sendUrl = `${apiBase}/authentication/gmail/send_message/`
    const sendResp = await fetch(sendUrl, { 
      method: "POST", 
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        body: input.body,
        cc: input.cc,
        bcc: input.bcc,
        isDraft: input.isDraft || false
      })
    })
    
    if (!sendResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${sendResp.status}: ${sendResp.statusText}` })
    }
    const sendData = await sendResp.json()
    
    return JSON.stringify({ 
      success: true, 
      result: sendData,
      message: input.isDraft ? "Draft created successfully" : "Email sent successfully"
    })
  },
  {
    name: "gmail_send_message",
    description: "Send a new email or create a draft in Gmail",
    schema: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content (HTML supported)"),
      cc: z.string().optional().describe("CC recipient(s)"),
      bcc: z.string().optional().describe("BCC recipient(s)"),
      isDraft: z.boolean().optional().describe("Create as draft instead of sending (default: false)"),
    }),
  }
)

