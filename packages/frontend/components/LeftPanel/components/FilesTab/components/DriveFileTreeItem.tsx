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
  FileSpreadsheet,
  FileBarChart,
  Star,
  ListChecks,
} from "lucide-react"
import { useState, useEffect, useRef } from 'react'
import { DriveFile } from "../../../../../../backend/api/drive/drive"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../ui/typography"
import { useToast } from "../../../../ui/use-toast"
import { handleCopyDriveToLocal } from "../handlers/handleCopyDriveToLocal"
import { CloudFileContextMenu } from "./CloudFileContextMenu"
import { 
  handleDriveRename, 
  handleDriveDelete, 
  handleDriveStar, 
  handleDriveUnstar, 
  handleDriveDownload 
} from "../handlers/handleDriveFileActions"
import { getColoredFileIcons } from "../../../../modals/settings-tabs/handlers/appearanceHandlers"

interface DriveFileTreeItemProps {
  file: DriveFile
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  folderContents: Map<string, DriveFile[]>
  loadingFolders: Set<string>
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (fileId: string, newName: string) => void
  onStarChanged?: (fileId: string, starred: boolean) => void
}

// Convert DriveFile to FileSystemItem for middle panel compatibility
function convertDriveFileToFileSystemItem(driveFile: DriveFile): FileSystemItem {
  return {
    id: driveFile.id,
    name: driveFile.name,
    type: driveFile.mimeType?.includes('folder') ? 'folder' : 'file',
    path: `drive://${driveFile.id}`, // Use drive:// protocol to identify as Drive file
    size: driveFile.size ? parseInt(driveFile.size) : undefined,
    modified: driveFile.modifiedTime ? new Date(driveFile.modifiedTime) : undefined,
    s3_url: driveFile.webViewLink, // Store webViewLink for reference
    file_id: driveFile.id, // Use Drive file ID
    mimeType: driveFile.mimeType // Store mimeType for file type detection
  }
}

export function DriveFileTreeItem({
  file,
  level,
  expandedItems,
  toggleExpanded,
  folderContents,
  loadingFolders,
  onFileSelect,
  selectedFile,
  onFileDeleted,
  onFileRenamed,
  onStarChanged
}: DriveFileTreeItemProps) {
  const { toast } = useToast()
  const isFolder = file.mimeType?.includes('folder')
  const isExpanded = expandedItems.has(file.id)
  const isLoading = loadingFolders.has(file.id)
  const children = folderContents.get(file.id) || []
  const isSelected = selectedFile?.file_id === file.id
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(file.name)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Select filename without extension
          const value = inputRef.current.value
          const lastDotIndex = value.lastIndexOf('.')
          if (lastDotIndex > 0 && !isFolder) {
            inputRef.current.setSelectionRange(0, lastDotIndex)
          } else {
            inputRef.current.select()
          }
        }
      })
    }
  }, [isRenaming, isFolder])

  useEffect(() => {
    const handleStorageChange = () => {
      forceUpdate({})
    }
    
    window.addEventListener('colored-file-icons-updated', handleStorageChange)
    return () => window.removeEventListener('colored-file-icons-updated', handleStorageChange)
  }, [])

  const handleCopyToLocal = async () => {
    await handleCopyDriveToLocal({
      driveFileId: file.id,
      fileName: file.name,
      showToast: toast
    })
  }

  const handleDownload = async () => {
    await handleDriveDownload({
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      showToast: toast
    })
  }

  const handleRename = () => {
    setIsRenaming(true)
    setNewName(file.name)
  }

  const handleRenameSubmit = async () => {
    if (newName.trim() === '' || newName === file.name) {
      setIsRenaming(false)
      return
    }
    
    const success = await handleDriveRename({
      fileId: file.id,
      fileName: file.name,
      newName: newName.trim(),
      showToast: toast,
      onSuccess: () => onFileRenamed?.(file.id, newName.trim())
    })
    
    if (!success) setNewName(file.name)
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewName(file.name)
    }
  }

  const handleDelete = async () => {
    await handleDriveDelete({
      fileId: file.id,
      fileName: file.name,
      showToast: toast,
      onSuccess: () => onFileDeleted?.(file.id)
    })
  }

  const handleToggleStar = async () => {
    if (file.starred) {
      await handleDriveUnstar({
        fileId: file.id,
        fileName: file.name,
        showToast: toast,
        onSuccess: () => onStarChanged?.(file.id, false)
      })
    } else {
      await handleDriveStar({
        fileId: file.id,
        fileName: file.name,
        showToast: toast,
        onSuccess: () => onStarChanged?.(file.id, true)
      })
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isRenaming) return
    e.stopPropagation()
    if (isFolder) {
      toggleExpanded(file.id)
    } else {
      if (onFileSelect) {
        const fileSystemItem = convertDriveFileToFileSystemItem(file)
        onFileSelect(fileSystemItem)
      }
    }
  }

  // Get file icon component with matching colors from local files
  const getFileIcon = () => {
    const coloredIcons = getColoredFileIcons()
    const uniformColor = 'text-muted-foreground'
    
    if (isFolder) return <Folder className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-yellow-400' : uniformColor}`} />
    // Check for plan files by filename
    const lowerName = file.name.toLowerCase()
    if (lowerName.endsWith('.plan.md') || lowerName.endsWith('.plan.json')) {
      return <ListChecks className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-purple-500' : uniformColor}`} />
    }
    if (file.mimeType?.includes('document')) return <FileText className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-blue-500' : uniformColor}`} />
    if (file.mimeType?.includes('spreadsheet')) return <FileSpreadsheet className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-green-500' : uniformColor}`} />
    if (file.mimeType?.includes('presentation')) return <FileBarChart className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-orange-400' : uniformColor}`} />
    if (file.mimeType?.includes('image')) return <FileImage className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-green-400' : uniformColor}`} />
    if (file.mimeType?.includes('video')) return <FileVideo className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-red-400' : uniformColor}`} />
    if (file.mimeType?.includes('audio')) return <FileAudio className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-blue-400' : uniformColor}`} />
    if (file.mimeType?.includes('pdf')) return <FileText className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-red-400' : uniformColor}`} />
    return <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
  }

  const buttonContent = isRenaming ? (
    <div
      className={`w-full flex items-center gap-2 text-left px-3 py-2 min-w-0 ${
        isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground'
      }`}
      style={{ paddingLeft: `${(level * 12) + 12}px` }}
    >
      {isFolder && (
        isExpanded ? 
          <ChevronDown className="h-4 w-4" strokeWidth={1} /> : 
          <ChevronRight className="h-4 w-4" strokeWidth={1} />
      )}
      {!isFolder && <div className="w-3" />}
      {getFileIcon()}
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onBlur={handleRenameSubmit}
        onKeyDown={handleRenameKeyDown}
        className="text-sm bg-muted text-foreground px-1 py-0 rounded border-none outline-none flex-1"
        autoFocus
        ref={inputRef}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  ) : (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-muted cursor-pointer transition-colors ${
        isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground'
      }`}
      style={{ paddingLeft: `${(level * 12) + 12}px` }}
    >
      {isFolder && (
        isLoading ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : isExpanded ? (
          <ChevronDown className="h-4 w-4" strokeWidth={1} />
        ) : (
          <ChevronRight className="h-4 w-4" strokeWidth={1} />
        )
      )}
      {!isFolder && <div className="w-3" />}
      {getFileIcon()}
      <Typography variant="xs" className="truncate min-w-0 flex-1">
        {file.name}
      </Typography>
      {file.starred && (
        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
      )}
    </button>
  )

  return (
    <>
      <CloudFileContextMenu
        provider="drive"
        isFolder={isFolder || false}
        isStarred={file.starred}
        onDownload={!isFolder ? handleDownload : undefined}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggleStar={handleToggleStar}
        onCopyToLocal={!isFolder ? handleCopyToLocal : undefined}
      >
        {buttonContent}
      </CloudFileContextMenu>

      {/* Render children if folder is expanded */}
      {isFolder && isExpanded && !isLoading && children.length > 0 && (
        <>
          {children
            .sort((a, b) => {
              // Sort folders first, then files
              const aIsFolder = a.mimeType?.includes('folder')
              const bIsFolder = b.mimeType?.includes('folder')
              if (aIsFolder && !bIsFolder) return -1
              if (!aIsFolder && bIsFolder) return 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <DriveFileTreeItem
                key={child.id}
                file={child}
                level={level + 1}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                folderContents={folderContents}
                loadingFolders={loadingFolders}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onFileDeleted={onFileDeleted}
                onFileRenamed={onFileRenamed}
                onStarChanged={onStarChanged}
              />
            ))}
        </>
      )}

      {/* Show loading state for empty expanded folders */}
      {isFolder && isExpanded && isLoading && (
        <div
          className="w-full flex items-center gap-2 text-left px-3 py-2 text-muted-foreground"
          style={{ paddingLeft: `${((level + 1) * 12) + 12}px` }}
        >
          <div className="w-3" />
          <RefreshCw className="h-3 w-3 animate-spin" />
          <Typography variant="muted" className="text-xs">Loading...</Typography>
        </div>
      )}

      {/* Show empty state for expanded folders with no contents */}
      {isFolder && isExpanded && !isLoading && children.length === 0 && (
        <div
          className="w-full flex items-center gap-2 text-left px-3 py-2 text-muted-foreground"
          style={{ paddingLeft: `${((level + 1) * 12) + 12}px` }}
        >
          <div className="w-3" />
          <Typography variant="muted" className="text-xs">Empty folder</Typography>
        </div>
      )}
    </>
  )
}

