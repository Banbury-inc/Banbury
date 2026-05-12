import { ApiService } from '../../../../../../backend/api/apiService'
import { createOfficeBlob, ensureOfficeExtension, OfficeFileType } from './createOfficeBlobs'

interface HandleCreateDropboxFileParams {
  fileType: OfficeFileType
  filename: string
  setIsCreating: (_creating: boolean) => void
  setDefaultName: () => void
  setIsPending: (_pending: boolean) => void
  setPendingName: (_name: string | null) => void
  onSuccess?: () => void
  onError?: (_error: Error) => void
}

export interface DropboxFileCreationState {
  isCreating: boolean
  setIsCreating: (_creating: boolean) => void
  newName: string
  setNewName: (_name: string) => void
  isPending: boolean
  setIsPending: (_pending: boolean) => void
  pendingName: string | null
  setPendingName: (_name: string | null) => void
}

export async function handleCreateDropboxFile({
  fileType,
  filename,
  setIsCreating,
  setDefaultName,
  setIsPending,
  setPendingName,
  onSuccess,
  onError,
}: HandleCreateDropboxFileParams): Promise<void> {
  const name = filename.trim()
  if (name === '') {
    setIsCreating(false)
    return
  }

  const fullFilename = ensureOfficeExtension(name, fileType)
  const titleWithoutExt = name.replace(/\.(docx|xlsx|pptx)$/i, '')

  setIsCreating(false)
  setDefaultName()
  setIsPending(true)
  setPendingName(fullFilename)

  try {
    const blob = await createOfficeBlob(fileType, titleWithoutExt)
    await ApiService.Dropbox.uploadFile(blob, fullFilename)
    onSuccess?.()
  } catch (error) {
    console.error(`Failed to create ${fileType} in Dropbox:`, error)
    onError?.(error instanceof Error ? error : new Error('Unknown error'))
  } finally {
    setIsPending(false)
    setPendingName(null)
  }
}

export async function handleCreateDropboxDocumentSubmit(
  state: DropboxFileCreationState,
  onSuccess?: () => void,
  onError?: (_error: Error) => void
): Promise<void> {
  return handleCreateDropboxFile({
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

export async function handleCreateDropboxSpreadsheetSubmit(
  state: DropboxFileCreationState,
  onSuccess?: () => void,
  onError?: (_error: Error) => void
): Promise<void> {
  return handleCreateDropboxFile({
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

export async function handleCreateDropboxPresentationSubmit(
  state: DropboxFileCreationState,
  onSuccess?: () => void,
  onError?: (_error: Error) => void
): Promise<void> {
  return handleCreateDropboxFile({
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
