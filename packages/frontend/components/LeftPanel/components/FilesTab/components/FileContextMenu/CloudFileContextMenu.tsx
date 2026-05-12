import * as ContextMenu from "@radix-ui/react-context-menu"
import { 
  Download,
  Edit2, 
  Trash2, 
  Star,
  HardDrive,
  FolderPlus,
  FilePlus,
  Share2,
  FileOutput,
} from "lucide-react"
import { Typography } from "../../../../../common/ui/typography"
import { DropboxIcon, GoogleDriveIcon, OneDriveIcon } from "../../../../../icons"

export type CloudProvider = 'local' | 'drive' | 'onedrive' | 'dropbox'

export interface CloudFileContextMenuProps {
  children: React.ReactNode
  provider: CloudProvider
  isFolder: boolean
  isStarred?: boolean
  
  // Core file actions
  onDownload?: () => void
  onRename?: () => void
  onDelete?: () => void
  onToggleStar?: () => void
  onShare?: () => void
  onSaveAsPDF?: () => void
  
  // Cross-provider copy actions
  onCopyToLocal?: () => void
  onCopyToDrive?: () => void
  onCopyToOneDrive?: () => void
  onCopyToDropbox?: () => void
  
  // Folder-specific actions (for local files)
  onNewFolder?: () => void
  onUploadFile?: () => void
  onUploadFolder?: () => void
  
  // Multi-select delete
  deleteLabel?: string
  
  // Provider availability
  driveAvailable?: boolean
  oneDriveConnected?: boolean
  dropboxConnected?: boolean
}

export function CloudFileContextMenu({
  children,
  provider,
  isFolder,
  isStarred,
  onDownload,
  onRename,
  onDelete,
  onToggleStar,
  onShare,
  onSaveAsPDF,
  onCopyToLocal,
  onCopyToDrive,
  onCopyToOneDrive,
  onCopyToDropbox,
  onNewFolder,
  onUploadFile,
  onUploadFolder,
  deleteLabel,
  driveAvailable,
  oneDriveConnected,
  dropboxConnected,
}: CloudFileContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-popover border border-zinc-200 dark:border-zinc-700 rounded-md p-1 shadow-lg z-50">
          {/* Upload actions (local folders only) */}
          {provider === 'local' && onUploadFile && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onUploadFile}
            >
              <FilePlus className="w-4 h-4" />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Upload File
              </Typography>
            </ContextMenu.Item>
          )}
          {provider === 'local' && onUploadFolder && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onUploadFolder}
            >
              <FolderPlus className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Upload Folder
              </Typography>
            </ContextMenu.Item>
          )}
          
          {/* New folder (local folders only) */}
          {provider === 'local' && isFolder && onNewFolder && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onNewFolder}
            >
              <FolderPlus className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                New Folder
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Download (files only) */}
          {!isFolder && onDownload && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onDownload}
            >
              <Download className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Download
              </Typography>
            </ContextMenu.Item>
          )}
          {/* Save as PDF (local files only) */}
          {provider === 'local' && !isFolder && onSaveAsPDF && driveAvailable && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onSaveAsPDF}
            >
              <FileOutput className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Save as PDF
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Star/Unstar (files and folders) */}
          {onToggleStar && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onToggleStar}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : ''}`} strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                {isStarred ? 'Unstar' : 'Star'}
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Share (files only) */}
          {!isFolder && onShare && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onShare}
            >
              <Share2 className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Share
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Cross-provider copy section */}
          {!isFolder && (onCopyToLocal || onCopyToDrive || onCopyToOneDrive || onCopyToDropbox) && (
            <>
              <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
              
              {/* Copy to Local (for cloud files) */}
              {onCopyToLocal && (
                <ContextMenu.Item 
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                  onSelect={onCopyToLocal}
                >
                  <HardDrive className="w-4 h-4" strokeWidth={1} />
                  <Typography variant="xs" className="text-zinc-900 dark:text-white">
                    Copy to Local
                  </Typography>
                </ContextMenu.Item>
              )}
              
              {/* Copy to Google Drive (for local/OneDrive files) */}
              {onCopyToDrive && (
                <ContextMenu.Item 
                  className={`flex items-center gap-2 px-2 py-1.5 rounded outline-none ${
                    driveAvailable 
                      ? 'hover:bg-sidebar-accent cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onSelect={driveAvailable ? onCopyToDrive : undefined}
                  disabled={!driveAvailable}
                >
                  <GoogleDriveIcon size={16} className="w-4 h-4" />
                  <Typography variant="xs" className="text-zinc-900 dark:text-white">
                    Copy to Google Drive
                  </Typography>
                </ContextMenu.Item>
              )}
              
              {/* Copy to OneDrive (for local/Drive files) */}
              {onCopyToOneDrive && (
                <ContextMenu.Item 
                  className={`flex items-center gap-2 px-2 py-1.5 rounded outline-none ${
                    oneDriveConnected 
                      ? 'hover:bg-sidebar-accent cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onSelect={oneDriveConnected ? onCopyToOneDrive : undefined}
                  disabled={!oneDriveConnected}
                >
                  <OneDriveIcon size={16} className="w-4 h-4" />
                  <Typography variant="xs" className="text-zinc-900 dark:text-white">
                    Copy to OneDrive
                  </Typography>
                </ContextMenu.Item>
              )}
              {onCopyToDropbox && (
                <ContextMenu.Item
                  className={`flex items-center gap-2 px-2 py-1.5 rounded outline-none ${
                    dropboxConnected
                      ? 'hover:bg-sidebar-accent cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onSelect={dropboxConnected ? onCopyToDropbox : undefined}
                  disabled={!dropboxConnected}
                >
                  <DropboxIcon size={16} className="w-4 h-4" />
                  <Typography variant="xs" className="text-zinc-900 dark:text-white">
                    Copy to Dropbox
                  </Typography>
                </ContextMenu.Item>
              )}
            </>
          )}

          {/* Rename */}
          {onRename && (
            <>
              {(onCopyToLocal || onCopyToDrive || onCopyToOneDrive || onCopyToDropbox) && !isFolder && (
                <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
              )}
              <ContextMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                onSelect={onRename}
              >
                <Edit2 className="w-4 h-4" strokeWidth={1} />
                <Typography variant="xs" className="text-zinc-900 dark:text-white">
                  Rename
                </Typography>
              </ContextMenu.Item>
            </>
          )}

          {/* Delete */}
          {onDelete && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onDelete}
            >
              <Trash2 className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-red-600 dark:text-red-400">
                {deleteLabel || 'Delete'}
              </Typography>
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
