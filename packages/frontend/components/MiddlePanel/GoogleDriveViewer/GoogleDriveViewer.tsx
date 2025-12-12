import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, Download } from 'lucide-react'
import { Button } from '../../ui/button'
import { Typography } from '../../ui/typography'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { ApiService } from '../../../../backend/api/apiService'

interface GoogleDriveViewerProps {
  file: FileSystemItem
}

export function GoogleDriveViewer({ file }: GoogleDriveViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [key, setKey] = useState(0)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if this is a Google Workspace file using mimeType (more reliable)
  const isWorkspaceFile = file.mimeType?.includes('vnd.google-apps') ||
                          file.s3_url?.includes('docs.google.com') || 
                          file.s3_url?.includes('sheets.google.com') || 
                          file.s3_url?.includes('slides.google.com')
  
  // Get the Drive file ID from path
  const driveFileId = file.path?.replace('drive://', '') || file.file_id || ''

  // Fetch file content for non-Workspace files
  useEffect(() => {
    if (isWorkspaceFile) {
      setIsLoading(false)
      return
    }

    let currentBlobUrl: string | null = null

    // For regular files, fetch with authentication and create blob URL
    async function fetchFile() {
      try {
        setIsLoading(true)
        setError(null)
        const blob = await ApiService.Drive.getFileBlob(driveFileId)
        const url = URL.createObjectURL(blob)
        currentBlobUrl = url
        setBlobUrl(url)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching Drive file:', err)
        setError('Failed to load file')
        setIsLoading(false)
      }
    }

    fetchFile()

    // Cleanup blob URL on unmount or before refetching
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [driveFileId, isWorkspaceFile, key])
  
  // Get the embed URL
  const getEmbedUrl = () => {
    // For Google Workspace files, convert view link to embed link
    if (isWorkspaceFile) {
      if (!file.s3_url) {
        console.error('GoogleDriveViewer - No s3_url available for Workspace file')
        return null
      }
      
      let url = file.s3_url
      
      // Convert /edit or /view to /preview for embedding
      if (url.includes('/edit')) {
        url = url.replace('/edit', '/preview')
      } else if (url.includes('/view')) {
        url = url.replace('/view', '/preview')
      }
      // If URL doesn't have /preview, /edit, or /view, try to construct preview URL
      else if (!url.includes('/preview')) {
        console.warn('GoogleDriveViewer - URL format unexpected:', url)
      }
      
      return url
    }
    
    // For regular files, use the blob URL
    return blobUrl
  }

  const embedUrl = getEmbedUrl()

  const handleRefresh = () => {
    // Revoke old blob URL if exists
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }
    setIsLoading(true)
    setError(null)
    setKey(prev => prev + 1)
  }

  const handleOpenInNewTab = () => {
    if (file.s3_url) {
      window.open(file.s3_url, '_blank')
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await ApiService.Drive.getFileBlob(driveFileId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading file:', err)
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Typography variant="small" className="font-medium truncate">
            {file.name}
          </Typography>
          {isWorkspaceFile && (
            <span className="text-xs px-2 py-0.5 bg-blue-600 rounded text-white">
              Google Workspace
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {!isWorkspaceFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            title="Open in Google Drive"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <Typography variant="small" className="text-gray-400">
                Loading Google Drive file...
              </Typography>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-4">
              <Typography variant="h3" className="text-xl font-semibold text-white mb-2">
                Error Loading File
              </Typography>
              <Typography variant="p" className="text-gray-400 mb-4">
                {error}. Click the button below to open it in Google Drive or try refreshing.
              </Typography>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button
                  onClick={handleOpenInNewTab}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Drive
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {!error && embedUrl && (
          <iframe
            key={key}
            src={embedUrl}
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setError('Failed to load file in preview')
            }}
            title={file.name}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        )}
        
        {!error && !embedUrl && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-4">
              <Typography variant="h3" className="text-xl font-semibold text-white mb-2">
                Unable to Load File
              </Typography>
              <Typography variant="p" className="text-gray-400 mb-4">
                This Google Drive file cannot be previewed. Click the button below to open it in Google Drive.
              </Typography>
              <Button
                onClick={handleOpenInNewTab}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Drive
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

