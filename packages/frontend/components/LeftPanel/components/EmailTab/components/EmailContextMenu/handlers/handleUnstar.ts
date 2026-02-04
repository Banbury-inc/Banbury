import { ApiService } from '../../../../../../../backend/api/apiService'

export async function handleUnstar(
  messageId: string,
  provider: 'gmail' | 'outlook'
): Promise<void> {
  try {
    if (provider === 'outlook') {
      await ApiService.Emails.modifyOutlookMessage(messageId, {
        flag: 'notFlagged'
      })
    } else {
      await ApiService.Emails.modifyMessage(messageId, {
        removeLabelIds: ['STARRED']
      })
    }
  } catch (error) {
    console.error('Failed to unstar email:', error)
    throw error
  }
}
