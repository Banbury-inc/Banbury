// Utility functions for building Google Drive file trees

import { DriveFile } from '../../backend/api/drive/drive'

export interface DriveFileSystemItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mimeType: string
  modifiedTime?: string
  createdTime?: string
  size?: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
  parents?: string[]
  starred?: boolean
  children?: DriveFileSystemItem[]
}

/**
 * Converts DriveFile to DriveFileSystemItem format
 */
function convertDriveFileToTreeItem(file: DriveFile): DriveFileSystemItem {
  return {
    id: file.id,
    name: file.name,
    type: file.mimeType?.includes('folder') ? 'folder' : 'file',
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    createdTime: file.createdTime,
    size: file.size,
    webViewLink: file.webViewLink,
    iconLink: file.iconLink,
    thumbnailLink: file.thumbnailLink,
    parents: file.parents,
    starred: file.starred,
    children: file.mimeType?.includes('folder') ? [] : undefined
  }
}

/**
 * Builds a hierarchical tree structure from Google Drive files
 */
export function buildDriveFileTree(files: DriveFile[], currentFolderId?: string): DriveFileSystemItem[] {
  // Convert all files to tree items
  const items = files.map(convertDriveFileToTreeItem)
  
  // If we're in a specific folder, just return those items sorted
  if (currentFolderId) {
    return sortDriveItems(items)
  }
  
  // Otherwise, organize by parent relationships
  const itemMap = new Map<string, DriveFileSystemItem>()
  const rootItems: DriveFileSystemItem[] = []
  
  // Create a map of all items
  items.forEach(item => {
    itemMap.set(item.id, item)
  })
  
  // Build parent-child relationships
  items.forEach(item => {
    if (!item.parents || item.parents.length === 0) {
      // No parent means it's a root item
      rootItems.push(item)
    } else {
      // Try to find parent in our item map
      const parentId = item.parents[0] // Google Drive files typically have one parent
      const parent = itemMap.get(parentId)
      
      if (parent && parent.children) {
        parent.children.push(item)
      } else {
        // Parent not in our current list, treat as root item
        rootItems.push(item)
      }
    }
  })
  
  return sortDriveItems(rootItems)
}

/**
 * Sorts drive items: folders first, then files, both alphabetically
 */
function sortDriveItems(items: DriveFileSystemItem[]): DriveFileSystemItem[] {
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  }).map(item => ({
    ...item,
    children: item.children ? sortDriveItems(item.children) : undefined
  }))
}

/**
 * Flattens Drive file tree for search purposes
 */
export function flattenDriveFileTree(items: DriveFileSystemItem[]): DriveFileSystemItem[] {
  const result: DriveFileSystemItem[] = []
  
  function traverse(items: DriveFileSystemItem[]) {
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
 * Filters Drive file tree based on search query
 */
export function filterDriveFileTree(items: DriveFileSystemItem[], query: string): DriveFileSystemItem[] {
  if (!query.trim()) {
    return items
  }

  const lowerQuery = query.toLowerCase()
  
  function filterItems(items: DriveFileSystemItem[]): DriveFileSystemItem[] {
    return items.reduce((acc: DriveFileSystemItem[], item) => {
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

/**
 * Gets the icon type for a Drive file based on its mimeType
 */
export function getDriveFileIcon(mimeType: string): string {
  if (mimeType?.includes('folder')) return 'folder'
  if (mimeType?.includes('document')) return 'document'
  if (mimeType?.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType?.includes('presentation')) return 'presentation'
  if (mimeType?.includes('image')) return 'image'
  if (mimeType?.includes('video')) return 'video'
  if (mimeType?.includes('audio')) return 'audio'
  if (mimeType?.includes('pdf')) return 'pdf'
  return 'file'
}

