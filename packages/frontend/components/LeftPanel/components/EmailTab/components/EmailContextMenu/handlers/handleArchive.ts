import { ApiService } from '../../../../../../../backend/api/apiService'

export async function handleArchive(
  messageId: string,
  provider: 'gmail' | 'outlook'
): Promise<void> {
  try {
    if (provider === 'outlook') {
      await ApiService.Emails.modifyOutlookMessage(messageId, {
        action: 'move',
        destinationFolderId: 'archive'
      })
    } else {
      await ApiService.Emails.modifyMessage(messageId, {
        removeLabelIds: ['INBOX']
      })
    }
  } catch (error) {
    console.error('Failed to archive email:', error)
    throw error
  }
}
