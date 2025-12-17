import { ApiService } from "../apiService";
import axios from 'axios';

export interface GmailMessageListResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  payload?: any
  internalDate?: string
}

export interface GmailThreadMessage {
  id: string
  from?: string
  subject?: string
  date?: string
  snippet?: string
}

export interface GmailThreadResponse {
  result: 'success' | 'error'
  id?: string
  messages?: GmailThreadMessage[]
  error?: string
}

export interface GmailLabel {
  id: string
  name: string
  type: 'system' | 'user'
  messageListVisibility?: 'show' | 'hide'
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide'
  messagesTotal?: number
  messagesUnread?: number
  threadsTotal?: number
  threadsUnread?: number
  color?: {
    textColor?: string
    backgroundColor?: string
  }
}

export interface GmailLabelListResponse {
  labels: GmailLabel[]
}

// Fallback system labels when the API endpoint is unavailable
export const FALLBACK_SYSTEM_LABELS: GmailLabel[] = [
  { id: 'INBOX', name: 'Inbox', type: 'system' },
  { id: 'SENT', name: 'Sent', type: 'system' },
  { id: 'DRAFT', name: 'Drafts', type: 'system' },
  { id: 'STARRED', name: 'Starred', type: 'system' },
  { id: 'SPAM', name: 'Spam', type: 'system' },
  { id: 'TRASH', name: 'Trash', type: 'system' },
  { id: 'IMPORTANT', name: 'Important', type: 'system' },
  { id: 'UNREAD', name: 'Unread', type: 'system' },
  { id: 'CATEGORY_PERSONAL', name: 'Personal', type: 'system' },
  { id: 'CATEGORY_SOCIAL', name: 'Social', type: 'system' },
  { id: 'CATEGORY_PROMOTIONS', name: 'Promotions', type: 'system' },
  { id: 'CATEGORY_UPDATES', name: 'Updates', type: 'system' },
  { id: 'CATEGORY_FORUMS', name: 'Forums', type: 'system' },
]


export default class Emails {
    constructor(_api: ApiService) {}
  /**
   * Search emails by query
   */

  static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  static async searchEmails(query: string): Promise<any> {
    try {
      // First get the message list (basic metadata)
      const listResponse = await ApiService.get<any>(`/authentication/gmail/list_messages/?q=${encodeURIComponent(query)}&maxResults=10`);
      
      if (!listResponse.messages || listResponse.messages.length === 0) {
        return { messages: [] };
      }
      
      // Extract message IDs and get full details using batch endpoint
      const messageIds = listResponse.messages.map((msg: any) => msg.id);
      
      const batchResponse = await ApiService.post<any>('/authentication/gmail/messages/batch', {
        messageIds: messageIds
      });
      
      // Convert the batch response format to match expected format
      const fullMessages = Object.values(batchResponse.messages || {});
      
      return {
        messages: fullMessages,
        nextPageToken: listResponse.nextPageToken,
        resultSizeEstimate: listResponse.resultSizeEstimate
      };
    } catch (error) {
      console.error('Gmail search error:', error);
      ApiService.handleError(error, `Search emails with query: ${query}`);
      throw error;
    }
  }

  static async listMessages(params?: { labelIds?: string[]; maxResults?: number; pageToken?: string; q?: string }) {
    const query: Record<string, any> = {}
    if (params?.labelIds && params.labelIds.length > 0) {
      query.labelIds = params.labelIds[0]
    }
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.q) query.q = params.q

    const url = new URL(`${ApiService.baseURL}/authentication/gmail/list_messages/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))
    if (params?.labelIds && params.labelIds.length > 1) {
      params.labelIds.slice(1).forEach((lid) => url.searchParams.append('labelIds', lid))
    }

    const resp = await axios.get<GmailMessageListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  static async getMessage(messageId: string) {
    const resp = await axios.get<GmailMessage>(
      `${ApiService.baseURL}/authentication/gmail/messages/${encodeURIComponent(messageId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async sendMessage(input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean; in_reply_to?: string; references?: string; thread_id?: string; attachments?: Array<{ filename: string; mimeType?: string; content: string }> }) {
    const resp = await axios.post(`${ApiService.baseURL}/authentication/gmail/send_message/`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  static async sendReply(input: { original_message_id: string; to: string; subject: string; body: string; cc?: string; bcc?: string; attachments?: Array<{ filename: string; mimeType?: string; content: string }> }) {
    // Use files app endpoint to support attachments
    const resp = await axios.post(`${ApiService.baseURL}/files/gmail/reply`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  static async getThread(threadId: string) {
    const resp = await axios.get<GmailThreadResponse>(
      `${ApiService.baseURL}/authentication/gmail/thread/${encodeURIComponent(threadId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async listThreads(params?: { q?: string; maxResults?: number }) {
    const query: Record<string, any> = {}
    if (params?.q) query.q = params.q
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults

    const url = new URL(`${ApiService.baseURL}/authentication/gmail/threads/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  static async modifyMessage(messageId: string, change: { addLabelIds?: string[]; removeLabelIds?: string[] }) {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/gmail/messages/${encodeURIComponent(messageId)}/modify/`,
      change,
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  static async getMessagesBatch(messageIds: string[]) {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/gmail/messages/batch`,
      { messageIds },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  static async getAttachment(messageId: string, attachmentId: string) {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/gmail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getSignature() {
    const resp = await axios.get(
      `${ApiService.baseURL}/files/gmail/signature`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async sendMessageWithSignature(input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean; in_reply_to?: string; references?: string; thread_id?: string; attachments?: Array<{ filename: string; mimeType?: string; content: string }> }) {
    const resp = await axios.post(`${ApiService.baseURL}/files/gmail/send_with_signature`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  /**
   * List all Gmail labels (system + user labels)
   * Falls back to a static list of system labels if the endpoint is unavailable
   */
  static async listLabels(): Promise<GmailLabelListResponse> {
    try {
      const resp = await axios.get<GmailLabelListResponse>(
        `${ApiService.baseURL}/authentication/gmail/labels/`,
        { headers: this.withAuthHeaders() }
      )
      return resp.data
    } catch (error) {
      // If endpoint doesn't exist or fails, return fallback system labels
      console.warn('Gmail labels endpoint unavailable, using fallback system labels:', error)
      return { labels: FALLBACK_SYSTEM_LABELS }
    }
  }

  /**
   * Create a new Gmail label
   * @param input Label creation parameters
   * @returns The created label
   */
  static async createLabel(input: { name: string; labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide'; messageListVisibility?: 'show' | 'hide' }): Promise<GmailLabel> {
    const resp = await axios.post<GmailLabel>(
      `${ApiService.baseURL}/authentication/gmail/labels/`,
      input,
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  /**
   * Delete a Gmail label
   * @param labelId The label ID to delete
   */
  static async deleteLabel(labelId: string): Promise<void> {
    await axios.delete(
      `${ApiService.baseURL}/authentication/gmail/labels/${encodeURIComponent(labelId)}/`,
      { headers: this.withAuthHeaders() }
    )
  }

}