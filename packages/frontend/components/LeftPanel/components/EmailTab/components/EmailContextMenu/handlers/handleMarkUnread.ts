import { ApiService } from '../../../../../../../backend/api/apiService'

export async function handleMarkUnread(
  messageId: string,
  provider: 'gmail' | 'outlook'
): Promise<void> {
  try {
    if (provider === 'outlook') {
      await ApiService.Emails.modifyOutlookMessage(messageId, {
        isRead: false
      })
    } else {
      await ApiService.Emails.modifyMessage(messageId, {
        addLabelIds: ['UNREAD']
      })
    }
  } catch (error) {
    console.error('Failed to mark email as unread:', error)
    throw error
  }
}
