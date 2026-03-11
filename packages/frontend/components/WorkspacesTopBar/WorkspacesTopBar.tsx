import { PanelLeft, PanelRight, TerminalSquare } from 'lucide-react'
import { Button } from '../common/ui/button'
import { WindowControls } from './WindowControls'

interface WorkspacesTopBarProps {
  isFileSidebarCollapsed: boolean
  isAssistantPanelCollapsed: boolean
  onToggleFileSidebar: () => void
  onToggleAssistantPanel: () => void
  onOpenTerminal: () => void
}

export function WorkspacesTopBar({
  isFileSidebarCollapsed,
  isAssistantPanelCollapsed,
  onToggleFileSidebar,
  onToggleAssistantPanel,
  onOpenTerminal,
}: WorkspacesTopBarProps) {
  const isDesktop = typeof window !== 'undefined' && window.desktopApp?.isDesktop === true

  return (
    <div 
      className="hidden md:flex h-[35px] w-full bg-card border-b border-zinc-200 dark:border-white/[0.06] items-center justify-between shadow-soft"
      style={isDesktop ? { WebkitAppRegion: 'drag' } : undefined}
    >
      {/* Left Panel Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleFileSidebar}
        title={isFileSidebarCollapsed ? "Show file panel" : "Hide file panel"}
        style={isDesktop ? { WebkitAppRegion: 'no-drag' } : undefined}
      >
        <PanelLeft
          className="h-5 w-5 text-muted-foreground"
          strokeWidth={1.5}
        />
      </Button>

      {/* Right Panel Toggle and Window Controls */}
      <div 
        className="flex items-center gap-1"
        style={isDesktop ? { WebkitAppRegion: 'no-drag' } : undefined}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenTerminal}
          title="Open terminal"
        >
          <TerminalSquare
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleAssistantPanel}
          title={isAssistantPanelCollapsed ? "Show assistant panel" : "Hide assistant panel"}
        >
          <PanelRight
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </Button>

        {/* Window Controls (Electron only) */}
        <WindowControls />
      </div>
    </div>
  )
}
