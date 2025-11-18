import { 
  RefreshCw, 
  FolderPlus, 
  FileText,
  FileSpreadsheet,
  FilePlus,
  Plus,
  Network,
  Folder,
} from "lucide-react"
import { useState, useRef, useCallback } from 'react'
import { LocalFilesView } from "./components/LocalFilesView"
import { GoogleDriveView } from "./components/GoogleDriveView"
import { Button } from "../../../ui/button"
import { FileSystemItem } from "../../../../utils/fileTreeUtils"
import { Typography } from "../../../ui/typography"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"
import { handleRefreshFiles } from "./handlers/handleRefreshFiles"
import { handleRefreshComplete } from "./handlers/handleRefreshComplete"

interface FilesTabProps {
  userInfo?: {
    username: string
    email?: string
  } | null
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFileMoved?: (fileId: string, oldPath: string, newPath: string) => void
  onFolderCreated?: (folderPath: string) => void
  onFolderRenamed?: (oldPath: string, newPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
  triggerRootFolderCreation?: boolean
  onCreateDocument?: (documentName: string) => void
  onCreateSpreadsheet?: (spreadsheetName: string) => void
  onCreateNotebook?: (notebookName: string) => void
  onCreateDrawio?: (diagramName: string) => void
  onCreateTldraw?: (drawingName: string) => void
  onCreateFolder?: () => void
}

export function FilesTab({
  userInfo,
  onFileSelect,
  selectedFile,
  onRefreshComplete: externalOnRefreshComplete,
  refreshTrigger,
  onFileDeleted,
  onFileRenamed,
  onFileMoved,
  onFolderCreated,
  onFolderRenamed,
  onFolderDeleted,
  triggerRootFolderCreation,
  onCreateDocument,
  onCreateSpreadsheet,
  onCreateDrawio,
  onCreateTldraw,
  onCreateFolder,
}: FilesTabProps) {
  const [fileViewMode, setFileViewMode] = useState<'local' | 'drive'>('local')
  const [localRefreshCounter, setLocalRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const effectiveRefreshTrigger = (refreshTrigger ?? 0) + localRefreshCounter
  const handleLocalRefreshComplete = useCallback(() => {
    handleRefreshComplete({ setIsRefreshing, onRefreshComplete: externalOnRefreshComplete })
  }, [externalOnRefreshComplete])

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

  // Trigger create actions via window object (set by LocalFilesView)
  const handleCreateDocument = () => {
    if ((window as any).__handleCreateDocument) {
      (window as any).__handleCreateDocument()
    }
  }

  const handleCreateSpreadsheet = () => {
    if ((window as any).__handleCreateSpreadsheet) {
      (window as any).__handleCreateSpreadsheet()
    }
  }

  const handleCreateDrawio = () => {
    if ((window as any).__handleCreateDrawio) {
      (window as any).__handleCreateDrawio()
    }
  }

  const handleCreateTldraw = () => {
    if ((window as any).__handleCreateTldraw) {
      (window as any).__handleCreateTldraw()
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Content Header */}
      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-4">
            {/* File View Mode Navigation */}
            <Select value={fileViewMode} onValueChange={(value) => setFileViewMode(value as 'local' | 'drive')}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <Typography
                    variant="small"
                    className="text-sm font-medium"
                  >
                    Local Files
                  </Typography>
                </SelectItem>
                <SelectItem value="drive">
                  <Typography
                    variant="small"
                    className="text-sm font-medium"
                  >
                    Google Drive
                  </Typography>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRefreshFiles({ setRefreshCounter: setLocalRefreshCounter, setIsRefreshing })}
              disabled={isRefreshing}
              title="Refresh"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </Button>
            {fileViewMode === 'local' && (
              <Select
                value=""
                onValueChange={(value) => {
                  switch (value) {
                    case 'upload-file':
                      handleFileUpload()
                      break
                    case 'upload-folder':
                      handleFolderUpload()
                      break
                    case 'document':
                      handleCreateDocument()
                      break
                    case 'spreadsheet':
                      handleCreateSpreadsheet()
                      break
                    case 'canvas':
                      handleCreateTldraw()
                      break
                    case 'folder':
                      onCreateFolder?.()
                      break
                  }
                }}
              >
                <SelectTrigger size="sm" className="bg-foreground hover:bg-foreground hover:text-primary-foreground">
                  <Plus className="h-4 w-4 text-primary-foreground" strokeWidth={1} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload-file">
                    <div className="flex items-center">
                      <FilePlus size={16} strokeWidth={1} className="mr-2" />
                      Upload File
                    </div>
                  </SelectItem>
                  <SelectItem value="upload-folder">
                    <div className="flex items-center">
                      <FolderPlus size={16} strokeWidth={1} className="mr-2" />
                      Upload Folder
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center">
                      <FileText size={16} strokeWidth={1} className="mr-2" />
                      Document
                    </div>
                  </SelectItem>
                  <SelectItem value="spreadsheet">
                    <div className="flex items-center">
                      <FileSpreadsheet size={16} strokeWidth={1} className="mr-2" />
                      Spreadsheet
                    </div>
                  </SelectItem>
                  <SelectItem value="canvas">
                    <div className="flex items-center">
                      <Network size={16} strokeWidth={1} className="mr-2" />
                      Canvas
                    </div>
                  </SelectItem>
                  <SelectItem value="folder">
                    <div className="flex items-center">
                      <Folder size={16} strokeWidth={1} className="mr-2" />
                      Folder
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {fileViewMode === 'local' && (
          <LocalFilesView
            userInfo={userInfo}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            onRefreshComplete={handleLocalRefreshComplete}
            refreshTrigger={effectiveRefreshTrigger}
            onFileDeleted={onFileDeleted}
            onFileRenamed={onFileRenamed}
            onFileMoved={onFileMoved}
            onFolderCreated={onFolderCreated}
            onFolderRenamed={onFolderRenamed}
            onFolderDeleted={onFolderDeleted}
            triggerRootFolderCreation={triggerRootFolderCreation}
            onCreateDocument={onCreateDocument}
            onCreateSpreadsheet={onCreateSpreadsheet}
            onCreateDrawio={onCreateDrawio}
            onCreateTldraw={onCreateTldraw}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
          />
        )}

        {fileViewMode === 'drive' && (
          <GoogleDriveView
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        )}
      </div>
    </div>
  )
}
