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
  Mail,
  Calendar as CalendarIcon,
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
  Upload,
  Plus,
} from "lucide-react"
import { useRouter } from 'next/router'
import { useState, useEffect, useCallback, useRef } from 'react'
import { toggleFileSelection, collectSelectedFileItems } from "./handlers/handle-multi-select"

import { EmailTab } from "./EmailTab"
import { CalendarTab } from "./CalendarTab"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { ApiService } from "../../services/apiService"
import { buildFileTree, FileSystemItem } from "../../utils/fileTreeUtils"
import InlineFileSearch from "../InlineFileSearch"
import { useToast } from "../ui/use-toast"

interface AppSidebarProps {
  currentView: 'dashboard' | 'workspaces'
  userInfo?: {
    username: string
    email?: string
  } | null
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number // Add a trigger prop to force refresh
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFileMoved?: (fileId: string, oldPath: string, newPath: string) => void
  onFolderCreated?: (folderPath: string) => void
  onFolderRenamed?: (oldPath: string, newPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
  triggerRootFolderCreation?: boolean
  onEmailSelect?: (email: any) => void
  onComposeEmail?: () => void
  onCreateDocument?: (documentName: string) => void
  onCreateSpreadsheet?: (spreadsheetName: string) => void
  onCreateNotebook?: (notebookName: string) => void
  onCreateFolder?: () => void
  onGenerateImage?: () => void
  onEventSelect?: (event: any) => void
  onOpenCalendar?: () => void
}

// Drag and drop state interfaces
interface DragState {
  isDragging: boolean
  draggedItem: FileSystemItem | null
  dragOverTarget: string | null
}

// File tree item component
interface FileTreeItemProps {
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

const isViewableFile = (fileName: string): boolean => {
  return isImageFile(fileName) || isPdfFile(fileName) || isDocumentFile(fileName) || isVideoFile(fileName) || isAudioFile(fileName) || isCodeFile(fileName)
}

// Function to get the appropriate icon component and color for a file type
const getFileIcon = (fileName: string): { icon: any, color: string } => {
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
        <ContextMenu.Content className="min-w-[160px] bg-zinc-800 rounded-md p-1 shadow-lg border border-zinc-700 z-50">
          {onUploadFile && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onUploadFile}
            >
              <FilePlus className="w-4 h-4" />
              Upload File
            </ContextMenu.Item>
          )}
          {onUploadFolder && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onUploadFolder}
            >
              <FolderPlus className="w-4 h-4" />
              Upload Folder
            </ContextMenu.Item>
          )}
          {isFolder && onNewFolder && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-zinc-700 rounded cursor-pointer outline-none"
              onSelect={onNewFolder}
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </ContextMenu.Item>
          )}
          <ContextMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-zinc-700 rounded cursor-pointer outline-none"
            onSelect={onRename}
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </ContextMenu.Item>
          {onDelete && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:bg-zinc-700 rounded cursor-pointer outline-none"
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

function FileTreeItem({ 
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
    if (isRenaming) return; // Don't handle clicks while renaming
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
          (isSelected || isMultiSelected) ? 'bg-zinc-800 text-white' : 'text-zinc-300'
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
          className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
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
        className={`w-full flex items-center gap-2 text-left px-3 py-2 min-w-0 hover:bg-zinc-800 hover:text-white transition-colors ${
          (isSelected || isMultiSelected) ? 'bg-zinc-800 text-white' : 'text-zinc-300'
        } ${isDragged ? 'opacity-50' : ''} ${isDropTarget ? 'bg-zinc-700 ring-2 ring-blue-500' : ''}`}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className={`h-4 w-4 flex-shrink-0 ${fileIconData.color}`} />
        <span className="text-sm truncate min-w-0 flex-1">{item.name}</span>
      </button>
    )
  )

  return (
    <>
      <div className="w-full">
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
              <span className="text-sm truncate min-w-0 flex-1">{pendingFolderName}</span>
              <span className="text-xs text-gray-400">Creating...</span>
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

export function LeftPanel({ currentView, userInfo, onFileSelect, selectedFile, onRefreshComplete, refreshTrigger, onFileDeleted, onFileRenamed, onFileMoved, onFolderCreated, onFolderRenamed, onFolderDeleted, triggerRootFolderCreation, onEmailSelect, onComposeEmail, onCreateDocument, onCreateSpreadsheet, onCreateNotebook, onCreateFolder, onGenerateImage, onEventSelect, onOpenCalendar }: AppSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false)
  const [newRootFolderName, setNewRootFolderName] = useState('New Folder')
  const [isCreatingRootFolderPending, setIsCreatingRootFolderPending] = useState(false)
  const [pendingRootFolderName, setPendingRootFolderName] = useState<string | null>(null)
  const rootFolderInputRef = useRef<HTMLInputElement | null>(null)
  
  // Document creation state
  const [isCreatingDocument, setIsCreatingDocument] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('New Document.docx')
  const [isCreatingDocumentPending, setIsCreatingDocumentPending] = useState(false)
  const [pendingDocumentName, setPendingDocumentName] = useState<string | null>(null)
  const documentInputRef = useRef<HTMLInputElement | null>(null)
  
  // Spreadsheet creation state
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false)
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('New Spreadsheet.csv')
  const [isCreatingSpreadsheetPending, setIsCreatingSpreadsheetPending] = useState(false)
  const [pendingSpreadsheetName, setPendingSpreadsheetName] = useState<string | null>(null)
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null)
  // Notebook creation state
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('New Notebook.ipynb')
  const [isCreatingNotebookPending, setIsCreatingNotebookPending] = useState(false)
  const [pendingNotebookName, setPendingNotebookName] = useState<string | null>(null)
  const notebookInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState<'files' | 'email' | 'calendar'>('files')
  const [uploadingFolder, setUploadingFolder] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
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
  
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverTarget: null
  })
  
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  // Drag and drop handlers
  const handleDragStart = (item: FileSystemItem) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOverTarget: null
    })
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverTarget: null
    })
  }

  const handleDragOver = (item: FileSystemItem) => {
    if (dragState.draggedItem && item.type === 'folder') {
      setDragState(prev => ({
        ...prev,
        dragOverTarget: item.id
      }))
    }
  }

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dragOverTarget: null
    }))
  }

  const handleDrop = async (targetItem: FileSystemItem, draggedItem: FileSystemItem) => {
    if (!draggedItem.file_id || targetItem.type !== 'folder') return
    
    try {
      // Calculate new file path
      const newPath = `${targetItem.path}/${draggedItem.name}`
      
      // Call API to move the file (download, upload to new location, delete old)
      await ApiService.moveS3File(draggedItem.file_id, newPath, draggedItem.name)
      
      // Notify parent component about the move
      onFileMoved?.(draggedItem.file_id, draggedItem.path, newPath)
      
      // Refresh the file tree
      fetchUserFiles()
      
    } catch (error) {
      alert('Failed to move file. Please try again.')
    } finally {
      handleDragEnd()
    }
  }

  const handleFolderCreated = (folderPath: string) => {
    // Refresh the file tree when a folder is created
    fetchUserFiles()
    // Call the parent callback if provided
    onFolderCreated?.(folderPath)
  }

  const handleFolderRenamed = (oldPath: string, newPath: string) => {
    // Refresh the file tree when a folder is renamed
    fetchUserFiles()
    // Call the parent callback if provided
    onFolderRenamed?.(oldPath, newPath)
  }

  const handleFolderDeleted = (folderPath: string) => {
    // Refresh the file tree when a folder is deleted
    fetchUserFiles()
    // Propagate up if parent wants to react (e.g., close tabs)
    onFolderDeleted?.(folderPath)
  }

  const onShiftToggleSelection = (item: FileSystemItem, e?: React.MouseEvent) => {
    const next = toggleFileSelection({ selectedIds, itemId: item.id, isShiftKey: true })
    setSelectedIds(next)
  }

  const clearSelection = () => setSelectedIds(new Set())

  const fetchUserFiles = useCallback(async () => {
    if (!userInfo?.username) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await ApiService.getUserFiles(userInfo.username)
      
      if (result.success) {
        const tree = buildFileTree(result.files)
        setFileSystem(tree)
        // Call the refresh complete callback if provided
        onRefreshComplete?.()
      }
    } catch (err) {
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [userInfo?.username])

  // Fetch files when component mounts or user changes
  useEffect(() => {
    fetchUserFiles()
  }, [fetchUserFiles])

  // Listen for assistant create_file completion to refresh and optionally open the file
  useEffect(() => {
    const handleCreated = (e: Event) => {
      try {
        const detail: any = (e as CustomEvent).detail;
        // Attempt to open the created file based on returned info
        const info = detail?.result?.file_info || detail?.result;
        const createdPath: string | undefined = info?.file_path || info?.path;
        const createdName: string | undefined = info?.file_name || info?.name;
        if (!createdPath || !createdName || !userInfo?.username) {
          fetchUserFiles();
          return;
        }

        let attempts = 0;
        const maxAttempts = 8;
        const delayMs = 500;
        let cancelled = false;

        const pollAndOpen = async () => {
          if (cancelled) return;
          try {
            await fetchUserFiles();
            const result = await ApiService.getUserFiles(userInfo.username);
            if (result.success && Array.isArray(result.files)) {
              const f = result.files.find(f => f.file_path === createdPath);
              if (f && f.file_id) {
                const item = {
                  id: f.file_path,
                  name: f.file_name,
                  path: f.file_path,
                  type: 'file',
                  file_id: f.file_id,
                  size: f.file_size,
                  modified: new Date(f.date_modified),
                  s3_url: f.s3_url,
                } as any;
                onFileSelect?.(item);
                return;
              }
            }
          } catch {}

          attempts += 1;
          if (attempts < maxAttempts) {
            setTimeout(pollAndOpen, delayMs);
          }
        };

        pollAndOpen();
      } catch {}
    }

    window.addEventListener('assistant-file-created', handleCreated as EventListener)
    return () => window.removeEventListener('assistant-file-created', handleCreated as EventListener)
  }, [fetchUserFiles, onFileSelect, userInfo?.username])

  // Fetch files when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchUserFiles()
    }
  }, [refreshTrigger, fetchUserFiles])

  // Handle trigger for root folder creation
  useEffect(() => {
    if (triggerRootFolderCreation) {
      setIsCreatingRootFolder(true)
      setNewRootFolderName('New Folder')
    }
  }, [triggerRootFolderCreation])

  // Focus root folder input when creating
  useEffect(() => {
    if (isCreatingRootFolder && rootFolderInputRef.current) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (rootFolderInputRef.current) {
          rootFolderInputRef.current.focus()
          rootFolderInputRef.current.select()
        }
      }, 10)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingRootFolder])

  const handleCreateRootFolderSubmit = async () => {
    const name = newRootFolderName.trim()
    if (name === '') {
      setIsCreatingRootFolder(false)
      return
    }
    // Close input immediately and fire request in background
    setIsCreatingRootFolder(false)
    setNewRootFolderName('New Folder')
    setIsCreatingRootFolderPending(true)
    setPendingRootFolderName(name)
    ApiService.createFolder('', name)
      .then(() => {
        handleFolderCreated(name)
      })
      .catch(() => {
        alert('Failed to create folder. Please try again.')
      })
      .finally(() => {
        setIsCreatingRootFolderPending(false)
        setPendingRootFolderName(null)
      })
  }

  const handleCreateRootFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateRootFolderSubmit()
    } else if (e.key === 'Escape') {
      setIsCreatingRootFolder(false)
      setNewRootFolderName('New Folder')
    }
  }

  // Document creation handlers
  const handleCreateDocument = () => {
    setIsCreatingDocument(true)
    setNewDocumentName('New Document.docx')
  }

  // Focus document input when creating
  useEffect(() => {
    if (isCreatingDocument && documentInputRef.current) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (documentInputRef.current) {
          documentInputRef.current.focus()
          selectFilenameWithoutExtension(documentInputRef.current)
        }
      }, 10)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingDocument])

  const handleCreateDocumentSubmit = async () => {
    const name = newDocumentName.trim()
    if (name === '') {
      setIsCreatingDocument(false)
      return
    }
    // Extract filename without extension for the handler
    const filenameWithoutExtension = name.replace(/\.docx$/, '')
    
    // Close input immediately and fire request in background
    setIsCreatingDocument(false)
    setNewDocumentName('New Document.docx')
    setIsCreatingDocumentPending(true)
    setPendingDocumentName(name)
    
    // Call the parent handler to create the document
    if (onCreateDocument) {
      try {
        await onCreateDocument(filenameWithoutExtension)
      } catch (error) {
        console.error('Failed to create document:', error)
      } finally {
        setIsCreatingDocumentPending(false)
        setPendingDocumentName(null)
      }
    }
  }

  const handleCreateDocumentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateDocumentSubmit()
    } else if (e.key === 'Escape') {
      setIsCreatingDocument(false)
      setNewDocumentName('New Document.docx')
    }
  }

  // Spreadsheet creation handlers
  const handleCreateSpreadsheet = () => {
    setIsCreatingSpreadsheet(true)
    setNewSpreadsheetName('New Spreadsheet.xlsx')
  }

  // Focus spreadsheet input when creating
  useEffect(() => {
    if (isCreatingSpreadsheet && spreadsheetInputRef.current) {
      // Use a small timeout to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        if (spreadsheetInputRef.current) {
          spreadsheetInputRef.current.focus()
          selectFilenameWithoutExtension(spreadsheetInputRef.current)
        }
      }, 10)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingSpreadsheet])

  const handleCreateSpreadsheetSubmit = async () => {
    const name = newSpreadsheetName.trim()
    if (name === '') {
      setIsCreatingSpreadsheet(false)
      return
    }
    // Extract filename without extension for the handler
    const filenameWithoutExtension = name.replace(/\.xlsx$/, '')
    
    // Close input immediately and fire request in background
    setIsCreatingSpreadsheet(false)
    setNewSpreadsheetName('New Spreadsheet.xlsx')
    setIsCreatingSpreadsheetPending(true)
    setPendingSpreadsheetName(name)
    
    // Call the parent handler to create the spreadsheet
    if (onCreateSpreadsheet) {
      try {
        await onCreateSpreadsheet(filenameWithoutExtension)
      } catch (error) {
        console.error('Failed to create spreadsheet:', error)
      } finally {
        setIsCreatingSpreadsheetPending(false)
        setPendingSpreadsheetName(null)
      }
    }
  }

  const handleCreateSpreadsheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSpreadsheetSubmit()
    } else if (e.key === 'Escape') {
      setIsCreatingSpreadsheet(false)
      setNewSpreadsheetName('New Spreadsheet.xlsx')
    }
  }

  // Notebook creation handlers
  const handleCreateNotebook = () => {
    setIsCreatingNotebook(true)
    setNewNotebookName('New Notebook.ipynb')
  }

  useEffect(() => {
    if (isCreatingNotebook && notebookInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (notebookInputRef.current) {
          notebookInputRef.current.focus()
          selectFilenameWithoutExtension(notebookInputRef.current)
        }
      }, 10)
      return () => clearTimeout(timeoutId)
    }
  }, [isCreatingNotebook])

  const handleCreateNotebookSubmit = async () => {
    const name = newNotebookName.trim()
    if (name === '') {
      setIsCreatingNotebook(false)
      return
    }
    const filenameWithoutExtension = name.replace(/\.ipynb$/, '')
    setIsCreatingNotebook(false)
    setNewNotebookName('New Notebook.ipynb')
    setIsCreatingNotebookPending(true)
    setPendingNotebookName(name)
    if (onCreateSpreadsheet && false) {}
    if ((onCreateNotebook as any)) {}
    if ((onCreateNotebook as any)) {
      try {
        await (onCreateNotebook as any)(filenameWithoutExtension)
      } catch (error) {
        console.error('Failed to create notebook:', error)
      } finally {
        setIsCreatingNotebookPending(false)
        setPendingNotebookName(null)
      }
    } else {
      setIsCreatingNotebookPending(false)
      setPendingNotebookName(null)
    }
  }

  const handleCreateNotebookKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateNotebookSubmit()
    else if (e.key === 'Escape') {
      setIsCreatingNotebook(false)
      setNewNotebookName('New Notebook.ipynb')
    }
  }

  // Handle file upload
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle folder upload
  const handleFolderUpload = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click()
    }
  }

  // Handle file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !userInfo?.username) return

    setUploadingFolder(true)
    try {
      const fileArray = Array.from(files)
      await ApiService.uploadToS3(fileArray[0], fileArray[0].name, 'web-editor', fileArray[0].name, '')
      fetchUserFiles()
    } catch (error) {
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploadingFolder(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle folder input change
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !userInfo?.username) return

    setUploadingFolder(true)
    try {
      const fileArray = Array.from(files)
      
      // Extract folder name from the first file's path
      const firstFile = fileArray[0]
      const folderName = firstFile.webkitRelativePath.split('/')[0]
      
      await ApiService.uploadFolder(fileArray, folderName, 'web-editor', '')
      fetchUserFiles()
    } catch (error) {
      alert('Failed to upload folder. Please try again.')
    } finally {
      setUploadingFolder(false)
      if (folderInputRef.current) {
        folderInputRef.current.value = ''
      }
    }
  }
  
  const router = useRouter()
  const selectionCount = selectedIds.size

  const onDeleteSelectedFiles = async () => {
    const selectedItems = collectSelectedFileItems(fileSystem, selectedIds)
    if (!selectedItems.length) return
    try {
      await Promise.all(
        selectedItems.map(async it => it.file_id ? ApiService.deleteS3File(it.file_id) : Promise.resolve())
      )
      fetchUserFiles()
      selectedItems.forEach(it => it.file_id && onFileDeleted?.(it.file_id))
    } catch (error) {
      alert('Failed to delete some files. Please try again.')
    } finally {
      clearSelection()
    }
  }

  return (
    <div className="h-full w-full bg-black border-r border-zinc-300 dark:border-zinc-600 flex flex-col relative z-10 border-0">
      {/* Search Bar - Above tabs */}
      {onFileSelect && (
        <div className="px-4 py-2 bg-black border-zinc-700">
          <InlineFileSearch onFileSelect={onFileSelect} onEmailSelect={onEmailSelect} />
        </div>
      )}
      
      {/* Header with Tabs */}
      <div>
                 {/* Tab Navigation */}
         <div className="flex px-2 pt-2">
                       <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'files'
                  ? 'text-white bg-zinc-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800/50'
              }`}
            >
             <div className="flex items-center justify-center gap-2">
               <Folder className="h-4 w-4" />
               Files
             </div>
           </button>
                       <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'email'
                  ? 'text-white bg-zinc-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800/50'
              }`}
            >
             <div className="flex items-center justify-center gap-2">
               <Mail className="h-4 w-4" />
               Email
             </div>
           </button>
                       <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'text-white bg-zinc-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800/50'
              }`}
            >
             <div className="flex items-center justify-center gap-2">
               <CalendarIcon className="h-4 w-4" />
               Calendar
             </div>
           </button>
         </div>
        
                 {/* Tab Content Header */}
         {activeTab === 'files' && (
           <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b">
             <h2 className="text-gray-200 text-sm font-medium">Files</h2>
             <div className="flex items-center gap-2">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button
                     variant="ghost"
                     size="sm"
                     className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-zinc-800"
                     title="Add New"
                   >
                     <Plus className="h-3 w-3" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent
                   align="start"
                   side="bottom"
                   sideOffset={8}
                   avoidCollisions={true}
                   sticky="always"
                   className="bg-zinc-800 border-zinc-600 text-white shadow-xl min-w-[160px]"
                   style={{ zIndex: 999999 }}
                 >
                   <DropdownMenuItem 
                     onSelect={handleFileUpload}
                     className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                   >
                     <FilePlus size={20} className="mr-2" />
                     Upload File
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                     onSelect={handleFolderUpload}
                     className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                   >
                     <FolderPlus size={20} className="mr-2" />
                     Upload Folder
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                     onSelect={handleCreateDocument}
                     className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                   >
                     <FileText size={20} className="mr-2" />
                     Document
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                     onSelect={handleCreateSpreadsheet}
                     className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                   >
                     <FileSpreadsheet size={20} className="mr-2" />
                     Spreadsheet
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                     onSelect={onCreateFolder}
                     className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                   >
                     <Folder size={20} className="mr-2" />
                     Folder
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
               <Button
                 variant="ghost"
                 size="sm"
                 className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-zinc-800"
                 onClick={fetchUserFiles}
                 disabled={loading}
                 title="Refresh"
               >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
               </Button>
             </div>
           </div>
         )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar">
        {activeTab === 'files' && (
          <div 
            onContextMenu={(e) => {
              e.preventDefault()
              // You could add a root-level context menu here for creating folders at the root
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              
              // Check if this is an internal drag (file move) or external drag (file upload)
              const isInternalDrag = e.dataTransfer.types.includes('application/x-internal-file-move') && 
                                   dragState.isDragging
              
              // Only show upload overlay for external drags
              if (!isInternalDrag) {
                setIsDragOver(true)
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDragOver(false)
              }
            }}
            onDrop={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              
              // Check if this is an internal drag (file move) or external drag (file upload)
              const isInternalDrag = e.dataTransfer.types.includes('application/x-internal-file-move') && 
                                   dragState.isDragging
              
              // If it's an internal drag, don't handle it here (let the FileTreeItem handle it)
              if (isInternalDrag) {
                setIsDragOver(false)
                return
              }
              
              if (!userInfo?.username) return
              
              const items = Array.from(e.dataTransfer.items)
              const files: File[] = []
              const folders: File[] = []
              
              for (const item of items) {
                if (item.kind === 'file') {
                  const entry = item.webkitGetAsEntry?.()
                  if (entry) {
                    if (entry.isFile) {
                      const file = item.getAsFile()
                      if (file) files.push(file)
                                         } else if (entry.isDirectory) {
                       // Handle directory
                       const dirReader = (entry as any).createReader()
                       const readEntries = (): Promise<File[]> => {
                         return new Promise((resolve) => {
                           dirReader.readEntries(async (entries: any[]) => {
                             const folderFiles: File[] = []
                             for (const entry of entries) {
                               if (entry.isFile) {
                                 const file = await new Promise<File>((resolve) => {
                                   (entry as any).file(resolve)
                                 })
                                 folderFiles.push(file)
                               }
                             }
                             resolve(folderFiles)
                           })
                         })
                       }
                       
                       const folderFiles = await readEntries()
                       folders.push(...folderFiles)
                     }
                  }
                }
              }
              
              setIsDragOver(false)
              
              if (files.length > 0 || folders.length > 0) {
                setUploadingFolder(true)
                try {
                  // Upload individual files
                  for (const file of files) {
                    await ApiService.uploadToS3(file, file.name, 'web-editor', file.name, '')
                  }
                  
                  // Upload folder contents
                  if (folders.length > 0) {
                    const folderName = `uploaded_folder_${Date.now()}`
                    await ApiService.uploadFolder(folders, folderName, 'web-editor', '')
                  }
                  
                  fetchUserFiles()
                } catch (error) {
                  alert('Failed to upload items. Please try again.')
                } finally {
                  setUploadingFolder(false)
                }
              }
            }}
          >
            {/* Drag over indicator */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 z-50 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Drop files or folders here to upload</span>
                </div>
              </div>
            )}
            
            {loading && !fileSystem.length && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading files...
              </div>
            )}
            
            {error && (
              <div className="px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}
            
            {uploadingFolder && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Uploading folder...
              </div>
            )}
            
            {!loading && !error && fileSystem.length === 0 && !uploadingFolder && (
              <div className="px-3 py-2 text-sm text-gray-400">
                No files found
              </div>
            )}

            {/* Root level folder creation */}
            {isCreatingRootFolder && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <Folder className="h-4 w-4" />
                <input
                  type="text"
                  value={newRootFolderName}
                  onChange={(e) => setNewRootFolderName(e.target.value)}
                  onKeyDown={handleCreateRootFolderKeyDown}
                  onBlur={handleCreateRootFolderSubmit}
                  className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
                  ref={rootFolderInputRef}
                  onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {isCreatingRootFolderPending && pendingRootFolderName && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm truncate min-w-0 flex-1">{pendingRootFolderName}</span>
                <span className="text-xs text-gray-400">Creating...</span>
              </div>
            )}

            {/* Root level document creation */}
            {isCreatingDocument && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <FileText className="h-4 w-4" />
                <input
                  type="text"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  onKeyDown={handleCreateDocumentKeyDown}
                  onBlur={handleCreateDocumentSubmit}
                  className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
                  ref={documentInputRef}
                  onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {isCreatingDocumentPending && pendingDocumentName && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm truncate min-w-0 flex-1">{pendingDocumentName}</span>
                <span className="text-xs text-gray-400">Creating...</span>
              </div>
            )}

            {/* Root level spreadsheet creation */}
            {isCreatingSpreadsheet && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <FileSpreadsheet className="h-4 w-4" />
                <input
                  type="text"
                  value={newSpreadsheetName}
                  onChange={(e) => setNewSpreadsheetName(e.target.value)}
                  onKeyDown={handleCreateSpreadsheetKeyDown}
                  onBlur={handleCreateSpreadsheetSubmit}
                  className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
                  ref={spreadsheetInputRef}
                  onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {isCreatingSpreadsheetPending && pendingSpreadsheetName && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm truncate min-w-0 flex-1">{pendingSpreadsheetName}</span>
                <span className="text-xs text-gray-400">Creating...</span>
              </div>
            )}

            {/* Root level notebook creation */}
            {isCreatingNotebook && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <FileCode className="h-4 w-4" />
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  onKeyDown={handleCreateNotebookKeyDown}
                  onBlur={handleCreateNotebookSubmit}
                  className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
                  ref={notebookInputRef}
                  onFocus={(e) => selectFilenameWithoutExtension(e.currentTarget)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {isCreatingNotebookPending && pendingNotebookName && (
              <div className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-300" style={{ paddingLeft: '12px' }}>
                <div className="w-3" />
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm truncate min-w-0 flex-1">{pendingNotebookName}</span>
                <span className="text-xs text-gray-400">Creating...</span>
              </div>
            )}
            
            {fileSystem.map((item) => (
              <FileTreeItem
                key={item.id}
                item={item}
                level={0}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onFileDeleted={onFileDeleted}
                onFileRenamed={onFileRenamed}
                onFolderCreated={handleFolderCreated}
                onFolderRenamed={handleFolderRenamed}
                onFolderDeleted={handleFolderDeleted}
                onUploadFile={handleFileUpload}
                onUploadFolder={handleFolderUpload}
                userInfo={userInfo}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                selectedIds={selectedIds}
                onShiftToggleSelection={onShiftToggleSelection}
                selectionCount={selectionCount}
                onDeleteSelectedFiles={onDeleteSelectedFiles}
              />
            ))}
          </div>
        )}
        
                 {activeTab === 'email' && (
           <EmailTab 
             onOpenEmailApp={() => router.push('/email')} 
             onMessageSelect={onEmailSelect}
             onComposeEmail={onComposeEmail}
           />
         )}
                 {activeTab === 'calendar' && (
           <CalendarTab 
             onOpenCalendarApp={onOpenCalendar}
             onEventSelect={onEventSelect}
           />
         )}
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple={true}
        onChange={handleFolderInputChange}
        style={{ display: 'none' }}
        {...({ webkitdirectory: '' } as any)}
      />
      <style jsx global>{`
        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #52525b transparent; /* thumb track */
        }
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46; /* zinc-700 */
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #52525b; /* zinc-600 */
        }
      `}</style>
    </div>
  )
}
