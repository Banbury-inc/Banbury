import { 
  Folder, 
  RefreshCw, 
  FolderPlus, 
  FileText,
  FileCode,
  FileSpreadsheet,
  FilePlus,
  Upload,
  Plus,
  Network,
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from 'react'
import { toggleFileSelection, collectSelectedFileItems } from "../../handlers/handle-multi-select"
import { DriveFileTreeItem } from "./components/DriveFileTreeItem"
import { FileTreeItem, DragState } from "./components/FileTreeItem"
import { Button } from "../../../ui/button"
import { ApiService } from "../../../../services/apiService"
import { DriveService, DriveFile } from "../../../../services/driveService"
import { ScopeService } from "../../../../services/scopeService"
import { buildFileTree, FileSystemItem } from "../../../../utils/fileTreeUtils"
import { Typography } from "../../../ui/typography"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"

interface FilesTabProps {
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
  onCreateFolder?: () => void
}

export function FilesTab({
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
  onCreateNotebook,
  onCreateDrawio,
  onCreateTldraw,
  onCreateFolder,
}: FilesTabProps) {
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
  
  // Notebook creation state
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('New Notebook.ipynb')
  const [isCreatingNotebookPending, setIsCreatingNotebookPending] = useState(false)
  const [pendingNotebookName, setPendingNotebookName] = useState<string | null>(null)
  const notebookInputRef = useRef<HTMLInputElement | null>(null)
  
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
  
  const [fileViewMode, setFileViewMode] = useState<'local' | 'drive'>('local')
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveAvailable, setDriveAvailable] = useState<boolean | null>(null)
  const [driveNextPageToken, setDriveNextPageToken] = useState<string | undefined>(undefined)
  const [isLoadingMoreDrive, setIsLoadingMoreDrive] = useState(false)
  const [checkingDriveAccess, setCheckingDriveAccess] = useState(false)
  const [uploadingFolder, setUploadingFolder] = useState(false)
  
  // Drive folder expansion state (tree view)
  const [expandedDriveItems, setExpandedDriveItems] = useState<Set<string>>(new Set())
  const [driveFolderContents, setDriveFolderContents] = useState<Map<string, DriveFile[]>>(new Map())
  const [loadingDriveFolders, setLoadingDriveFolders] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
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

  const onShiftToggleSelection = (item: FileSystemItem, e?: React.MouseEvent) => {
    const next = toggleFileSelection({ selectedIds, itemId: item.id, isShiftKey: true })
    setSelectedIds(next)
  }

  const clearSelection = () => setSelectedIds(new Set())

  const fetchUserFiles = useCallback(async () => {
    if (!userInfo?.username) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await ApiService.getUserFiles(userInfo.username)
      
      if (result.success) {
        const tree = buildFileTree(result.files)
        setFileSystem(tree)
        // Call the refresh complete callback if provided
        onRefreshComplete?.()
      }
    } catch (err) {
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [userInfo?.username, onRefreshComplete])

  // Check Google Drive access
  const checkDriveAccess = useCallback(async () => {
    try {
      setCheckingDriveAccess(true)
      
      // Debug: Check if auth token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) {
        console.error('No auth token found in localStorage!')
        setDriveAvailable(false)
        setDriveError('Please log in to access Google Drive')
        return
      }
      
      const isAvailable = await ScopeService.isFeatureAvailable('drive')
      setDriveAvailable(isAvailable)
    } catch (error) {
      console.error('Error checking Drive access:', error)
      setDriveAvailable(false)
    } finally {
      setCheckingDriveAccess(false)
    }
  }, [])

  // Request Google Drive access
  const requestDriveAccess = useCallback(async () => {
    try {
      await ScopeService.requestFeatureAccess(['drive'])
    } catch (error) {
      console.error('Error requesting Drive access:', error)
    }
  }, [])

  // Fetch Google Drive files (root level)
  const fetchDriveFiles = useCallback(async (pageToken?: string) => {
    // If we're loading more, use different loading state
    if (pageToken) {
      setIsLoadingMoreDrive(true)
    } else {
      setDriveLoading(true)
      setDriveError(null)
      // Reset pagination state when starting fresh
      setDriveNextPageToken(undefined)
    }
    
    try {
      // Debug: Check auth token before making request
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      // Fetch root-level files with pagination
      const response = await DriveService.listRootFiles(100, pageToken)
      
      if (response.files) {
        // If pageToken exists, append to existing files; otherwise replace
        if (pageToken) {
          setDriveFiles(prev => [...prev, ...(response.files || [])])
        } else {
          setDriveFiles(response.files || [])
        }
        
        // Store the next page token for pagination
        setDriveNextPageToken(response.nextPageToken)
      }
    } catch (error: any) {
      console.error('Failed to load Drive files:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      
      // Provide specific error messages
      if (error.message === 'No authentication token found') {
        setDriveError('Not logged in. Please log in to access Google Drive.')
      } else if (error.response?.status === 401) {
        setDriveError('Authentication failed. Please log in again or grant Drive access.')
        // Trigger a re-check of Drive access
        checkDriveAccess()
      } else if (error.response?.status === 403) {
        setDriveError('Access forbidden. Please activate Google Drive permissions.')
        setDriveAvailable(false)
      } else {
        setDriveError(`Failed to load Google Drive files: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setDriveLoading(false)
      setIsLoadingMoreDrive(false)
    }
  }, [checkDriveAccess])

  // Load more Google Drive files for infinite scroll
  const loadMoreDriveFiles = useCallback(() => {
    if (driveNextPageToken && !isLoadingMoreDrive) {
      fetchDriveFiles(driveNextPageToken)
    }
  }, [driveNextPageToken, isLoadingMoreDrive, fetchDriveFiles])

  // Handle scroll for infinite loading in Drive files
  const handleDriveScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100) { // Load when 100px from bottom
      loadMoreDriveFiles()
    }
  }, [loadMoreDriveFiles])

  // Fetch contents of a specific Drive folder (for tree expansion)
  const fetchDriveFolderContents = useCallback(async (folderId: string) => {
    setLoadingDriveFolders(prev => new Set(prev).add(folderId))
    
    try {
      const response = await DriveService.listFilesInFolder(folderId)
      
      if (response.files) {
        setDriveFolderContents(prev => {
          const newMap = new Map(prev)
          newMap.set(folderId, response.files || [])
          return newMap
        })
      }
    } catch (error) {
      console.error(`Failed to load folder contents for ${folderId}:`, error)
    } finally {
      setLoadingDriveFolders(prev => {
        const newSet = new Set(prev)
        newSet.delete(folderId)
        return newSet
      })
    }
  }, [])

  // Handle file view mode change
  const handleFileViewModeChange = useCallback((mode: 'local' | 'drive') => {
    setFileViewMode(mode)
  }, [])

  // Toggle Drive folder expansion (tree view)
  const toggleDriveExpanded = useCallback((folderId: string) => {
    setExpandedDriveItems(prev => {
      const newSet = new Set(prev)
      const isExpanding = !newSet.has(folderId)
      
      if (isExpanding) {
        newSet.add(folderId)
        // Lazy load folder contents if not already loaded
        if (!driveFolderContents.has(folderId)) {
          fetchDriveFolderContents(folderId)
        }
      } else {
        newSet.delete(folderId)
      }
      
      return newSet
    })
  }, [driveFolderContents, fetchDriveFolderContents])

  // Fetch files when component mounts or user changes
  useEffect(() => {
    fetchUserFiles()
  }, [fetchUserFiles])

  // Check Drive access on component mount
  useEffect(() => {
    checkDriveAccess()
  }, [checkDriveAccess])

  // Fetch Drive files when view mode changes to 'drive'
  useEffect(() => {
    if (fileViewMode === 'drive' && driveAvailable) {
      fetchDriveFiles()
    }
  }, [fileViewMode, driveAvailable, fetchDriveFiles])

  // Listen for assistant create_file completion to refresh and optionally open the file
  useEffect(() => {
    const handleCreated = (e: Event) => {
      try {
        const detail: any = (e as CustomEvent).detail;
        // Attempt to open the created file based on returned info
        const info = detail?.result?.file_info || detail?.result;
        const createdPath: string | undefined = info?.file_path || info?.path;
        const createdName: string | undefined = info?.file_name || info?.name;
        if (!createdPath || !createdName || !userInfo?.username) {
          fetchUserFiles();
          return;
        }

        let attempts = 0;
        const maxAttempts = 8;
        const delayMs = 500;
        let cancelled = false;

        const pollAndOpen = async () => {
          if (cancelled) return;
          try {
            await fetchUserFiles();
            const result = await ApiService.getUserFiles(userInfo.username);
            if (result.success && Array.isArray(result.files)) {
              const f = result.files.find(f => f.file_path === createdPath);
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
                } as any;
                onFileSelect?.(item);
                return;
              }
            }
          } catch {}

          attempts += 1;
          if (attempts < maxAttempts) {
            setTimeout(pollAndOpen, delayMs);
          }
        };

        pollAndOpen();
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

  const handleCreateRootFolderSubmit = async () => {
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
    ApiService.createFolder('', name)
      .then(() => {
        handleFolderCreated(name)
      })
      .catch(() => {
        alert('Failed to create folder. Please try again.')
      })
      .finally(() => {
        setIsCreatingRootFolderPending(false)
        setPendingRootFolderName(null)
      })
  }

  const handleCreateRootFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateRootFolderSubmit()
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

  const handleCreateDocumentSubmit = async () => {
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

  const handleCreateDocumentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateDocumentSubmit()
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

  const handleCreateSpreadsheetSubmit = async () => {
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

  const handleCreateSpreadsheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSpreadsheetSubmit()
    } else if (e.key === 'Escape') {
      setIsCreatingSpreadsheet(false)
      setNewSpreadsheetName('New Spreadsheet.xlsx')
    }
  }

  // Notebook creation handlers
  const handleCreateNotebook = () => {
    setIsCreatingNotebook(true)
    setNewNotebookName('New Notebook.ipynb')
  }

  useEffect(() => {
    if (isCreatingNotebook && notebookInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (notebookInputRef.current) {
          notebookInputRef.current.focus()
          selectFilenameWithoutExtension(notebookInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingNotebook])

  const handleCreateNotebookSubmit = async () => {
    const name = newNotebookName.trim()
    if (name === '') {
      setIsCreatingNotebook(false)
      return
    }
    const filenameWithoutExtension = name.replace(/\.ipynb$/, '')
    setIsCreatingNotebook(false)
    setNewNotebookName('New Notebook.ipynb')
    setIsCreatingNotebookPending(true)
    setPendingNotebookName(name)
    
    if (onCreateNotebook) {
      try {
        await onCreateNotebook(filenameWithoutExtension)
      } catch (error) {
        console.error('Failed to create notebook:', error)
      } finally {
        setIsCreatingNotebookPending(false)
        setPendingNotebookName(null)
      }
    } else {
      setIsCreatingNotebookPending(false)
      setPendingNotebookName(null)
    }
  }

  const handleCreateNotebookKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateNotebookSubmit()
    else if (e.key === 'Escape') {
      setIsCreatingNotebook(false)
      setNewNotebookName('New Notebook.ipynb')
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Content Header */}
      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-4">
            {/* File View Mode Navigation */}
            <Select value={fileViewMode} onValueChange={(value) => handleFileViewModeChange(value as 'local' | 'drive')}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <Typography
                    variant="small"
                    className="text-sm font-medium"
                  >
                    Local Files
                  </Typography>
                </SelectItem>
                <SelectItem value="drive">
                  <Typography
                    variant="small"
                    className="text-sm font-medium"
                  >
                    Google Drive
                  </Typography>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fileViewMode === 'local' ? fetchUserFiles : () => fetchDriveFiles()}
              disabled={fileViewMode === 'local' ? loading : driveLoading}
              title="Refresh"
            >
              <RefreshCw className={`${(fileViewMode === 'local' ? loading : driveLoading) ? 'animate-spin' : ''}`} />
            </Button>
            {fileViewMode === 'local' && (
              <Select
                value=""
                onValueChange={(value) => {
                  switch (value) {
                    case 'upload-file':
                      handleFileUpload()
                      break
                    case 'upload-folder':
                      handleFolderUpload()
                      break
                    case 'document':
                      handleCreateDocument()
                      break
                    case 'spreadsheet':
                      handleCreateSpreadsheet()
                      break
                    case 'canvas':
                      handleCreateTldraw()
                      break
                    case 'folder':
                      onCreateFolder?.()
                      break
                  }
                }}
              >
                <SelectTrigger size="sm" className="bg-foreground hover:bg-foreground hover:text-primary-foreground">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload-file">
                    <div className="flex items-center">
                      <FilePlus size={16} className="mr-2" />
                      Upload File
                    </div>
                  </SelectItem>
                  <SelectItem value="upload-folder">
                    <div className="flex items-center">
                      <FolderPlus size={16} className="mr-2" />
                      Upload Folder
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center">
                      <FileText size={16} className="mr-2" />
                      Document
                    </div>
                  </SelectItem>
                  <SelectItem value="spreadsheet">
                    <div className="flex items-center">
                      <FileSpreadsheet size={16} className="mr-2" />
                      Spreadsheet
                    </div>
                  </SelectItem>
                  <SelectItem value="canvas">
                    <div className="flex items-center">
                      <Network size={16} className="mr-2" />
                      Canvas
                    </div>
                  </SelectItem>
                  <SelectItem value="folder">
                    <div className="flex items-center">
                      <Folder size={16} className="mr-2" />
                      Folder
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div 
        className="flex-1 overflow-y-auto sidebar-scrollbar"
        onScroll={fileViewMode === 'drive' ? handleDriveScroll : undefined}
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
                <Upload className="h-4 w-4" />
                <Typography variant="small" className="font-medium">Drop files or folders here to upload</Typography>
              </div>
            </div>
          )}
          
          {/* Local Files View */}
          {fileViewMode === 'local' && (
            <>
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
            </>
          )}

          {/* Google Drive View */}
          {fileViewMode === 'drive' && (
            <>
              {checkingDriveAccess && (
                <div className="flex items-center justify-center h-full px-3 py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                  <Typography variant="muted">Checking Google Drive access...</Typography>
                </div>
              )}
              
              {!checkingDriveAccess && driveAvailable === false && (
                <div className="flex flex-col items-center justify-center px-4 py-8">
                  <Folder className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
                  <Typography variant="h3" className="mb-2 text-center">Google Drive Access Required</Typography>
                  <Typography variant="small" className="text-center mb-4 max-w-md text-muted-foreground">
                    To view your Google Drive files, you need to grant Drive access to your Google account.
                  </Typography>
                  <Button
                    onClick={requestDriveAccess}
                    variant="default"
                  >
                    Activate Google Drive Access
                  </Button>
                </div>
              )}

              {!checkingDriveAccess && driveAvailable && driveLoading && !driveFiles.length && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  <Typography variant="muted">Loading Google Drive files...</Typography>
                </div>
              )}
              
              {!checkingDriveAccess && driveAvailable && driveError && (
                <div className="px-3 py-2">
                  <Typography variant="small" className="text-destructive">{driveError}</Typography>
                </div>
              )}
              
              {!checkingDriveAccess && driveAvailable && !driveLoading && driveFiles.length === 0 && !driveError && (
                <div className="px-3 py-2">
                  <Typography variant="muted">No Google Drive files found</Typography>
                </div>
              )}
            </>
          )}

          {/* Root level folder creation - only for local files */}
          {fileViewMode === 'local' && isCreatingRootFolder && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <Folder className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newRootFolderName}
                onChange={(e) => setNewRootFolderName(e.target.value)}
                onKeyDown={handleCreateRootFolderKeyDown}
                onBlur={handleCreateRootFolderSubmit}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={rootFolderInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {fileViewMode === 'local' && isCreatingRootFolderPending && pendingRootFolderName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingRootFolderName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level document creation - only for local files */}
          {fileViewMode === 'local' && isCreatingDocument && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <FileText className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                onKeyDown={handleCreateDocumentKeyDown}
                onBlur={handleCreateDocumentSubmit}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={documentInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {fileViewMode === 'local' && isCreatingDocumentPending && pendingDocumentName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingDocumentName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level spreadsheet creation - only for local files */}
          {fileViewMode === 'local' && isCreatingSpreadsheet && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newSpreadsheetName}
                onChange={(e) => setNewSpreadsheetName(e.target.value)}
                onKeyDown={handleCreateSpreadsheetKeyDown}
                onBlur={handleCreateSpreadsheetSubmit}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={spreadsheetInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {fileViewMode === 'local' && isCreatingSpreadsheetPending && pendingSpreadsheetName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingSpreadsheetName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level notebook creation - only for local files */}
          {fileViewMode === 'local' && isCreatingNotebook && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={handleCreateNotebookKeyDown}
                onBlur={handleCreateNotebookSubmit}
                className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
                ref={notebookInputRef}
                onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {fileViewMode === 'local' && isCreatingNotebookPending && pendingNotebookName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingNotebookName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level draw.io diagram creation - only for local files */}
          {fileViewMode === 'local' && isCreatingDrawio && (
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
          {fileViewMode === 'local' && isCreatingDrawioPending && pendingDrawioName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingDrawioName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}

          {/* Root level tldraw canvas creation - only for local files */}
          {fileViewMode === 'local' && isCreatingTldraw && (
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
          {fileViewMode === 'local' && isCreatingTldrawPending && pendingTldrawName && (
            <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingTldrawName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}
          
          {/* Local file tree */}
          {fileViewMode === 'local' && fileSystem.map((item) => (
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

          {/* Google Drive file tree */}
          {fileViewMode === 'drive' && driveAvailable && driveFiles
            .sort((a, b) => {
              // Sort folders first, then files
              const aIsFolder = a.mimeType?.includes('folder')
              const bIsFolder = b.mimeType?.includes('folder')
              if (aIsFolder && !bIsFolder) return -1
              if (!aIsFolder && bIsFolder) return 1
              return a.name.localeCompare(b.name)
            })
            .map((file) => (
              <DriveFileTreeItem
                key={file.id}
                file={file}
                level={0}
                expandedItems={expandedDriveItems}
                toggleExpanded={toggleDriveExpanded}
                folderContents={driveFolderContents}
                loadingFolders={loadingDriveFolders}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))
          }
          
          {/* Loading more Drive files indicator */}
          {fileViewMode === 'drive' && isLoadingMoreDrive && (
            <div className="flex items-center gap-2 px-3 py-2">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <Typography variant="muted">Loading more files...</Typography>
            </div>
          )}
          
          {/* End of Drive files indicator */}
          {fileViewMode === 'drive' && !driveLoading && !isLoadingMoreDrive && driveFiles.length > 0 && !driveNextPageToken && (
            <div className="flex items-center justify-center px-3 py-4">
              <Typography variant="muted" className="text-xs">End of files</Typography>
            </div>
          )}
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

