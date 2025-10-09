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
} from "lucide-react"
import { DriveFile } from "../../../../../services/driveService"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../ui/typography"

interface DriveFileTreeItemProps {
  file: DriveFile
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  folderContents: Map<string, DriveFile[]>
  loadingFolders: Set<string>
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
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
  selectedFile
}: DriveFileTreeItemProps) {
  const isFolder = file.mimeType?.includes('folder')
  const isExpanded = expandedItems.has(file.id)
  const isLoading = loadingFolders.has(file.id)
  const children = folderContents.get(file.id) || []
  const isSelected = selectedFile?.file_id === file.id

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      toggleExpanded(file.id)
    } else {
      // For files, call onFileSelect to open in middle panel
      if (onFileSelect) {
        const fileSystemItem = convertDriveFileToFileSystemItem(file)
        onFileSelect(fileSystemItem)
      }
    }
  }

  // Get file icon component with matching colors from local files
  const getFileIcon = () => {
    if (isFolder) return <Folder className="h-4 w-4 flex-shrink-0 text-yellow-400" />
    if (file.mimeType?.includes('document')) return <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
    if (file.mimeType?.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-green-500" />
    if (file.mimeType?.includes('presentation')) return <FileBarChart className="h-4 w-4 flex-shrink-0 text-orange-400" />
    if (file.mimeType?.includes('image')) return <FileImage className="h-4 w-4 flex-shrink-0 text-green-400" />
    if (file.mimeType?.includes('video')) return <FileVideo className="h-4 w-4 flex-shrink-0 text-red-400" />
    if (file.mimeType?.includes('audio')) return <FileAudio className="h-4 w-4 flex-shrink-0 text-blue-400" />
    if (file.mimeType?.includes('pdf')) return <FileText className="h-4 w-4 flex-shrink-0 text-red-400" />
    return <File className="h-4 w-4 flex-shrink-0 text-gray-400" />
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-zinc-800 cursor-pointer transition-colors ${
          isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300'
        }`}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        {isFolder && (
          isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )
        )}
        {!isFolder && <div className="w-3" />}
        {getFileIcon()}
        <Typography variant="small" className="truncate min-w-0 flex-1">
          {file.name}
        </Typography>
        {file.starred && (
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
        )}
      </button>

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
              />
            ))}
        </>
      )}

      {/* Show loading state for empty expanded folders */}
      {isFolder && isExpanded && isLoading && (
        <div
          className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-500"
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
          className="w-full flex items-center gap-2 text-left px-3 py-2 text-zinc-500"
          style={{ paddingLeft: `${((level + 1) * 12) + 12}px` }}
        >
          <div className="w-3" />
          <Typography variant="muted" className="text-xs">Empty folder</Typography>
        </div>
      )}
    </>
  )
}

