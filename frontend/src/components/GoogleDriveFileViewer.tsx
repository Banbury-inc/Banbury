import React, { useState, useCallback } from 'react'
import { 
  Download, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  Eye,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { GoogleDriveService, DriveFileSystemItem } from '../services/googleDriveService'

interface GoogleDriveFileViewerProps {
  file: DriveFileSystemItem
  onClose: () => void
}

export function GoogleDriveFileViewer({ file, onClose }: GoogleDriveFileViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const getFileIcon = () => {
    if (!file.mimeType) {
      return <File className="h-8 w-8 text-gray-400" />
    }

    // Google Workspace files
    if (file.mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="h-8 w-8 text-blue-500" />
    }
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    }
    if (file.mimeType === 'application/vnd.google-apps.presentation') {
      return <Presentation className="h-8 w-8 text-orange-500" />
    }

    // Regular file types
    if (file.mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-purple-400" />
    }
    if (file.mimeType.startsWith('video/')) {
      return <Video className="h-8 w-8 text-red-400" />
    }
    if (file.mimeType.startsWith('audio/')) {
      return <Music className="h-8 w-8 text-pink-400" />
    }
    if (file.mimeType.includes('zip') || file.mimeType.includes('archive')) {
      return <Archive className="h-8 w-8 text-yellow-400" />
    }

    return <File className="h-8 w-8 text-gray-400" />
  }

  const getFileTypeDescription = () => {
    if (!file.mimeType) return 'Unknown file type'

    const typeMap: { [key: string]: string } = {
      'application/vnd.google-apps.document': 'Google Docs Document',
      'application/vnd.google-apps.spreadsheet': 'Google Sheets Spreadsheet',
      'application/vnd.google-apps.presentation': 'Google Slides Presentation',
      'application/vnd.google-apps.drawing': 'Google Drawings',
      'application/vnd.google-apps.form': 'Google Forms',
      'application/vnd.google-apps.script': 'Google Apps Script',
      'application/pdf': 'PDF Document',
      'text/plain': 'Text Document',
      'application/msword': 'Microsoft Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Microsoft Word Document',
      'application/vnd.ms-excel': 'Microsoft Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Microsoft Excel Spreadsheet',
      'application/vnd.ms-powerpoint': 'Microsoft PowerPoint Presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Microsoft PowerPoint Presentation'
    }

    if (typeMap[file.mimeType]) {
      return typeMap[file.mimeType]
    }

    if (file.mimeType.startsWith('image/')) return 'Image'
    if (file.mimeType.startsWith('video/')) return 'Video'
    if (file.mimeType.startsWith('audio/')) return 'Audio'
    if (file.mimeType.startsWith('text/')) return 'Text Document'

    return file.mimeType
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown date'
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      const result = await GoogleDriveService.downloadFile(file.driveId)
      
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
        setDownloadError(result.error || 'Failed to download file')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      setDownloadError('Failed to download file')
    } finally {
      setIsDownloading(false)
    }
  }, [file.driveId])

  const handleOpenInDrive = useCallback(() => {
    GoogleDriveService.openInDrive(file.driveId)
  }, [file.driveId])

  const handlePreview = useCallback(() => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    } else {
      handleOpenInDrive()
    }
  }, [file.webViewLink, handleOpenInDrive])

  const canPreview = () => {
    if (!file.mimeType) return false
    
    // Google Workspace files can always be previewed
    if (file.mimeType.startsWith('application/vnd.google-apps.')) {
      return true
    }
    
    // Common previewable file types
    const previewableTypes = [
      'application/pdf',
      'text/',
      'image/',
      'video/',
      'audio/'
    ]
    
    return previewableTypes.some(type => file.mimeType!.startsWith(type))
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="text-white font-semibold truncate">File Details</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* File Info */}
        <div className="p-4 space-y-4">
          {/* File Icon and Name */}
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium truncate">{file.name}</h4>
              <p className="text-zinc-400 text-sm">{getFileTypeDescription()}</p>
            </div>
          </div>

          {/* File Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Size:</span>
              <span className="text-white">{formatFileSize(file.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Modified:</span>
              <span className="text-white">{formatDate(file.modified)}</span>
            </div>
            {file.mimeType && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Type:</span>
                <span className="text-white text-xs font-mono">{file.mimeType}</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {downloadError && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded text-red-400 text-sm">
              {downloadError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {canPreview() && (
              <Button
                onClick={handlePreview}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            
            <Button
              onClick={handleOpenInDrive}
              variant="outline"
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Drive
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}