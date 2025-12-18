import { 
  RefreshCw, 
  FolderPlus, 
  FileText,
  FileSpreadsheet,
  FilePlus,
  Plus,
  Network,
  Folder,
  FileBarChart,
  Clock,
  Star,
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
  onCreatePowerpoint?: (presentationName: string) => void
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
  onCreatePowerpoint,
  onCreateFolder,
}: FilesTabProps) {
  const [fileViewMode, setFileViewMode] = useState<'local' | 'recent' | 'starred' | 'drive'>('local')
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

  const handleCreatePowerpoint = () => {
    if ((window as any).__handleCreatePowerpoint) {
      (window as any).__handleCreatePowerpoint()
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Content Header */}
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b min-w-0 gap-3">
          <div className="flex items-center min-w-0 flex-1 overflow-hidden">
            {/* File View Mode Navigation */}
            <Select value={fileViewMode} onValueChange={(value) => setFileViewMode(value as 'local' | 'recent' | 'starred' | 'drive')}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <Folder className="h-3 w-3" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">
                      All Files
                    </Typography>
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">
                      Recent
                    </Typography>
                  </div>
                </SelectItem>
                <SelectItem value="starred">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">
                      Starred
                    </Typography>
                  </div>
                </SelectItem>
                <SelectItem value="drive">
                  <div className="flex items-center gap-2">
                    <Network className="h-3 w-3" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">
                      Google Drive
                    </Typography>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefreshFiles({ setRefreshCounter: setLocalRefreshCounter, setIsRefreshing })}
              disabled={isRefreshing}
              title="Refresh"
              className="flex-shrink-0"
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
                    case 'presentation':
                      handleCreatePowerpoint()
                      break
                    case 'folder':
                      onCreateFolder?.()
                      break
                  }
                }}
              >
                <SelectTrigger size="sm" className="bg-foreground hover:bg-foreground hover:text-primary-foreground flex-shrink-0">
                  <Plus className="h-4 w-4 text-primary-foreground" strokeWidth={1} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload-file" className="[&_svg]:!text-gray-400">
                    <div className="flex items-center">
                      <FilePlus size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Upload File</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="upload-folder" className="[&_svg]:!text-yellow-400">
                    <div className="flex items-center">
                      <FolderPlus size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Upload Folder</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="document" className="[&_svg]:!text-blue-500">
                    <div className="flex items-center">
                      <FileText size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Document</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="spreadsheet" className="[&_svg]:!text-green-500">
                    <div className="flex items-center">
                      <FileSpreadsheet size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Spreadsheet</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="canvas" className="[&_svg]:!text-purple-400">
                    <div className="flex items-center">
                      <Network size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Canvas</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="presentation" className="[&_svg]:!text-orange-400">
                    <div className="flex items-center">
                      <FileBarChart size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Presentation</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="folder" className="[&_svg]:!text-yellow-400">
                    <div className="flex items-center">
                      <Folder size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Folder</Typography>
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
        {(fileViewMode === 'local' || fileViewMode === 'recent' || fileViewMode === 'starred') && (
          <LocalFilesView
            viewMode={fileViewMode}
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
            onCreatePowerpoint={onCreatePowerpoint}
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
