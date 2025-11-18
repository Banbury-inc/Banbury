import { ApiService } from "../../../../../../backend/api/apiService"

interface HandleCreateRootFolderSubmitParams {
  newRootFolderName: string
  setIsCreatingRootFolder: (creating: boolean) => void
  setNewRootFolderName: (name: string) => void
  setIsCreatingRootFolderPending: (pending: boolean) => void
  setPendingRootFolderName: (name: string | null) => void
  onFolderCreated?: (name: string) => void | Promise<void>
}

export async function handleCreateRootFolderSubmit({
  newRootFolderName,
  setIsCreatingRootFolder,
  setNewRootFolderName,
  setIsCreatingRootFolderPending,
  setPendingRootFolderName,
  onFolderCreated,
}: HandleCreateRootFolderSubmitParams) {
  const name = newRootFolderName.trim()
  if (name === '') {
    setIsCreatingRootFolder(false)
    return
  }
  // Close input immediately and fire request in background
  setIsCreatingRootFolder(false)
  setNewRootFolderName('New Folder')
  setIsCreatingRootFolderPending(true)
  setPendingRootFolderName(name)
  
  try {
    await ApiService.createFolder('', name)
    if (onFolderCreated) {
      await onFolderCreated(name)
    }
  } catch (error) {
    alert('Failed to create folder. Please try again.')
  } finally {
    setIsCreatingRootFolderPending(false)
    setPendingRootFolderName(null)
  }
}

