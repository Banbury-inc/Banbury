import { RefreshCw, Folder, Search, X, FileText, FileSpreadsheet, FileBarChart } from "lucide-react"
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Dropbox, { DropboxFile } from "../../../../../../../backend/api/dropbox/dropbox"
import { DropboxFileTreeItem } from "./components/DropboxFileTreeItem"
import { Button } from "../../../../../common/ui/button"
import { Input } from "../../../../../common/ui/input"
import { Typography } from "../../../../../common/ui/typography"
import { handleFetchDropboxFiles, DropboxViewMode } from "../../handlers/handleFetchDropboxFiles"
import { FileSystemItem } from "../../../../../../utils/fileTreeUtils"
import { filterDropboxFiles } from "../../handlers/handleFileTypeFilter"
import {
  handleCreateDropboxDocumentSubmit,
  handleCreateDropboxPresentationSubmit,
  handleCreateDropboxSpreadsheetSubmit,
  DropboxFileCreationState,
} from "../../handlers/handleCreateDropboxFile"

interface DropboxViewProps {
  viewMode?: DropboxViewMode
  onFileSelect?: (_file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  activeFilters?: Set<string>
}

export function DropboxView({
  viewMode = 'root',
  onFileSelect,
  selectedFile,
  activeFilters = new Set(),
}: DropboxViewProps) {
  const [files, setFiles] = useState<DropboxFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const previousViewMode = useRef<DropboxViewMode>(viewMode)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [folderContents, setFolderContents] = useState<Map<string, DropboxFile[]>>(new Map())
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const [isCreatingDocument, setIsCreatingDocument] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('New Document.docx')
  const [isCreatingDocumentPending, setIsCreatingDocumentPending] = useState(false)
  const [pendingDocumentName, setPendingDocumentName] = useState<string | null>(null)
  const documentInputRef = useRef<HTMLInputElement | null>(null)

  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false)
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('New Spreadsheet.xlsx')
  const [isCreatingSpreadsheetPending, setIsCreatingSpreadsheetPending] = useState(false)
  const [pendingSpreadsheetName, setPendingSpreadsheetName] = useState<string | null>(null)
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null)

  const [isCreatingPresentation, setIsCreatingPresentation] = useState(false)
  const [newPresentationName, setNewPresentationName] = useState('New Presentation.pptx')
  const [isCreatingPresentationPending, setIsCreatingPresentationPending] = useState(false)
  const [pendingPresentationName, setPendingPresentationName] = useState<string | null>(null)
  const presentationInputRef = useRef<HTMLInputElement | null>(null)

  const checkConnection = useCallback(async () => {
    try {
      setCheckingConnection(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) {
        setConnected(false)
        setError('Please log in to access Dropbox')
        return
      }

      const status = await Dropbox.getStatus()
      setConnected(status.connected)
      if (status.accountEmail) setAccountEmail(status.accountEmail)
    } catch (error) {
      console.error('Error checking Dropbox connection:', error)
      setConnected(false)
    } finally {
      setCheckingConnection(false)
    }
  }, [])

  const requestConnection = useCallback(async () => {
    try {
      const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/workspaces` : ''
      const result = await Dropbox.initiateOAuth(callbackUrl)
      if (result.auth_url) window.location.href = result.auth_url
    } catch (error) {
      console.error('Error initiating Dropbox connection:', error)
    }
  }, [])

  const fetchFiles = useCallback(async (cursor?: string) => {
    await handleFetchDropboxFiles({
      cursor,
      viewMode,
      searchQuery: viewMode === 'search' ? searchQuery : undefined,
      setIsLoadingMore,
      setLoading,
      setError,
      setNextCursor,
      setFiles,
      setConnected,
      checkConnection,
    })
  }, [checkConnection, viewMode, searchQuery])

  const loadMoreFiles = useCallback(() => {
    if (nextCursor && !isLoadingMore) fetchFiles(nextCursor)
  }, [nextCursor, isLoadingMore, fetchFiles])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100) loadMoreFiles()
  }, [loadMoreFiles])

  const fetchFolderContents = useCallback(async (folderId: string) => {
    setLoadingFolders(prev => new Set(prev).add(folderId))
    try {
      const response = await Dropbox.listFilesInFolder(folderId)
      if (response.value) {
        setFolderContents(prev => {
          const newMap = new Map(prev)
          newMap.set(folderId, response.value || [])
          return newMap
        })
      }
    } catch (error) {
      console.error(`Failed to load Dropbox folder contents for ${folderId}:`, error)
    } finally {
      setLoadingFolders(prev => {
        const newSet = new Set(prev)
        newSet.delete(folderId)
        return newSet
      })
    }
  }, [])

  const toggleExpanded = useCallback((folderId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      const isExpanding = !newSet.has(folderId)
      if (isExpanding) {
        newSet.add(folderId)
        if (!folderContents.has(folderId)) fetchFolderContents(folderId)
      } else {
        newSet.delete(folderId)
      }
      return newSet
    })
  }, [folderContents, fetchFolderContents])

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    fetchFiles()
  }, [searchQuery, fetchFiles])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setIsSearching(false)
    setFiles([])
  }, [])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  useEffect(() => {
    if (previousViewMode.current === viewMode) return
    setFiles([])
    setNextCursor(undefined)
    setError(null)
    setExpandedItems(new Set())
    setFolderContents(new Map())
    setSearchQuery('')
    setIsSearching(false)
    previousViewMode.current = viewMode
  }, [viewMode])

  useEffect(() => {
    if (connected && viewMode !== 'search') fetchFiles()
  }, [connected, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredFiles = useMemo(() => {
    return filterDropboxFiles(files, activeFilters)
  }, [files, activeFilters])

  function selectFilenameWithoutExtension(input: HTMLInputElement) {
    const value = input.value
    const lastDotIndex = value.lastIndexOf('.')
    if (lastDotIndex > 0) {
      input.setSelectionRange(0, lastDotIndex)
    } else {
      input.select()
    }
  }

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

  const documentState: DropboxFileCreationState = {
    isCreating: isCreatingDocument,
    setIsCreating: setIsCreatingDocument,
    newName: newDocumentName,
    setNewName: setNewDocumentName,
    isPending: isCreatingDocumentPending,
    setIsPending: setIsCreatingDocumentPending,
    pendingName: pendingDocumentName,
    setPendingName: setPendingDocumentName,
  }

  const spreadsheetState: DropboxFileCreationState = {
    isCreating: isCreatingSpreadsheet,
    setIsCreating: setIsCreatingSpreadsheet,
    newName: newSpreadsheetName,
    setNewName: setNewSpreadsheetName,
    isPending: isCreatingSpreadsheetPending,
    setIsPending: setIsCreatingSpreadsheetPending,
    pendingName: pendingSpreadsheetName,
    setPendingName: setPendingSpreadsheetName,
  }

  const presentationState: DropboxFileCreationState = {
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
    await handleCreateDropboxDocumentSubmit(documentState, () => fetchFiles())
  }, [documentState, fetchFiles])

  const handleSpreadsheetSubmit = useCallback(async () => {
    await handleCreateDropboxSpreadsheetSubmit(spreadsheetState, () => fetchFiles())
  }, [spreadsheetState, fetchFiles])

  const handlePresentationSubmit = useCallback(async () => {
    await handleCreateDropboxPresentationSubmit(presentationState, () => fetchFiles())
  }, [presentationState, fetchFiles])

  useEffect(() => {
    if (!isCreatingDocument || !documentInputRef.current) return
    const timeoutId = setTimeout(() => {
      if (documentInputRef.current) selectFilenameWithoutExtension(documentInputRef.current)
    }, 10)
    return () => clearTimeout(timeoutId)
  }, [isCreatingDocument])

  useEffect(() => {
    if (!isCreatingSpreadsheet || !spreadsheetInputRef.current) return
    const timeoutId = setTimeout(() => {
      if (spreadsheetInputRef.current) selectFilenameWithoutExtension(spreadsheetInputRef.current)
    }, 10)
    return () => clearTimeout(timeoutId)
  }, [isCreatingSpreadsheet])

  useEffect(() => {
    if (!isCreatingPresentation || !presentationInputRef.current) return
    const timeoutId = setTimeout(() => {
      if (presentationInputRef.current) selectFilenameWithoutExtension(presentationInputRef.current)
    }, 10)
    return () => clearTimeout(timeoutId)
  }, [isCreatingPresentation])

  useEffect(() => {
    ;(window as any).__handleCreateDocument = handleCreateDocument
    ;(window as any).__handleCreateSpreadsheet = handleCreateSpreadsheet
    ;(window as any).__handleCreatePowerpoint = handleCreatePowerpoint

    return () => {
      delete (window as any).__handleCreateDocument
      delete (window as any).__handleCreateSpreadsheet
      delete (window as any).__handleCreatePowerpoint
    }
  }, [handleCreateDocument, handleCreateSpreadsheet, handleCreatePowerpoint])

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

  const handleFavoriteChanged = useCallback((fileId: string, isFavorite: boolean) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (isFavorite) newSet.add(fileId)
      else newSet.delete(fileId)
      return newSet
    })
  }, [])

  return (
    <div className="h-full overflow-y-auto sidebar-scrollbar" onScroll={handleScroll}>
      {checkingConnection && (
        <div className="flex items-center justify-center h-full px-3 py-8">
          <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Checking Dropbox connection...</Typography>
        </div>
      )}

      {!checkingConnection && connected === false && (
        <div className="flex flex-col items-center justify-center px-4 py-8">
          <Folder className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
          <Typography variant="h3" className="mb-2 text-center">Dropbox Connection Required</Typography>
          <Typography variant="small" className="text-center mb-4 max-w-md text-muted-foreground">
            To view your Dropbox files, connect your Dropbox account.
          </Typography>
          <Button onClick={requestConnection} variant="default">Connect Dropbox</Button>
        </div>
      )}

      {!checkingConnection && connected && accountEmail && (
        <div className="px-3 py-2 border-b">
          <Typography variant="muted" className="text-xs truncate">Connected as {accountEmail}</Typography>
        </div>
      )}

      {!checkingConnection && connected && viewMode === 'search' && (
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Dropbox..."
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
            <Button size="sm" onClick={handleSearch} disabled={!searchQuery.trim() || loading}>Search</Button>
          </div>
        </div>
      )}

      {!checkingConnection && connected && loading && !files.length && (
        <div className="flex items-center gap-2 px-3 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading Dropbox files...</Typography>
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
                {viewMode === 'root' && 'No Dropbox files found'}
              </>
            )}
          </Typography>
        </div>
      )}

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
              if (e.key === 'Escape') {
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
              if (e.key === 'Escape') {
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
              if (e.key === 'Escape') {
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

      {connected && filteredFiles
        .slice()
        .sort((a, b) => {
          if (viewMode === 'root') {
            const aIsFolder = !!a.folder
            const bIsFolder = !!b.folder
            if (aIsFolder && !bIsFolder) return -1
            if (!aIsFolder && bIsFolder) return 1
            return a.name.localeCompare(b.name)
          }
          return 0
        })
        .map((file) => (
          <DropboxFileTreeItem
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

      {isLoadingMore && (
        <div className="flex items-center gap-2 px-3 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading more files...</Typography>
        </div>
      )}

      {!loading && !isLoadingMore && filteredFiles.length > 0 && !nextCursor && (
        <div className="flex items-center justify-center px-3 py-4">
          <Typography variant="muted" className="text-xs">End of files</Typography>
        </div>
      )}
    </div>
  )
}
