import axios from 'axios'

import { CONFIG } from '../config/config'

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

export class EmailService {
  private static baseURL = CONFIG.url

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  static async listMessages(params?: { labelIds?: string[]; maxResults?: number; pageToken?: string; q?: string }) {
    const query: Record<string, any> = {}
    if (params?.labelIds && params.labelIds.length > 0) {
      query.labelIds = params.labelIds[0]
    }
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.q) query.q = params.q

    const url = new URL(`${this.baseURL}/authentication/gmail/list_messages/`)
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
      `${this.baseURL}/authentication/gmail/messages/${encodeURIComponent(messageId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async sendMessage(input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean; in_reply_to?: string; references?: string; thread_id?: string }) {
    const resp = await axios.post(`${this.baseURL}/authentication/gmail/send_message/`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  static async sendReply(input: { original_message_id: string; to: string; subject: string; body: string; cc?: string; bcc?: string }) {
    const resp = await axios.post(`${this.baseURL}/authentication/gmail/reply/`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }

  static async getThread(threadId: string) {
    const resp = await axios.get<GmailMessage>(
      `${this.baseURL}/authentication/gmail/thread/${encodeURIComponent(threadId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async listThreads(params?: { q?: string; maxResults?: number }) {
    const query: Record<string, any> = {}
    if (params?.q) query.q = params.q
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults

    const url = new URL(`${this.baseURL}/authentication/gmail/threads/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  static async modifyMessage(messageId: string, change: { addLabelIds?: string[]; removeLabelIds?: string[] }) {
    const resp = await axios.post(
      `${this.baseURL}/authentication/gmail/messages/${encodeURIComponent(messageId)}/modify/`,
      change,
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  static async getMessagesBatch(messageIds: string[]) {
    const resp = await axios.post(
      `${this.baseURL}/authentication/gmail/messages/batch`,
      { messageIds },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  static async getAttachment(messageId: string, attachmentId: string) {
    const resp = await axios.get(
      `${this.baseURL}/authentication/gmail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getSignature() {
    const resp = await axios.get(
      `${this.baseURL}/files/gmail/signature`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async sendMessageWithSignature(input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean; in_reply_to?: string; references?: string; thread_id?: string }) {
    const resp = await axios.post(`${this.baseURL}/files/gmail/send_with_signature`, input, {
      headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() }
    })
    return resp.data
  }
}


