import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession, MeetingSummary } from "../../../../types/meeting-types"

/**
 * Extracts action item checked states from HTML task list
 * TipTap task items have structure: <li data-type="taskItem" data-checked="true/false">...</li>
 */
function extractActionItemStatesFromHtml(htmlContent: string): Map<string, boolean> {
  const states = new Map<string, boolean>()
  
  // Parse task list items from HTML - TipTap uses data-checked attribute
  // We also look for data-action-item-id to map back to action items
  const taskItemRegex = /<li[^>]*data-type="taskItem"[^>]*(?:data-action-item-id="([^"]+)")?[^>]*data-checked="([^"]+)"[^>]*>/gi
  let match
  
  while ((match = taskItemRegex.exec(htmlContent)) !== null) {
    const actionItemId = match[1]
    const isChecked = match[2] === 'true'
    
    // Only add if we have an action item ID
    if (actionItemId) {
      states.set(actionItemId, isChecked)
    }
  }
  
  return states
}

/**
 * Saves edited summary HTML content to the backend
 * Uses PUT to update existing summary or POST to create new one
 */
export async function saveEditedSummary(
  sessionId: string,
  htmlContent: string,
  existingSummary?: MeetingSummary,
  actionItemCheckedStates?: Map<string, boolean>
): Promise<MeetingSummary> {
  if (!htmlContent || htmlContent.trim() === '') {
    throw new Error('Summary content cannot be empty')
  }

  // Extract action item checked states from HTML if not provided
  const checkedStates = actionItemCheckedStates || extractActionItemStatesFromHtml(htmlContent)

  // Update action items status based on checked states
  let updatedActionItems = existingSummary?.actionItems || []
  if (checkedStates.size > 0 && updatedActionItems.length > 0) {
    updatedActionItems = updatedActionItems.map(item => ({
      ...item,
      status: checkedStates.get(item.id) === true 
        ? 'completed' as const
        : item.status === 'completed' 
          ? 'pending' as const 
          : item.status
    }))
  }

  // If we have an existing summary, preserve its structure and update only the summary HTML and action items
  // Otherwise, create a new minimal summary
  const summary: MeetingSummary = existingSummary ? {
    ...existingSummary,
    summary: htmlContent,
    actionItems: updatedActionItems,
    generatedAt: existingSummary.generatedAt || new Date()
  } : {
    id: `summary-${Date.now()}`,
    meetingId: sessionId,
    summary: htmlContent,
    keyPoints: [],
    decisions: [],
    nextSteps: [],
    actionItems: updatedActionItems,
    generatedAt: new Date()
  }

  // Use POST to create/update summary (backend may handle both)
  const result = await ApiService.post<{ success: boolean; message: string; summary?: MeetingSummary }>(
    `/meeting-agent/sessions/${sessionId}/summary/`,
    summary
  )

  if (!result.success) {
    throw new Error(result.message || 'Failed to save edited summary')
  }

  return result.summary || summary
}

/**
 * Handler for saving edited summary with success/error callbacks
 */
export async function handleSaveEditedSummary(
  sessionId: string,
  htmlContent: string,
  existingSummary?: MeetingSummary,
  actionItemCheckedStates?: Map<string, boolean>,
  onSuccess?: (meeting: MeetingSession) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    if (!htmlContent || htmlContent.trim() === '') {
      const errorMessage = 'Summary content cannot be empty'
      onError?.(errorMessage)
      throw new Error(errorMessage)
    }

    // Save the edited summary - action item states will be extracted from HTML
    await saveEditedSummary(sessionId, htmlContent, existingSummary, actionItemCheckedStates)

    // Fetch updated meeting data
    try {
      const updatedMeeting = await ApiService.MeetingAgent.getMeetingSession(sessionId)
      onSuccess?.(updatedMeeting)
    } catch (fetchError) {
      console.warn('Failed to fetch updated meeting after saving summary:', fetchError)
      // Still call onSuccess even if fetch fails, as the save was successful
      onSuccess?.({} as MeetingSession)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save edited summary'
    console.error('Error saving edited summary:', error)
    onError?.(errorMessage)
    throw error
  }
}
