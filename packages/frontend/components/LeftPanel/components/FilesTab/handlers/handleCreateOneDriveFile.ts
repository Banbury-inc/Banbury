import { ApiService } from '../../../../../../backend/api/apiService'
import { createOfficeBlob, ensureOfficeExtension, OfficeFileType } from './createOfficeBlobs'

interface HandleCreateOneDriveFileParams {
  fileType: OfficeFileType
  filename: string
  setIsCreating: (creating: boolean) => void
  setDefaultName: () => void
  setIsPending: (pending: boolean) => void
  setPendingName: (name: string | null) => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Handle creating a new Office file in OneDrive
 */
export async function handleCreateOneDriveFile({
  fileType,
  filename,
  setIsCreating,
  setDefaultName,
  setIsPending,
  setPendingName,
  onSuccess,
  onError,
}: HandleCreateOneDriveFileParams): Promise<void> {
  const name = filename.trim()
  if (name === '') {
    setIsCreating(false)
    return
  }

  const fullFilename = ensureOfficeExtension(name, fileType)
  const titleWithoutExt = name.replace(/\.(docx|xlsx|pptx)$/i, '')
  
  // Close input immediately and fire request in background
  setIsCreating(false)
  setDefaultName()
  setIsPending(true)
  setPendingName(fullFilename)
  
  try {
    // Generate the blob
    const blob = await createOfficeBlob(fileType, titleWithoutExt)
    
    // Upload to OneDrive (root folder)
    await ApiService.OneDrive.uploadFile(blob, fullFilename)
    
    onSuccess?.()
  } catch (error) {
    console.error(`Failed to create ${fileType} in OneDrive:`, error)
    onError?.(error instanceof Error ? error : new Error('Unknown error'))
  } finally {
    setIsPending(false)
    setPendingName(null)
  }
}

// Convenience wrappers for specific file types

export interface OneDriveFileCreationState {
  isCreating: boolean
  setIsCreating: (creating: boolean) => void
  newName: string
  setNewName: (name: string) => void
  isPending: boolean
  setIsPending: (pending: boolean) => void
  pendingName: string | null
  setPendingName: (name: string | null) => void
}

export async function handleCreateOneDriveDocumentSubmit(
  state: OneDriveFileCreationState,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  return handleCreateOneDriveFile({
    fileType: 'document',
    filename: state.newName,
    setIsCreating: state.setIsCreating,
    setDefaultName: () => state.setNewName('New Document.docx'),
    setIsPending: state.setIsPending,
    setPendingName: state.setPendingName,
    onSuccess,
    onError,
  })
}

export async function handleCreateOneDriveSpreadsheetSubmit(
  state: OneDriveFileCreationState,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  return handleCreateOneDriveFile({
    fileType: 'spreadsheet',
    filename: state.newName,
    setIsCreating: state.setIsCreating,
    setDefaultName: () => state.setNewName('New Spreadsheet.xlsx'),
    setIsPending: state.setIsPending,
    setPendingName: state.setPendingName,
    onSuccess,
    onError,
  })
}

export async function handleCreateOneDrivePresentationSubmit(
  state: OneDriveFileCreationState,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  return handleCreateOneDriveFile({
    fileType: 'presentation',
    filename: state.newName,
    setIsCreating: state.setIsCreating,
    setDefaultName: () => state.setNewName('New Presentation.pptx'),
    setIsPending: state.setIsPending,
    setPendingName: state.setPendingName,
    onSuccess,
    onError,
  })
}
