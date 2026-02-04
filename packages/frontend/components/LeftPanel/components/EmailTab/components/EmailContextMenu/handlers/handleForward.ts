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

export async function handleForward(
  email: ParsedEmail,
  onOpenCompose: (config: {
    to: string
    subject: string
    body?: string
  }) => void
): Promise<void> {
  try {
    // Prepare forward
    const forwardSubject = email.subject.startsWith('Fwd:') 
      ? email.subject 
      : `Fwd: ${email.subject}`
    
    onOpenCompose({
      to: '',
      subject: forwardSubject,
      body: `\n\n---\nForwarded message from ${email.from} on ${email.date}:\n\nSubject: ${email.subject}\n\n${email.snippet}`
    })
  } catch (error) {
    console.error('Failed to prepare forward:', error)
    throw error
  }
}
