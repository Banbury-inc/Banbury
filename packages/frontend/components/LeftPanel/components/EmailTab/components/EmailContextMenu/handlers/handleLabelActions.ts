import { toggleLabel as toggleLabelUtil, createLabel as createLabelUtil, dispatchLabelRefreshEvents } from '../../../../../../MiddlePanel/EmailViewer/handlers/labelActions'

/**
 * Toggle a label on/off for an email
 * @param emailId - The email message ID
 * @param labelId - The label ID to toggle
 * @param currentlyHasLabel - Whether the email currently has this label
 */
export async function handleToggleLabel(
  emailId: string,
  labelId: string,
  currentlyHasLabel: boolean
): Promise<void> {
  await toggleLabelUtil(emailId, labelId, currentlyHasLabel)
  dispatchLabelRefreshEvents()
}

/**
 * Create a new label and apply it to an email
 * @param emailId - The email message ID
 * @param labelName - The name for the new label
 * @returns The created label
 */
export async function handleCreateAndApplyLabel(
  emailId: string,
  labelName: string
) {
  const newLabel = await createLabelUtil(labelName)
  await toggleLabelUtil(emailId, newLabel.id, false)
  dispatchLabelRefreshEvents()
  return newLabel
}
