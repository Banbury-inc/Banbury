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

  /**
   * Check if Gmail is connected and accessible
   */
  static async checkGmailConnection(): Promise<{ connected: boolean }> {
    try {
      // Try to fetch labels as a simple connectivity check
      await this.listLabels()
      return { connected: true }
    } catch (error) {
      return { connected: false }
    }
  }

  /**
   * Alias for listMessages for backward compatibility
   */
  static async getMessages(params?: { labelIds?: string[]; maxResults?: number; pageToken?: string; q?: string }): Promise<GmailMessageListResponse> {
    return this.listMessages(params)
  }

  /**
   * Add labels to a message
   */
  static async addLabels(messageId: string, labelIds: string[]): Promise<any> {
    return this.modifyMessage(messageId, { addLabelIds: labelIds })
  }

  /**
   * Remove labels from a message
   */
  static async removeLabels(messageId: string, labelIds: string[]): Promise<any> {
    return this.modifyMessage(messageId, { removeLabelIds: labelIds })
  }

  /**
   * Delete a message (move to trash)
   */
  static async deleteMessage(messageId: string): Promise<any> {
    return this.modifyMessage(messageId, { addLabelIds: ['TRASH'] })
  }

  // =========================================================================
  // Outlook API Methods
  // =========================================================================

  /**
   * List Outlook messages
   */
  static async listOutlookMessages(params?: { folderId?: string; maxResults?: number; pageToken?: string; q?: string }): Promise<OutlookMessageListResponse> {
    const query: Record<string, any> = {}
    if (params?.folderId) query.folderId = params.folderId
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.q) query.q = params.q

    const url = new URL(`${ApiService.baseURL}/authentication/outlook/list_messages/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get<OutlookMessageListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * Get a single Outlook message by ID
   */
  static async getOutlookMessage(messageId: string): Promise<OutlookMessage> {
    const resp = await axios.get<OutlookMessage>(
      `${ApiService.baseURL}/authentication/outlook/messages/${encodeURIComponent(messageId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Get multiple Outlook messages in batch
   */
  static async getOutlookMessagesBatch(messageIds: string[]): Promise<{ messages: Record<string, OutlookMessage> }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/outlook/messages/batch`,
      { messageIds },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  /**
   * List Outlook mail folders (equivalent to Gmail labels)
   */
  static async listOutlookFolders(): Promise<OutlookFolderListResponse> {
    try {
      const resp = await axios.get<OutlookFolderListResponse>(
        `${ApiService.baseURL}/authentication/outlook/folders/`,
        { headers: this.withAuthHeaders() }
      )
      return resp.data
    } catch (error) {
      console.warn('Outlook folders endpoint unavailable, using fallback:', error)
      return { folders: FALLBACK_OUTLOOK_FOLDERS }
    }
  }

  /**
   * Send an Outlook email
   */
  static async sendOutlookMessage(input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean }): Promise<any> {
    const resp = await axios.post(`${ApiService.baseURL}/authentication/outlook/send_message/`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  /**
   * Send a reply to an Outlook email
   */
  static async sendOutlookReply(input: { original_message_id: string; body: string }): Promise<any> {
    const resp = await axios.post(`${ApiService.baseURL}/authentication/outlook/reply/`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  /**
   * Modify an Outlook message (star/flag, read/unread, delete, move)
   */
  static async modifyOutlookMessage(messageId: string, change: {
    action?: 'delete' | 'permanentDelete' | 'move'
    destinationFolderId?: string
    isRead?: boolean
    flag?: 'flagged' | 'notFlagged' | 'complete'
    addLabelIds?: string[]
    removeLabelIds?: string[]
  }): Promise<any> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/outlook/messages/${encodeURIComponent(messageId)}/modify/`,
      change,
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  /**
   * Get an Outlook message attachment
   */
  static async getOutlookAttachment(messageId: string, attachmentId: string): Promise<OutlookAttachment> {
    const resp = await axios.get<OutlookAttachment>(
      `${ApiService.baseURL}/authentication/outlook/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Get all messages in an Outlook conversation/thread
   */
  static async getOutlookThread(conversationId: string): Promise<OutlookThreadResponse> {
    const resp = await axios.get<OutlookThreadResponse>(
      `${ApiService.baseURL}/authentication/outlook/thread/${encodeURIComponent(conversationId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Search Outlook emails
   */
  static async searchOutlookEmails(query: string): Promise<any> {
    try {
      const listResponse = await this.listOutlookMessages({ q: query, maxResults: 10 })
      
      if (!listResponse.messages || listResponse.messages.length === 0) {
        return { messages: [] }
      }
      
      const messageIds = listResponse.messages.map((msg: any) => msg.id)
      const batchResponse = await this.getOutlookMessagesBatch(messageIds)
      const fullMessages = Object.values(batchResponse.messages || {})
      
      return {
        messages: fullMessages,
        nextPageToken: listResponse.nextPageToken
      }
    } catch (error) {
      console.error('Outlook search error:', error)
      throw error
    }
  }

  /**
   * Alias for listOutlookMessages for backward compatibility
   */
  static async getOutlookMessages(params?: { folderId?: string; maxResults?: number; pageToken?: string; q?: string }): Promise<OutlookMessageListResponse> {
    return this.listOutlookMessages(params)
  }

  /**
   * Alias for listOutlookFolders for backward compatibility
   */
  static async getOutlookFolders(): Promise<OutlookFolderListResponse> {
    return this.listOutlookFolders()
  }

  /**
   * Flag or unflag an Outlook message
   */
  static async flagOutlookMessage(messageId: string, flagged: boolean): Promise<any> {
    return this.modifyOutlookMessage(messageId, { 
      flag: flagged ? 'flagged' : 'notFlagged' 
    })
  }

  /**
   * Delete an Outlook message (move to deleted items)
   */
  static async deleteOutlookMessage(messageId: string): Promise<any> {
    return this.modifyOutlookMessage(messageId, { action: 'delete' })
  }
}

// =========================================================================
// Outlook Types
// =========================================================================

export interface OutlookMessageListResponse {
  messages: OutlookMessage[]
  nextPageToken?: string
}

export interface OutlookMessage {
  id: string
  subject?: string
  from?: {
    emailAddress: {
      name?: string
      address: string
    }
  }
  toRecipients?: Array<{
    emailAddress: {
      name?: string
      address: string
    }
  }>
  ccRecipients?: Array<{
    emailAddress: {
      name?: string
      address: string
    }
  }>
  receivedDateTime?: string
  sentDateTime?: string
  bodyPreview?: string
  body?: {
    contentType: 'Text' | 'HTML'
    content: string
  }
  isRead?: boolean
  hasAttachments?: boolean
  flag?: {
    flagStatus: 'notFlagged' | 'flagged' | 'complete'
  }
  parentFolderId?: string
  conversationId?: string
  internetMessageHeaders?: Array<{
    name: string
    value: string
  }>
  attachments?: OutlookAttachment[]
}

export interface OutlookFolder {
  id: string
  name: string
  type: 'system' | 'user'
  parentFolderId?: string
  messagesUnread?: number
  messagesTotal?: number
}

export interface OutlookFolderListResponse {
  folders: OutlookFolder[]
}

export interface OutlookAttachment {
  id: string
  name: string
  contentType: string
  size: number
  data?: string  // Base64 encoded content
}

export interface OutlookThreadResponse {
  result: 'success' | 'error'
  id?: string
  messages?: OutlookMessage[]
  error?: string
}

// Fallback Outlook folders when the API endpoint is unavailable
export const FALLBACK_OUTLOOK_FOLDERS: OutlookFolder[] = [
  { id: 'inbox', name: 'Inbox', type: 'system' },
  { id: 'sentitems', name: 'Sent Items', type: 'system' },
  { id: 'drafts', name: 'Drafts', type: 'system' },
  { id: 'deleteditems', name: 'Deleted Items', type: 'system' },
  { id: 'junkemail', name: 'Junk Email', type: 'system' },
  { id: 'archive', name: 'Archive', type: 'system' },
]