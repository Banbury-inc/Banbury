import { PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '../ui/button'

interface WorkspacesTopBarProps {
  isFileSidebarCollapsed: boolean
  isAssistantPanelCollapsed: boolean
  onToggleFileSidebar: () => void
  onToggleAssistantPanel: () => void
}

export function WorkspacesTopBar({
  isFileSidebarCollapsed,
  isAssistantPanelCollapsed,
  onToggleFileSidebar,
  onToggleAssistantPanel,
}: WorkspacesTopBarProps) {
  return (
    <div className="hidden md:flex h-[35px] w-full bg-card border-b border-zinc-200 dark:border-white/[0.06] items-center justify-between px-4 shadow-soft">
      {/* Left Panel Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleFileSidebar}
        title={isFileSidebarCollapsed ? "Show file panel" : "Hide file panel"}
      >
        <PanelLeft
          className={`h-5 w-5 ${isFileSidebarCollapsed ? 'text-muted-foreground' : 'text-foreground'}`}
          strokeWidth={1.5}
        />
      </Button>

      {/* Right Panel Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleAssistantPanel}
        title={isAssistantPanelCollapsed ? "Show assistant panel" : "Hide assistant panel"}
      >
        <PanelRight
          className={`h-5 w-5 ${isAssistantPanelCollapsed ? 'text-muted-foreground' : 'text-foreground'}`}
          strokeWidth={1.5}
        />
      </Button>
    </div>
  )
}
