import { FileSystemItem } from "../../../../utils/fileTreeUtils"

/**
 * Removes a file from the file tree by file_id
 */
export function removeFileFromTree(
  items: FileSystemItem[],
  fileId: string
): FileSystemItem[] {
  return items.reduce((acc, item) => {
    if (item.type === 'file' && item.file_id === fileId) {
      // Skip this file (remove it)
      return acc
    }
    
    if (item.type === 'folder' && item.children) {
      // Recursively process children
      const filteredChildren = removeFileFromTree(item.children, fileId)
      acc.push({
        ...item,
        children: filteredChildren
      })
    } else {
      acc.push(item)
    }
    
    return acc
  }, [] as FileSystemItem[])
}

/**
 * Removes multiple files from the file tree by file_ids
 */
export function removeMultipleFilesFromTree(
  items: FileSystemItem[],
  fileIds: Set<string>
): FileSystemItem[] {
  return items.reduce((acc, item) => {
    if (item.type === 'file' && item.file_id && fileIds.has(item.file_id)) {
      // Skip this file (remove it)
      return acc
    }
    
    if (item.type === 'folder' && item.children) {
      // Recursively process children
      const filteredChildren = removeMultipleFilesFromTree(item.children, fileIds)
      acc.push({
        ...item,
        children: filteredChildren
      })
    } else {
      acc.push(item)
    }
    
    return acc
  }, [] as FileSystemItem[])
}

/**
 * Removes a folder from the file tree by path
 */
export function removeFolderFromTree(
  items: FileSystemItem[],
  folderPath: string
): FileSystemItem[] {
  return items.reduce((acc, item) => {
    if (item.type === 'folder' && item.path === folderPath) {
      // Skip this folder (remove it)
      return acc
    }
    
    if (item.type === 'folder' && item.children) {
      // Recursively process children
      const filteredChildren = removeFolderFromTree(item.children, folderPath)
      acc.push({
        ...item,
        children: filteredChildren
      })
    } else {
      acc.push(item)
    }
    
    return acc
  }, [] as FileSystemItem[])
}

/**
 * Removes multiple folders from the file tree by paths
 */
export function removeMultipleFoldersFromTree(
  items: FileSystemItem[],
  folderPaths: Set<string>
): FileSystemItem[] {
  return items.reduce((acc, item) => {
    if (item.type === 'folder' && folderPaths.has(item.path)) {
      // Skip this folder (remove it)
      return acc
    }
    
    if (item.type === 'folder' && item.children) {
      // Recursively process children
      const filteredChildren = removeMultipleFoldersFromTree(item.children, folderPaths)
      acc.push({
        ...item,
        children: filteredChildren
      })
    } else {
      acc.push(item)
    }
    
    return acc
  }, [] as FileSystemItem[])
}

/**
 * Inserts a file back into the tree at its original position
 * This is used to restore a file if deletion fails
 */
export function insertFileIntoTree(
  items: FileSystemItem[],
  file: FileSystemItem
): FileSystemItem[] {
  // Extract the parent path from the file's path
  const pathParts = file.path.split('/')
  const fileName = pathParts.pop()
  const parentPath = pathParts.join('/') || ''
  
  // If this is a root-level file (no parent path)
  if (!parentPath) {
    return [...items, file].sort((a, b) => {
      // Sort folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }
  
  // Find the parent folder and insert the file
  return items.map(item => {
    if (item.type === 'folder' && item.path === parentPath) {
      const updatedChildren = [...(item.children || []), file].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      return {
        ...item,
        children: updatedChildren
      }
    }
    
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: insertFileIntoTree(item.children, file)
      }
    }
    
    return item
  })
}

/**
 * Inserts a folder back into the tree at its original position
 */
export function insertFolderIntoTree(
  items: FileSystemItem[],
  folder: FileSystemItem
): FileSystemItem[] {
  const pathParts = folder.path.split('/')
  const folderName = pathParts.pop()
  const parentPath = pathParts.join('/') || ''
  
  // If this is a root-level folder
  if (!parentPath) {
    return [...items, folder].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }
  
  // Find the parent folder and insert the folder
  return items.map(item => {
    if (item.type === 'folder' && item.path === parentPath) {
      const updatedChildren = [...(item.children || []), folder].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      return {
        ...item,
        children: updatedChildren
      }
    }
    
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: insertFolderIntoTree(item.children, folder)
      }
    }
    
    return item
  })
}
