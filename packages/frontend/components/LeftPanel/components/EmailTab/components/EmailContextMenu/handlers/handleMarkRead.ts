import { ApiService } from '../../../../../../../backend/api/apiService'

export async function handleMarkRead(
  messageId: string,
  provider: 'gmail' | 'outlook'
): Promise<void> {
  try {
    if (provider === 'outlook') {
      await ApiService.Emails.modifyOutlookMessage(messageId, {
        isRead: true
      })
    } else {
      await ApiService.Emails.modifyMessage(messageId, {
        removeLabelIds: ['UNREAD']
      })
    }
  } catch (error) {
    console.error('Failed to mark email as read:', error)
    throw error
  }
}
