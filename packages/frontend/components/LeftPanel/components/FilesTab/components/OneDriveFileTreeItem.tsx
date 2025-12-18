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
import { OneDriveFile } from "../../../../../../backend/api/onedrive/onedrive"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../ui/typography"

interface OneDriveFileTreeItemProps {
  file: OneDriveFile
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  folderContents: Map<string, OneDriveFile[]>
  loadingFolders: Set<string>
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  favorites?: Set<string>
}

function convertOneDriveFileToFileSystemItem(oneDriveFile: OneDriveFile): FileSystemItem {
  const isFolder = !!oneDriveFile.folder
  const mimeType = oneDriveFile.file?.mimeType || (isFolder ? 'application/vnd.ms-folder' : undefined)
  
  return {
    id: oneDriveFile.id,
    name: oneDriveFile.name,
    type: isFolder ? 'folder' : 'file',
    path: `onedrive://${oneDriveFile.id}`,
    size: oneDriveFile.size,
    modified: oneDriveFile.modifiedDateTime ? new Date(oneDriveFile.modifiedDateTime) : undefined,
    s3_url: oneDriveFile.webUrl,
    file_id: oneDriveFile.id,
    mimeType: mimeType
  }
}

export function OneDriveFileTreeItem({
  file,
  level,
  expandedItems,
  toggleExpanded,
  folderContents,
  loadingFolders,
  onFileSelect,
  selectedFile,
  favorites = new Set()
}: OneDriveFileTreeItemProps) {
  const isFolder = !!file.folder
  const isExpanded = expandedItems.has(file.id)
  const isLoading = loadingFolders.has(file.id)
  const children = folderContents.get(file.id) || []
  const isSelected = selectedFile?.file_id === file.id
  const isFavorite = favorites.has(file.id)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      toggleExpanded(file.id)
    } else {
      if (onFileSelect) {
        const fileSystemItem = convertOneDriveFileToFileSystemItem(file)
        onFileSelect(fileSystemItem)
      }
    }
  }

  const getFileIcon = () => {
    if (isFolder) return <Folder className="h-4 w-4 flex-shrink-0 text-yellow-400" />
    
    const mimeType = file.file?.mimeType || ''
    
    if (mimeType.includes('document') || mimeType.includes('word')) 
      return <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) 
      return <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-green-500" />
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) 
      return <FileBarChart className="h-4 w-4 flex-shrink-0 text-orange-400" />
    if (mimeType.includes('image')) 
      return <FileImage className="h-4 w-4 flex-shrink-0 text-green-400" />
    if (mimeType.includes('video')) 
      return <FileVideo className="h-4 w-4 flex-shrink-0 text-red-400" />
    if (mimeType.includes('audio')) 
      return <FileAudio className="h-4 w-4 flex-shrink-0 text-blue-400" />
    if (mimeType.includes('pdf')) 
      return <FileText className="h-4 w-4 flex-shrink-0 text-red-400" />
    
    return <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
  }

  return (
    <>
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
        {isFavorite && (
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
        )}
      </button>

      {/* Render children if folder is expanded */}
      {isFolder && isExpanded && !isLoading && children.length > 0 && (
        <>
          {children
            .sort((a, b) => {
              // Sort folders first, then files
              const aIsFolder = !!a.folder
              const bIsFolder = !!b.folder
              if (aIsFolder && !bIsFolder) return -1
              if (!aIsFolder && bIsFolder) return 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <OneDriveFileTreeItem
                key={child.id}
                file={child}
                level={level + 1}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                folderContents={folderContents}
                loadingFolders={loadingFolders}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                favorites={favorites}
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

