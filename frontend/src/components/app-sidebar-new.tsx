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
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  FileX,
  FileType,
  FileCheck,
  FileSearch,
  FileBarChart,
  FilePieChart,
  FileDigit,
  FileHeart,
  FileLock,
  FileMinus,
  FilePlus,
  FileQuestion,
  FileSignature,
  FileStack,
  FileSymlink,
  FileTerminal,
  FileWarning,
  FileCog,
  FileKey,
  FilePen,
  FileClock,
  FileDown,
  FileUp,
  FileVolume,
  FileVolume2,
  FileMusic,
  FilePlay,
  FileList,
  FileGrid,
  FileColumns,
  FileRows,
  FileTable,
  FileBarChart2,
  FileBarChart3,
  FileBarChart4,
  FilePieChart2,
  FilePieChart3,
  FilePieChart4,
  FileScatter,
  FileTrendingUp,
  FileTrendingDown,
  FileActivity,
  FileTimer,
  FileCalendar,
  FileClock2,
  FileMap,
  FileMapPin,
  FileNavigation,
  FileNavigation2,
  FileCompass,
  FileGlobe,
  FileGlobe2,
  FileWorld,
  FileEarth,
  FileSun,
  FileMoon,
  FileCloud,
  FileCloudRain,
  FileCloudSnow,
  FileCloudLightning,
  FileCloudFog,
  FileCloudOff,
  FileCloudDrizzle,
  FileCloudHail,
  FileCloudSleet,
  FileCloudWind,
  FileCloudy,
  FileCloudSun,
  FileCloudMoon,
  FileCloudSunRain,
  FileCloudMoonRain,
  FileCloudSnowRain,
  FileCloudLightningRain,
  FileCloudFogRain,
  FileCloudOffRain,
  FileCloudDrizzleRain,
  FileCloudHailRain,
  FileCloudSleetRain,
  FileCloudWindRain,
  FileCloudyRain,
  FileCloudSunRain2,
  FileCloudMoonRain2,
  FileCloudSnowRain2,
  FileCloudLightningRain2,
  FileCloudFogRain2,
  FileCloudOffRain2,
  FileCloudDrizzleRain2,
  FileCloudHailRain2,
  FileCloudSleetRain2,
  FileCloudWindRain2,
  FileCloudyRain2
} from "lucide-react"
import { useRouter } from 'next/router'
import { useState, useEffect, useCallback, useRef } from 'react'

import { EmailTab } from "./EmailTab"
import { Button } from "./ui/button"
import { ApiService } from "../services/apiService"
import { buildFileTree, FileSystemItem, S3FileInfo } from "../utils/fileTreeUtils"

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
  triggerRootFolderCreation?: boolean
  onEmailSelect?: (email: any) => void
  onComposeEmail?: () => void
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

// Function to get the appropriate icon component for a file type
const getFileIcon = (fileName: string) => {
  if (isImageFile(fileName)) return FileImage
  if (isVideoFile(fileName)) return FileVideo
  if (isAudioFile(fileName)) return FileAudio
  if (isPdfFile(fileName)) return FileText
  if (isDocumentFile(fileName)) return FileText
  if (isSpreadsheetFile(fileName)) return FileSpreadsheet
  if (isPresentationFile(fileName)) return FileBarChart
  if (isCodeFile(fileName)) return FileCode
  if (isArchiveFile(fileName)) return FileArchive
  if (isDataFile(fileName)) return FileJson
  if (isExecutableFile(fileName)) return FileCog
  if (isFontFile(fileName)) return FileType
  if (is3DFile(fileName)) return FileCube
  if (isVectorFile(fileName)) return FileImage
  
  // Default file icon
  return File
}

// File Context Menu Component
interface FileContextMenuProps {
  children: React.ReactNode
  onRename: () => void
  onDelete?: () => void
  onNewFolder?: () => void
  isFolder?: boolean
}

function FileContextMenu({ children, onRename, onDelete, onNewFolder, isFolder }: FileContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-zinc-800 rounded-md p-1 shadow-lg border border-zinc-700 z-50">
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
              Delete
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
  userInfo, 
  dragState, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onDragLeave, 
  onDrop 
}: FileTreeItemProps) {
  const isExpanded = expandedItems.has(item.id)
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedFile?.id === item.id
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(item.name)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('New Folder')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const newFolderInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isRenaming])

  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      requestAnimationFrame(() => {
        newFolderInputRef.current?.focus()
        newFolderInputRef.current?.select()
      })
    }
  }, [isCreatingFolder])
  
  // Check if this item is being dragged or is a drop target
  const isDragged = dragState.draggedItem?.id === item.id
  const isDropTarget = dragState.dragOverTarget === item.id && item.type === 'folder'
  
  // Get the appropriate icon for this file
  const FileIconComponent = item.type === 'folder' ? Folder : getFileIcon(item.name)
  
  // Drag event handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (item.type === 'file' && item.file_id) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', item.id)
      onDragStart(item)
    } else {
      e.preventDefault()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (item.type === 'folder' && dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      e.preventDefault()
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
    if (item.type === 'folder' && dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      onDrop(item, dragState.draggedItem)
    }
  }
  
  const handleClick = () => {
    if (isRenaming) return; // Don't handle clicks while renaming
    if (hasChildren) {
      toggleExpanded(item.id)
    } else if (item.type === 'file' && onFileSelect) {
      onFileSelect(item)
    }
  }

  const handleRename = () => {
    setIsRenaming(true)
    setNewName(item.name)
  }

  const handleDelete = async () => {
    if (!item.file_id) return
    
    const confirmed = window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)
    if (!confirmed) return
    
    try {
      await ApiService.deleteS3File(item.file_id)
      onFileDeleted?.(item.file_id)
    } catch (error) {
      alert('Failed to delete file. Please try again.')
    }
  }

  const handleRenameSubmit = async () => {
    if (newName.trim() === '' || newName === item.name) {
      setIsRenaming(false)
      return
    }
    
    try {
      if (item.type === 'file' && item.file_id) {
        // Handle file renaming
        await ApiService.renameS3File(item.file_id, newName.trim(), item.path)
        onFileRenamed?.(item.path, newName.trim())
      } else if (item.type === 'folder') {
        // Handle folder renaming
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
    if (newFolderName.trim() === '') {
      setIsCreatingFolder(false)
      return
    }
    
    try {
      await ApiService.createFolder(item.path, newFolderName.trim())
      onFolderCreated?.(item.path ? `${item.path}/${newFolderName.trim()}` : newFolderName.trim())
      setIsCreatingFolder(false)
      setNewFolderName('New Folder')
    } catch (error) {
      alert('Failed to create folder. Please try again.')
      setIsCreatingFolder(false)
    }
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
        className={`w-full flex items-center gap-2 text-left px-3 py-2 ${
          isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300'
        }`}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className="h-4 w-4" />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
          autoFocus
          ref={inputRef}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ) : (
      <button
        onClick={handleClick}
        draggable={item.type === 'file' && item.file_id ? true : false}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-zinc-800 hover:text-white transition-colors ${
          isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300'
        } ${isDragged ? 'opacity-50' : ''} ${isDropTarget ? 'bg-zinc-700 ring-2 ring-blue-500' : ''}`}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="h-3 w-3" /> : 
            <ChevronRight className="h-3 w-3" />
        )}
        {!hasChildren && <div className="w-3" />}
        <FileIconComponent className="h-4 w-4" />
        <span className="text-sm truncate">{item.name}</span>
      </button>
    )
  )

  return (
    <>
      <div className="w-full">
        {(item.type === 'file' && item.file_id) || item.type === 'folder' ? (
          <FileContextMenu 
            onRename={handleRename} 
            onDelete={item.type === 'file' && item.file_id ? handleDelete : undefined} 
            onNewFolder={item.type === 'folder' ? handleCreateFolder : undefined}
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
                onBlur={handleCreateFolderSubmit}
                onKeyDown={handleCreateFolderKeyDown}
                className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
                autoFocus
                ref={newFolderInputRef}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.stopPropagation()}
              />
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
              userInfo={userInfo}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </>
      )}
    </>
  )
}

export function AppSidebar({ currentView, userInfo, onFileSelect, selectedFile, onRefreshComplete, refreshTrigger, onFileDeleted, onFileRenamed, onFileMoved, onFolderCreated, onFolderRenamed, triggerRootFolderCreation, onEmailSelect, onComposeEmail }: AppSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false)
  const [newRootFolderName, setNewRootFolderName] = useState('New Folder')
  const rootFolderInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState<'files' | 'email'>('files')
  
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
      requestAnimationFrame(() => {
        rootFolderInputRef.current?.focus()
        rootFolderInputRef.current?.select()
      })
    }
  }, [isCreatingRootFolder])

  const handleCreateRootFolderSubmit = async () => {
    if (newRootFolderName.trim() === '') {
      setIsCreatingRootFolder(false)
      return
    }
    
    try {
      await ApiService.createFolder('', newRootFolderName.trim())
      handleFolderCreated(newRootFolderName.trim())
      setIsCreatingRootFolder(false)
      setNewRootFolderName('New Folder')
    } catch (error) {
      alert('Failed to create folder. Please try again.')
      setIsCreatingRootFolder(false)
    }
  }

  const handleCreateRootFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateRootFolderSubmit()
    } else if (e.key === 'Escape') {
      setIsCreatingRootFolder(false)
      setNewRootFolderName('New Folder')
    }
  }
  
  const router = useRouter()

  return (
    <div className="h-full w-full bg-black border-r border-zinc-300 dark:border-zinc-600 flex flex-col relative z-10">
      {/* Header with Tabs */}
      <div>
                 {/* Tab Navigation */}
         <div className="flex px-2 pt-2">
                       <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === 'files'
                  ? 'text-white bg-zinc-900 shadow-sm'
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
                  ? 'text-white bg-zinc-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800/50'
              }`}
            >
             <div className="flex items-center justify-center gap-2">
               <Mail className="h-4 w-4" />
               Email
             </div>
           </button>
         </div>
        
                 {/* Tab Content Header */}
         {activeTab === 'files' && (
           <div className="flex items-center justify-between px-4 py-3 bg-zinc-900">
             <h2 className="text-gray-200 text-sm font-medium">Files</h2>
             <Button
               variant="ghost"
               size="sm"
               className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-zinc-800"
               onClick={fetchUserFiles}
               disabled={loading}
             >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'files' && (
          <div onContextMenu={(e) => {
            e.preventDefault()
            // You could add a root-level context menu here for creating folders at the root
          }}>
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
            
            {!loading && !error && fileSystem.length === 0 && (
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
                  onBlur={handleCreateRootFolderSubmit}
                  onKeyDown={handleCreateRootFolderKeyDown}
                  className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
                  autoFocus
                  ref={rootFolderInputRef}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.stopPropagation()}
                />
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
                userInfo={userInfo}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
      </div>
    </div>
  )
}
