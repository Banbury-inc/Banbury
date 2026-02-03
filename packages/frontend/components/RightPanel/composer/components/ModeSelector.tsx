import { ChevronDown, Search, ClipboardList, Infinity, Check } from "lucide-react"
import { Button } from "../../../common/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "../../../common/ui/popover"
import { Typography } from "@/components/common/ui/typography"
import type { ComposerToolPreferences } from "../Composer"

interface ModeSelectorProps {
  toolPreferences: ComposerToolPreferences
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void
  showText?: boolean
}

export function ModeSelector({ toolPreferences, onUpdateToolPreferences, showText = true }: ModeSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 px-2 gap-1 hover:text-primary flex-shrink-0 whitespace-nowrap"
          title="Mode"
          aria-label="Mode"
        >
          {toolPreferences.ask_mode ? (
            <Search height={14} width={14} strokeWidth={1.5} className="mr-1" />
          ) : toolPreferences.plan_mode ? (
            <ClipboardList height={14} width={14} strokeWidth={1.5} className="mr-1" />
          ) : (
            <Infinity height={14} width={14} strokeWidth={1.5} className="mr-1" />
          )}
          {showText && (
            <Typography variant="small" className="text-xs font-medium">
              {toolPreferences.ask_mode ? "Ask" : toolPreferences.plan_mode ? "Plan" : "Agent"}
            </Typography>
          )}
          <ChevronDown height={16} width={16} strokeWidth={1} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-48 p-0 bg-popover text-popover-foreground border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      >
        <div className="p-1 flex flex-col">
          {/* Agent Mode Option */}
          <div
            className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onUpdateToolPreferences({
                ...toolPreferences,
                plan_mode: false,
                ask_mode: false
              })
            }}
          >
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
              {!toolPreferences.plan_mode && !toolPreferences.ask_mode && <Check className="size-4" />}
            </span>
            <Infinity height={16} width={16} strokeWidth={1.5} className="text-muted-foreground" />
            <Typography variant="xs">Agent</Typography>
          </div>
          {/* Ask Mode Option */}
          <div
            className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onUpdateToolPreferences({
                ...toolPreferences,
                plan_mode: false,
                ask_mode: true
              })
            }}
          >
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
              {toolPreferences.ask_mode && <Check className="size-4" />}
            </span>
            <Search height={16} width={16} strokeWidth={1.5} className="text-blue-500" />
            <Typography variant="xs">Ask</Typography>
          </div>
          {/* Plan Mode Option */}
          <div
            className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onUpdateToolPreferences({
                ...toolPreferences,
                plan_mode: true,
                ask_mode: false
              })
            }}
          >
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
              {toolPreferences.plan_mode && <Check className="size-4" />}
            </span>
            <ClipboardList height={16} width={16} strokeWidth={1.5} className="text-emerald-500" />
            <Typography variant="xs">Plan</Typography>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
