import { RefreshCw, Folder } from "lucide-react"
import { useState, useEffect, useCallback } from 'react'
import { DriveFileTreeItem } from "./DriveFileTreeItem"
import { Button } from "../../../../ui/button"
import { DriveService, DriveFile } from "../../../../../services/driveService"
import { ScopeService } from "../../../../../services/scopeService"
import { Typography } from "../../../../ui/typography"
import { handleFetchDriveFiles } from "../handlers/handleFetchDriveFiles"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"

interface GoogleDriveViewProps {
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
}

export function GoogleDriveView({
  onFileSelect,
  selectedFile,
}: GoogleDriveViewProps) {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveAvailable, setDriveAvailable] = useState<boolean | null>(null)
  const [driveNextPageToken, setDriveNextPageToken] = useState<string | undefined>(undefined)
  const [isLoadingMoreDrive, setIsLoadingMoreDrive] = useState(false)
  const [checkingDriveAccess, setCheckingDriveAccess] = useState(false)
  
  // Drive folder expansion state (tree view)
  const [expandedDriveItems, setExpandedDriveItems] = useState<Set<string>>(new Set())
  const [driveFolderContents, setDriveFolderContents] = useState<Map<string, DriveFile[]>>(new Map())
  const [loadingDriveFolders, setLoadingDriveFolders] = useState<Set<string>>(new Set())

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
    await handleFetchDriveFiles({
      pageToken,
      setIsLoadingMoreDrive,
      setDriveLoading,
      setDriveError,
      setDriveNextPageToken,
      setDriveFiles,
      setDriveAvailable,
      checkDriveAccess,
    })
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

  // Fetch Drive files when available
  useEffect(() => {
    if (driveAvailable) {
      fetchDriveFiles()
    }
  }, [driveAvailable, fetchDriveFiles])

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
      
      {!checkingDriveAccess && driveAvailable && !driveLoading && driveFiles.length === 0 && !driveError && (
        <div className="px-3 py-2">
          <Typography variant="muted">No Google Drive files found</Typography>
        </div>
      )}

      {/* Google Drive file tree */}
      {driveAvailable && driveFiles
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
      {isLoadingMoreDrive && (
        <div className="flex items-center gap-2 px-3 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1} />
          <Typography variant="muted">Loading more files...</Typography>
        </div>
      )}
      
      {/* End of Drive files indicator */}
      {!driveLoading && !isLoadingMoreDrive && driveFiles.length > 0 && !driveNextPageToken && (
        <div className="flex items-center justify-center px-3 py-4">
          <Typography variant="muted" className="text-xs">End of files</Typography>
        </div>
      )}
    </div>
  )
}

