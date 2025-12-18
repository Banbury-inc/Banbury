import { RefreshCw, Folder, Search, X } from "lucide-react"
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { OneDriveFileTreeItem } from "./OneDriveFileTreeItem"
import { Button } from "../../../../ui/button"
import { Input } from "../../../../ui/input"
import OneDrive, { OneDriveFile } from "../../../../../../backend/api/onedrive/onedrive"
import { Typography } from "../../../../ui/typography"
import { handleFetchOneDriveFiles, OneDriveViewMode } from "../handlers/handleFetchOneDriveFiles"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { filterOneDriveFiles } from "../handlers/handleFileTypeFilter"

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

      {!checkingConnection && connected && !loading && filteredFiles.length === 0 && !error && (
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

