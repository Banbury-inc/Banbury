import { ApiService } from '../../../../../backend/api/apiService'
import { GmailMessage, OutlookMessage } from '../../../../../backend/api/emails/emails'

interface LoadNextBatchParams {
  selectedProvider: 'gmail' | 'outlook'
  selectedLabelId: string
  nextPageToken?: string
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  onSuccess: (data: {
    messages: (GmailMessage | OutlookMessage)[]
    nextPageToken?: string
  }) => void
}

export async function loadNextBatch({
  selectedProvider,
  selectedLabelId,
  nextPageToken,
  setIsLoadingMore,
  setError,
  onSuccess
}: LoadNextBatchParams) {
  if (!nextPageToken) return

  setIsLoadingMore(true)
  setError(null)

  try {
    if (selectedProvider === 'gmail') {
      const response = await ApiService.Emails.listMessages({
        labelIds: [selectedLabelId],
        maxResults: 50,
        pageToken: nextPageToken
      })

      if (response.messages && response.messages.length > 0) {
        const messageIds = response.messages.map((msg: { id: string }) => msg.id)
        try {
          const batchResponse = await ApiService.Emails.getMessagesBatch(messageIds)
          const fullMessages: GmailMessage[] = []

          for (const msg of response.messages) {
            const fullMessage = batchResponse.messages[msg.id]
            if (fullMessage && !fullMessage.error) {
              fullMessages.push(fullMessage)
            } else {
              fullMessages.push({
                id: msg.id,
                threadId: msg.threadId,
                snippet: 'Failed to load message',
                labelIds: []
              })
            }
          }

          onSuccess({
            messages: fullMessages,
            nextPageToken: response.nextPageToken
          })
        } catch (batchError) {
          console.error('Failed to load messages in batch:', batchError)
          // Fallback to using partial data
          onSuccess({
            messages: response.messages as GmailMessage[],
            nextPageToken: response.nextPageToken
          })
        }
      } else {
        onSuccess({
          messages: [],
          nextPageToken: undefined
        })
      }
    } else {
      // Outlook
      const response = await ApiService.Emails.listOutlookMessages({
        folderId: selectedLabelId,
        maxResults: 50,
        pageToken: nextPageToken
      })

      if (response.messages && response.messages.length > 0) {
        const messageIds = response.messages.map((msg: OutlookMessage) => msg.id)
        try {
          const batchResponse = await ApiService.Emails.getOutlookMessagesBatch(messageIds)
          const fullMessages: OutlookMessage[] = []

          for (const msg of response.messages) {
            const fullMessage = batchResponse.messages[msg.id]
            if (fullMessage && !('error' in fullMessage)) {
              fullMessages.push(fullMessage)
            } else {
              fullMessages.push(msg)
            }
          }

          onSuccess({
            messages: fullMessages,
            nextPageToken: response.nextPageToken
          })
        } catch (batchError) {
          console.error('Failed to load Outlook messages in batch:', batchError)
          onSuccess({
            messages: response.messages,
            nextPageToken: response.nextPageToken
          })
        }
      } else {
        onSuccess({
          messages: [],
          nextPageToken: undefined
        })
      }
    }
  } catch (err: any) {
    setError(err.message || 'Failed to load more messages')
  } finally {
    setIsLoadingMore(false)
  }
}
