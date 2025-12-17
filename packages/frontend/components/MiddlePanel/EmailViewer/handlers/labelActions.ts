import { ApiService } from '../../../../../backend/api/apiService'
import { GmailLabel, FALLBACK_SYSTEM_LABELS } from '../../../../../backend/api/emails/emails'

/**
 * Load available Gmail labels from the API
 */
export async function loadAvailableLabels(): Promise<GmailLabel[]> {
  try {
    const response = await ApiService.Emails.listLabels()
    return response.labels || FALLBACK_SYSTEM_LABELS
  } catch (err) {
    console.warn('Failed to load Gmail labels:', err)
    return FALLBACK_SYSTEM_LABELS
  }
}

/**
 * Toggle a label on an email message
 * @param messageId - The Gmail message ID
 * @param labelId - The label ID to toggle
 * @param currentlyHasLabel - Whether the email currently has the label
 */
export async function toggleLabel(
  messageId: string,
  labelId: string,
  currentlyHasLabel: boolean
): Promise<void> {
  if (currentlyHasLabel) {
    await ApiService.Emails.modifyMessage(messageId, { removeLabelIds: [labelId] })
  } else {
    await ApiService.Emails.modifyMessage(messageId, { addLabelIds: [labelId] })
  }
}

/**
 * Create a new Gmail label
 * @param name - The name for the new label
 * @returns The created GmailLabel
 */
export async function createLabel(name: string): Promise<GmailLabel> {
  return await ApiService.Emails.createLabel({ name })
}

/**
 * Create a new label and apply it to an email
 * @param messageId - The Gmail message ID
 * @param labelName - The name for the new label
 * @returns The created GmailLabel
 */
export async function createAndApplyLabel(
  messageId: string,
  labelName: string
): Promise<GmailLabel> {
  const newLabel = await ApiService.Emails.createLabel({ name: labelName })
  await ApiService.Emails.modifyMessage(messageId, { addLabelIds: [newLabel.id] })
  return newLabel
}

/**
 * Dispatch refresh events to notify other components
 */
export function dispatchLabelRefreshEvents(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('gmail-labels-refresh'))
    window.dispatchEvent(new Event('email-refresh'))
  }
}

