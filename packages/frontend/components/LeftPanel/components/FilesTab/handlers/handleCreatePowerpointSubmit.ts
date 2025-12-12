interface HandleCreatePowerpointSubmitParams {
  newPowerpointName: string
  setIsCreatingPowerpoint: (creating: boolean) => void
  setNewPowerpointName: (name: string) => void
  setIsCreatingPowerpointPending: (pending: boolean) => void
  setPendingPowerpointName: (name: string | null) => void
  onCreatePowerpoint?: (name: string) => void | Promise<void>
}

export async function handleCreatePowerpointSubmit({
  newPowerpointName,
  setIsCreatingPowerpoint,
  setNewPowerpointName,
  setIsCreatingPowerpointPending,
  setPendingPowerpointName,
  onCreatePowerpoint,
}: HandleCreatePowerpointSubmitParams) {
  const name = newPowerpointName.trim()
  if (name === '') {
    setIsCreatingPowerpoint(false)
    return
  }
  // Extract filename without extension for the handler
  const filenameWithoutExtension = name.replace(/\.pptx$/, '')
  
  // Close input immediately and fire request in background
  setIsCreatingPowerpoint(false)
  setNewPowerpointName('New Presentation.pptx')
  setIsCreatingPowerpointPending(true)
  setPendingPowerpointName(name)
  
  // Call the parent handler to create the presentation
  if (onCreatePowerpoint) {
    try {
      await onCreatePowerpoint(filenameWithoutExtension)
    } catch (error) {
      console.error('Failed to create presentation:', error)
    } finally {
      setIsCreatingPowerpointPending(false)
      setPendingPowerpointName(null)
    }
  }
}

