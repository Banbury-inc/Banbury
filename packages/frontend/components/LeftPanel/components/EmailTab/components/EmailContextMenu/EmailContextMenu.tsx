import * as ContextMenu from "@radix-ui/react-context-menu"
import { 
  Mail,
  MailOpen,
  Star,
  StarOff,
  Trash2,
  Archive,
  Reply,
  ReplyAll,
  Forward,
} from "lucide-react"
import { Typography } from "../../../../../common/ui/typography"

export interface EmailContextMenuProps {
  children: React.ReactNode
  isRead: boolean
  isStarred: boolean
  
  // Email actions
  onMarkRead?: () => void
  onMarkUnread?: () => void
  onStar?: () => void
  onUnstar?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onReply?: () => void
  onReplyAll?: () => void
  onForward?: () => void
}

export function EmailContextMenu({
  children,
  isRead,
  isStarred,
  onMarkRead,
  onMarkUnread,
  onStar,
  onUnstar,
  onDelete,
  onArchive,
  onReply,
  onReplyAll,
  onForward,
}: EmailContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-popover border border-zinc-200 dark:border-zinc-700 rounded-md p-1 shadow-lg z-50">
          {/* Mark as Read/Unread */}
          {isRead ? (
            onMarkUnread && (
              <ContextMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                onSelect={onMarkUnread}
              >
                <Mail className="w-4 h-4" strokeWidth={1} />
                <Typography variant="xs" className="text-zinc-900 dark:text-white">
                  Mark as Unread
                </Typography>
              </ContextMenu.Item>
            )
          ) : (
            onMarkRead && (
              <ContextMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                onSelect={onMarkRead}
              >
                <MailOpen className="w-4 h-4" strokeWidth={1} />
                <Typography variant="xs" className="text-zinc-900 dark:text-white">
                  Mark as Read
                </Typography>
              </ContextMenu.Item>
            )
          )}

          {/* Star/Unstar */}
          {isStarred ? (
            onUnstar && (
              <ContextMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                onSelect={onUnstar}
              >
                <StarOff className="w-4 h-4" strokeWidth={1} />
                <Typography variant="xs" className="text-zinc-900 dark:text-white">
                  Unstar
                </Typography>
              </ContextMenu.Item>
            )
          ) : (
            onStar && (
              <ContextMenu.Item 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                onSelect={onStar}
              >
                <Star className="w-4 h-4" strokeWidth={1} />
                <Typography variant="xs" className="text-zinc-900 dark:text-white">
                  Star
                </Typography>
              </ContextMenu.Item>
            )
          )}

          {/* Archive */}
          {onArchive && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onArchive}
            >
              <Archive className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Archive
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Delete */}
          {onDelete && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onDelete}
            >
              <Trash2 className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-red-600 dark:text-red-400">
                Delete
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Separator before compose actions */}
          {(onReply || onReplyAll || onForward) && (
            <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
          )}

          {/* Reply */}
          {onReply && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onReply}
            >
              <Reply className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Reply
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Reply All */}
          {onReplyAll && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onReplyAll}
            >
              <ReplyAll className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Reply All
              </Typography>
            </ContextMenu.Item>
          )}

          {/* Forward */}
          {onForward && (
            <ContextMenu.Item 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
              onSelect={onForward}
            >
              <Forward className="w-4 h-4" strokeWidth={1} />
              <Typography variant="xs" className="text-zinc-900 dark:text-white">
                Forward
              </Typography>
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
