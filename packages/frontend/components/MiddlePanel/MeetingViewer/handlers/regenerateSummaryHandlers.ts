import { MeetingSession } from "../../../../types/meeting-types"
import { handleRegenerateAnthropicSummary } from "./anthropicSummaryHandlers"
import type { Editor } from '@tiptap/react'

interface RegenerateSummaryParams {
  sessionId: string
  transcriptionText: string
  editor: Editor | null
  onSuccess?: (meeting: MeetingSession) => void
  onError?: (error: string) => void
  onProgress?: (html: string) => void
}

/**
 * Handler for regenerating a meeting summary
 * Validates inputs and calls the regenerate function
 */
export async function handleRegenerateSummary({
  sessionId,
  transcriptionText,
  editor,
  onSuccess,
  onError,
  onProgress
}: RegenerateSummaryParams): Promise<void> {
  if (!transcriptionText || transcriptionText.trim().length === 0) {
    const error = 'No transcription available. Please wait for transcription to complete.'
    onError?.(error)
    throw new Error(error)
  }

  if (!editor) {
    const error = 'Editor not ready. Please try again.'
    onError?.(error)
    throw new Error(error)
  }

  try {
    await handleRegenerateAnthropicSummary(
      sessionId,
      transcriptionText,
      editor,
      onSuccess,
      onError,
      onProgress
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate summary'
    onError?.(errorMessage)
    throw error
  }
}
