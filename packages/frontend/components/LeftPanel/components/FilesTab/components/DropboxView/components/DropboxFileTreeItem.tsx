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
import { DropboxFile } from "../../../../../../../../backend/api/dropbox/dropbox"
import { FileSystemItem } from "../../../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../../../common/ui/typography"
import { useToast } from "../../../../../../common/ui/use-toast"
import { CloudFileContextMenu } from "../../FileContextMenu/CloudFileContextMenu"
import { getColoredFileIcons } from "../../../../../../modals/settings-tabs/handlers/appearanceHandlers"
import {
  handleDropboxAddFavorite,
  handleDropboxDelete,
  handleDropboxDownload,
  handleDropboxRemoveFavorite,
  handleDropboxRename,
  handleDropboxShare,
} from "../../../handlers/handleDropboxFileActions"
import { handleCopyDropboxToLocal } from "../../FileContextMenu/handlers/handleCopyDropboxToLocal"

interface DropboxFileTreeItemProps {
  file: DropboxFile
  level: number
  expandedItems: Set<string>
  toggleExpanded: (_id: string) => void
  folderContents: Map<string, DropboxFile[]>
  loadingFolders: Set<string>
  onFileSelect?: (_file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  favorites?: Set<string>
  onFileDeleted?: (_fileId: string) => void
  onFileRenamed?: (_fileId: string, _newName: string) => void
  onFavoriteChanged?: (_fileId: string, _isFavorite: boolean) => void
}

function convertDropboxFileToFileSystemItem(dropboxFile: DropboxFile): FileSystemItem {
  const isFolder = !!dropboxFile.folder
  const mimeType = dropboxFile.file?.mimeType || dropboxFile.mimeType || (isFolder ? 'application/vnd.dropbox.folder' : undefined)

  return {
    id: dropboxFile.id,
    name: dropboxFile.name,
    type: isFolder ? 'folder' : 'file',
    path: `dropbox://${encodeURIComponent(dropboxFile.id)}`,
    size: dropboxFile.size,
    modified: dropboxFile.serverModified ? new Date(dropboxFile.serverModified) : undefined,
    s3_url: dropboxFile.webUrl,
    file_id: dropboxFile.id,
    mimeType
  }
}

export function DropboxFileTreeItem({
  file,
  level,
  expandedItems,
  toggleExpanded,
  folderContents,
  loadingFolders,
  onFileSelect,
  selectedFile,
  favorites = new Set(),
  onFileDeleted,
  onFileRenamed,
  onFavoriteChanged
}: DropboxFileTreeItemProps) {
  const { toast } = useToast()
  const isFolder = !!file.folder
  const isExpanded = expandedItems.has(file.id)
  const isLoading = loadingFolders.has(file.id)
  const children = folderContents.get(file.id) || []
  const isSelected = selectedFile?.file_id === file.id
  const isFavorite = favorites.has(file.id)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(file.name)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (!isRenaming || !inputRef.current) return

    requestAnimationFrame(() => {
      if (!inputRef.current) return
      inputRef.current.focus()
      const value = inputRef.current.value
      const lastDotIndex = value.lastIndexOf('.')
      if (lastDotIndex > 0 && !isFolder) {
        inputRef.current.setSelectionRange(0, lastDotIndex)
      } else {
        inputRef.current.select()
      }
    })
  }, [isRenaming, isFolder])

  useEffect(() => {
    const handleStorageChange = () => forceUpdate({})
    window.addEventListener('colored-file-icons-updated', handleStorageChange)
    return () => window.removeEventListener('colored-file-icons-updated', handleStorageChange)
  }, [])

  async function handleCopyToLocal() {
    await handleCopyDropboxToLocal({
      dropboxItemId: file.id,
      fileName: file.name,
      showToast: toast
    })
  }

  async function handleDownload() {
    await handleDropboxDownload({ itemId: file.id, fileName: file.name, showToast: toast })
  }

  function handleRename() {
    setIsRenaming(true)
    setNewName(file.name)
  }

  async function handleRenameSubmit() {
    if (newName.trim() === '' || newName === file.name) {
      setIsRenaming(false)
      return
    }

    const success = await handleDropboxRename({
      itemId: file.id,
      fileName: file.name,
      newName: newName.trim(),
      showToast: toast,
      onSuccess: () => onFileRenamed?.(file.id, newName.trim())
    })

    if (!success) setNewName(file.name)
    setIsRenaming(false)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleRenameSubmit()
    if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewName(file.name)
    }
  }

  async function handleDelete() {
    await handleDropboxDelete({
      itemId: file.id,
      fileName: file.name,
      showToast: toast,
      onSuccess: () => onFileDeleted?.(file.id)
    })
  }

  async function handleToggleFavorite() {
    if (isFavorite) {
      await handleDropboxRemoveFavorite({
        itemId: file.id,
        fileName: file.name,
        showToast: toast,
        onSuccess: () => onFavoriteChanged?.(file.id, false)
      })
      return
    }

    await handleDropboxAddFavorite({
      itemId: file.id,
      fileName: file.name,
      showToast: toast,
      onSuccess: () => onFavoriteChanged?.(file.id, true)
    })
  }

  async function handleShare() {
    await handleDropboxShare({ itemId: file.id, fileName: file.name, showToast: toast })
  }

  function handleClick(e: React.MouseEvent) {
    if (isRenaming) return
    e.stopPropagation()
    if (isFolder) {
      toggleExpanded(file.id)
      return
    }

    if (onFileSelect) onFileSelect(convertDropboxFileToFileSystemItem(file))
  }

  function getFileIcon() {
    const coloredIcons = getColoredFileIcons()
    const uniformColor = 'text-muted-foreground'
    if (isFolder) return <Folder className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-yellow-400' : uniformColor}`} />

    const lowerName = file.name.toLowerCase()
    if (lowerName.endsWith('.plan.md') || lowerName.endsWith('.plan.json')) {
      return <ListChecks className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-purple-500' : uniformColor}`} />
    }

    const mimeType = file.file?.mimeType || file.mimeType || ''
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-blue-500' : uniformColor}`} />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-green-500' : uniformColor}`} />
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <FileBarChart className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-orange-400' : uniformColor}`} />
    if (mimeType.includes('image')) return <FileImage className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-green-400' : uniformColor}`} />
    if (mimeType.includes('video')) return <FileVideo className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-red-400' : uniformColor}`} />
    if (mimeType.includes('audio')) return <FileAudio className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-blue-400' : uniformColor}`} />
    if (mimeType.includes('pdf')) return <FileText className={`h-4 w-4 flex-shrink-0 ${coloredIcons ? 'text-red-400' : uniformColor}`} />
    return <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
  }

  const buttonContent = isRenaming ? (
    <div
      className={`w-full flex items-center gap-2 text-left px-3 py-2 min-w-0 ${isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
      style={{ paddingLeft: `${(level * 12) + 12}px` }}
    >
      {isFolder && (isExpanded ? <ChevronDown className="h-4 w-4" strokeWidth={1} /> : <ChevronRight className="h-4 w-4" strokeWidth={1} />)}
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
      className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-muted cursor-pointer transition-colors ${isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
      style={{ paddingLeft: `${(level * 12) + 12}px` }}
    >
      {isFolder && (
        isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> :
          isExpanded ? <ChevronDown className="h-4 w-4" strokeWidth={1} /> : <ChevronRight className="h-4 w-4" strokeWidth={1} />
      )}
      {!isFolder && <div className="w-3" />}
      {getFileIcon()}
      <Typography variant="xs" className="truncate min-w-0 flex-1">{file.name}</Typography>
      {isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
    </button>
  )

  return (
    <>
      <CloudFileContextMenu
        provider="dropbox"
        isFolder={isFolder}
        isStarred={isFavorite}
        onDownload={!isFolder ? handleDownload : undefined}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggleStar={handleToggleFavorite}
        onShare={!isFolder ? handleShare : undefined}
        onCopyToLocal={!isFolder ? handleCopyToLocal : undefined}
      >
        {buttonContent}
      </CloudFileContextMenu>

      {isFolder && isExpanded && !isLoading && children.length > 0 && (
        <>
          {children
            .slice()
            .sort((a, b) => {
              const aIsFolder = !!a.folder
              const bIsFolder = !!b.folder
              if (aIsFolder && !bIsFolder) return -1
              if (!aIsFolder && bIsFolder) return 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <DropboxFileTreeItem
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
                onFileDeleted={onFileDeleted}
                onFileRenamed={onFileRenamed}
                onFavoriteChanged={onFavoriteChanged}
              />
            ))}
        </>
      )}

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
