import { 
  ChevronDown, 
  ChevronRight, 
  File, 
  Folder, 
  RefreshCw, 
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  FileType,
  FileBarChart,
  FileCog,
  Network,
  Star,
  ListChecks,
} from "lucide-react"
import { useState, useEffect, useRef } from 'react'
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../common/ui/typography"
import { ApiService } from "../../../../../../backend/api/apiService"
import { useToast } from "../../../../common/ui/use-toast"
import { handleCopyLocalToDrive } from "./FileContextMenu/handlers/handleCopyLocalToDrive"
import { handleCopyLocalToOneDrive } from "./FileContextMenu/handlers/handleCopyLocalToOneDrive"
import { handleCopyLocalToDropbox } from "./FileContextMenu/handlers/handleCopyLocalToDropbox"
import { handleLocalFileDownload } from "../handlers/handleLocalFileDownload"
import { handleSaveAsPDF } from "./FileContextMenu/handlers/handleSaveAsPDF"
import { CloudFileContextMenu } from "./FileContextMenu/CloudFileContextMenu"
import { getColoredFileIcons } from "../../../../modals/settings-tabs/handlers/appearanceHandlers"

// Drag and drop state interfaces
export interface DragState {
  isDragging: boolean
  draggedItem: FileSystemItem | null
  dragOverTarget: string | null
}

// File tree item component
export interface FileTreeItemProps {
  item: FileSystemItem
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onFileDeleted?: (fileId: string) => void
  onFileDeleteFailed?: (file: FileSystemItem) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFolderCreated?: (folderPath: string) => void
  onFolderRenamed?: (oldPath: string, newPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
  onFolderDeleteFailed?: (folder: FileSystemItem) => void
  onUploadFile?: () => void
  onUploadFolder?: () => void
  userInfo?: {
    username: string
    email?: string
  } | null
  dragState: DragState
  onDragStart: (item: FileSystemItem) => void
  onDragEnd: () => void
  onDragOver: (item: FileSystemItem) => void
  onDragLeave: () => void
  onDrop: (targetItem: FileSystemItem, draggedItem: FileSystemItem) => void
  selectedIds: Set<string>
  onShiftToggleSelection: (item: FileSystemItem, e?: React.MouseEvent) => void
  selectionCount: number
  onDeleteSelectedFiles: () => void
  starredFileIds?: Set<string>
  onStarFile?: (fileId: string) => void
  onUnstarFile?: (fileId: string) => void
  onShareFile?: (file: FileSystemItem) => void
  driveAvailable?: boolean
  oneDriveConnected?: boolean
  dropboxConnected?: boolean
  triggerSidebarRefresh?: () => void
}

// Comprehensive file type detection functions
const getFileExtension = (fileName: string): string => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return extension
}

const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico']
  const extension = getFileExtension(fileName)
  return imageExtensions.includes(extension)
}

const isVideoFile = (fileName: string): boolean => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv']
  const extension = getFileExtension(fileName)
  return videoExtensions.includes(extension)
}

const isAudioFile = (fileName: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au']
  const extension = getFileExtension(fileName)
  return audioExtensions.includes(extension)
}

const isPdfFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.pdf'
}

const isDocumentFile = (fileName: string): boolean => {
  const documentExtensions = ['.docx', '.doc', '.rtf', '.odt', '.txt', '.md', '.markdown']
  const extension = getFileExtension(fileName)
  return documentExtensions.includes(extension)
}

const isSpreadsheetFile = (fileName: string): boolean => {
  const spreadsheetExtensions = ['.xlsx', '.xls', '.csv', '.ods', '.tsv']
  const extension = getFileExtension(fileName)
  return spreadsheetExtensions.includes(extension)
}

const isPresentationFile = (fileName: string): boolean => {
  const presentationExtensions = ['.pptx', '.ppt', '.odp']
  const extension = getFileExtension(fileName)
  return presentationExtensions.includes(extension)
}

const isCodeFile = (fileName: string): boolean => {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
    '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh', '.fish',
    '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd', '.coffee', '.litcoffee', '.iced'
  ]
  const extension = getFileExtension(fileName)
  return codeExtensions.includes(extension)
}

const isArchiveFile = (fileName: string): boolean => {
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.lzma', '.cab', '.iso', '.dmg', '.pkg']
  const extension = getFileExtension(fileName)
  return archiveExtensions.includes(extension)
}

const isDataFile = (fileName: string): boolean => {
  const dataExtensions = ['.json', '.xml', '.csv', '.tsv', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log', '.sql', '.db', '.sqlite', '.sqlite3']
  const extension = getFileExtension(fileName)
  return dataExtensions.includes(extension)
}

const isDrawioFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.drawio' || (extension === '.xml' && fileName.toLowerCase().includes('drawio'))
}

const isTldrawFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.tldraw' || extension === '.tldr' || (extension === '.json' && fileName.toLowerCase().includes('tldraw'))
}

const isExecutableFile = (fileName: string): boolean => {
  const executableExtensions = ['.exe', '.msi', '.app', '.dmg', '.deb', '.rpm', '.pkg', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.jar', '.war', '.ear']
  const extension = getFileExtension(fileName)
  return executableExtensions.includes(extension)
}

const isFontFile = (fileName: string): boolean => {
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot', '.svg']
  const extension = getFileExtension(fileName)
  return fontExtensions.includes(extension)
}

const is3DFile = (fileName: string): boolean => {
  const threeDExtensions = ['.obj', '.fbx', '.dae', '.3ds', '.blend', '.max', '.ma', '.mb', '.c4d', '.stl', '.ply', '.wrl', '.x3d']
  const extension = getFileExtension(fileName)
  return threeDExtensions.includes(extension)
}

const isVectorFile = (fileName: string): boolean => {
  const vectorExtensions = ['.svg', '.ai', '.eps', '.pdf', '.cdr', '.wmf', '.emf', '.dxf', '.dwg']
  const extension = getFileExtension(fileName)
  return vectorExtensions.includes(extension)
}

const isPlanFile = (fileName: string): boolean => {
  const lowerName = fileName.toLowerCase()
  return lowerName.endsWith('.plan.md') || lowerName.endsWith('.plan.json')
}

// Function to get the appropriate icon component and color for a file type
const getFileIcon = (fileName: string): { icon: any, color: string } => {
  const coloredIcons = getColoredFileIcons()
  const uniformColor = 'text-muted-foreground'
  
  if (isPlanFile(fileName)) return { icon: ListChecks, color: coloredIcons ? 'text-purple-500' : uniformColor }
  if (isTldrawFile(fileName)) return { icon: Network, color: coloredIcons ? 'text-purple-400' : uniformColor }
  if (isDrawioFile(fileName)) return { icon: Network, color: coloredIcons ? 'text-blue-400' : uniformColor }
  if (isImageFile(fileName)) return { icon: FileImage, color: coloredIcons ? 'text-green-400' : uniformColor }
  if (isVideoFile(fileName)) return { icon: FileVideo, color: coloredIcons ? 'text-red-400' : uniformColor }
  if (isAudioFile(fileName)) return { icon: FileAudio, color: coloredIcons ? 'text-blue-400' : uniformColor }
  if (isPdfFile(fileName)) return { icon: FileText, color: coloredIcons ? 'text-red-400' : uniformColor }
  if (isDocumentFile(fileName)) return { icon: FileText, color: coloredIcons ? 'text-blue-500' : uniformColor }
  if (isSpreadsheetFile(fileName)) return { icon: FileSpreadsheet, color: coloredIcons ? 'text-green-500' : uniformColor }
  if (isPresentationFile(fileName)) return { icon: FileBarChart, color: coloredIcons ? 'text-orange-400' : uniformColor }
  if (isCodeFile(fileName)) return { icon: FileCode, color: coloredIcons ? 'text-yellow-400' : uniformColor }
  if (isArchiveFile(fileName)) return { icon: FileArchive, color: coloredIcons ? 'text-muted-foreground' : uniformColor }
  if (isDataFile(fileName)) return { icon: FileJson, color: coloredIcons ? 'text-indigo-400' : uniformColor }
  if (isExecutableFile(fileName)) return { icon: FileCog, color: coloredIcons ? 'text-red-500' : uniformColor }
  if (isFontFile(fileName)) return { icon: FileType, color: coloredIcons ? 'text-pink-400' : uniformColor }
  if (is3DFile(fileName)) return { icon: FileCog, color: coloredIcons ? 'text-cyan-400' : uniformColor }
  if (isVectorFile(fileName)) return { icon: FileImage, color: coloredIcons ? 'text-emerald-400' : uniformColor }
  
  // Default file icon
  return { icon: File, color: coloredIcons ? 'text-muted-foreground' : uniformColor }
}


export function FileTreeItem({ 
  item, 
  level, 
  expandedItems, 
  toggleExpanded, 
  onFileSelect, 
  selectedFile, 
  onFileDeleted,
  onFileDeleteFailed, 
  onFileRenamed, 
  onFolderCreated, 
  onFolderRenamed, 
  onFolderDeleted,
  onFolderDeleteFailed,
  onUploadFile,
  onUploadFolder,
  userInfo, 
  dragState, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onDragLeave, 
  onDrop,
  selectedIds,
  onShiftToggleSelection,
  selectionCount,
  onDeleteSelectedFiles,
  starredFileIds,
  onStarFile,
  onUnstarFile,
  onShareFile,
  driveAvailable,
  oneDriveConnected,
  dropboxConnected,
  triggerSidebarRefresh,
}: FileTreeItemProps) {
  
  // Helper function to select filename without extension
  const selectFilenameWithoutExtension = (input: HTMLInputElement) => {
    const value = input.value
    const lastDotIndex = value.lastIndexOf('.')
    if (lastDotIndex > 0) {
      input.setSelectionRange(0, lastDotIndex)
    } else {
      input.select()
    }
  }
  const { toast } = useToast()
  const isExpanded = expandedItems.has(item.id)
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedFile?.id === item.id
  const isMultiSelected = selectedIds.has(item.id)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(item.name)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('New Folder')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const newFolderInputRef = useRef<HTMLInputElement | null>(null)
  const [isCreatingFolderPending, setIsCreatingFolderPending] = useState(false)
  const [pendingFolderName, setPendingFolderName] = useState<string | null>(null)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          selectFilenameWithoutExtension(inputRef.current)
        }
      })
    }
  }, [isRenaming])

  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      requestAnimationFrame(() => {
        if (newFolderInputRef.current) {
          newFolderInputRef.current.focus()
          selectFilenameWithoutExtension(newFolderInputRef.current)
        }
      })
    }
  }, [isCreatingFolder])

  useEffect(() => {
    const handleStorageChange = () => {
      forceUpdate({})
    }
    
    window.addEventListener('colored-file-icons-updated', handleStorageChange)
    return () => window.removeEventListener('colored-file-icons-updated', handleStorageChange)
  }, [])
  
  // Check if this item is being dragged or is a drop target
  const isDragged = dragState.draggedItem?.id === item.id
  const isDropTarget = dragState.dragOverTarget === item.id && item.type === 'folder'
  
  // Get the appropriate icon and color for this file
  const coloredIcons = getColoredFileIcons()
  const folderColor = coloredIcons ? 'text-yellow-400' : 'text-muted-foreground'
  const fileIconData = item.type === 'folder' ? { icon: Folder, color: folderColor } : getFileIcon(item.name)
  const FileIconComponent = fileIconData.icon
  
  // Drag event handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (item.type === 'file' && item.file_id) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', item.id)
      // Add a custom type to identify internal drags
      e.dataTransfer.setData('application/x-internal-file-move', 'true')
      onDragStart(item)
    } else {
      e.preventDefault()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (item.type === 'folder' && dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      e.preventDefault()
      e.stopPropagation() // Prevent the parent container from handling this drag
      e.dataTransfer.dropEffect = 'move'
      onDragOver(item)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only trigger if we're leaving this element itself, not a child
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    onDragLeave()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent the parent container from handling this drop
    if (item.type === 'folder' && dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      onDrop(item, dragState.draggedItem)
    }
  }
  
  const handleClick = (e?: React.MouseEvent) => {
    if (isRenaming) return
    if (e?.shiftKey && item.type === 'file') {
      onShiftToggleSelection(item, e)
      return
    }
    if (hasChildren) {
      toggleExpanded(item.id)
    } else if (item.type === 'file' && onFileSelect) {
      onFileSelect(item)
    }
  }

  const handleRename = () => {
    setIsRenaming(true)
    setNewName(item.name) // Keep the full filename with extension
  }

  const handleDelete = async () => {
    if (!item.file_id) return
    
    // Optimistically remove the file from the UI
    onFileDeleted?.(item.file_id)
    
    try {
      await ApiService.Files.deleteS3File(item.file_id)
      // Deletion successful, show success toast
      toast({
        title: 'File deleted',
        description: `${item.name} has been deleted`,
        variant: 'success',
      })
    } catch (error) {
      // Deletion failed, restore the file
      onFileDeleteFailed?.(item)
      toast({
        title: 'Failed to delete file',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteFolder = async () => {
    if (item.type !== 'folder') return
    
    // Optimistically remove the folder from the UI
    onFolderDeleted?.(item.path)
    
    try {
      if (!userInfo?.username) throw new Error('User information not available')
      const result = await ApiService.Files.deleteFolder(item.path, userInfo.username)
      toast({
        title: 'Folder deleted',
        description: result.failed > 0 
          ? `Deleted ${result.deleted} items; ${result.failed} failed`
          : `Deleted ${result.deleted} items`,
        variant: result.failed > 0 ? 'destructive' : 'success',
      })
    } catch (error) {
      // Deletion failed, restore the folder
      onFolderDeleteFailed?.(item)
      toast({
        title: 'Failed to delete folder',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleRenameSubmit = async () => {
    if (newName.trim() === '' || newName === item.name) {
      setIsRenaming(false)
      return
    }
    
    try {
      if (item.type === 'file' && item.file_id) {
        // For files, we need to preserve the original extension
        const originalExtension = item.name.substring(item.name.lastIndexOf('.'))
        const newNameWithoutExtension = newName.replace(originalExtension, '')
        
        // Create the full new filename with the original extension
        const newFullName = newNameWithoutExtension.trim() + originalExtension
        
        // Pass the full filename (with extension) to the API
        await ApiService.Files.renameS3File(item.file_id, newFullName, item.path)
        
        // Calculate the new path with the full filename
        const newPath = item.path.replace(item.name, newFullName)
        onFileRenamed?.(item.path, newPath)
      } else if (item.type === 'folder') {
        // Handle folder renaming (folders don't have extensions)
        if (!userInfo?.username) {
          throw new Error('User information not available')
        }
        
        const result = await ApiService.Files.renameFolder(item.path, newName.trim(), userInfo.username)
        if (result.success) {
          onFolderRenamed?.(result.oldPath, result.newPath)
        }
      }
      setIsRenaming(false)
    } catch (error) {
      alert('Failed to rename item. Please try again.')
      setIsRenaming(false)
      setNewName(item.name) // Reset name on error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewName(item.name)
    }
  }

  const handleCreateFolder = () => {
    setIsCreatingFolder(true)
    setNewFolderName('New Folder')
  }

  const handleCreateFolderSubmit = async () => {
    const name = newFolderName.trim()
    if (name === '') {
      setIsCreatingFolder(false)
      return
    }
    // Close input immediately and fire request in background
    setIsCreatingFolder(false)
    setNewFolderName('New Folder')
    setIsCreatingFolderPending(true)
    setPendingFolderName(name)
    ApiService.Files.createFolder(item.path, name)
      .then(() => {
        onFolderCreated?.(item.path ? `${item.path}/${name}` : name)
      })
      .catch(() => {
        alert('Failed to create folder. Please try again.')
      })
      .finally(() => {
        setIsCreatingFolderPending(false)
        setPendingFolderName(null)
      })
  }

  const handleCreateFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolderSubmit()
    } else if (e.key === 'Escape') {
      setIsCreatingFolder(false)
      setNewFolderName('New Folder')
    }
  }

  const handleDownload = async () => {
    if (!item.file_id) return
    await handleLocalFileDownload({
      fileId: item.file_id,
      fileName: item.name,
      showToast: toast
    })
  }
  
  const itemPaddingLeft = `${(level * 12) + 8}px`
  const childItemPaddingLeft = `${((level + 1) * 12) + 8}px`
  const selectedItemClassName = (isSelected || isMultiSelected) ? 'bg-muted text-foreground' : 'text-muted-foreground'

  const buttonContent = (
    isRenaming ? (
      <div
        className={`mb-0.5 flex w-full min-w-0 items-center gap-2 rounded-md py-1.5 pr-2 text-left ${selectedItemClassName}`}
        style={{ paddingLeft: itemPaddingLeft }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-4 w-4" strokeWidth={1} /> : 
            <ChevronRight className="h-4 w-4" strokeWidth={1} />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className={`h-4 w-4 flex-shrink-0 ${fileIconData.color}`} />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded border-none bg-muted px-1 py-0 text-xs font-medium text-foreground outline-none"
          autoFocus
          ref={inputRef}
          onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ) : (
      <button
        onClick={(e) => handleClick(e)}
        draggable={item.type === 'file' && item.file_id ? true : false}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group mb-0.5 flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-left text-muted-foreground transition-colors hover:bg-muted ${selectedItemClassName} ${isDragged ? 'opacity-50' : ''} ${isDropTarget ? 'bg-muted ring-2 ring-ring' : ''}`}
        style={{ paddingLeft: itemPaddingLeft }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-4 w-4" strokeWidth={1} /> : 
            <ChevronRight className="h-4 w-4" strokeWidth={1} />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className={`h-4 w-4 flex-shrink-0 ${fileIconData.color}`} />
        <Typography variant="xs" className="min-w-0 flex-1 truncate font-medium leading-5 text-muted-foreground group-hover:text-foreground">{item.name}</Typography>
        {item.type === 'file' && item.file_id && starredFileIds?.has(item.file_id) && (
          <Star className="h-3 w-3 flex-shrink-0 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
        )}
      </button>
    )
  )

  return (
    <>
      <div className="w-full h-full">
        {(item.type === 'file' && item.file_id) || item.type === 'folder' ? (
          <CloudFileContextMenu 
            provider="local"
            isFolder={item.type === 'folder'}
            isStarred={item.file_id ? starredFileIds?.has(item.file_id) : false}
            onDownload={item.type === 'file' && item.file_id ? handleDownload : undefined}
            onRename={handleRename}
            onDelete={
              item.type === 'file' && item.file_id
                ? (selectionCount > 1 && isMultiSelected ? onDeleteSelectedFiles : handleDelete)
                : (item.type === 'folder' ? handleDeleteFolder : undefined)
            } 
            deleteLabel={
              item.type === 'file' && selectionCount > 1 && isMultiSelected
                ? `Delete ${selectionCount} files`
                : undefined
            }
            onNewFolder={item.type === 'folder' ? handleCreateFolder : undefined}
            onUploadFile={onUploadFile}
            onUploadFolder={onUploadFolder}
            onToggleStar={item.file_id ? () => {
              const isCurrentlyStarred = starredFileIds?.has(item.file_id!)
              if (isCurrentlyStarred) {
                onUnstarFile?.(item.file_id!)
              } else {
                onStarFile?.(item.file_id!)
              }
            } : undefined}
            onShare={item.type === 'file' && item.file_id ? () => onShareFile?.(item) : undefined}
            driveAvailable={driveAvailable}
            oneDriveConnected={oneDriveConnected}
            dropboxConnected={dropboxConnected}
            onCopyToDrive={item.type === 'file' && item.file_id ? () => {
              handleCopyLocalToDrive({
                s3FileId: item.file_id!,
                fileName: item.name,
                showToast: toast
              })
            } : undefined}
            onCopyToOneDrive={item.type === 'file' && item.file_id ? () => {
              handleCopyLocalToOneDrive({
                s3FileId: item.file_id!,
                fileName: item.name,
                showToast: toast
              })
            } : undefined}
            onCopyToDropbox={item.type === 'file' && item.file_id ? () => {
              handleCopyLocalToDropbox({
                s3FileId: item.file_id!,
                fileName: item.name,
                showToast: toast
              })
            } : undefined}
            onSaveAsPDF={item.type === 'file' && item.file_id ? () => {
              handleSaveAsPDF({
                s3FileId: item.file_id!,
                fileName: item.name,
                showToast: toast,
                triggerSidebarRefresh: triggerSidebarRefresh || (() => {})
              })
            } : undefined}
          >
            {buttonContent}
          </CloudFileContextMenu>
        ) : (
          buttonContent
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <>
          {/* Show new folder input if creating */}
          {isCreatingFolder && (
            <div
              className="mb-0.5 flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-muted-foreground"
              style={{ paddingLeft: childItemPaddingLeft }}
            >
              <div className="w-4" />
              <Folder className="h-4 w-4" strokeWidth={1} />
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleCreateFolderKeyDown}
                className="min-w-0 flex-1 rounded border-none bg-muted px-1 py-0 text-xs font-medium text-foreground outline-none"
                autoFocus
                ref={newFolderInputRef}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {/* Pending creation indicator */}
          {isCreatingFolderPending && pendingFolderName && (
            <div
              className="mb-0.5 flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-muted-foreground"
              style={{ paddingLeft: childItemPaddingLeft }}
            >
              <div className="w-4" />
              <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={1} />
              <Typography variant="xs" className="min-w-0 flex-1 truncate font-medium leading-5 text-muted-foreground">{pendingFolderName}</Typography>
              <Typography variant="muted" className="text-xs">Creating...</Typography>
            </div>
          )}
          
          {/* Render existing children */}
          {item.children?.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onFileDeleted={onFileDeleted}
              onFileRenamed={onFileRenamed}
              onFolderCreated={onFolderCreated}
              onFolderRenamed={onFolderRenamed}
              onFolderDeleted={onFolderDeleted}
              onUploadFile={onUploadFile}
              onUploadFolder={onUploadFolder}
              userInfo={userInfo}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              selectedIds={selectedIds}
              onShiftToggleSelection={onShiftToggleSelection}
              selectionCount={selectionCount}
              onDeleteSelectedFiles={onDeleteSelectedFiles}
              starredFileIds={starredFileIds}
              onStarFile={onStarFile}
              onUnstarFile={onUnstarFile}
              onShareFile={onShareFile}
              driveAvailable={driveAvailable}
              oneDriveConnected={oneDriveConnected}
              dropboxConnected={dropboxConnected}
            />
          ))}
        </>
      )}
    </>
  )
}

