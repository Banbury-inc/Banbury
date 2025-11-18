// Utility functions for building file trees from API data

export interface FileSystemItem {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: Date
  children?: FileSystemItem[]
  s3_url?: string
  file_id?: string
  mimeType?: string // For Google Drive files
}

export interface ApiFileInfo {
  file_name: string
  file_size: number
  file_type: string
  file_path: string
  date_uploaded: string
  date_modified: string
  date_accessed?: string
  kind?: string
  device_name: string
  file_id?: string
}

export interface S3FileInfo {
  file_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  date_uploaded: string
  date_modified: string
  s3_url: string
  device_name: string
}

/**
 * Converts S3 file info to ApiFileInfo format
 */
export function convertS3ToApiFile(s3File: S3FileInfo): ApiFileInfo {
  return {
    file_name: s3File.file_name,
    file_size: s3File.file_size,
    file_type: s3File.file_type,
    file_path: s3File.file_path,
    date_uploaded: s3File.date_uploaded,
    date_modified: s3File.date_modified,
    device_name: s3File.device_name,
    file_id: s3File.file_id,
    // Optional fields for S3 files
    date_accessed: s3File.date_modified, // Use modified date as fallback
    kind: 'file' // S3 files are always files
  }
}

/**
 * Converts flat file list from API into hierarchical tree structure
 */
export function buildFileTree(files: ApiFileInfo[] | S3FileInfo[]): FileSystemItem[] {
  // Keep original files to access S3 URLs
  const originalFilesMap: Map<string, ApiFileInfo | S3FileInfo> = new Map()
  
  // Convert S3 files to ApiFileInfo format if needed
  const apiFiles: ApiFileInfo[] = files.map(file => {
    let apiFile: ApiFileInfo
    if ('s3_url' in file) {
      apiFile = convertS3ToApiFile(file as S3FileInfo)
    } else {
      apiFile = file as ApiFileInfo
    }
    // Store original file by path for later reference
    originalFilesMap.set(apiFile.file_path, file)
    return apiFile
  })
  const tree: Map<string, FileSystemItem> = new Map()
  const rootItems: FileSystemItem[] = []

  // First pass: create all items
  apiFiles.forEach((file) => {
    const pathParts = file.file_path.split('/').filter(part => part.length > 0)
    let currentPath = ''

    pathParts.forEach((part, index) => {
      const isLastPart = index === pathParts.length - 1
      // A part is a file if it's the last part and matches the filename
      // OR if it's the last part and contains a file extension
      const hasFileExtension = part.includes('.') && part.lastIndexOf('.') > 0
      const isFile = isLastPart && (file.file_name === part || hasFileExtension)
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (!tree.has(currentPath)) {
        const item: FileSystemItem = {
          id: currentPath,
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          children: isFile ? undefined : []
        }

        if (isFile) {
          item.size = file.file_size
          item.modified = new Date(file.date_modified)
          if (file.file_id) {
            item.file_id = file.file_id
          }
          
          // Add S3 URL if available (for S3 files)
          const originalFile = originalFilesMap.get(file.file_path)
          if (originalFile && 's3_url' in originalFile && originalFile.s3_url) {
            item.s3_url = originalFile.s3_url
          }
        }

        tree.set(currentPath, item)
      }
    })
  })

  // Second pass: build parent-child relationships
  tree.forEach((item) => {
    const pathParts = item.path.split('/')
    if (pathParts.length === 1) {
      // Root level item
      rootItems.push(item)
    } else {
      // Find parent
      const parentPath = pathParts.slice(0, -1).join('/')
      const parent = tree.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(item)
      }
    }
  })

  // Sort items: folders first, then files, both alphabetically
  const sortItems = (items: FileSystemItem[]): FileSystemItem[] => {
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
 * Flattens file tree for search purposes
 */
export function flattenFileTree(items: FileSystemItem[]): FileSystemItem[] {
  const result: FileSystemItem[] = []
  
  const traverse = (items: FileSystemItem[]) => {
    items.forEach(item => {
      result.push(item)
      if (item.children) {
        traverse(item.children)
      }
    })
  }
  
  traverse(items)
  return result
}

/**
 * Filters file tree based on search query
 */
export function filterFileTree(items: FileSystemItem[], query: string): FileSystemItem[] {
  if (!query.trim()) {
    return items
  }

  const lowerQuery = query.toLowerCase()
  
  const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
    return items.reduce((acc: FileSystemItem[], item) => {
      const matchesQuery = item.name.toLowerCase().includes(lowerQuery)
      const filteredChildren = item.children ? filterItems(item.children) : undefined
      
      if (matchesQuery || (filteredChildren && filteredChildren.length > 0)) {
        acc.push({
          ...item,
          children: filteredChildren
        })
      }
      
      return acc
    }, [])
  }
  
  return filterItems(items)
}
