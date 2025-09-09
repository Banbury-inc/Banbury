import React, { useState, useEffect, useCallback } from 'react'
import { 
  Cloud, 
  Folder, 
  File, 
  RefreshCw, 
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Video,
  Music,
  Archive,
  Settings
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { GoogleDriveService, DriveFileSystemItem } from '../../services/googleDriveService'
import { ScopeService } from '../../services/scopeService'
import { GoogleDriveFileViewer } from '../GoogleDriveFileViewer'

interface GoogleDriveTabProps {
  onFileSelect?: (file: DriveFileSystemItem) => void
  selectedFile?: DriveFileSystemItem | null
}

export function GoogleDriveTab({ onFileSelect, selectedFile }: GoogleDriveTabProps) {
  const [driveFiles, setDriveFiles] = useState<DriveFileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDriveAccess, setHasDriveAccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [viewingFile, setViewingFile] = useState<DriveFileSystemItem | null>(null)

  // Check Drive access on component mount
  useEffect(() => {
    checkDriveAccess()
  }, [])

  const checkDriveAccess = useCallback(async () => {
    try {
      const hasAccess = await GoogleDriveService.hasDriveAccess()
      setHasDriveAccess(hasAccess)
      
      if (hasAccess) {
        loadDriveFiles()
      }
    } catch (error) {
      console.error('Error checking Drive access:', error)
      setHasDriveAccess(false)
    }
  }, [])

  const loadDriveFiles = useCallback(async () => {
    if (!hasDriveAccess) return

    setLoading(true)
    setError(null)
    
    try {
      const files = await GoogleDriveService.getRootFiles()
      setDriveFiles(files)
    } catch (error) {
      console.error('Error loading Drive files:', error)
      setError('Failed to load Google Drive files')
    } finally {
      setLoading(false)
    }
  }, [hasDriveAccess])

  const handleActivateDrive = useCallback(async () => {
    try {
      await GoogleDriveService.requestDriveAccess()
    } catch (error) {
      console.error('Error requesting Drive access:', error)
      setError('Failed to request Google Drive access')
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim() || !hasDriveAccess) return

    setIsSearching(true)
    setError(null)

    try {
      const results = await GoogleDriveService.searchFiles(searchTerm)
      const searchResults = GoogleDriveService.buildDriveFileTree(results.files)
      setDriveFiles(searchResults)
    } catch (error) {
      console.error('Error searching Drive files:', error)
      setError('Failed to search Google Drive files')
    } finally {
      setIsSearching(false)
    }
  }, [searchTerm, hasDriveAccess])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    loadDriveFiles()
  }, [loadDriveFiles])

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const getFileIcon = (item: DriveFileSystemItem) => {
    if (item.type === 'folder') {
      return <Folder className="h-4 w-4 text-blue-400" />
    }

    if (!item.mimeType) {
      return <File className="h-4 w-4 text-gray-400" />
    }

    // Google Workspace files
    if (item.mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="h-4 w-4 text-blue-500" />
    }
    if (item.mimeType === 'application/vnd.google-apps.spreadsheet') {
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />
    }
    if (item.mimeType === 'application/vnd.google-apps.presentation') {
      return <Presentation className="h-4 w-4 text-orange-500" />
    }

    // Regular file types
    if (item.mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-purple-400" />
    }
    if (item.mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-red-400" />
    }
    if (item.mimeType.startsWith('audio/')) {
      return <Music className="h-4 w-4 text-pink-400" />
    }
    if (item.mimeType.includes('zip') || item.mimeType.includes('archive')) {
      return <Archive className="h-4 w-4 text-yellow-400" />
    }

    return <File className="h-4 w-4 text-gray-400" />
  }

  const handleFileClick = useCallback((item: DriveFileSystemItem) => {
    if (item.type === 'folder') {
      toggleExpanded(item.id)
    } else {
      onFileSelect?.(item)
      setViewingFile(item)
    }
  }, [onFileSelect, toggleExpanded])

  const handleDownloadFile = useCallback(async (item: DriveFileSystemItem, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      const result = await GoogleDriveService.downloadFile(item.driveId)
      
      if (result.success && result.url && result.fileName) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up object URL
        window.URL.revokeObjectURL(result.url)
      } else {
        setError(result.error || 'Failed to download file')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      setError('Failed to download file')
    }
  }, [])

  const handleOpenInDrive = useCallback((item: DriveFileSystemItem, event: React.MouseEvent) => {
    event.stopPropagation()
    GoogleDriveService.openInDrive(item.driveId)
  }, [])

  const renderFileTreeItem = (item: DriveFileSystemItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const isSelected = selectedFile?.id === item.id
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800 transition-colors ${
            isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300'
          }`}
          style={{ paddingLeft: `${(level * 12) + 12}px` }}
          onClick={() => handleFileClick(item)}
        >
          {item.type === 'folder' && (
            isExpanded ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronRight className="h-3 w-3" />
          )}
          {item.type === 'file' && <div className="w-3" />}
          
          {getFileIcon(item)}
          
          <span className="text-sm truncate min-w-0 flex-1">{item.name}</span>
          
          {item.type === 'file' && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => handleDownloadFile(item, e)}
                title="Download file"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => handleOpenInDrive(item, e)}
                title="Open in Google Drive"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {item.type === 'folder' && hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderFileTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!hasDriveAccess) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-semibold">Google Drive</h3>
        </div>
        
        <div className="text-center space-y-4">
          <div className="text-zinc-400 text-sm">
            <p>Connect your Google Drive to view and manage your files directly in the workspace.</p>
          </div>
          
          <Button
            onClick={handleActivateDrive}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Connect Google Drive
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* File Viewer Modal */}
      {viewingFile && (
        <GoogleDriveFileViewer 
          file={viewingFile} 
          onClose={() => setViewingFile(null)} 
        />
      )}
      
      <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">Google Drive</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadDriveFiles}
              disabled={loading}
              className="h-8 w-8 p-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search Drive files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 pr-8"
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          </div>
          
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="px-2"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-900/20 border-l-4 border-red-500 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : driveFiles.length === 0 ? (
          <div className="text-center p-8 text-zinc-400">
            {searchTerm ? 'No files found' : 'No files in Google Drive'}
          </div>
        ) : (
          <div className="group">
            {driveFiles.map((item) => renderFileTreeItem(item))}
          </div>
        )}
        </div>
      </div>
    </>
  )
}