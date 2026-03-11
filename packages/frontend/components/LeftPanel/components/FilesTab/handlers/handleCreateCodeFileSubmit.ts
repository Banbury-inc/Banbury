interface HandleCreateCodeFileSubmitParams {
  newCodeFileName: string
  setIsCreatingCodeFile: (creating: boolean) => void
  setNewCodeFileName: (name: string) => void
  setIsCreatingCodeFilePending: (pending: boolean) => void
  setPendingCodeFileName: (name: string | null) => void
  onCreateCodeFile?: (name: string) => void | Promise<void>
}

export async function handleCreateCodeFileSubmit({
  newCodeFileName,
  setIsCreatingCodeFile,
  setNewCodeFileName,
  setIsCreatingCodeFilePending,
  setPendingCodeFileName,
  onCreateCodeFile,
}: HandleCreateCodeFileSubmitParams) {
  const name = newCodeFileName.trim()
  if (name === '') {
    setIsCreatingCodeFile(false)
    return
  }
  setIsCreatingCodeFile(false)
  setNewCodeFileName('main.py')
  setIsCreatingCodeFilePending(true)
  setPendingCodeFileName(name)

  if (onCreateCodeFile) {
    try {
      await onCreateCodeFile(name)
    } catch (error) {
      console.error('Failed to create code file:', error)
    } finally {
      setIsCreatingCodeFilePending(false)
      setPendingCodeFileName(null)
    }
  }
}
