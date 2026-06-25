import type React from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { Copy, Download, FileText, FolderOpen, Pencil, Share2, Trash2 } from 'lucide-react'
import { Typography } from '../../../../common/ui/typography'

interface MeetingContextMenuProps {
  children: React.ReactNode
  onOpen: () => void
  onRename: () => void
  onShare: () => void
  onCopyUrl: () => void
  onDownloadRecording: () => void
  onDownloadTranscript: () => void
  onDelete: () => void
}

const menuItemClassName = 'flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none'

export function MeetingContextMenu({
  children,
  onOpen,
  onRename,
  onShare,
  onCopyUrl,
  onDownloadRecording,
  onDownloadTranscript,
  onDelete
}: MeetingContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[200px] bg-popover border border-border rounded-md p-1 shadow-lg z-50"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <ContextMenu.Item className={menuItemClassName} onSelect={onOpen}>
            <FolderOpen className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-popover-foreground">
              Open
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Item className={menuItemClassName} onSelect={onRename}>
            <Pencil className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-popover-foreground">
              Rename
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Item className={menuItemClassName} onSelect={onShare}>
            <Share2 className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-popover-foreground">
              Share
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Item className={menuItemClassName} onSelect={onCopyUrl}>
            <Copy className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-popover-foreground">
              Copy meeting URL
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
          <ContextMenu.Item className={menuItemClassName} onSelect={onDownloadRecording}>
            <Download className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-popover-foreground">
              Download recording
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Item className={menuItemClassName} onSelect={onDownloadTranscript}>
            <FileText className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-popover-foreground">
              Download transcript
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
          <ContextMenu.Item className={menuItemClassName} onSelect={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1} />
            <Typography variant="xs" className="text-destructive">
              Delete
            </Typography>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
