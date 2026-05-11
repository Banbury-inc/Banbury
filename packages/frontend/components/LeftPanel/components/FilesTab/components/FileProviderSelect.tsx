import { HardDrive } from "lucide-react"
import type { Dispatch } from "react"
import { GoogleDriveIcon, OneDriveIcon } from "../../../../icons"
import { Typography } from "../../../../common/ui/typography"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../../../../common/ui/select"

type FileProvider = 'local' | 'google-drive' | 'onedrive'

interface FileProviderSelectProps {
  fileProvider: FileProvider
  onProviderChange: Dispatch<FileProvider>
}

function getProviderIcon(provider: FileProvider) {
  switch (provider) {
    case 'local': return HardDrive
    case 'google-drive': return GoogleDriveIcon
    case 'onedrive': return OneDriveIcon
  }
}

function getProviderDisplayName(provider: FileProvider) {
  switch (provider) {
    case 'local': return 'Local'
    case 'google-drive': return 'Google Drive'
    case 'onedrive': return 'OneDrive'
  }
}

export function FileProviderSelect({ fileProvider, onProviderChange }: FileProviderSelectProps) {
  return (
    <Select key={`provider-${fileProvider}`} value={fileProvider} onValueChange={(value) => onProviderChange(value as FileProvider)}>
      <SelectTrigger size="xs" className="min-w-14 w-auto max-w-full">
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
  )
}
