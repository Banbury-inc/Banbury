import { ApiService } from '../../../../../../backend/api/apiService'
import { GmailLabel, FALLBACK_SYSTEM_LABELS } from '../../../../../../backend/api/emails/emails'

/**
 * Load Gmail labels from the API with fallback to system labels
 * @returns Promise resolving to array of GmailLabel objects
 */
export async function loadLabels(): Promise<GmailLabel[]> {
  try {
    const response = await ApiService.Emails.listLabels()
    return response.labels || FALLBACK_SYSTEM_LABELS
  } catch (err) {
    console.warn('Failed to load Gmail labels, using fallback:', err)
    return FALLBACK_SYSTEM_LABELS
  }
}

