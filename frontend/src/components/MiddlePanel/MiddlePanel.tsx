import { Menu } from 'lucide-react'

interface MiddlePanelProps<T = any> {
  isFileSidebarCollapsed: boolean
  isAssistantPanelCollapsed: boolean
  panelLayout: T
  onToggleFileSidebar: () => void
  onToggleAssistantPanel: () => void
  renderPanelGroup: (group: T) => React.ReactNode
}

export function MiddlePanel({
  isFileSidebarCollapsed,
  isAssistantPanelCollapsed,
  panelLayout,
  onToggleFileSidebar,
  onToggleAssistantPanel,
  renderPanelGroup,
}: MiddlePanelProps): JSX.Element {
  return (
    <main className="h-full bg-background relative border-0">
      {/* Expand button for file sidebar when collapsed - positioned on left border */}
      {isFileSidebarCollapsed && (
        <button
          onClick={onToggleFileSidebar}
          className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button"
          title="Expand file sidebar"
        >
          <Menu className="h-4 w-4" strokeWidth={1} />
        </button>
      )}
      {/* Expand button for assistant panel when collapsed - positioned on right border */}
      {isAssistantPanelCollapsed && (
        <button
          onClick={onToggleAssistantPanel}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button"
          title="Expand assistant panel"
        >
          <Menu className="h-4 w-4" strokeWidth={1} />
        </button>
      )}
      {renderPanelGroup(panelLayout)}
    </main>
  )
}

