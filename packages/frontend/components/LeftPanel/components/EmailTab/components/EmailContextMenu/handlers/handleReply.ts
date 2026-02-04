import { GmailMessage, OutlookMessage } from '../../../../../../../backend/api/emails/emails'

interface ParsedEmail {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  isRead: boolean
  hasAttachments: boolean
  labels: string[]
  isDraft: boolean
  provider: 'gmail' | 'outlook'
  isStarred?: boolean
}

export async function handleReply(
  email: ParsedEmail,
  onOpenCompose: (config: {
    to: string
    subject: string
    body?: string
    replyToId?: string
  }) => void
): Promise<void> {
  try {
    // Prepare reply
    const replySubject = email.subject.startsWith('Re:') 
      ? email.subject 
      : `Re: ${email.subject}`
    
    onOpenCompose({
      to: email.from,
      subject: replySubject,
      body: `\n\n---\nOn ${email.date}, ${email.from} wrote:\n${email.snippet}`,
      replyToId: email.id
    })
  } catch (error) {
    console.error('Failed to prepare reply:', error)
    throw error
  }
}
