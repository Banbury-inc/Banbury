import * as ContextMenu from '@radix-ui/react-context-menu'
import { Copy, FolderOpen, Pencil, Trash2 } from 'lucide-react'
import { Typography } from '../../../../common/ui/typography'

interface FlowContextMenuProps {
  children: React.ReactNode
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const menuItemClassName = 'flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none'

export function FlowContextMenu({ children, onOpen, onRename, onDuplicate, onDelete }: FlowContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-popover border border-zinc-200 dark:border-zinc-700 rounded-md p-1 shadow-lg z-50">
          <ContextMenu.Item className={menuItemClassName} onSelect={onOpen}>
            <FolderOpen className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-zinc-900 dark:text-white">
              Open
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Item className={menuItemClassName} onSelect={onRename}>
            <Pencil className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-zinc-900 dark:text-white">
              Rename
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Item className={menuItemClassName} onSelect={onDuplicate}>
            <Copy className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-zinc-900 dark:text-white">
              Duplicate
            </Typography>
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
          <ContextMenu.Item className={menuItemClassName} onSelect={onDelete}>
            <Trash2 className="w-4 h-4" strokeWidth={1} />
            <Typography variant="xs" className="text-red-600 dark:text-red-400">
              Delete
            </Typography>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
