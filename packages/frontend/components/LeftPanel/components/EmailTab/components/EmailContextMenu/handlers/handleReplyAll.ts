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

export async function handleReplyAll(
  email: ParsedEmail,
  onOpenCompose: (config: {
    to: string
    subject: string
    body?: string
    replyToId?: string
  }) => void
): Promise<void> {
  try {
    // Prepare reply all - include original recipients
    const replySubject = email.subject.startsWith('Re:') 
      ? email.subject 
      : `Re: ${email.subject}`
    
    // Combine from and to addresses
    const allRecipients = [email.from, email.to]
      .filter(Boolean)
      .join(', ')
    
    onOpenCompose({
      to: allRecipients,
      subject: replySubject,
      body: `\n\n---\nOn ${email.date}, ${email.from} wrote:\n${email.snippet}`,
      replyToId: email.id
    })
  } catch (error) {
    console.error('Failed to prepare reply all:', error)
    throw error
  }
}
