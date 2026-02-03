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
  Trash2,
  Filter,
  X,
  Users,
  Search,
  HardDrive,
  SquareArrowOutUpRight,
} from "lucide-react"
import { useState, useRef, useCallback } from 'react'
import { LocalFilesView } from "./components/LocalFilesView"
import { GoogleDriveView } from "./components/GoogleDriveView"
import { OneDriveView } from "./components/OneDriveView"
import { GoogleDriveIcon, OneDriveIcon } from "../../../icons"
import { Button } from "../../../common/ui/button"
import { FileSystemItem } from "../../../../utils/fileTreeUtils"
import { Typography } from "../../../common/ui/typography"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../../../common/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../../../common/ui/popover"
import { Checkbox } from "../../../common/ui/checkbox"
import { handleRefreshFiles } from "./handlers/handleRefreshFiles"
import { handleRefreshComplete } from "./handlers/handleRefreshComplete"
import { FILE_TYPE_CATEGORIES } from "./handlers/handleFileTypeFilter"
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
  // Workspace dependencies
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
  // Use workspace handlers hook
  const {
    handleFileSelect,
    handleFileDeleted,
    handleFileRenamed,
    handleFileMoved,
    handleFolderRenamed,
    handleCreateDocument,
    handleCreateSpreadsheet,
    handleCreateNotebook,
    handleCreateDrawio,
    handleCreateTldraw,
    handleCreatePowerpoint,
    handleGenerateImage
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

  // Toggle a filter category
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

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters(new Set())
  }

  // Get provider icon
  const getProviderIcon = (provider: FileProvider) => {
    switch (provider) {
      case 'local': return HardDrive
      case 'google-drive': return GoogleDriveIcon
      case 'onedrive': return OneDriveIcon
    }
  }

  // Get provider display name
  const getProviderDisplayName = (provider: FileProvider) => {
    switch (provider) {
      case 'local': return 'Local'
      case 'google-drive': return 'Google Drive'
      case 'onedrive': return 'OneDrive'
    }
  }

  // Get view mode icon based on provider
  const getViewModeIcon = (provider: FileProvider) => {
    switch (provider) {
      case 'local':
        switch (localViewMode) {
          case 'all': return Folder
          case 'recent': return Clock
          case 'starred': return Star
          case 'shared': return Users
        }
        break
      case 'google-drive':
        switch (googleDriveViewMode) {
          case 'my-drive': return Folder
          case 'recent': return Clock
          case 'starred': return Star
          case 'trash': return Trash2
        }
        break
      case 'onedrive':
        switch (oneDriveViewMode) {
          case 'root': return Folder
          case 'recent': return Clock
          case 'favorites': return Star
          case 'search': return Search
          case 'trash': return Trash2
        }
        break
    }
    return Folder
  }

  // Get view mode display name based on provider
  const getViewModeDisplayName = (provider: FileProvider) => {
    switch (provider) {
      case 'local':
        switch (localViewMode) {
          case 'all': return 'All Files'
          case 'recent': return 'Recent'
          case 'starred': return 'Starred'
          case 'shared': return 'Shared with me'
        }
        break
      case 'google-drive':
        switch (googleDriveViewMode) {
          case 'my-drive': return 'My Drive'
          case 'recent': return 'Recent'
          case 'starred': return 'Starred'
          case 'trash': return 'Trash'
        }
        break
      case 'onedrive':
        switch (oneDriveViewMode) {
          case 'root': return 'My Files'
          case 'recent': return 'Recent'
          case 'favorites': return 'Favorites'
          case 'search': return 'Search'
          case 'trash': return 'Trash'
        }
        break
    }
    return 'All Files'
  }

  // Handle provider change
  const handleProviderChange = (newProvider: FileProvider) => {
    setFileProvider(newProvider)
  }

  // Handle view mode change based on provider
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

  // Get current view mode value based on provider
  const getCurrentViewMode = () => {
    switch (fileProvider) {
      case 'local': return localViewMode
      case 'google-drive': return googleDriveViewMode
      case 'onedrive': return oneDriveViewMode
    }
  }
  const [localRefreshCounter, setLocalRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const effectiveRefreshTrigger = (refreshTrigger ?? 0) + localRefreshCounter
  const handleLocalRefreshComplete = useCallback(() => {
    handleRefreshComplete({ setIsRefreshing, onRefreshComplete: externalOnRefreshComplete })
  }, [setIsRefreshing, externalOnRefreshComplete])

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

  // Note: Create handlers are now provided by useWorkspaceHandlers hook above

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Content Header */}
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden @container">
            {/* Provider Selector */}
            <Select key={`provider-${fileProvider}`} value={fileProvider} onValueChange={(value) => handleProviderChange(value as FileProvider)}>
              <SelectTrigger size="xs" className="min-w-0 w-auto max-w-full overflow-hidden">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    {(() => {
                      const Icon = getProviderIcon(fileProvider)
                      if (fileProvider === 'google-drive' || fileProvider === 'onedrive') {
                        return <Icon size={14} className="h-3.5 w-3.5 flex-shrink-0" />
                      }
                      return <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                    })()}
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline min-w-0">
                      {getProviderDisplayName(fileProvider)}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>File Provider</SelectLabel>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <Typography variant="xs" className="font-medium">Local</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="google-drive">
                    <div className="flex items-center gap-2">
                      <GoogleDriveIcon size={14} className="h-3.5 w-3.5" />
                      <Typography variant="xs" className="font-medium">Google Drive</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="onedrive">
                    <div className="flex items-center gap-2">
                      <OneDriveIcon size={14} className="h-3.5 w-3.5" />
                      <Typography variant="xs" className="font-medium">OneDrive</Typography>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* View Mode Selector */}
            <Select key={`view-mode-${fileProvider}-${getCurrentViewMode()}`} value={getCurrentViewMode()} onValueChange={handleViewModeChange}>
              <SelectTrigger size="xs" className="min-w-0 w-auto max-w-full overflow-hidden">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    {(() => {
                      const Icon = getViewModeIcon(fileProvider)
                      return <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                    })()}
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline min-w-0">
                      {getViewModeDisplayName(fileProvider)}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Local Files View Modes */}
                {fileProvider === 'local' && (
                  <SelectGroup>
                    <SelectLabel>View</SelectLabel>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">All Files</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Recent</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="starred">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Starred</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="shared">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Shared with me</Typography>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                )}

                {/* Google Drive View Modes */}
                {fileProvider === 'google-drive' && (
                  <SelectGroup>
                    <SelectLabel>View</SelectLabel>
                    <SelectItem value="my-drive">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">My Drive</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Recent</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="starred">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Starred</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="trash">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Trash</Typography>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                )}

                {/* OneDrive View Modes */}
                {fileProvider === 'onedrive' && (
                  <SelectGroup>
                    <SelectLabel>View</SelectLabel>
                    <SelectItem value="root">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">My Files</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Recent</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="favorites">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Favorites</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="search">
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Search</Typography>
                      </div>
                    </SelectItem>
                    <SelectItem value="trash">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <Typography variant="xs" className="font-medium">Trash</Typography>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  title="Filter by file type"
                  className={`flex-shrink-0 relative ${activeFilters.size > 0 ? 'border-primary' : ''} hover:bg-accent hover:text-accent-foreground`}
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {activeFilters.size > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {activeFilters.size}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <Typography variant="xs" className="font-medium">Filter by type</Typography>
                  {activeFilters.size > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {Object.entries(FILE_TYPE_CATEGORIES).map(([key, category]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={activeFilters.has(key)}
                        onCheckedChange={() => toggleFilter(key)}
                      />
                      <Typography variant="xs">{category.label}</Typography>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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
                <SelectTrigger size="xs" className="bg-accent hover:bg-accent hover:text-accent-foreground flex-shrink-0">
                  <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
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
            {/* Google Drive + Menu (only in My Drive view) */}
            {fileProvider === 'google-drive' && googleDriveViewMode === 'my-drive' && (
              <Select
                value=""
                onValueChange={(value) => {
                  switch (value) {
                    case 'document':
                      handleCreateDocument()
                      break
                    case 'spreadsheet':
                      handleCreateSpreadsheet()
                      break
                    case 'presentation':
                      handleCreatePowerpoint()
                      break
                  }
                }}
              >
                <SelectTrigger size="xs" className="bg-accent hover:bg-accent hover:text-accent-foreground flex-shrink-0">
                  <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectItem value="presentation" className="[&_svg]:!text-orange-400">
                    <div className="flex items-center">
                      <FileBarChart size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Presentation</Typography>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {/* OneDrive + Menu (only in My Files view) */}
            {fileProvider === 'onedrive' && oneDriveViewMode === 'root' && (
              <Select
                value=""
                onValueChange={(value) => {
                  switch (value) {
                    case 'document':
                      handleCreateDocument()
                      break
                    case 'spreadsheet':
                      handleCreateSpreadsheet()
                      break
                    case 'presentation':
                      handleCreatePowerpoint()
                      break
                  }
                }}
              >
                <SelectTrigger size="xs" className="bg-accent hover:bg-accent hover:text-accent-foreground flex-shrink-0">
                  <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectItem value="presentation" className="[&_svg]:!text-orange-400">
                    <div className="flex items-center">
                      <FileBarChart size={16} strokeWidth={1} className="mr-2" />
                      <Typography variant="xs" className="font-medium">Presentation</Typography>
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
        {/* Local Files */}
        {fileProvider === 'local' && (
          <LocalFilesView
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
