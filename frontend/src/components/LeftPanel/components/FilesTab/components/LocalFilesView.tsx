import { 
  Folder, 
  RefreshCw, 
  FileText,
  FileSpreadsheet,
  Upload,
  Network,
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from 'react'
import { toggleFileSelection, collectSelectedFileItems } from "../../../handlers/handle-multi-select"
import { FileTreeItem, DragState } from "./FileTreeItem"
import { ApiService } from "../../../../../services/apiService"
import { buildFileTree, FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../ui/typography"
import { handleCreateDocumentSubmit } from "../handlers/handleCreateDocumentSubmit"
import { handleCreateSpreadsheetSubmit } from "../handlers/handleCreateSpreadsheetSubmit"
import { handleCreateDrawioSubmit as handleCreateDrawioSubmitHandler } from "../handlers/handleCreateDrawioSubmit"
import { handleCreateRootFolderSubmit } from "../handlers/handleCreateRootFolderSubmit"

interface LocalFilesViewProps {
  userInfo?: {
    username: string
    email?: string
  } | null
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFileMoved?: (fileId: string, oldPath: string, newPath: string) => void
  onFolderCreated?: (folderPath: string) => void
  onFolderRenamed?: (oldPath: string, newPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
  triggerRootFolderCreation?: boolean
  onCreateDocument?: (documentName: string) => void
  onCreateSpreadsheet?: (spreadsheetName: string) => void
  onCreateNotebook?: (notebookName: string) => void
  onCreateDrawio?: (diagramName: string) => void
  onCreateTldraw?: (drawingName: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  folderInputRef: React.RefObject<HTMLInputElement>
}

export function LocalFilesView({
  userInfo,
  onFileSelect,
  selectedFile,
  onRefreshComplete,
  refreshTrigger,
  onFileDeleted,
  onFileRenamed,
  onFileMoved,
  onFolderCreated,
  onFolderRenamed,
  onFolderDeleted,
  triggerRootFolderCreation,
  onCreateDocument,
  onCreateSpreadsheet,
  onCreateDrawio,
  onCreateTldraw,
  fileInputRef,
  folderInputRef,
}: LocalFilesViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false)
  const [newRootFolderName, setNewRootFolderName] = useState('New Folder')
  const [isCreatingRootFolderPending, setIsCreatingRootFolderPending] = useState(false)
  const [pendingRootFolderName, setPendingRootFolderName] = useState<string | null>(null)
  const rootFolderInputRef = useRef<HTMLInputElement | null>(null)
  
  // Document creation state
  const [isCreatingDocument, setIsCreatingDocument] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('New Document.docx')
  const [isCreatingDocumentPending, setIsCreatingDocumentPending] = useState(false)
  const [pendingDocumentName, setPendingDocumentName] = useState<string | null>(null)
  const documentInputRef = useRef<HTMLInputElement | null>(null)
  
  // Spreadsheet creation state
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false)
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('New Spreadsheet.xlsx')
  const [isCreatingSpreadsheetPending, setIsCreatingSpreadsheetPending] = useState(false)
  const [pendingSpreadsheetName, setPendingSpreadsheetName] = useState<string | null>(null)
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null)
  
  // Draw.io diagram creation state
  const [isCreatingDrawio, setIsCreatingDrawio] = useState(false)
  const [newDrawioName, setNewDrawioName] = useState('New Diagram.drawio')
  const [isCreatingDrawioPending, setIsCreatingDrawioPending] = useState(false)
  const [pendingDrawioName, setPendingDrawioName] = useState<string | null>(null)
  const drawioInputRef = useRef<HTMLInputElement | null>(null)
  
  // Tldraw canvas creation state
  const [isCreatingTldraw, setIsCreatingTldraw] = useState(false)
  const [newTldrawName, setNewTldrawName] = useState('New Canvas.tldraw')
  const [isCreatingTldrawPending, setIsCreatingTldrawPending] = useState(false)
  const [pendingTldrawName, setPendingTldrawName] = useState<string | null>(null)
  const tldrawInputRef = useRef<HTMLInputElement | null>(null)
  
  const [uploadingFolder, setUploadingFolder] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverTarget: null
  })
  
  // Helper function to select filename without extension
  const selectFilenameWithoutExtension = (input: HTMLInputElement) => {
    const value = input.value
    const lastDotIndex = value.lastIndexOf('.')
    if (lastDotIndex > 0) {
      input.setSelectionRange(0, lastDotIndex)
    } else {
      input.select()
    }
  }
  
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  // Drag and drop handlers
  const handleDragStart = (item: FileSystemItem) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOverTarget: null
    })
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverTarget: null
    })
  }

  const handleDragOver = (item: FileSystemItem) => {
    if (dragState.draggedItem && item.type === 'folder') {
      setDragState(prev => ({
        ...prev,
        dragOverTarget: item.id
      }))
    }
  }

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dragOverTarget: null
    }))
  }

  const handleDrop = async (targetItem: FileSystemItem, draggedItem: FileSystemItem) => {
    if (!draggedItem.file_id || targetItem.type !== 'folder') return
    try {
      // Calculate new file path
      const newPath = `${targetItem.path}/${draggedItem.name}`
      // Call API to move the file (download, upload to new location, delete old)
      await ApiService.moveS3File(draggedItem.file_id, newPath, draggedItem.name)
      // Notify parent component about the move
      onFileMoved?.(draggedItem.file_id, draggedItem.path, newPath)
      // Refresh the file tree
      fetchUserFiles()
      
    } catch (error) {
      alert('Failed to move file. Please try again.')
    } finally {
      handleDragEnd()
    }
  }

  const handleFolderCreated = (folderPath: string) => {
    // Refresh the file tree when a folder is created
    fetchUserFiles()
    // Call the parent callback if provided
    onFolderCreated?.(folderPath)
  }

  const handleFolderRenamed = (oldPath: string, newPath: string) => {
    // Refresh the file tree when a folder is renamed
    fetchUserFiles()
    // Call the parent callback if provided
    onFolderRenamed?.(oldPath, newPath)
  }

  const handleFolderDeleted = (folderPath: string) => {
    // Refresh the file tree when a folder is deleted
    fetchUserFiles()
    // Propagate up if parent wants to react (e.g., close tabs)
    onFolderDeleted?.(folderPath)
  }

  const onShiftToggleSelection = (item: FileSystemItem) => {
    const next = toggleFileSelection({ selectedIds, itemId: item.id, isShiftKey: true })
    setSelectedIds(next)
  }

  const clearSelection = () => setSelectedIds(new Set())

  const fetchUserFiles = useCallback(async () => {
    if (!userInfo?.username) {
      onRefreshComplete?.()
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await ApiService.getUserFiles(userInfo.username)
      
      if (result.success) {
        const tree = buildFileTree(result.files)
        setFileSystem(tree)
      }
    } catch (err) {
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
      onRefreshComplete?.()
    }
  }, [userInfo?.username, onRefreshComplete])

  // Fetch files when component mounts or user changes
  useEffect(() => {
    fetchUserFiles()
  }, [fetchUserFiles])

  // Listen for assistant create_file completion to refresh and optionally open the file
  useEffect(() => {
    const handleCreated = (e: Event) => {
      try {
        const detail: any = (e as CustomEvent).detail
        // Attempt to open the created file based on returned info
        const info = detail?.result?.file_info || detail?.result
        const createdPath: string | undefined = info?.file_path || info?.path
        const createdName: string | undefined = info?.file_name || info?.name
        if (!createdPath || !createdName || !userInfo?.username) {
          fetchUserFiles()
          return
        }

        let attempts = 0
        const maxAttempts = 8
        const delayMs = 500
        let cancelled = false

        const pollAndOpen = async () => {
          if (cancelled) return
          try {
            await fetchUserFiles()
            const result = await ApiService.getUserFiles(userInfo.username)
            if (result.success && Array.isArray(result.files)) {
              const f = result.files.find(f => f.file_path === createdPath)
              if (f && f.file_id) {
                const item = {
                  id: f.file_path,
                  name: f.file_name,
                  path: f.file_path,
                  type: 'file',
                  file_id: f.file_id,
                  size: f.file_size,
                  modified: new Date(f.date_modified),
                  s3_url: f.s3_url,
                } as any
                onFileSelect?.(item)
                return
              }
            }
          } catch {}

          attempts += 1
          if (attempts < maxAttempts) {
            setTimeout(pollAndOpen, delayMs)
          }
        }

        pollAndOpen()
      } catch {}
    }

    window.addEventListener('assistant-file-created', handleCreated as EventListener)
    return () => window.removeEventListener('assistant-file-created', handleCreated as EventListener)
  }, [fetchUserFiles, onFileSelect, userInfo?.username])

  // Fetch files when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchUserFiles()
    }
  }, [refreshTrigger, fetchUserFiles])

  // Handle trigger for root folder creation
  useEffect(() => {
    if (triggerRootFolderCreation) {
      setIsCreatingRootFolder(true)
      setNewRootFolderName('New Folder')
    }
  }, [triggerRootFolderCreation])

  // Focus root folder input when creating
  useEffect(() => {
    if (isCreatingRootFolder && rootFolderInputRef.current) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (rootFolderInputRef.current) {
          rootFolderInputRef.current.focus()
          rootFolderInputRef.current.select()
        }
      }, 10)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingRootFolder])

  const handleCreateRootFolderSubmitWrapper = async () => {
    await handleCreateRootFolderSubmit({
      newRootFolderName,
      setIsCreatingRootFolder,
      setNewRootFolderName,
      setIsCreatingRootFolderPending,
      setPendingRootFolderName,
      onFolderCreated: handleFolderCreated,
    })
  }

  const handleCreateRootFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateRootFolderSubmitWrapper()
    } else if (e.key === 'Escape') {
      setIsCreatingRootFolder(false)
      setNewRootFolderName('New Folder')
    }
  }

  // Document creation handlers
  const handleCreateDocument = () => {
    setIsCreatingDocument(true)
    setNewDocumentName('New Document.docx')
  }

  // Focus document input when creating
  useEffect(() => {
    if (isCreatingDocument && documentInputRef.current) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (documentInputRef.current) {
          documentInputRef.current.focus()
          selectFilenameWithoutExtension(documentInputRef.current)
        }
      }, 10)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingDocument])

  const handleCreateDocumentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateDocumentSubmit({
        newDocumentName: newDocumentName,
        setIsCreatingDocument: setIsCreatingDocument,
        setNewDocumentName: setNewDocumentName,
        setIsCreatingDocumentPending: setIsCreatingDocumentPending,
        setPendingDocumentName: setPendingDocumentName,
        onCreateDocument: onCreateDocument,
      })
    } else if (e.key === 'Escape') {
      setIsCreatingDocument(false)
      setNewDocumentName('New Document.docx')
    }
  }

  // Spreadsheet creation handlers
  const handleCreateSpreadsheet = () => {
    setIsCreatingSpreadsheet(true)
    setNewSpreadsheetName('New Spreadsheet.xlsx')
  }

  // Focus spreadsheet input when creating
  useEffect(() => {
    if (isCreatingSpreadsheet && spreadsheetInputRef.current) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (spreadsheetInputRef.current) {
          spreadsheetInputRef.current.focus()
          selectFilenameWithoutExtension(spreadsheetInputRef.current)
        }
      }, 10)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingSpreadsheet])

  const handleCreateSpreadsheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSpreadsheetSubmit({
        newSpreadsheetName: newSpreadsheetName,
        setIsCreatingSpreadsheet: setIsCreatingSpreadsheet,
        setNewSpreadsheetName: setNewSpreadsheetName,
        setIsCreatingSpreadsheetPending: setIsCreatingSpreadsheetPending,
        setPendingSpreadsheetName: setPendingSpreadsheetName,
        onCreateSpreadsheet: onCreateSpreadsheet,
      })
    } else if (e.key === 'Escape') {
      setIsCreatingSpreadsheet(false)
      setNewSpreadsheetName('New Spreadsheet.xlsx')
    }
  }

  // Draw.io diagram creation handlers
  const handleCreateDrawio = () => {
    setIsCreatingDrawio(true)
    setNewDrawioName('New Diagram.drawio')
  }

  useEffect(() => {
    if (isCreatingDrawio && drawioInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (drawioInputRef.current) {
          drawioInputRef.current.focus()
          selectFilenameWithoutExtension(drawioInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingDrawio])

  const handleCreateDrawioSubmit = async () => {
    await handleCreateDrawioSubmitHandler({
      newDrawioName,
      setIsCreatingDrawio,
      setNewDrawioName,
      setIsCreatingDrawioPending,
      setPendingDrawioName,
      onCreateDrawio,
    })
  }

  const handleCreateDrawioKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateDrawioSubmit()
    else if (e.key === 'Escape') {
      setIsCreatingDrawio(false)
      setNewDrawioName('New Diagram.drawio')
    }
  }

  // Tldraw canvas creation handlers
  const handleCreateTldraw = () => {
    setIsCreatingTldraw(true)
    setNewTldrawName('New Canvas.tldraw')
  }

  useEffect(() => {
    if (isCreatingTldraw && tldrawInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (tldrawInputRef.current) {
          tldrawInputRef.current.focus()
          selectFilenameWithoutExtension(tldrawInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingTldraw])

  const handleCreateTldrawSubmit = async () => {
    const name = newTldrawName.trim()
    if (name === '') {
      setIsCreatingTldraw(false)
      return
    }
    const filenameWithoutExtension = name.replace(/\.tldraw$/, '')
    setIsCreatingTldraw(false)
    setNewTldrawName('New Canvas.tldraw')
    setIsCreatingTldrawPending(true)
    setPendingTldrawName(name)
    
    if (onCreateTldraw) {
      try {
        await onCreateTldraw(filenameWithoutExtension)
      } catch (error) {
        console.error('Failed to create tldraw canvas:', error)
      } finally {
        setIsCreatingTldrawPending(false)
        setPendingTldrawName(null)
      }
    } else {
      setIsCreatingTldrawPending(false)
      setPendingTldrawName(null)
    }
  }

  const handleCreateTldrawKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateTldrawSubmit()
    else if (e.key === 'Escape') {
      setIsCreatingTldraw(false)
      setNewTldrawName('New Canvas.tldraw')
    }
  }

  // Handle file upload
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle folder upload
  const handleFolderUpload = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click()
    }
  }

  // Handle file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !userInfo?.username) return

    setUploadingFolder(true)
    try {
      const fileArray = Array.from(files)
      await ApiService.uploadToS3(fileArray[0], fileArray[0].name, 'web-editor', fileArray[0].name, '')
      fetchUserFiles()
    } catch (error) {
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploadingFolder(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle folder input change
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !userInfo?.username) return

    setUploadingFolder(true)
    try {
      const fileArray = Array.from(files)
      
      // Extract folder name from the first file's path
      const firstFile = fileArray[0]
      const folderName = firstFile.webkitRelativePath.split('/')[0]
      
      await ApiService.uploadFolder(fileArray, folderName, 'web-editor', '')
      fetchUserFiles()
    } catch (error) {
      alert('Failed to upload folder. Please try again.')
    } finally {
      setUploadingFolder(false)
      if (folderInputRef.current) {
        folderInputRef.current.value = ''
      }
    }
  }

  const selectionCount = selectedIds.size

  const onDeleteSelectedFiles = async () => {
    const selectedItems = collectSelectedFileItems(fileSystem, selectedIds)
    if (!selectedItems.length) return
    try {
      await Promise.all(
        selectedItems.map(async it => it.file_id ? ApiService.deleteS3File(it.file_id) : Promise.resolve())
      )
      fetchUserFiles()
      selectedItems.forEach(it => it.file_id && onFileDeleted?.(it.file_id))
    } catch (error) {
      alert('Failed to delete some files. Please try again.')
    } finally {
      clearSelection()
    }
  }

  // Expose handlers for parent components
  useEffect(() => {
    if (onCreateDocument) {
      (window as any).__handleCreateDocument = handleCreateDocument
    }
    if (onCreateSpreadsheet) {
      (window as any).__handleCreateSpreadsheet = handleCreateSpreadsheet
    }
    if (onCreateDrawio) {
      (window as any).__handleCreateDrawio = handleCreateDrawio
    }
    if (onCreateTldraw) {
      (window as any).__handleCreateTldraw = handleCreateTldraw
    }
  }, [onCreateDocument, onCreateSpreadsheet, onCreateDrawio, onCreateTldraw])

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div 
        className="flex-1 overflow-y-auto sidebar-scrollbar"
      >
        <div 
          className="min-h-full"
          onContextMenu={(e) => {
            e.preventDefault()
            // You could add a root-level context menu here for creating folders at the root
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Check if this is an internal drag (file move) or external drag (file upload)
            const isInternalDrag = e.dataTransfer.types.includes('application/x-internal-file-move') && 
                                 dragState.isDragging
            
            // Only show upload overlay for external drags
            if (!isInternalDrag) {
              setIsDragOver(true)
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDragOver(false)
            }
          }}
          onDrop={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Check if this is an internal drag (file move) or external drag (file upload)
            const isInternalDrag = e.dataTransfer.types.includes('application/x-internal-file-move') && 
                                 dragState.isDragging
            
            // If it's an internal drag, don't handle it here (let the FileTreeItem handle it)
            if (isInternalDrag) {
              setIsDragOver(false)
              return
            }
            
            if (!userInfo?.username) return
            
            const items = Array.from(e.dataTransfer.items)
            const files: File[] = []
            const folders: File[] = []
            
            for (const item of items) {
              if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry?.()
                if (entry) {
                  if (entry.isFile) {
                    const file = item.getAsFile()
                    if (file) files.push(file)
                  } else if (entry.isDirectory) {
                    // Handle directory
                    const dirReader = (entry as any).createReader()
                    const readEntries = (): Promise<File[]> => {
                      return new Promise((resolve) => {
                        dirReader.readEntries(async (entries: any[]) => {
                          const folderFiles: File[] = []
                          for (const entry of entries) {
                            if (entry.isFile) {
                              const file = await new Promise<File>((resolve) => {
                                (entry as any).file(resolve)
                              })
                              folderFiles.push(file)
                            }
                          }
                          resolve(folderFiles)
                        })
                      })
                    }
                    
                    const folderFiles = await readEntries()
                    folders.push(...folderFiles)
                  }
                }
              }
            }
            
            setIsDragOver(false)
            
            if (files.length > 0 || folders.length > 0) {
              setUploadingFolder(true)
              try {
                // Upload individual files
                for (const file of files) {
                  await ApiService.uploadToS3(file, file.name, 'web-editor', file.name, '')
                }
                
                // Upload folder contents
                if (folders.length > 0) {
                  const folderName = `uploaded_folder_${Date.now()}`
                  await ApiService.uploadFolder(folders, folderName, 'web-editor', '')
                }
                
                fetchUserFiles()
              } catch (error) {
                alert('Failed to upload items. Please try again.')
              } finally {
                setUploadingFolder(false)
              }
            }
          }}
        >
          {/* Drag over indicator */}
          {isDragOver && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2">
                <Upload className="h-4 w-4" strokeWidth={1} />
                <Typography variant="small" className="font-medium">Drop files or folders here to upload</Typography>
              </div>
            </div>
          )}
          
          {/* Local Files View */}
          {loading && !fileSystem.length && (
            <div className="flex items-center gap-2 px-3 py-2">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <Typography variant="muted">Loading files...</Typography>
            </div>
          )}
          
          {error && (
            <div className="px-3 py-2">
              <Typography variant="small" className="text-destructive">{error}</Typography>
            </div>
          )}
          
          {uploadingFolder && (
            <div className="flex items-center gap-2 px-3 py-2">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <Typography variant="muted">Uploading folder...</Typography>
            </div>
          )}
          
          {!loading && !error && fileSystem.length === 0 && !uploadingFolder && (
            <div className="px-3 py-2">
              <Typography variant="muted">No files found</Typography>
            </div>
          )}

          {/* Root level folder creation */}
          {isCreatingRootFolder && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <Folder className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newRootFolderName}
                onChange={(e) => setNewRootFolderName(e.target.value)}
                onKeyDown={handleCreateRootFolderKeyDown}
                onBlur={handleCreateRootFolderSubmitWrapper}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={rootFolderInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {isCreatingRootFolderPending && pendingRootFolderName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingRootFolderName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level document creation */}
          {isCreatingDocument && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <FileText className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                onKeyDown={handleCreateDocumentKeyDown}
                onBlur={() => handleCreateDocumentSubmit({
                  newDocumentName: newDocumentName,
                  setIsCreatingDocument: setIsCreatingDocument,
                  setNewDocumentName: setNewDocumentName,
                  setIsCreatingDocumentPending: setIsCreatingDocumentPending,
                  setPendingDocumentName: setPendingDocumentName,
                  onCreateDocument: onCreateDocument,
                })}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={documentInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {isCreatingDocumentPending && pendingDocumentName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingDocumentName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level spreadsheet creation */}
          {isCreatingSpreadsheet && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newSpreadsheetName}
                onChange={(e) => setNewSpreadsheetName(e.target.value)}
                onKeyDown={handleCreateSpreadsheetKeyDown}
                onBlur={() => handleCreateSpreadsheetSubmit({
                  newSpreadsheetName: newSpreadsheetName,
                  setIsCreatingSpreadsheet: setIsCreatingSpreadsheet,
                  setNewSpreadsheetName: setNewSpreadsheetName,
                  setIsCreatingSpreadsheetPending: setIsCreatingSpreadsheetPending,
                  setPendingSpreadsheetName: setPendingSpreadsheetName,
                  onCreateSpreadsheet: onCreateSpreadsheet,
                })}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={spreadsheetInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {isCreatingSpreadsheetPending && pendingSpreadsheetName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingSpreadsheetName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level draw.io diagram creation */}
          {isCreatingDrawio && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <Network className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newDrawioName}
                onChange={(e) => setNewDrawioName(e.target.value)}
                onKeyDown={handleCreateDrawioKeyDown}
                onBlur={handleCreateDrawioSubmit}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={drawioInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {isCreatingDrawioPending && pendingDrawioName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingDrawioName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level tldraw canvas creation */}
          {isCreatingTldraw && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <Network className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newTldrawName}
                onChange={(e) => setNewTldrawName(e.target.value)}
                onKeyDown={handleCreateTldrawKeyDown}
                onBlur={handleCreateTldrawSubmit}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={tldrawInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {isCreatingTldrawPending && pendingTldrawName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingTldrawName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}
          
          {/* Local file tree */}
          {fileSystem.map((item) => (
            <FileTreeItem
              key={item.id}
              item={item}
              level={0}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onFileDeleted={onFileDeleted}
              onFileRenamed={onFileRenamed}
              onFolderCreated={handleFolderCreated}
              onFolderRenamed={handleFolderRenamed}
              onFolderDeleted={handleFolderDeleted}
              onUploadFile={handleFileUpload}
              onUploadFolder={handleFolderUpload}
              userInfo={userInfo}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              selectedIds={selectedIds}
              onShiftToggleSelection={onShiftToggleSelection}
              selectionCount={selectionCount}
              onDeleteSelectedFiles={onDeleteSelectedFiles}
            />
          ))}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple={true}
        onChange={handleFolderInputChange}
        style={{ display: 'none' }}
        {...({ webkitdirectory: '' } as any)}
      />
    </div>
  )
}

