import { ApiService } from './apiService'
import { ScopeService } from './scopeService'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  modifiedTime: string
  size?: string
  webViewLink?: string
  webContentLink?: string
  iconLink?: string
  thumbnailLink?: string
  kind: string
  trashed?: boolean
}

export interface GoogleDriveFolder {
  id: string
  name: string
  parents?: string[]
  modifiedTime: string
  webViewLink?: string
  kind: string
  trashed?: boolean
}

export interface DriveFileSystemItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: Date
  children?: DriveFileSystemItem[]
  driveId: string
  mimeType?: string
  webViewLink?: string
  webContentLink?: string
  iconLink?: string
  thumbnailLink?: string
  parents?: string[]
}

export class GoogleDriveService {
  private static baseURL = ApiService['baseURL']

  /**
   * Check if user has Google Drive access
   */
  static async hasDriveAccess(): Promise<boolean> {
    try {
      return await ScopeService.isFeatureAvailable('drive')
    } catch (error) {
      console.error('Error checking Drive access:', error)
      return false
    }
  }

  /**
   * Request Google Drive access
   */
  static async requestDriveAccess(): Promise<void> {
    await ScopeService.requestFeatureAccess(['drive'])
  }

  /**
   * List files from Google Drive
   */
  static async listFiles(
    pageSize: number = 100,
    pageToken?: string,
    q?: string
  ): Promise<{
    files: GoogleDriveFile[]
    nextPageToken?: string
  }> {
    try {
      // Ensure user has Drive access
      const hasAccess = await this.hasDriveAccess()
      if (!hasAccess) {
        throw new Error('Google Drive access not granted')
      }

      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        fields: 'nextPageToken,files(id,name,mimeType,parents,modifiedTime,size,webViewLink,webContentLink,iconLink,thumbnailLink,kind,trashed)'
      })

      if (pageToken) {
        params.set('pageToken', pageToken)
      }

      if (q) {
        params.set('q', q)
      }

      const response = await ApiService.get<{
        files: GoogleDriveFile[]
        nextPageToken?: string
      }>(`/authentication/google/drive/list?${params.toString()}`)

      return response
    } catch (error) {
      console.error('Error listing Drive files:', error)
      throw error
    }
  }

  /**
   * Get files in a specific folder
   */
  static async getFilesInFolder(
    folderId: string,
    pageSize: number = 100,
    pageToken?: string
  ): Promise<{
    files: GoogleDriveFile[]
    nextPageToken?: string
  }> {
    const query = `'${folderId}' in parents and trashed=false`
    return this.listFiles(pageSize, pageToken, query)
  }

  /**
   * Search files in Google Drive
   */
  static async searchFiles(
    searchQuery: string,
    pageSize: number = 50
  ): Promise<{
    files: GoogleDriveFile[]
    nextPageToken?: string
  }> {
    const query = `name contains '${searchQuery}' and trashed=false`
    return this.listFiles(pageSize, undefined, query)
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const hasAccess = await this.hasDriveAccess()
      if (!hasAccess) {
        throw new Error('Google Drive access not granted')
      }

      const response = await ApiService.get<GoogleDriveFile>(
        `/authentication/google/drive/file/${fileId}?fields=id,name,mimeType,parents,modifiedTime,size,webViewLink,webContentLink,iconLink,thumbnailLink,kind,trashed`
      )

      return response
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  }

  /**
   * Build hierarchical file tree from flat Drive files list
   */
  static buildDriveFileTree(files: GoogleDriveFile[]): DriveFileSystemItem[] {
    const fileMap = new Map<string, DriveFileSystemItem>()
    const rootItems: DriveFileSystemItem[] = []

    // Convert Drive files to our file system items
    files.forEach(file => {
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
      const item: DriveFileSystemItem = {
        id: `drive-${file.id}`,
        name: file.name,
        type: isFolder ? 'folder' : 'file',
        path: file.name, // Will be updated when building hierarchy
        driveId: file.id,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        iconLink: file.iconLink,
        thumbnailLink: file.thumbnailLink,
        parents: file.parents,
        modified: new Date(file.modifiedTime),
        children: isFolder ? [] : undefined
      }

      if (file.size) {
        item.size = parseInt(file.size)
      }

      fileMap.set(file.id, item)
    })

    // Build parent-child relationships
    fileMap.forEach(item => {
      if (item.parents && item.parents.length > 0) {
        // Find parent folder
        const parentId = item.parents[0]
        const parent = fileMap.get(parentId)
        
        if (parent && parent.children) {
          parent.children.push(item)
          // Update path to include parent path
          item.path = parent.path ? `${parent.path}/${item.name}` : item.name
        } else {
          // Parent not in our file list, treat as root item
          rootItems.push(item)
        }
      } else {
        // No parents, this is a root item
        rootItems.push(item)
      }
    })

    // Sort items: folders first, then files, both alphabetically
    const sortItems = (items: DriveFileSystemItem[]): DriveFileSystemItem[] => {
      return items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      }).map(item => ({
        ...item,
        children: item.children ? sortItems(item.children) : undefined
      }))
    }

    return sortItems(rootItems)
  }

  /**
   * Get root folder contents
   */
  static async getRootFiles(): Promise<DriveFileSystemItem[]> {
    try {
      const response = await this.listFiles(1000, undefined, "parents in 'root' and trashed=false")
      return this.buildDriveFileTree(response.files)
    } catch (error) {
      console.error('Error getting root files:', error)
      throw error
    }
  }

  /**
   * Get all files (for building complete tree)
   */
  static async getAllFiles(): Promise<DriveFileSystemItem[]> {
    try {
      let allFiles: GoogleDriveFile[] = []
      let nextPageToken: string | undefined = undefined

      // Fetch all files in batches
      do {
        const response = await this.listFiles(1000, nextPageToken, 'trashed=false')
        allFiles = allFiles.concat(response.files)
        nextPageToken = response.nextPageToken
      } while (nextPageToken)

      return this.buildDriveFileTree(allFiles)
    } catch (error) {
      console.error('Error getting all files:', error)
      throw error
    }
  }

  /**
   * Download file content from Google Drive
   */
  static async downloadFile(fileId: string): Promise<{
    success: boolean
    blob?: Blob
    url?: string
    fileName?: string
    error?: string
  }> {
    try {
      const hasAccess = await this.hasDriveAccess()
      if (!hasAccess) {
        throw new Error('Google Drive access not granted')
      }

      // Get file metadata first
      const metadata = await this.getFileMetadata(fileId)
      
      // For Google Workspace files, use export endpoint
      if (metadata.mimeType.startsWith('application/vnd.google-apps.')) {
        return this.exportGoogleFile(fileId, metadata)
      }

      // For regular files, download directly
      const response = await fetch(`${this.baseURL}/authentication/google/drive/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      return {
        success: true,
        blob,
        url,
        fileName: metadata.name
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  /**
   * Export Google Workspace files (Docs, Sheets, Slides)
   */
  private static async exportGoogleFile(fileId: string, metadata: GoogleDriveFile): Promise<{
    success: boolean
    blob?: Blob
    url?: string
    fileName?: string
    error?: string
  }> {
    try {
      let exportMimeType: string
      let fileExtension: string

      // Determine export format based on Google file type
      switch (metadata.mimeType) {
        case 'application/vnd.google-apps.document':
          exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          fileExtension = '.docx'
          break
        case 'application/vnd.google-apps.spreadsheet':
          exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          fileExtension = '.xlsx'
          break
        case 'application/vnd.google-apps.presentation':
          exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          fileExtension = '.pptx'
          break
        case 'application/vnd.google-apps.drawing':
          exportMimeType = 'image/png'
          fileExtension = '.png'
          break
        default:
          // For other Google apps, try PDF export
          exportMimeType = 'application/pdf'
          fileExtension = '.pdf'
          break
      }

      const response = await fetch(
        `${this.baseURL}/authentication/google/drive/export/${fileId}?mimeType=${encodeURIComponent(exportMimeType)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const fileName = metadata.name.includes('.') 
        ? metadata.name 
        : metadata.name + fileExtension

      return {
        success: true,
        blob,
        url,
        fileName
      }
    } catch (error) {
      console.error('Error exporting Google file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Open file in Google Drive web interface
   */
  static openInDrive(fileId: string): void {
    const url = `https://drive.google.com/file/d/${fileId}/view`
    window.open(url, '_blank')
  }

  /**
   * Get file icon based on MIME type
   */
  static getFileIcon(mimeType: string): string {
    const iconMap: { [key: string]: string } = {
      'application/vnd.google-apps.folder': '📁',
      'application/vnd.google-apps.document': '📄',
      'application/vnd.google-apps.spreadsheet': '📊',
      'application/vnd.google-apps.presentation': '📽️',
      'application/vnd.google-apps.drawing': '🎨',
      'application/vnd.google-apps.form': '📝',
      'application/vnd.google-apps.script': '⚙️',
      'application/pdf': '📄',
      'image/': '🖼️',
      'video/': '🎥',
      'audio/': '🎵',
      'text/': '📄',
      'application/zip': '📦',
      'application/x-zip-compressed': '📦'
    }

    // Check for exact match first
    if (iconMap[mimeType]) {
      return iconMap[mimeType]
    }

    // Check for partial matches
    for (const key in iconMap) {
      if (mimeType.startsWith(key)) {
        return iconMap[key]
      }
    }

    // Default file icon
    return '📄'
  }
}