import * as ContextMenu from "@radix-ui/react-context-menu"
import { useState } from "react"
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
  Tag,
  Check,
  Plus,
  ChevronRight,
} from "lucide-react"
import { Typography } from "../../../../../common/ui/typography"
import { Input } from "../../../../../common/ui/input"
import { Button } from "../../../../../common/ui/button"
import { useToast } from "../../../../../common/ui/use-toast"
import { loadAvailableLabels } from "../../../../../MiddlePanel/EmailViewer/handlers/labelActions"
import { GmailLabel } from "../../../../../../backend/api/emails/emails"
import { handleToggleLabel, handleCreateAndApplyLabel } from "./handlers/handleLabelActions"

export interface EmailContextMenuProps {
  children: React.ReactNode
  isRead: boolean
  isStarred: boolean
  
  // Email identification for labels
  emailId?: string
  emailLabels?: string[]
  provider?: string
  
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
  onLabelChange?: () => void
}

export function EmailContextMenu({
  children,
  isRead,
  isStarred,
  emailId,
  emailLabels = [],
  provider = 'gmail',
  onMarkRead,
  onMarkUnread,
  onStar,
  onUnstar,
  onDelete,
  onArchive,
  onReply,
  onReplyAll,
  onForward,
  onLabelChange,
}: EmailContextMenuProps) {
  const { toast } = useToast()
  const [availableLabels, setAvailableLabels] = useState<GmailLabel[]>([])
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [labelsLoaded, setLabelsLoaded] = useState(false)
  const [showCreateLabel, setShowCreateLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [creatingLabel, setCreatingLabel] = useState(false)

  // Load labels when submenu is opened
  const loadLabels = async () => {
    if (labelsLoaded || labelsLoading) return
    
    setLabelsLoading(true)
    try {
      const labels = await loadAvailableLabels()
      // Filter to only user-created labels
      const userLabels = labels.filter(l => l.type === 'user')
      setAvailableLabels(userLabels)
      setLabelsLoaded(true)
    } catch (error) {
      console.error('Failed to load labels:', error)
    } finally {
      setLabelsLoading(false)
    }
  }

  // Handle label toggle
  const handleLabelToggle = async (labelId: string, currentlyHasLabel: boolean) => {
    if (!emailId) return
    
    try {
      await handleToggleLabel(emailId, labelId, currentlyHasLabel)
      onLabelChange?.()
    } catch (error) {
      console.error('Failed to toggle label:', error)
      toast({
        title: "Failed to update label",
        description: "There was an error updating the label.",
        variant: "destructive",
      })
    }
  }

  // Handle create new label
  const handleCreateLabel = async () => {
    if (!emailId || !newLabelName.trim() || creatingLabel) return
    
    setCreatingLabel(true)
    try {
      const newLabel = await handleCreateAndApplyLabel(emailId, newLabelName.trim())
      setNewLabelName('')
      setShowCreateLabel(false)
      onLabelChange?.()
      toast({
        title: "Label created",
        description: `Label "${newLabel.name}" created and applied.`,
        variant: "default",
      })
      // Reload labels to include the new one
      setLabelsLoaded(false)
      await loadLabels()
    } catch (error) {
      console.error('Failed to create and apply label:', error)
      toast({
        title: "Failed to create label",
        description: "There was an error creating the label.",
        variant: "destructive",
      })
    } finally {
      setCreatingLabel(false)
    }
  }

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

          {/* Label as submenu */}
          {emailId && provider === 'gmail' && (
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                onPointerEnter={loadLabels}
              >
                <Tag className="w-4 h-4" strokeWidth={1} />
                <Typography variant="xs" className="text-zinc-900 dark:text-white flex-1">
                  Label as
                </Typography>
                <ChevronRight className="w-3 h-3" strokeWidth={1} />
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent className="min-w-[180px] bg-popover border border-zinc-200 dark:border-zinc-700 rounded-md p-1 shadow-lg z-50">
                  {labelsLoading ? (
                    <div className="px-3 py-2">
                      <Typography variant="xs" className="text-zinc-500">
                        Loading labels...
                      </Typography>
                    </div>
                  ) : availableLabels.length === 0 ? (
                    <div className="px-3 py-2">
                      <Typography variant="xs" className="text-zinc-500">
                        No labels yet
                      </Typography>
                    </div>
                  ) : (
                    availableLabels.map((label) => {
                      const isApplied = emailLabels.includes(label.id)
                      return (
                        <ContextMenu.Item
                          key={label.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                          onSelect={() => handleLabelToggle(label.id, isApplied)}
                        >
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {isApplied && <Check className="w-4 h-4 text-primary" strokeWidth={2} />}
                          </div>
                          <Typography variant="xs" className="text-zinc-900 dark:text-white">
                            {label.name}
                          </Typography>
                        </ContextMenu.Item>
                      )
                    })
                  )}
                  
                  {/* Separator before create new label */}
                  {availableLabels.length > 0 && (
                    <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
                  )}
                  
                  {/* Create new label */}
                  {!showCreateLabel ? (
                    <ContextMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                      onSelect={(e) => {
                        e.preventDefault()
                        setShowCreateLabel(true)
                      }}
                    >
                      <Plus className="w-4 h-4" strokeWidth={1} />
                      <Typography variant="xs" className="text-zinc-900 dark:text-white">
                        Create new label
                      </Typography>
                    </ContextMenu.Item>
                  ) : (
                    <div className="px-2 py-1.5" onSelect={(e: any) => e.preventDefault()}>
                      <div className="flex gap-1">
                        <Input
                          placeholder="Label name..."
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleCreateLabel()
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              setShowCreateLabel(false)
                              setNewLabelName('')
                            }
                          }}
                          variant="primary"
                          className="flex-1 h-7 text-xs"
                          disabled={creatingLabel}
                          autoFocus
                        />
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleCreateLabel()
                          }}
                          disabled={creatingLabel || !newLabelName.trim()}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
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
