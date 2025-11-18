interface HandleCreateDocumentSubmitParams {
  newDocumentName: string
  setIsCreatingDocument: (creating: boolean) => void
  setNewDocumentName: (name: string) => void
  setIsCreatingDocumentPending: (pending: boolean) => void
  setPendingDocumentName: (name: string | null) => void
  onCreateDocument?: (name: string) => void | Promise<void>
}

export async function handleCreateDocumentSubmit({
  newDocumentName,
  setIsCreatingDocument,
  setNewDocumentName,
  setIsCreatingDocumentPending,
  setPendingDocumentName,
  onCreateDocument,
}: HandleCreateDocumentSubmitParams) {
  const name = newDocumentName.trim()
  if (name === '') {
    setIsCreatingDocument(false)
    return
  }
  // Extract filename without extension for the handler
  const filenameWithoutExtension = name.replace(/\.docx$/, '')
  
  // Close input immediately and fire request in background
  setIsCreatingDocument(false)
  setNewDocumentName('New Document.docx')
  setIsCreatingDocumentPending(true)
  setPendingDocumentName(name)
  
  // Call the parent handler to create the document
  if (onCreateDocument) {
    try {
      await onCreateDocument(filenameWithoutExtension)
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setIsCreatingDocumentPending(false)
      setPendingDocumentName(null)
    }
  }
}

