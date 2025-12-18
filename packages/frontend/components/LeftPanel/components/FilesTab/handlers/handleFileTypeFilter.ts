import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { DriveFile } from "../../../../../../backend/api/drive/drive"

// File type category definitions
export interface FileTypeCategory {
  label: string
  extensions: string[]
  mimeTypes?: string[] // For Google Drive files
}

export const FILE_TYPE_CATEGORIES: Record<string, FileTypeCategory> = {
  documents: {
    label: 'Documents',
    extensions: ['.doc', '.docx', '.txt', '.rtf', '.odt', '.md', '.markdown'],
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml', 'text/plain', 'text/rtf', 'application/vnd.google-apps.document']
  },
  spreadsheets: {
    label: 'Spreadsheets',
    extensions: ['.xls', '.xlsx', '.csv', '.ods', '.tsv'],
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml', 'text/csv', 'application/vnd.google-apps.spreadsheet']
  },
  images: {
    label: 'Images',
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico'],
    mimeTypes: ['image/']
  },
  videos: {
    label: 'Videos',
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'],
    mimeTypes: ['video/']
  },
  audio: {
    label: 'Audio',
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au'],
    mimeTypes: ['audio/']
  },
  pdfs: {
    label: 'PDFs',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf']
  },
  code: {
    label: 'Code',
    extensions: [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh',
      '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd'
    ],
    mimeTypes: ['text/', 'application/json', 'application/xml', 'application/javascript']
  },
  presentations: {
    label: 'Presentations',
    extensions: ['.ppt', '.pptx', '.odp'],
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml', 'application/vnd.google-apps.presentation']
  },
  archives: {
    label: 'Archives',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.lzma', '.cab', '.iso', '.dmg', '.pkg'],
    mimeTypes: ['application/zip', 'application/x-rar', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip']
  },
  canvas: {
    label: 'Canvas',
    extensions: ['.drawio', '.tldraw', '.tldr'],
    mimeTypes: []
  }
}

// Get file extension from filename
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0) return ''
  return fileName.substring(lastDot).toLowerCase()
}

// Check if a file matches any of the active filter categories
export function matchesFileTypeFilter(fileName: string, activeFilters: Set<string>): boolean {
  if (activeFilters.size === 0) return true
  
  const extension = getFileExtension(fileName)
  if (!extension) return false
  
  for (const categoryKey of activeFilters) {
    const category = FILE_TYPE_CATEGORIES[categoryKey]
    if (category && category.extensions.includes(extension)) {
      return true
    }
  }
  
  return false
}

// Check if a Drive file matches any of the active filter categories
export function matchesDriveFileTypeFilter(file: DriveFile, activeFilters: Set<string>): boolean {
  if (activeFilters.size === 0) return true
  
  const { mimeType, name } = file
  
  for (const categoryKey of activeFilters) {
    const category = FILE_TYPE_CATEGORIES[categoryKey]
    if (!category) continue
    
    // Check by mimeType
    if (mimeType && category.mimeTypes) {
      for (const mType of category.mimeTypes) {
        if (mimeType.includes(mType)) return true
      }
    }
    
    // Check by extension as fallback
    const extension = getFileExtension(name)
    if (extension && category.extensions.includes(extension)) {
      return true
    }
  }
  
  return false
}

// Filter file tree while preserving folder hierarchy
export function filterFileTree(items: FileSystemItem[], activeFilters: Set<string>): FileSystemItem[] {
  if (activeFilters.size === 0) return items
  
  return items.reduce<FileSystemItem[]>((acc, item) => {
    if (item.type === 'folder') {
      // Recursively filter children
      const filteredChildren = item.children ? filterFileTree(item.children, activeFilters) : []
      
      // Only include folder if it has matching children
      if (filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren
        })
      }
    } else {
      // Check if file matches filter
      if (matchesFileTypeFilter(item.name, activeFilters)) {
        acc.push(item)
      }
    }
    
    return acc
  }, [])
}

// Filter flat file list (for recent/starred views)
export function filterFlatFileList(files: FileSystemItem[], activeFilters: Set<string>): FileSystemItem[] {
  if (activeFilters.size === 0) return files
  
  return files.filter(file => matchesFileTypeFilter(file.name, activeFilters))
}

// Filter Drive files
export function filterDriveFiles(files: DriveFile[], activeFilters: Set<string>): DriveFile[] {
  if (activeFilters.size === 0) return files
  
  return files.filter(file => {
    // Hide folders when filters are active
    if (file.mimeType?.includes('folder')) return false
    
    return matchesDriveFileTypeFilter(file, activeFilters)
  })
}

