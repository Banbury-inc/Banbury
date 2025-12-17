import { ApiService } from '../../../../../backend/api/apiService'

interface ThreadMessage {
  id: string
  threadId?: string
  internalDate?: string
  [key: string]: any
}

interface LoadThreadResult {
  messages: ThreadMessage[]
  error?: string
}

/**
 * Load thread messages for a given email using only Gmail's threadId.
 * No subject-based or heuristic linking is performed.
 * 
 * @param email - The selected email message
 * @returns Array of messages in the thread sorted by date (oldest first)
 */
export async function loadThreadMessages(email: ThreadMessage | null): Promise<LoadThreadResult> {
  // Guard: no email provided
  if (!email) return { messages: [] }

  // Guard: no threadId means show single email only (no heuristic linking)
  if (!email.threadId) return { messages: [email] }

  try {
    // Get thread metadata (message ids) from Gmail API
    const thread: any = await ApiService.Emails.getThread(email.threadId)
    
    const ids: string[] = (thread?.messages || thread?.thread?.messages || [])
      .map((m: any) => (m.id ? m.id : m.messageId ? m.messageId : m))
      .filter(Boolean)

    // Single message thread - just return the email
    if (!ids || ids.length <= 1) return { messages: [email] }

    // Fetch full messages in batch for rendering contents
    const batch = await ApiService.Emails.getMessagesBatch(ids)
    
    const fullMessages: ThreadMessage[] = ids
      .map((id) => batch?.messages?.[id])
      .filter((m): m is ThreadMessage => m && !m.error)
      // Sort by internalDate ascending (oldest first)
      .sort((a, b) => Number(a.internalDate || 0) - Number(b.internalDate || 0))

    return { 
      messages: fullMessages.length > 0 ? fullMessages : [email] 
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error loading thread'
    console.error('Error loading thread via threadId:', e)
    // On error, show only the selected email (no subject-based fallback)
    return { messages: [email], error: errorMessage }
  }
}

