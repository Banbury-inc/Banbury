import { ChevronRightIcon, Square, CornerDownLeft } from "lucide-react"
import * as AssistantUI from "@assistant-ui/react"
import { Button } from "../../../common/ui/button"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../../../common/ui/tooltip"
import { Typography } from "@/components/common/ui/typography"
import type { FC, RefObject } from "react"

const { ThreadPrimitive, ComposerPrimitive } = AssistantUI as any

interface ComposerSendButtonProps {
  sendButtonRef: RefObject<HTMLButtonElement | null>
  hasText: boolean
  onSend: () => void
  hasQueuedMessages: boolean
  onSendNextQueued: () => void
}

export const ComposerSendButton: FC<ComposerSendButtonProps> = ({
  sendButtonRef,
  hasText,
  onSend,
  hasQueuedMessages,
  onSendNextQueued,
}) => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <Button
          ref={sendButtonRef}
          type="button"
          variant="primary"
          size="xs"
          className={`h-7 w-7 flex-shrink-0 ${
            hasText
              ? 'cursor-pointer bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100'
              : 'opacity-50 bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
          }`}
          title="Send"
          aria-label="Send message"
          onClick={onSend}
          disabled={!hasText}
        >
          <ChevronRightIcon height={16} width={16} strokeWidth={1} />
        </Button>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <div className="flex items-center gap-2 flex-shrink-0 flex-nowrap">
          {/* Send Next button - shown when agent is running and there are queued messages */}
          {hasQueuedMessages && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    title="Send next queued message (interrupts current)"
                    aria-label="Send next queued message"
                    className="h-7 px-2 gap-1 cursor-pointer bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 flex-shrink-0 whitespace-nowrap"
                    onClick={onSendNextQueued}
                  >
                    <CornerDownLeft height={14} width={14} strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">Send Next</Typography>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <Typography variant="xs">Press Enter to interrupt and send next queued message</Typography>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <ComposerPrimitive.Cancel asChild>
            <Button
              type="button"
              variant="primary"
              size="xs"
              title="Stop generating"
              aria-label="Stop generating"
              className="h-7 w-7 cursor-pointer bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 flex-shrink-0" 
            >
              <Square height={14} width={14} strokeWidth={1} />
            </Button>
          </ComposerPrimitive.Cancel>
        </div>
      </ThreadPrimitive.If>
    </>
  )
}
