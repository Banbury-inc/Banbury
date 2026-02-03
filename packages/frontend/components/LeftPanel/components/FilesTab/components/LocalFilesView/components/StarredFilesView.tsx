import { Folder, Star } from "lucide-react"
import { FileTreeItem, DragState } from "../../FileTreeItem"
import { FileSystemItem } from "../../../../../../../utils/fileTreeUtils"
import { Typography } from "../../../../../../common/ui/typography"

interface StarredFilesViewProps {
  filteredStarredFiles: FileSystemItem[]
  activeFilters: Set<string>
  onFileSelect: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onFileDeleted: (fileId: string) => void
  onFileDeleteFailed: (file: FileSystemItem) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFolderCreated: (folderPath: string) => void
  onFolderRenamed: (oldPath: string, newPath: string) => void
  onFolderDeleted: (folderPath: string) => void
  onFolderDeleteFailed: (folder: FileSystemItem) => void
  onUploadFile: () => void
  onUploadFolder: () => void
  userInfo?: {
    username: string
    email?: string
  } | null
  dragState: DragState
  onDragStart: (item: FileSystemItem) => void
  onDragEnd: () => void
  onDragOver: (item: FileSystemItem) => void
  onDragLeave: () => void
  onDrop: (targetItem: FileSystemItem, draggedItem: FileSystemItem) => Promise<void>
  selectedIds: Set<string>
  onShiftToggleSelection: (item: FileSystemItem) => void
  selectionCount: number
  onDeleteSelectedFiles: () => Promise<void>
  starredFileIds: Set<string>
  onStarFile: (fileId: string) => Promise<void>
  onUnstarFile: (fileId: string) => Promise<void>
  onShareFile: (file: FileSystemItem) => void
  driveAvailable: boolean
  oneDriveConnected: boolean
  triggerSidebarRefresh?: () => void
}

export function StarredFilesView({
  filteredStarredFiles,
  activeFilters,
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
  triggerSidebarRefresh,
}: StarredFilesViewProps) {
  if (filteredStarredFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {activeFilters.size > 0 ? (
          <>
            <Folder className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
            <Typography variant="muted">No matching files</Typography>
          </>
        ) : (
          <>
            <Star className="h-14 w-14 mb-4 opacity-40 text-muted-foreground" strokeWidth={1.5} />
            <Typography variant="small" className="mb-2 font-medium text-foreground">
              No starred files
            </Typography>
            <Typography variant="muted" className="text-xs text-center max-w-[200px] leading-relaxed">
              Star files to quickly access them here
            </Typography>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {filteredStarredFiles.map((file) => (
        <FileTreeItem
          key={file.file_id}
          item={file}
          level={0}
          expandedItems={new Set()}
          toggleExpanded={() => {}}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          onFileDeleted={onFileDeleted}
          onFileDeleteFailed={onFileDeleteFailed}
          onFileRenamed={onFileRenamed}
          onFolderCreated={onFolderCreated}
          onFolderRenamed={onFolderRenamed}
          onFolderDeleted={onFolderDeleted}
          onFolderDeleteFailed={onFolderDeleteFailed}
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
          triggerSidebarRefresh={triggerSidebarRefresh}
        />
      ))}
    </>
  )
}
