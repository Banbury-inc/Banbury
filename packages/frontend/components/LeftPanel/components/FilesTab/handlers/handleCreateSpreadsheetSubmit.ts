interface HandleCreateSpreadsheetSubmitParams {
  newSpreadsheetName: string
  setIsCreatingSpreadsheet: (creating: boolean) => void
  setNewSpreadsheetName: (name: string) => void
  setIsCreatingSpreadsheetPending: (pending: boolean) => void
  setPendingSpreadsheetName: (name: string | null) => void
  onCreateSpreadsheet?: (name: string) => void | Promise<void>
}

export async function handleCreateSpreadsheetSubmit({
  newSpreadsheetName,
  setIsCreatingSpreadsheet,
  setNewSpreadsheetName,
  setIsCreatingSpreadsheetPending,
  setPendingSpreadsheetName,
  onCreateSpreadsheet,
}: HandleCreateSpreadsheetSubmitParams) {
  const name = newSpreadsheetName.trim()
  if (name === '') {
    setIsCreatingSpreadsheet(false)
    return
  }
  // Extract filename without extension for the handler
  const filenameWithoutExtension = name.replace(/\.xlsx$/, '')
  
  // Close input immediately and fire request in background
  setIsCreatingSpreadsheet(false)
  setNewSpreadsheetName('New Spreadsheet.xlsx')
  setIsCreatingSpreadsheetPending(true)
  setPendingSpreadsheetName(name)
  
  // Call the parent handler to create the spreadsheet
  if (onCreateSpreadsheet) {
    try {
      await onCreateSpreadsheet(filenameWithoutExtension)
    } catch (error) {
      console.error('Failed to create spreadsheet:', error)
    } finally {
      setIsCreatingSpreadsheetPending(false)
      setPendingSpreadsheetName(null)
    }
  }
}

