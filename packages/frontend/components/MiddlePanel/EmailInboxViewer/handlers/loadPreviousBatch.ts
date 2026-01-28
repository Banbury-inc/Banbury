import { GmailMessage, OutlookMessage } from '../../../../../backend/api/emails/emails'

interface BatchHistoryEntry {
  messages: (GmailMessage | OutlookMessage)[]
  nextPageToken?: string
}

interface LoadPreviousBatchParams {
  batchHistory: BatchHistoryEntry[]
  currentBatchIndex: number
  setCurrentBatchIndex: React.Dispatch<React.SetStateAction<number>>
  onSuccess: (data: {
    messages: (GmailMessage | OutlookMessage)[]
    nextPageToken?: string
  }) => void
}

export function loadPreviousBatch({
  batchHistory,
  currentBatchIndex,
  setCurrentBatchIndex,
  onSuccess
}: LoadPreviousBatchParams) {
  if (currentBatchIndex <= 0) return

  const previousIndex = currentBatchIndex - 1
  const previousBatch = batchHistory[previousIndex]

  if (previousBatch) {
    setCurrentBatchIndex(previousIndex)
    onSuccess({
      messages: previousBatch.messages,
      nextPageToken: previousBatch.nextPageToken
    })
  }
}
