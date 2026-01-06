import { RefreshCw, Folder, FileText, FileSpreadsheet, FileBarChart } from "lucide-react"
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { DriveFileTreeItem } from "./DriveFileTreeItem"
import { Button } from "../../../../ui/button"
import { DriveFile } from "../../../../../../backend/api/drive/drive"
import { ApiService } from "../../../../../../backend/api/apiService"
import { Typography } from "../../../../ui/typography"
import { handleFetchDriveFiles, DriveViewMode } from "../handlers/handleFetchDriveFiles"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { filterDriveFiles } from "../handlers/handleFileTypeFilter"
import { 
  handleCreateDriveDocumentSubmit,
  handleCreateDriveSpreadsheetSubmit,
  handleCreateDrivePresentationSubmit,
  DriveFileCreationState
} from "../handlers/handleCreateDriveFile"

interface GoogleDriveViewProps {
  viewMode?: DriveViewMode
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  activeFilters?: Set<string>
}

export function GoogleDriveView({
  viewMode = 'my-drive',
  onFileSelect,
  selectedFile,
  activeFilters = new Set(),
}: GoogleDriveViewProps) {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveAvailable, setDriveAvailable] = useState<boolean | null>(null)
  const [driveNextPageToken, setDriveNextPageToken] = useState<string | undefined>(undefined)
  const [isLoadingMoreDrive, setIsLoadingMoreDrive] = useState(false)
  const [checkingDriveAccess, setCheckingDriveAccess] = useState(false)
  
  // Track the previous view mode to detect changes
  const previousViewMode = useRef<DriveViewMode>(viewMode)
  
  // Drive folder expansion state (tree view)
  const [expandedDriveItems, setExpandedDriveItems] = useState<Set<string>>(new Set())
  const [driveFolderContents, setDriveFolderContents] = useState<Map<string, DriveFile[]>>(new Map())
  const [loadingDriveFolders, setLoadingDriveFolders] = useState<Set<string>>(new Set())

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

  // Presentation creation state
  const [isCreatingPresentation, setIsCreatingPresentation] = useState(false)
  const [newPresentationName, setNewPresentationName] = useState('New Presentation.pptx')
  const [isCreatingPresentationPending, setIsCreatingPresentationPending] = useState(false)
  const [pendingPresentationName, setPendingPresentationName] = useState<string | null>(null)
  const presentationInputRef = useRef<HTMLInputElement | null>(null)

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
      
      const isAvailable = await ApiService.Scopes.isFeatureAvailable('drive')
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
      await ApiService.Scopes.requestFeatureAccess(['drive'])
    } catch (error) {
      console.error('Error requesting Drive access:', error)
    }
  }, [])

  // Fetch Google Drive files based on view mode
  const fetchDriveFiles = useCallback(async (pageToken?: string) => {
    await handleFetchDriveFiles({
      pageToken,
      viewMode,
      setIsLoadingMoreDrive,
      setDriveLoading,
      setDriveError,
      setDriveNextPageToken,
      setDriveFiles,
      setDriveAvailable,
      checkDriveAccess,
    })
  }, [checkDriveAccess, viewMode])

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
      const response = await ApiService.Drive.listFilesInFolder(folderId)
      
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

  // Check Drive access on component mount
  useEffect(() => {
    checkDriveAccess()
  }, [checkDriveAccess])

  // Reset state when viewMode changes
  useEffect(() => {
    if (previousViewMode.current !== viewMode) {
      // Clear files and reset state when switching modes
      setDriveFiles([])
      setDriveNextPageToken(undefined)
      setDriveError(null)
      setExpandedDriveItems(new Set())
      setDriveFolderContents(new Map())
      previousViewMode.current = viewMode
    }
  }, [viewMode])

  // Fetch Drive files when available or viewMode changes
  useEffect(() => {
    if (driveAvailable) {
      fetchDriveFiles()
    }
  }, [driveAvailable, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get display label for the current view mode
  const getViewModeLabel = useCallback(() => {
    switch (viewMode) {
      case 'recent': return 'recent'
      case 'starred': return 'starred'
      case 'trash': return 'trashed'
      case 'my-drive':
      default: return ''
    }
  }, [viewMode])

  // Apply filters to Drive files
  const filteredDriveFiles = useMemo(() => {
    return filterDriveFiles(driveFiles, activeFilters)
  }, [driveFiles, activeFilters])

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

  // Creation handlers
  const handleCreateDocument = useCallback(() => {
    setIsCreatingDocument(true)
    setNewDocumentName('New Document.docx')
  }, [])

  const handleCreateSpreadsheet = useCallback(() => {
    setIsCreatingSpreadsheet(true)
    setNewSpreadsheetName('New Spreadsheet.xlsx')
  }, [])

  const handleCreatePowerpoint = useCallback(() => {
    setIsCreatingPresentation(true)
    setNewPresentationName('New Presentation.pptx')
  }, [])

  // Build state objects for handlers
  const documentState: DriveFileCreationState = {
    isCreating: isCreatingDocument,
    setIsCreating: setIsCreatingDocument,
    newName: newDocumentName,
    setNewName: setNewDocumentName,
    isPending: isCreatingDocumentPending,
    setIsPending: setIsCreatingDocumentPending,
    pendingName: pendingDocumentName,
    setPendingName: setPendingDocumentName,
  }

  const spreadsheetState: DriveFileCreationState = {
    isCreating: isCreatingSpreadsheet,
    setIsCreating: setIsCreatingSpreadsheet,
    newName: newSpreadsheetName,
    setNewName: setNewSpreadsheetName,
    isPending: isCreatingSpreadsheetPending,
    setIsPending: setIsCreatingSpreadsheetPending,
    pendingName: pendingSpreadsheetName,
    setPendingName: setPendingSpreadsheetName,
  }

  const presentationState: DriveFileCreationState = {
    isCreating: isCreatingPresentation,
    setIsCreating: setIsCreatingPresentation,
    newName: newPresentationName,
    setNewName: setNewPresentationName,
    isPending: isCreatingPresentationPending,
    setIsPending: setIsCreatingPresentationPending,
    pendingName: pendingPresentationName,
    setPendingName: setPendingPresentationName,
  }

  const handleDocumentSubmit = useCallback(async () => {
    await handleCreateDriveDocumentSubmit(documentState, () => fetchDriveFiles())
  }, [documentState, fetchDriveFiles])

  const handleSpreadsheetSubmit = useCallback(async () => {
    await handleCreateDriveSpreadsheetSubmit(spreadsheetState, () => fetchDriveFiles())
  }, [spreadsheetState, fetchDriveFiles])

  const handlePresentationSubmit = useCallback(async () => {
    await handleCreateDrivePresentationSubmit(presentationState, () => fetchDriveFiles())
  }, [presentationState, fetchDriveFiles])

  // Focus inputs when creating
  useEffect(() => {
    if (isCreatingDocument && documentInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (documentInputRef.current) {
          documentInputRef.current.focus()
          selectFilenameWithoutExtension(documentInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingDocument])

  useEffect(() => {
    if (isCreatingSpreadsheet && spreadsheetInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (spreadsheetInputRef.current) {
          spreadsheetInputRef.current.focus()
          selectFilenameWithoutExtension(spreadsheetInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingSpreadsheet])

  useEffect(() => {
    if (isCreatingPresentation && presentationInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (presentationInputRef.current) {
          presentationInputRef.current.focus()
          selectFilenameWithoutExtension(presentationInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingPresentation])

  // Register handlers on window and cleanup on unmount
  useEffect(() => {
    (window as any).__handleCreateDocument = handleCreateDocument;
    (window as any).__handleCreateSpreadsheet = handleCreateSpreadsheet;
    (window as any).__handleCreatePowerpoint = handleCreatePowerpoint;

    return () => {
      delete (window as any).__handleCreateDocument
      delete (window as any).__handleCreateSpreadsheet
      delete (window as any).__handleCreatePowerpoint
    }
  }, [handleCreateDocument, handleCreateSpreadsheet, handleCreatePowerpoint])

  return (
    <div 
      className="h-full overflow-y-auto sidebar-scrollbar"
      onScroll={handleDriveScroll}
    >
      {checkingDriveAccess && (
        <div className="flex items-center justify-center h-full px-3 py-8">
          <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Checking Google Drive access...</Typography>
        </div>
      )}
      
      {!checkingDriveAccess && driveAvailable === false && (
        <div className="flex flex-col items-center justify-center px-4 py-8">
          <Folder className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
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
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading Google Drive files...</Typography>
        </div>
      )}
      
      {!checkingDriveAccess && driveAvailable && driveError && (
        <div className="px-3 py-2">
          <Typography variant="small" className="text-destructive">{driveError}</Typography>
        </div>
      )}
      
      {!checkingDriveAccess && driveAvailable && !driveLoading && filteredDriveFiles.length === 0 && !driveError && !isCreatingDocument && !isCreatingSpreadsheet && !isCreatingPresentation && !isCreatingDocumentPending && !isCreatingSpreadsheetPending && !isCreatingPresentationPending && (
        <div className="px-3 py-2">
          <Typography variant="muted">
            {activeFilters.size > 0 ? 'No matching files' : (
              <>
                {viewMode === 'recent' && 'No recent files found'}
                {viewMode === 'starred' && 'No starred files found'}
                {viewMode === 'trash' && 'No files in trash'}
                {viewMode === 'my-drive' && 'No Google Drive files found'}
              </>
            )}
          </Typography>
        </div>
      )}

      {/* Document creation row */}
      {viewMode === 'my-drive' && isCreatingDocument && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <FileText className="h-4 w-4 text-blue-500" />
          <input
            type="text"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDocumentSubmit()
              else if (e.key === 'Escape') {
                setIsCreatingDocument(false)
                setNewDocumentName('New Document.docx')
              }
            }}
            onBlur={handleDocumentSubmit}
            className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
            ref={documentInputRef}
            onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {viewMode === 'my-drive' && isCreatingDocumentPending && pendingDocumentName && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <RefreshCw className="h-4 w-4 animate-spin" />
          <Typography variant="xs" className="truncate min-w-0 flex-1">{pendingDocumentName}</Typography>
          <Typography variant="muted" className="text-xs">Creating...</Typography>
        </div>
      )}

      {/* Spreadsheet creation row */}
      {viewMode === 'my-drive' && isCreatingSpreadsheet && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <FileSpreadsheet className="h-4 w-4 text-green-500" />
          <input
            type="text"
            value={newSpreadsheetName}
            onChange={(e) => setNewSpreadsheetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSpreadsheetSubmit()
              else if (e.key === 'Escape') {
                setIsCreatingSpreadsheet(false)
                setNewSpreadsheetName('New Spreadsheet.xlsx')
              }
            }}
            onBlur={handleSpreadsheetSubmit}
            className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
            ref={spreadsheetInputRef}
            onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {viewMode === 'my-drive' && isCreatingSpreadsheetPending && pendingSpreadsheetName && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <RefreshCw className="h-4 w-4 animate-spin" />
          <Typography variant="xs" className="truncate min-w-0 flex-1">{pendingSpreadsheetName}</Typography>
          <Typography variant="muted" className="text-xs">Creating...</Typography>
        </div>
      )}

      {/* Presentation creation row */}
      {viewMode === 'my-drive' && isCreatingPresentation && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <FileBarChart className="h-4 w-4 text-orange-400" />
          <input
            type="text"
            value={newPresentationName}
            onChange={(e) => setNewPresentationName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePresentationSubmit()
              else if (e.key === 'Escape') {
                setIsCreatingPresentation(false)
                setNewPresentationName('New Presentation.pptx')
              }
            }}
            onBlur={handlePresentationSubmit}
            className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
            ref={presentationInputRef}
            onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {viewMode === 'my-drive' && isCreatingPresentationPending && pendingPresentationName && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <RefreshCw className="h-4 w-4 animate-spin" />
          <Typography variant="xs" className="truncate min-w-0 flex-1">{pendingPresentationName}</Typography>
          <Typography variant="muted" className="text-xs">Creating...</Typography>
        </div>
      )}

      {/* Google Drive file tree */}
      {driveAvailable && filteredDriveFiles
        .slice() // Create a copy to avoid mutating state
        .sort((a, b) => {
          // For my-drive mode, sort folders first then by name
          // For other modes (recent/starred/trash), preserve API order (modifiedTime desc)
          if (viewMode === 'my-drive') {
            const aIsFolder = a.mimeType?.includes('folder')
            const bIsFolder = b.mimeType?.includes('folder')
            if (aIsFolder && !bIsFolder) return -1
            if (!aIsFolder && bIsFolder) return 1
            return a.name.localeCompare(b.name)
          }
          // Keep API order for other modes
          return 0
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
      {isLoadingMoreDrive && (
        <div className="flex items-center gap-2 px-3 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading more files...</Typography>
        </div>
      )}
      
      {/* End of Drive files indicator */}
      {!driveLoading && !isLoadingMoreDrive && filteredDriveFiles.length > 0 && !driveNextPageToken && (
        <div className="flex items-center justify-center px-3 py-4">
          <Typography variant="muted" className="text-xs">End of files</Typography>
        </div>
      )}
    </div>
  )
}

