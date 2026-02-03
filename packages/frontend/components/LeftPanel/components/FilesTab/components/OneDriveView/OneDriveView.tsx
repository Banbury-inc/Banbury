import { RefreshCw, Folder, Search, X, FileText, FileSpreadsheet, FileBarChart } from "lucide-react"
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { OneDriveFileTreeItem } from "./components/OneDriveFileTreeItem"
import { Button } from "../../../../../common/ui/button"
import { Input } from "../../../../../common/ui/input"
import OneDrive, { OneDriveFile } from "../../../../../../../backend/api/onedrive/onedrive"
import { Typography } from "../../../../../common/ui/typography"
import { handleFetchOneDriveFiles, OneDriveViewMode } from "../../handlers/handleFetchOneDriveFiles"
import { FileSystemItem } from "../../../../../../utils/fileTreeUtils"
import { filterOneDriveFiles } from "../../handlers/handleFileTypeFilter"
import {
  handleCreateOneDriveDocumentSubmit,
  handleCreateOneDriveSpreadsheetSubmit,
  handleCreateOneDrivePresentationSubmit,
  OneDriveFileCreationState
} from "../../handlers/handleCreateOneDriveFile"

interface OneDriveViewProps {
  viewMode?: OneDriveViewMode
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  activeFilters?: Set<string>
}

export function OneDriveView({
  viewMode = 'root',
  onFileSelect,
  selectedFile,
  activeFilters = new Set(),
}: OneDriveViewProps) {
  const [files, setFiles] = useState<OneDriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [nextLink, setNextLink] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Track the previous view mode to detect changes
  const previousViewMode = useRef<OneDriveViewMode>(viewMode)

  // Folder expansion state (tree view)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [folderContents, setFolderContents] = useState<Map<string, OneDriveFile[]>>(new Map())
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set())
  
  // Favorites (Banbury-managed)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

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

  // Check OneDrive connection
  const checkConnection = useCallback(async () => {
    try {
      setCheckingConnection(true)

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) {
        console.error('No auth token found in localStorage!')
        setConnected(false)
        setError('Please log in to access OneDrive')
        return
      }

      const status = await OneDrive.getStatus()
      setConnected(status.connected)
      if (status.accountEmail) {
        setAccountEmail(status.accountEmail)
      }
    } catch (error) {
      console.error('Error checking OneDrive connection:', error)
      setConnected(false)
    } finally {
      setCheckingConnection(false)
    }
  }, [])

  // Request OneDrive connection
  const requestConnection = useCallback(async () => {
    try {
      const callbackUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/workspaces` 
        : ''
      const result = await OneDrive.initiateOAuth(callbackUrl)
      if (result.auth_url) {
        window.location.href = result.auth_url
      }
    } catch (error) {
      console.error('Error initiating OneDrive connection:', error)
    }
  }, [])

  // Fetch OneDrive files based on view mode
  const fetchFiles = useCallback(async (skipToken?: string) => {
    await handleFetchOneDriveFiles({
      skipToken,
      viewMode,
      searchQuery: viewMode === 'search' ? searchQuery : undefined,
      setIsLoadingMore,
      setLoading,
      setError,
      setNextLink,
      setFiles,
      setConnected,
      checkConnection,
    })
  }, [checkConnection, viewMode, searchQuery])

  // Load more files for infinite scroll
  const loadMoreFiles = useCallback(() => {
    if (nextLink && !isLoadingMore) {
      fetchFiles(nextLink)
    }
  }, [nextLink, isLoadingMore, fetchFiles])

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      loadMoreFiles()
    }
  }, [loadMoreFiles])

  // Fetch contents of a specific folder (for tree expansion)
  const fetchFolderContents = useCallback(async (folderId: string) => {
    setLoadingFolders(prev => new Set(prev).add(folderId))

    try {
      const response = await OneDrive.listFilesInFolder(folderId)

      if (response.value) {
        setFolderContents(prev => {
          const newMap = new Map(prev)
          newMap.set(folderId, response.value || [])
          return newMap
        })
      }
    } catch (error) {
      console.error(`Failed to load folder contents for ${folderId}:`, error)
    } finally {
      setLoadingFolders(prev => {
        const newSet = new Set(prev)
        newSet.delete(folderId)
        return newSet
      })
    }
  }, [])

  // Toggle folder expansion (tree view)
  const toggleExpanded = useCallback((folderId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      const isExpanding = !newSet.has(folderId)

      if (isExpanding) {
        newSet.add(folderId)
        // Lazy load folder contents if not already loaded
        if (!folderContents.has(folderId)) {
          fetchFolderContents(folderId)
        }
      } else {
        newSet.delete(folderId)
      }

      return newSet
    })
  }, [folderContents, fetchFolderContents])

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      fetchFiles()
    }
  }, [searchQuery, fetchFiles])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setIsSearching(false)
    setFiles([])
  }, [])

  // Check connection on component mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Reset state when viewMode changes
  useEffect(() => {
    if (previousViewMode.current !== viewMode) {
      setFiles([])
      setNextLink(undefined)
      setError(null)
      setExpandedItems(new Set())
      setFolderContents(new Map())
      setSearchQuery('')
      setIsSearching(false)
      previousViewMode.current = viewMode
    }
  }, [viewMode])

  // Fetch files when connected or viewMode changes
  useEffect(() => {
    if (connected && viewMode !== 'search') {
      fetchFiles()
    }
  }, [connected, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get display label for the current view mode
  const getViewModeLabel = useCallback(() => {
    switch (viewMode) {
      case 'recent': return 'recent'
      case 'favorites': return 'favorite'
      case 'search': return 'search results'
      case 'trash': return 'deleted'
      case 'root':
      default: return ''
    }
  }, [viewMode])

  // Apply filters to files
  const filteredFiles = useMemo(() => {
    return filterOneDriveFiles(files, activeFilters)
  }, [files, activeFilters])

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
  const documentState: OneDriveFileCreationState = {
    isCreating: isCreatingDocument,
    setIsCreating: setIsCreatingDocument,
    newName: newDocumentName,
    setNewName: setNewDocumentName,
    isPending: isCreatingDocumentPending,
    setIsPending: setIsCreatingDocumentPending,
    pendingName: pendingDocumentName,
    setPendingName: setPendingDocumentName,
  }

  const spreadsheetState: OneDriveFileCreationState = {
    isCreating: isCreatingSpreadsheet,
    setIsCreating: setIsCreatingSpreadsheet,
    newName: newSpreadsheetName,
    setNewName: setNewSpreadsheetName,
    isPending: isCreatingSpreadsheetPending,
    setIsPending: setIsCreatingSpreadsheetPending,
    pendingName: pendingSpreadsheetName,
    setPendingName: setPendingSpreadsheetName,
  }

  const presentationState: OneDriveFileCreationState = {
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
    await handleCreateOneDriveDocumentSubmit(documentState, () => fetchFiles())
  }, [documentState, fetchFiles])

  const handleSpreadsheetSubmit = useCallback(async () => {
    await handleCreateOneDriveSpreadsheetSubmit(spreadsheetState, () => fetchFiles())
  }, [spreadsheetState, fetchFiles])

  const handlePresentationSubmit = useCallback(async () => {
    await handleCreateOneDrivePresentationSubmit(presentationState, () => fetchFiles())
  }, [presentationState, fetchFiles])

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

  // Handle file deleted - remove from local state
  const handleFileDeleted = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setFolderContents(prev => {
      const newMap = new Map(prev)
      for (const [folderId, files] of Array.from(newMap.entries())) {
        newMap.set(folderId, files.filter(f => f.id !== fileId))
      }
      return newMap
    })
  }, [])

  // Handle file renamed - update local state
  const handleFileRenamed = useCallback((fileId: string, newName: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f))
    setFolderContents(prev => {
      const newMap = new Map(prev)
      for (const [folderId, files] of Array.from(newMap.entries())) {
        newMap.set(folderId, files.map(f => f.id === fileId ? { ...f, name: newName } : f))
      }
      return newMap
    })
  }, [])

  // Handle favorite changed - update local state
  const handleFavoriteChanged = useCallback((fileId: string, isFavorite: boolean) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (isFavorite) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }, [])

  return (
    <div
      className="h-full overflow-y-auto sidebar-scrollbar"
      onScroll={handleScroll}
    >
      {checkingConnection && (
        <div className="flex items-center justify-center h-full px-3 py-8">
          <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Checking OneDrive connection...</Typography>
        </div>
      )}

      {!checkingConnection && connected === false && (
        <div className="flex flex-col items-center justify-center px-4 py-8">
          <Folder className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
          <Typography variant="h3" className="mb-2 text-center">OneDrive Connection Required</Typography>
          <Typography variant="small" className="text-center mb-4 max-w-md text-muted-foreground">
            To view your OneDrive files, you need to connect your Microsoft account.
          </Typography>
          <Button
            onClick={requestConnection}
            variant="default"
          >
            Connect OneDrive
          </Button>
        </div>
      )}

      {/* Search input for search mode */}
      {!checkingConnection && connected && viewMode === 'search' && (
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search OneDrive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8 pr-8 h-8"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
            >
              Search
            </Button>
          </div>
        </div>
      )}

      {!checkingConnection && connected && loading && !files.length && (
        <div className="flex items-center gap-2 px-3 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading OneDrive files...</Typography>
        </div>
      )}

      {!checkingConnection && connected && error && (
        <div className="px-3 py-2">
          <Typography variant="small" className="text-destructive">{error}</Typography>
        </div>
      )}

      {!checkingConnection && connected && !loading && filteredFiles.length === 0 && !error && !isCreatingDocument && !isCreatingSpreadsheet && !isCreatingPresentation && !isCreatingDocumentPending && !isCreatingSpreadsheetPending && !isCreatingPresentationPending && (
        <div className="px-3 py-2">
          <Typography variant="muted">
            {activeFilters.size > 0 ? 'No matching files' : (
              <>
                {viewMode === 'recent' && 'No recent files found'}
                {viewMode === 'favorites' && 'No favorite files found'}
                {viewMode === 'search' && (isSearching ? 'No search results found' : 'Enter a search query')}
                {viewMode === 'trash' && 'No deleted files found'}
                {viewMode === 'root' && 'No OneDrive files found'}
              </>
            )}
          </Typography>
        </div>
      )}

      {/* Document creation row */}
      {viewMode === 'root' && isCreatingDocument && (
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
      {viewMode === 'root' && isCreatingDocumentPending && pendingDocumentName && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <RefreshCw className="h-4 w-4 animate-spin" />
          <Typography variant="xs" className="truncate min-w-0 flex-1">{pendingDocumentName}</Typography>
          <Typography variant="muted" className="text-xs">Creating...</Typography>
        </div>
      )}

      {/* Spreadsheet creation row */}
      {viewMode === 'root' && isCreatingSpreadsheet && (
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
      {viewMode === 'root' && isCreatingSpreadsheetPending && pendingSpreadsheetName && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <RefreshCw className="h-4 w-4 animate-spin" />
          <Typography variant="xs" className="truncate min-w-0 flex-1">{pendingSpreadsheetName}</Typography>
          <Typography variant="muted" className="text-xs">Creating...</Typography>
        </div>
      )}

      {/* Presentation creation row */}
      {viewMode === 'root' && isCreatingPresentation && (
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
      {viewMode === 'root' && isCreatingPresentationPending && pendingPresentationName && (
        <div className="w-full flex items-center gap-2 text-left px-3 py-2" style={{ paddingLeft: '12px' }}>
          <div className="w-3" />
          <RefreshCw className="h-4 w-4 animate-spin" />
          <Typography variant="xs" className="truncate min-w-0 flex-1">{pendingPresentationName}</Typography>
          <Typography variant="muted" className="text-xs">Creating...</Typography>
        </div>
      )}

      {/* OneDrive file tree */}
      {connected && filteredFiles
        .slice()
        .sort((a, b) => {
          // For root mode, sort folders first then by name
          // For other modes, preserve API order (modifiedTime desc)
          if (viewMode === 'root') {
            const aIsFolder = !!a.folder
            const bIsFolder = !!b.folder
            if (aIsFolder && !bIsFolder) return -1
            if (!aIsFolder && bIsFolder) return 1
            return a.name.localeCompare(b.name)
          }
          // Keep API order for other modes
          return 0
        })
        .map((file) => (
          <OneDriveFileTreeItem
            key={file.id}
            file={file}
            level={0}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
            folderContents={folderContents}
            loadingFolders={loadingFolders}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            favorites={favorites}
            onFileDeleted={handleFileDeleted}
            onFileRenamed={handleFileRenamed}
            onFavoriteChanged={handleFavoriteChanged}
          />
        ))
      }

      {/* Loading more files indicator */}
      {isLoadingMore && (
        <div className="flex items-center gap-2 px-3 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading more files...</Typography>
        </div>
      )}

      {/* End of files indicator */}
      {!loading && !isLoadingMore && filteredFiles.length > 0 && !nextLink && (
        <div className="flex items-center justify-center px-3 py-4">
          <Typography variant="muted" className="text-xs">End of files</Typography>
        </div>
      )}
    </div>
  )
}

