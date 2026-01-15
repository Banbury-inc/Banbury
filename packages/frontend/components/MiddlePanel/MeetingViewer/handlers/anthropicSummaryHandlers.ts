import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession, MeetingSummary, ActionItem } from "../../../../types/meeting-types"
import type { Editor } from '@tiptap/react'
import { v4 as uuidv4 } from 'uuid'


interface SummaryData {
  summary: string
  keyPoints: string[]
  decisions: string[]
  nextSteps: string[]
  actionItems: Array<{
    description: string
    assignee?: string | null
    priority: 'low' | 'medium' | 'high'
    status: 'pending' | 'in_progress' | 'completed'
  }>
}

/**
 * Generates a meeting summary using Anthropic API directly (non-streaming)
 * Updates the tiptap editor with the generated content
 * Returns both HTML and structured data
 */
export async function handleGenerateAnthropicSummary(
  sessionId: string,
  transcriptionText: string,
  editor: Editor | null,
  onProgress?: (html: string) => void,
  onComplete?: (html: string, data?: SummaryData) => void,
  onError?: (error: string) => void
): Promise<{ html: string; data: SummaryData }> {
  const token = localStorage.getItem('authToken')

  if (!editor) {
    throw new Error('Editor instance is required')
  }

  try {
    // Clear editor content
    editor.commands.clearContent()

    // Show loading state
    editor.commands.setContent('<p>Generating summary...</p>', false)
    onProgress?.('<p>Generating summary...</p>')

    // Call the Anthropic endpoint (non-streaming)
    const response = await fetch('/api/meeting/generate-summary-anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        sessionId,
        transcriptionText
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(errorData.error || `API request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      throw new Error('No data received from AI')
    }

    const finalData: SummaryData = result.data

    // Convert to HTML for editor
    const finalHtml = convertSummaryDataToHtml(finalData)
    editor.commands.setContent(finalHtml, false)
    onProgress?.(finalHtml)

    // Call completion callback with HTML and data
    onComplete?.(finalHtml, finalData)

    return { html: finalHtml, data: finalData }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
    onError?.(errorMessage)
    throw error
  }
}

/**
 * Converts structured summary data to HTML for display in the editor
 */
function convertSummaryDataToHtml(data: SummaryData): string {
  let html = ''

  // Add summary section
  if (data.summary) {
    const summaryParagraphs = data.summary.split('\n\n').filter(p => p.trim())
    summaryParagraphs.forEach(para => {
      html += `<p>${escapeHtml(para)}</p>`
    })
  }

  // Add key points
  if (data.keyPoints && data.keyPoints.length > 0) {
    html += '<h2>Key Points</h2><ul>'
    data.keyPoints.forEach(point => {
      html += `<li>${escapeHtml(point)}</li>`
    })
    html += '</ul>'
  }

  // Add decisions
  if (data.decisions && data.decisions.length > 0) {
    html += '<h2>Decisions Made</h2><ul>'
    data.decisions.forEach(decision => {
      html += `<li>${escapeHtml(decision)}</li>`
    })
    html += '</ul>'
  }

  // Add next steps
  if (data.nextSteps && data.nextSteps.length > 0) {
    html += '<h2>Next Steps</h2><ul>'
    data.nextSteps.forEach(step => {
      html += `<li>${escapeHtml(step)}</li>`
    })
    html += '</ul>'
  }

  // Add action items
  if (data.actionItems && data.actionItems.length > 0) {
    html += '<h2>Action Items</h2><ul>'
    data.actionItems.forEach(item => {
      let itemText = escapeHtml(item.description)
      if (item.assignee) {
        itemText += ` <em>(${escapeHtml(item.assignee)})</em>`
      }
      html += `<li>${itemText}</li>`
    })
    html += '</ul>'
  }

  return html || '<p>No summary available</p>'
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  // Fallback for server-side
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Saves the generated summary data to the backend
 * Note: This may fail if the backend requires transcription to be in the session first
 */
export async function saveSummaryDataToBackend(
  sessionId: string,
  summaryData: SummaryData,
  htmlContent?: string
): Promise<MeetingSummary> {
  // Convert action items to the expected format
  const actionItems: ActionItem[] = (summaryData.actionItems || []).map((item) => ({
    id: uuidv4(),
    description: item.description || '',
    assignee: item.assignee || undefined,
    priority: item.priority || 'medium',
    status: item.status || 'pending'
  }))
  
  // Use HTML content if provided, otherwise convert from data
  const summaryHtml = htmlContent || convertSummaryDataToHtml(summaryData)
  
  const summary: MeetingSummary = {
    id: `summary-${Date.now()}`,
    meetingId: sessionId,
    summary: summaryHtml, // Save HTML content for editor display
    keyPoints: summaryData.keyPoints || [],
    decisions: summaryData.decisions || [],
    nextSteps: summaryData.nextSteps || [],
    actionItems: actionItems,
    generatedAt: new Date() // ApiService should serialize this to ISO string
  }

  const result = await ApiService.post<{ success: boolean; message: string; summary?: MeetingSummary }>(
    `/meeting-agent/sessions/${sessionId}/summary/`,
    summary
  )

  if (!result.success) {
    // Backend may require transcription to be saved in session first
    // This is a known limitation - the summary is still displayed in the editor
    throw new Error(result.message || 'Failed to save summary to backend. Summary is still displayed in the editor.')
  }

  return result.summary || summary
}

/**
 * Main handler for generating and saving meeting summaries with Anthropic
 */
export async function handleGenerateAnthropicSummaryWithSave(
  sessionId: string,
  transcriptionText: string,
  editor: Editor | null,
  onSuccess?: (meeting: MeetingSession) => void,
  onError?: (error: string) => void,
  onProgress?: (html: string) => void
): Promise<void> {
  try {
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      throw new Error('No transcription available for summary generation')
    }

    if (!editor) {
      throw new Error('Editor instance is required')
    }

    // Generate summary
    const { html: htmlContent, data: summaryData } = await handleGenerateAnthropicSummary(
      sessionId,
      transcriptionText,
      editor,
      onProgress,
      async (html, data) => {
        // Try to save to backend when complete, but don't fail if it doesn't work
        // The summary is already displayed in the editor
        if (data) {
          try {
            await saveSummaryDataToBackend(sessionId, data, html)
          } catch (saveError) {
            console.warn('Failed to save summary to backend (summary is still displayed in editor):', saveError)
            // Don't throw - summary was generated successfully and is displayed
          }
        }
      },
      onError
    )

    // Also save after generation completes (in case onComplete didn't save)
    try {
      await saveSummaryDataToBackend(sessionId, summaryData, htmlContent)
    } catch (saveError) {
      console.warn('Failed to save summary to backend after generation:', saveError)
      // Don't throw - summary was generated successfully and is displayed
    }

    // Try to fetch updated meeting data, but don't fail if it doesn't work
    try {
      const updatedMeeting = await ApiService.MeetingAgent.getMeetingSession(sessionId)
      onSuccess?.(updatedMeeting)
    } catch (fetchError) {
      console.warn('Failed to fetch updated meeting (summary is still displayed):', fetchError)
      // Still call onSuccess with current meeting state if available
      // The summary is already in the editor, so this is not critical
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
    console.error('Summary generation error:', error)
    onError?.(errorMessage)
    throw error
  }
}

/**
 * Handler for regenerating a meeting summary
 * This is the same as generating a new summary, but used when a summary already exists
 */
export async function handleRegenerateAnthropicSummary(
  sessionId: string,
  transcriptionText: string,
  editor: Editor | null,
  onSuccess?: (meeting: MeetingSession) => void,
  onError?: (error: string) => void,
  onProgress?: (html: string) => void
): Promise<void> {
  // Regeneration is the same as generation - just clear and regenerate
  return handleGenerateAnthropicSummaryWithSave(
    sessionId,
    transcriptionText,
    editor,
    onSuccess,
    onError,
    onProgress
  )
}
