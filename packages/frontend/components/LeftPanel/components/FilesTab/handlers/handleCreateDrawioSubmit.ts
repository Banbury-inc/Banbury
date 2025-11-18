interface HandleCreateDrawioSubmitParams {
  newDrawioName: string
  setIsCreatingDrawio: (creating: boolean) => void
  setNewDrawioName: (name: string) => void
  setIsCreatingDrawioPending: (pending: boolean) => void
  setPendingDrawioName: (name: string | null) => void
  onCreateDrawio?: (name: string) => void | Promise<void>
}

export async function handleCreateDrawioSubmit({
  newDrawioName,
  setIsCreatingDrawio,
  setNewDrawioName,
  setIsCreatingDrawioPending,
  setPendingDrawioName,
  onCreateDrawio,
}: HandleCreateDrawioSubmitParams) {
  const name = newDrawioName.trim()
  if (name === '') {
    setIsCreatingDrawio(false)
    return
  }
  const filenameWithoutExtension = name.replace(/\.drawio$/, '')
  setIsCreatingDrawio(false)
  setNewDrawioName('New Diagram.drawio')
  setIsCreatingDrawioPending(true)
  setPendingDrawioName(name)
  
  if (onCreateDrawio) {
    try {
      await onCreateDrawio(filenameWithoutExtension)
    } catch (error) {
      console.error('Failed to create draw.io diagram:', error)
    } finally {
      setIsCreatingDrawioPending(false)
      setPendingDrawioName(null)
    }
  } else {
    setIsCreatingDrawioPending(false)
    setPendingDrawioName(null)
  }
}

