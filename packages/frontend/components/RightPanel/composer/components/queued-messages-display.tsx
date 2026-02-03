import { Circle, ChevronDown, ChevronRight, Trash2, ArrowUp, Pencil, CornerDownLeft } from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '../../../common/ui/button'
import { Typography } from '../../../common/ui/typography'

export interface QueuedMessage {
  id: string
  text: string
  timestamp: number
}

interface QueuedMessagesDisplayProps {
  messages: QueuedMessage[]
  onRemove: (id: string) => void
  onMoveToFront: (id: string) => void
  onEdit?: (id: string) => void
  onSendNow?: (id: string) => void
}

export const QueuedMessagesDisplay: React.FC<QueuedMessagesDisplayProps> = ({
  messages,
  onRemove,
  onMoveToFront,
  onEdit,
  onSendNow
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (messages.length === 0) return null

  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="px-2 py-2">
      <div className="space-y-1">
        {/* Dropdown header */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 p-1 rounded"
          onClick={() => setIsExpanded(!isExpanded)}
        >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        )}
        <Typography variant="xs" className="text-zinc-700 dark:text-zinc-300 font-medium">
          {messages.length} Queued Message{messages.length > 1 ? 's' : ''}
        </Typography>
      </div>

      {/* Message list */}
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="group flex items-center gap-2 py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            >
              <Circle className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
              <Typography variant="xs" className="truncate flex-1 text-zinc-700 dark:text-zinc-300" title={message.text}>
                {truncateText(message.text)}
              </Typography>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <div className="flex items-center gap-1">
                    <CornerDownLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <Typography variant="xs" className="text-zinc-500 dark:text-zinc-400">
                      to send now
                    </Typography>
                  </div>
                )}
                <div className={`flex gap-1 transition-all duration-200 ${index === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-5 w-5 p-0 text-muted-foreground hover:bg-transparent hover:text-white/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(message.id)
                    }}
                    title="Edit message"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {index > 0 && onSendNow && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-5 w-5 p-0 text-muted-foreground hover:bg-transparent hover:text-white/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSendNow(message.id)
                    }}
                    title="Send now"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-5 w-5 p-0 text-muted-foreground hover:bg-transparent hover:text-white/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(message.id)
                  }}
                  title="Remove from queue"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
