import { 
  RefreshCw, 
  FolderPlus, 
  FileText,
  FileSpreadsheet,
  FilePlus,
  Plus,
  Network,
  Folder,
  Clock,
  Star,
  Trash2,
  Filter,
  X,
  Users,
  Search,
  HardDrive,
} from "lucide-react"
import { useState, useRef } from 'react'
import { LocalFilesView } from "../../LeftPanel/components/FilesTab/components/LocalFilesView"
import { GoogleDriveView } from "../../LeftPanel/components/FilesTab/components/GoogleDriveView"
import { OneDriveView } from "../../LeftPanel/components/FilesTab/components/OneDriveView"
import { GoogleDriveIcon, OneDriveIcon } from "../../icons"
import { Button } from "../../ui/button"
import { FileSystemItem } from "../../../utils/fileTreeUtils"
import { Typography } from "../../ui/typography"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../../ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { Checkbox } from "../../ui/checkbox"
import { FILE_TYPE_CATEGORIES } from "../../LeftPanel/components/FilesTab/handlers/handleFileTypeFilter"
import { PanelGroup, UserInfo } from "../../../pages/Workspaces/types"

type FileProvider = 'local' | 'google-drive' | 'onedrive'
type LocalViewMode = 'all' | 'recent' | 'starred' | 'shared'
type GoogleDriveViewMode = 'my-drive' | 'recent' | 'starred' | 'trash'
type OneDriveViewMode = 'root' | 'recent' | 'favorites' | 'search' | 'trash'

interface FileBrowserViewerProps {
  userInfo?: UserInfo | null
  onFileSelect?: (file: FileSystemItem) => void
  activePanelId: string
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
  triggerSidebarRefresh: () => void
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
}

export function FileBrowserViewer({
  userInfo,
  onFileSelect,
  activePanelId,
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setSelectedFile,
  triggerSidebarRefresh,
  toast,
}: FileBrowserViewerProps) {
  const [fileProvider, setFileProvider] = useState<FileProvider>('local')
  const [localViewMode, setLocalViewMode] = useState<LocalViewMode>('all')
  const [googleDriveViewMode, setGoogleDriveViewMode] = useState<GoogleDriveViewMode>('my-drive')
  const [oneDriveViewMode, setOneDriveViewMode] = useState<OneDriveViewMode>('root')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

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

  const getProviderIcon = (provider: FileProvider) => {
    switch (provider) {
      case 'local': return HardDrive
      case 'google-drive': return GoogleDriveIcon
      case 'onedrive': return OneDriveIcon
    }
  }

  const getProviderDisplayName = (provider: FileProvider) => {
    switch (provider) {
      case 'local': return 'Local'
      case 'google-drive': return 'Google Drive'
      case 'onedrive': return 'OneDrive'
    }
  }

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

  const ProviderIcon = getProviderIcon(fileProvider)
  const ViewModeIcon = getViewModeIcon(fileProvider)

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Typography variant="h3" className="text-foreground">
            Files
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          {activeFilters.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear Filters
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
                {activeFilters.size > 0 && (
                  <span className="ml-1 text-xs">({activeFilters.size})</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <Typography variant="small" className="font-medium mb-3">
                Filter by File Type
              </Typography>
              <div className="space-y-2">
                {Object.entries(FILE_TYPE_CATEGORIES).map(([key, category]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${key}`}
                      checked={activeFilters.has(key)}
                      onCheckedChange={() => toggleFilter(key)}
                    />
                    <label
                      htmlFor={`filter-${key}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {category.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Provider and View Mode Selectors */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-muted/30">
        {/* Provider Selector */}
        <Select value={fileProvider} onValueChange={(value) => setFileProvider(value as FileProvider)}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <ProviderIcon className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>File Provider</SelectLabel>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Local
                </div>
              </SelectItem>
              <SelectItem value="google-drive">
                <div className="flex items-center gap-2">
                  <GoogleDriveIcon className="h-4 w-4" />
                  Google Drive
                </div>
              </SelectItem>
              <SelectItem value="onedrive">
                <div className="flex items-center gap-2">
                  <OneDriveIcon className="h-4 w-4" />
                  OneDrive
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* View Mode Selector */}
        {fileProvider === 'local' && (
          <Select value={localViewMode} onValueChange={(value) => setLocalViewMode(value as LocalViewMode)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ViewModeIcon className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  All Files
                </div>
              </SelectItem>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </div>
              </SelectItem>
              <SelectItem value="starred">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Starred
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Shared with me
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {fileProvider === 'google-drive' && (
          <Select value={googleDriveViewMode} onValueChange={(value) => setGoogleDriveViewMode(value as GoogleDriveViewMode)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ViewModeIcon className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="my-drive">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  My Drive
                </div>
              </SelectItem>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </div>
              </SelectItem>
              <SelectItem value="starred">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Starred
                </div>
              </SelectItem>
              <SelectItem value="trash">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Trash
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {fileProvider === 'onedrive' && (
          <Select value={oneDriveViewMode} onValueChange={(value) => setOneDriveViewMode(value as OneDriveViewMode)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ViewModeIcon className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  My Files
                </div>
              </SelectItem>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </div>
              </SelectItem>
              <SelectItem value="favorites">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Favorites
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* File View */}
      <div className="flex-1 overflow-auto">
        {fileProvider === 'local' && (
          <LocalFilesView
            viewMode={localViewMode}
            userInfo={userInfo}
            onFileSelect={onFileSelect}
            refreshTrigger={refreshTrigger}
            onRefreshComplete={() => {}}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            activeFilters={activeFilters}
          />
        )}

        {fileProvider === 'google-drive' && (
          <GoogleDriveView
            viewMode={googleDriveViewMode}
            userInfo={userInfo}
            onFileSelect={onFileSelect}
            refreshTrigger={refreshTrigger}
            onRefreshComplete={() => {}}
            activeFilters={activeFilters}
          />
        )}

        {fileProvider === 'onedrive' && (
          <OneDriveView
            viewMode={oneDriveViewMode}
            userInfo={userInfo}
            onFileSelect={onFileSelect}
            refreshTrigger={refreshTrigger}
            onRefreshComplete={() => {}}
            activeFilters={activeFilters}
          />
        )}
      </div>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        style={{ display: 'none' }}
      />
    </div>
  )
}
