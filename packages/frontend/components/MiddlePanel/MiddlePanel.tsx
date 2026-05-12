import { Menu } from 'lucide-react'
import { useIsMobile } from '../../hooks/use-mobile'

interface MiddlePanelProps<T = any> {
  isFileSidebarCollapsed: boolean
  isAssistantPanelCollapsed: boolean
  panelLayout: T
  onToggleFileSidebar: () => void
  onToggleAssistantPanel: () => void
  renderPanelGroup: (group: T) => React.ReactNode
  hasFilesOpen?: boolean
}

export function MiddlePanel({
  isFileSidebarCollapsed,
  isAssistantPanelCollapsed,
  panelLayout,
  onToggleFileSidebar,
  onToggleAssistantPanel,
  renderPanelGroup,
  hasFilesOpen = true,
}: MiddlePanelProps): JSX.Element {
  const isMobile = useIsMobile()

  return (
    <main className="h-full bg-card relative border-0">
      <style>{`
        /* Burger button styling */
        .burger-button {
          transition: all 0.2s ease-in-out;
        }
        .burger-button:hover {
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        /* Touch-friendly targets - minimum 44x44px on mobile */
        @media (max-width: 767px) {
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
      {/* Expand button for file sidebar when collapsed - positioned on left border */}
      {isFileSidebarCollapsed && !isMobile && (
        <button
          onClick={onToggleFileSidebar}
          className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-11 w-11 md:h-6 md:w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button touch-target"
          title="Expand file sidebar"
        >
          <Menu className="h-5 w-5" strokeWidth={1} />
        </button>
      )}
      {/* Expand button for assistant panel when collapsed - positioned on right border */}
      {isAssistantPanelCollapsed && hasFilesOpen && !isMobile && (
        <button
          onClick={onToggleAssistantPanel}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20 h-11 w-11 md:h-6 md:w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button touch-target"
          title="Expand assistant panel"
        >
          <Menu className="h-5 w-5" strokeWidth={1} />
        </button>
      )}
      {renderPanelGroup(panelLayout)}
    </main>
  )
}

