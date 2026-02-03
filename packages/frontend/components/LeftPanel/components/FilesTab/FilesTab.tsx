import { 
  RefreshCw,
} from "lucide-react"
import { useState, useRef, useCallback } from 'react'
import { LocalFilesView, LocalFilesViewRef } from "./components/LocalFilesView"
import { GoogleDriveView } from "./components/GoogleDriveView"
import { OneDriveView } from "./components/OneDriveView"
import { FileProviderSelect } from "./components/FileProviderSelect"
import { ViewModeSelect } from "./components/ViewModeSelect"
import { FileTypeFilter } from "./components/FileTypeFilter"
import { LocalFilesCreateMenu } from "./components/LocalFilesCreateMenu"
import { GoogleDriveCreateMenu } from "./components/GoogleDriveCreateMenu"
import { OneDriveCreateMenu } from "./components/OneDriveCreateMenu"
import { Button } from "../../../common/ui/button"
import { FileSystemItem } from "../../../../utils/fileTreeUtils"
import { handleRefreshFiles } from "./handlers/handleRefreshFiles"
import { handleRefreshComplete } from "./handlers/handleRefreshComplete"
import { useWorkspaceHandlers } from "./handlers/workspaceHandlers"
import { PanelGroup, UserInfo } from "../../../../pages/Workspaces/types"

type FileProvider = 'local' | 'google-drive' | 'onedrive'
type LocalViewMode = 'all' | 'recent' | 'starred' | 'shared'
type GoogleDriveViewMode = 'my-drive' | 'recent' | 'starred' | 'trash'
type OneDriveViewMode = 'root' | 'recent' | 'favorites' | 'search' | 'trash'

interface FilesTabProps {
  userInfo?: UserInfo | null
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number
  onFolderCreated?: (folderPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
  triggerRootFolderCreation?: boolean
  onCreateFolder?: () => void
  onOpenFilesApp?: () => void
  activePanelId: string
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
  triggerSidebarRefresh: () => void
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
}

export function FilesTab({
  userInfo,
  selectedFile,
  onRefreshComplete: externalOnRefreshComplete,
  refreshTrigger,
  onFolderCreated,
  onFolderDeleted,
  triggerRootFolderCreation,
  onCreateFolder,
  onOpenFilesApp,
  activePanelId,
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setSelectedFile,
  triggerSidebarRefresh,
  toast,
}: FilesTabProps) {
  const {
    handleFileSelect,
    handleFileDeleted,
    handleFileRenamed,
    handleFileMoved,
    handleFolderRenamed,
    handleCreateDocument,
    handleCreateSpreadsheet,
    handleCreateDrawio,
    handleCreateTldraw,
    handleCreatePowerpoint,
  } = useWorkspaceHandlers({
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setSelectedFile,
    selectedFile: selectedFile || null,
    triggerSidebarRefresh,
    toast,
    userInfo: userInfo || null
  })
  const [fileProvider, setFileProvider] = useState<FileProvider>('local')
  const [localViewMode, setLocalViewMode] = useState<LocalViewMode>('all')
  const [googleDriveViewMode, setGoogleDriveViewMode] = useState<GoogleDriveViewMode>('my-drive')
  const [oneDriveViewMode, setOneDriveViewMode] = useState<OneDriveViewMode>('root')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  const toggleFilter = (categoryKey: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(categoryKey)) {
        newFilters.delete(categoryKey)
      } else {
        newFilters.add(categoryKey)
      }
      return newFilters
    })
  }

  const clearFilters = () => {
    setActiveFilters(new Set())
  }



  const handleProviderChange = (newProvider: FileProvider) => {
    setFileProvider(newProvider)
  }

  const handleViewModeChange = (value: string) => {
    switch (fileProvider) {
      case 'local':
        setLocalViewMode(value as LocalViewMode)
        break
      case 'google-drive':
        setGoogleDriveViewMode(value as GoogleDriveViewMode)
        break
      case 'onedrive':
        setOneDriveViewMode(value as OneDriveViewMode)
        break
    }
  }

  const [localRefreshCounter, setLocalRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const localFilesViewRef = useRef<LocalFilesViewRef | null>(null)
  const effectiveRefreshTrigger = (refreshTrigger ?? 0) + localRefreshCounter
  const handleLocalRefreshComplete = useCallback(() => {
    handleRefreshComplete({ setIsRefreshing, onRefreshComplete: externalOnRefreshComplete })
  }, [setIsRefreshing, externalOnRefreshComplete])

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFolderUpload = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click()
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden @container">
            <FileProviderSelect fileProvider={fileProvider} onProviderChange={handleProviderChange} />

            <ViewModeSelect
              fileProvider={fileProvider}
              localViewMode={localViewMode}
              googleDriveViewMode={googleDriveViewMode}
              oneDriveViewMode={oneDriveViewMode}
              onViewModeChange={handleViewModeChange}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <FileTypeFilter
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
              onClearFilters={clearFilters}
            />
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleRefreshFiles({ setRefreshCounter: setLocalRefreshCounter, setIsRefreshing })}
              disabled={isRefreshing}
              title="Refresh"
              className="flex-shrink-0"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
            </Button>
            {/* Local Files + Menu */}
            {fileProvider === 'local' && (
              <LocalFilesCreateMenu
                onFileUpload={handleFileUpload}
                onFolderUpload={handleFolderUpload}
                localFilesViewRef={localFilesViewRef}
                onCreateFolder={onCreateFolder}
              />
            )}
            {/* Google Drive + Menu (only in My Drive view) */}
            {fileProvider === 'google-drive' && googleDriveViewMode === 'my-drive' && (
              <GoogleDriveCreateMenu
                onCreateDocument={handleCreateDocument}
                onCreateSpreadsheet={handleCreateSpreadsheet}
                onCreatePowerpoint={handleCreatePowerpoint}
              />
            )}
            {/* OneDrive + Menu (only in My Files view) */}
            {fileProvider === 'onedrive' && oneDriveViewMode === 'root' && (
              <OneDriveCreateMenu
                onCreateDocument={handleCreateDocument}
                onCreateSpreadsheet={handleCreateSpreadsheet}
                onCreatePowerpoint={handleCreatePowerpoint}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Local Files */}
        {fileProvider === 'local' && (
          <LocalFilesView
            ref={localFilesViewRef}
            viewMode={localViewMode === 'all' ? 'local' : localViewMode}
            userInfo={userInfo}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onRefreshComplete={handleLocalRefreshComplete}
            refreshTrigger={effectiveRefreshTrigger}
            onFileDeleted={handleFileDeleted}
            onFileRenamed={handleFileRenamed}
            onFileMoved={handleFileMoved}
            onFolderCreated={onFolderCreated}
            onFolderRenamed={handleFolderRenamed}
            onFolderDeleted={onFolderDeleted}
            triggerRootFolderCreation={triggerRootFolderCreation}
            onCreateDocument={handleCreateDocument}
            onCreateSpreadsheet={handleCreateSpreadsheet}
            onCreateDrawio={handleCreateDrawio}
            onCreateTldraw={handleCreateTldraw}
            onCreatePowerpoint={handleCreatePowerpoint}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            activeFilters={activeFilters}
            triggerSidebarRefresh={triggerSidebarRefresh}
          />
        )}

        {/* Google Drive */}
        {fileProvider === 'google-drive' && (
          <GoogleDriveView
            viewMode={googleDriveViewMode}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            activeFilters={activeFilters}
          />
        )}

        {/* OneDrive */}
        {fileProvider === 'onedrive' && (
          <OneDriveView
            viewMode={oneDriveViewMode}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            activeFilters={activeFilters}
          />
        )}
      </div>
    </div>
  )
}
