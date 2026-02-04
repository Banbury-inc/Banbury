import { ApiService } from '../../../../../../../backend/api/apiService'

export async function handleStar(
  messageId: string,
  provider: 'gmail' | 'outlook'
): Promise<void> {
  try {
    if (provider === 'outlook') {
      await ApiService.Emails.modifyOutlookMessage(messageId, {
        flag: 'flagged'
      })
    } else {
      await ApiService.Emails.modifyMessage(messageId, {
        addLabelIds: ['STARRED']
      })
    }
  } catch (error) {
    console.error('Failed to star email:', error)
    throw error
  }
}
