import * as ContextMenu from "@radix-ui/react-context-menu"
import { 
  ChevronDown, 
  ChevronRight, 
  File, 
  Folder, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  FolderPlus, 
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
  FilePlus,
  FileCog,
  Network,
} from "lucide-react"
import { useState, useEffect, useRef } from 'react'
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../ui/typography"
import { ApiService } from "../../../../../services/apiService"
import { useToast } from "../../../../ui/use-toast"

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
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFolderCreated?: (folderPath: string) => void
  onFolderRenamed?: (oldPath: string, newPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
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

// Function to get the appropriate icon component and color for a file type
const getFileIcon = (fileName: string): { icon: any, color: string } => {
  if (isTldrawFile(fileName)) return { icon: Network, color: 'text-purple-400' }
  if (isDrawioFile(fileName)) return { icon: Network, color: 'text-blue-400' }
  if (isImageFile(fileName)) return { icon: FileImage, color: 'text-green-400' }
  if (isVideoFile(fileName)) return { icon: FileVideo, color: 'text-red-400' }
  if (isAudioFile(fileName)) return { icon: FileAudio, color: 'text-blue-400' }
  if (isPdfFile(fileName)) return { icon: FileText, color: 'text-red-400' }
  if (isDocumentFile(fileName)) return { icon: FileText, color: 'text-blue-500' }
  if (isSpreadsheetFile(fileName)) return { icon: FileSpreadsheet, color: 'text-green-500' }
  if (isPresentationFile(fileName)) return { icon: FileBarChart, color: 'text-orange-400' }
  if (isCodeFile(fileName)) return { icon: FileCode, color: 'text-yellow-400' }
  if (isArchiveFile(fileName)) return { icon: FileArchive, color: 'text-gray-400' }
  if (isDataFile(fileName)) return { icon: FileJson, color: 'text-indigo-400' }
  if (isExecutableFile(fileName)) return { icon: FileCog, color: 'text-red-500' }
  if (isFontFile(fileName)) return { icon: FileType, color: 'text-pink-400' }
  if (is3DFile(fileName)) return { icon: FileCog, color: 'text-cyan-400' }
  if (isVectorFile(fileName)) return { icon: FileImage, color: 'text-emerald-400' }
  
  // Default file icon
  return { icon: File, color: 'text-gray-400' }
}

// File Context Menu Component
interface FileContextMenuProps {
  children: React.ReactNode
  onRename: () => void
  onDelete?: () => void
  onNewFolder?: () => void
  onUploadFile?: () => void
  onUploadFolder?: () => void
  isFolder?: boolean
  deleteLabel?: string
}

function FileContextMenu({ children, onRename, onDelete, onNewFolder, onUploadFile, onUploadFolder, isFolder, deleteLabel }: FileContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-white dark:bg-zinc-800 rounded-md p-1 shadow-lg border border-zinc-300 dark:border-zinc-700 z-50">
          {onUploadFile && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onUploadFile}
            >
              <FilePlus className="w-4 h-4" />
              Upload File
            </ContextMenu.Item>
          )}
          {onUploadFolder && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onUploadFolder}
            >
              <FolderPlus className="w-4 h-4" />
              Upload Folder
            </ContextMenu.Item>
          )}
          {isFolder && onNewFolder && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onNewFolder}
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </ContextMenu.Item>
          )}
          <ContextMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
            onSelect={onRename}
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </ContextMenu.Item>
          {onDelete && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onDelete}
            >
              <Trash2 className="w-4 h-4" />
              {deleteLabel || 'Delete'}
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

export function FileTreeItem({ 
  item, 
  level, 
  expandedItems, 
  toggleExpanded, 
  onFileSelect, 
  selectedFile, 
  onFileDeleted, 
  onFileRenamed, 
  onFolderCreated, 
  onFolderRenamed, 
  onFolderDeleted,
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
  onDeleteSelectedFiles
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
  
  // Check if this item is being dragged or is a drop target
  const isDragged = dragState.draggedItem?.id === item.id
  const isDropTarget = dragState.dragOverTarget === item.id && item.type === 'folder'
  
  // Get the appropriate icon and color for this file
  const fileIconData = item.type === 'folder' ? { icon: Folder, color: 'text-yellow-400' } : getFileIcon(item.name)
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
    
    try {
      await ApiService.deleteS3File(item.file_id)
      onFileDeleted?.(item.file_id)
    } catch (error) {
      alert('Failed to delete file. Please try again.')
    }
  }

  const handleDeleteFolder = async () => {
    if (item.type !== 'folder') return
    try {
      if (!userInfo?.username) throw new Error('User information not available')
      const result = await ApiService.deleteFolder(item.path, userInfo.username)
      toast({
        title: 'Folder deleted',
        description: result.failed > 0 
          ? `Deleted ${result.deleted} items; ${result.failed} failed`
          : `Deleted ${result.deleted} items`,
        variant: result.failed > 0 ? 'destructive' : 'success',
      })
    } catch (error) {
      toast({
        title: 'Failed to delete folder',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      onFolderDeleted?.(item.path)
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
        await ApiService.renameS3File(item.file_id, newFullName, item.path)
        
        // Calculate the new path with the full filename
        const newPath = item.path.replace(item.name, newFullName)
        onFileRenamed?.(item.path, newPath)
      } else if (item.type === 'folder') {
        // Handle folder renaming (folders don't have extensions)
        if (!userInfo?.username) {
          throw new Error('User information not available')
        }
        
        const result = await ApiService.renameFolder(item.path, newName.trim(), userInfo.username)
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
    ApiService.createFolder(item.path, name)
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
  
  const buttonContent = (
    isRenaming ? (
      <div
        className={`w-full flex items-center gap-2 text-left px-3 py-2 min-w-0 ${
          (isSelected || isMultiSelected) ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
        }`}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className={`h-4 w-4 flex-shrink-0 ${fileIconData.color}`} />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white px-1 py-0 rounded border-none outline-none flex-1"
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
        className={`w-full flex items-center gap-2 text-left px-3 py-2 min-w-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors ${
          (isSelected || isMultiSelected) ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
        } ${isDragged ? 'opacity-50' : ''} ${isDropTarget ? 'bg-zinc-300 dark:bg-zinc-700 ring-2 ring-blue-500' : ''}`}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className={`h-4 w-4 flex-shrink-0 ${fileIconData.color}`} />
        <Typography variant="small" className="truncate min-w-0 flex-1">{item.name}</Typography>
      </button>
    )
  )

  return (
    <>
      <div className="w-full h-full">
        {(item.type === 'file' && item.file_id) || item.type === 'folder' ? (
          <FileContextMenu 
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
            isFolder={item.type === 'folder'}
          >
            {buttonContent}
          </FileContextMenu>
        ) : (
          buttonContent
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <>
          {/* Show new folder input if creating */}
          {isCreatingFolder && (
            <div
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300"
              style={{ paddingLeft: `${((level + 1) * 12) + 12}px` }}
            >
              <div className="w-3" />
              <Folder className="h-4 w-4" />
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleCreateFolderKeyDown}
                className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
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
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300"
              style={{ paddingLeft: `${((level + 1) * 12) + 12}px` }}
            >
              <div className="w-3" />
              <RefreshCw className="h-4 w-4 animate-spin" />
              <Typography variant="small" className="truncate min-w-0 flex-1">{pendingFolderName}</Typography>
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
            />
          ))}
        </>
      )}
    </>
  )
}

