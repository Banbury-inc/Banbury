import {
  Folder,
  Clock,
  Star,
  Trash2,
  Users,
  Search,
} from "lucide-react"
import type { Dispatch } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../../../../common/ui/select"
import { Typography } from "../../../../common/ui/typography"

type FileProvider = 'local' | 'google-drive' | 'onedrive'
type LocalViewMode = 'all' | 'recent' | 'starred' | 'shared'
type GoogleDriveViewMode = 'my-drive' | 'recent' | 'starred' | 'trash'
type OneDriveViewMode = 'root' | 'recent' | 'favorites' | 'search' | 'trash'

interface ViewModeSelectProps {
  fileProvider: FileProvider
  localViewMode: LocalViewMode
  googleDriveViewMode: GoogleDriveViewMode
  oneDriveViewMode: OneDriveViewMode
  onViewModeChange: Dispatch<string>
}

function getViewModeIcon(provider: FileProvider, localViewMode: LocalViewMode, googleDriveViewMode: GoogleDriveViewMode, oneDriveViewMode: OneDriveViewMode) {
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

function getViewModeDisplayName(provider: FileProvider, localViewMode: LocalViewMode, googleDriveViewMode: GoogleDriveViewMode, oneDriveViewMode: OneDriveViewMode) {
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

function getCurrentViewMode(fileProvider: FileProvider, localViewMode: LocalViewMode, googleDriveViewMode: GoogleDriveViewMode, oneDriveViewMode: OneDriveViewMode) {
  switch (fileProvider) {
    case 'local': return localViewMode
    case 'google-drive': return googleDriveViewMode
    case 'onedrive': return oneDriveViewMode
  }
}

export function ViewModeSelect({
  fileProvider,
  localViewMode,
  googleDriveViewMode,
  oneDriveViewMode,
  onViewModeChange,
}: ViewModeSelectProps) {
  const currentViewMode = getCurrentViewMode(fileProvider, localViewMode, googleDriveViewMode, oneDriveViewMode)
  const Icon = getViewModeIcon(fileProvider, localViewMode, googleDriveViewMode, oneDriveViewMode)
  const displayName = getViewModeDisplayName(fileProvider, localViewMode, googleDriveViewMode, oneDriveViewMode)

  return (
    <Select key={`view-mode-${fileProvider}-${currentViewMode}`} value={currentViewMode} onValueChange={onViewModeChange}>
      <SelectTrigger size="xs" className="min-w-14 w-auto max-w-full">
        <SelectValue>
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
            <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline min-w-0">
              {displayName}
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
  )
}
