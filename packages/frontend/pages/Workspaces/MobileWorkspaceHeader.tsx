import { Folder, Mail, Calendar, CheckSquare, Video, UserCog, MessageSquare } from 'lucide-react'
import { Button } from '../../components/common/ui/button'
import { UserInfo } from './types'

interface MobileWorkspaceHeaderProps {
  activeLeftPanelTab: string
  onTabChange: (tabId: string) => void
  onOpenFileSidebar: () => void
  onOpenAssistant: () => void
  userInfo: UserInfo | null
}

export function MobileWorkspaceHeader({
  activeLeftPanelTab,
  onTabChange,
  onOpenFileSidebar,
  onOpenAssistant,
  userInfo,
}: MobileWorkspaceHeaderProps) {
  const tabs = [
    { id: 'files', icon: Folder, label: 'Files' },
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'meetings', icon: Video, label: 'Meetings' },
    ...(userInfo?.username === 'mmills' || userInfo?.username === 'mmills6060@gmail.com'
      ? [{ id: 'admin', icon: UserCog, label: 'Admin' }]
      : []),
  ]

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          /* Ensure buttons in mobile header are touch-friendly */
          button[class*="h-11"] {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="px-2 py-1.5 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between w-full touch-target bg-background">
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeLeftPanelTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  onOpenFileSidebar()
                }}
                className={`flex items-center justify-center h-8 w-8 min-h-[32px] min-w-[32px] rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-foreground'
                }`}
                title={tab.label}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0"
            onClick={onOpenAssistant}
            title="Assistant"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}
