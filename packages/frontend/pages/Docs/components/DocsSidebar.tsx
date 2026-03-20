import { ChevronRight, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { Button } from '../../../components/common/ui/button'
import { Sheet, SheetContent, SheetTitle } from '../../../components/common/ui/sheet'
import { cn } from '../../../utils'
import {
  handleDocsSidebarItemNavigate,
  handleToggleDocsSidebarSection,
} from './handlers/docs-sidebar-nav'

interface SidebarSection {
  id: string
  title: string
  items: SidebarItem[]
}

interface SidebarItem {
  id: string
  title: string
  href: string
}

interface DocsSidebarProps {
  activeSection?: string
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

const sections: SidebarSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'what-is-banbury', title: 'What is Banbury?', href: '/docs/what-is-banbury' },
      { id: 'using-banbury', title: 'Using Banbury', href: '/docs/using-banbury' },
      { id: 'desktop-app', title: 'Desktop App', href: '/docs/desktop-app' },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    items: [
      { id: 'features', title: 'Overview', href: '/docs/features' },
      { id: 'agent-modes', title: 'Agent Modes', href: '/docs/agent-modes' },
      { id: 'parallel-agents', title: 'Parallel Agents', href: '/docs/parallel-agents' },
      { id: 'queued-messages', title: 'Queued Messages', href: '/docs/queued-messages' },
      { id: 'video-generation', title: 'Video Generation', href: '/docs/video-generation' },
      { id: 'gmail-feature', title: 'Gmail', href: '/docs/gmail-feature' },
      { id: 'docs-feature', title: 'Docs', href: '/docs/docs-feature' },
      { id: 'spreadsheets-feature', title: 'Spreadsheets', href: '/docs/spreadsheets-feature' },
      { id: 'powerpoint-feature', title: 'PowerPoint', href: '/docs/powerpoint-feature' },
      { id: 'context-wheel', title: 'Context Wheel', href: '/docs/context-wheel' },
      { id: 'calendar-feature', title: 'Calendar', href: '/docs/calendar-feature' },
      { id: 'meeting-agent-feature', title: 'Meetings', href: '/docs/meeting-agent-feature' },
      { id: 'folders-feature', title: 'Folders', href: '/docs/folders-feature' },
      { id: 'browse-feature', title: 'Browse', href: '/docs/browse-feature' },
      { id: 'databases', title: 'Databases', href: '/docs/databases' },
      { id: 'canvas-feature', title: 'Canvas', href: '/docs/canvas-feature' },
      { id: 'file-sharing', title: 'File Sharing', href: '/docs/file-sharing' },
    ],
  },
  {
    id: 'contextual-knowledge',
    title: 'Contextual Knowledge',
    items: [
      { id: 'knowledge-graph', title: 'Knowledge Graph', href: '/docs/knowledge-graph' },
      { id: 'memories', title: 'Memories', href: '/docs/memories' },
    ],
  },
  {
    id: 'automating-workflows',
    title: 'Automating Workflows',
    items: [
      { id: 'task-studio', title: 'Task Studio', href: '/docs/task-studio' },
      { id: 'flows', title: 'Flows', href: '/docs/flows' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    items: [
      { id: 'integrations', title: 'Overview', href: '/docs/integrations' },
      { id: 'gmail', title: 'Gmail', href: '/docs/gmail' },
      { id: 'google-docs', title: 'Google Docs', href: '/docs/google-docs' },
      { id: 'google-sheets', title: 'Google Sheets', href: '/docs/google-sheets' },
      { id: 'outlook', title: 'Outlook', href: '/docs/outlook' },
      { id: 'microsoft-calendar', title: 'Microsoft Calendar', href: '/docs/microsoft-calendar' },
      { id: 'onedrive', title: 'OneDrive', href: '/docs/onedrive' },
      { id: 'x', title: 'X (Twitter)', href: '/docs/x' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [{ id: 'billing', title: 'Billing', href: '/docs/billing' }],
  },
]

function DocsSidebar({
  activeSection,
  mobileOpen,
  onMobileOpenChange,
}: DocsSidebarProps): JSX.Element {
  const router = useRouter()

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(['account', ...sections.map((section) => section.id)]),
  )

  const navBody = (
    <ul className="flex list-none flex-col gap-0.5 p-0">
      {sections.map((section) => (
        <li key={section.id} className="flex flex-col">
          <button
            type="button"
            onClick={() =>
              handleToggleDocsSidebarSection(section.id, setExpandedSections)
            }
            className="flex w-full items-center gap-2 rounded-md py-2.5 ps-2 pe-2 text-left text-foreground transition-colors hover:bg-accent/80"
          >
            <span className="flex-1 text-xs font-medium">{section.title}</span>
            <ChevronRight
              className={cn(
                'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                expandedSections.has(section.id) && 'rotate-90',
              )}
              aria-hidden
            />
          </button>

          {expandedSections.has(section.id) ? (
            <ul className="mt-0.5 mb-1 flex list-none flex-col gap-0.5 border-l border-border ps-3">
              {section.items.map((item) => {
                const isActive = activeSection === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        handleDocsSidebarItemNavigate({
                          href: item.href,
                          router,
                          onMobileOpenChange,
                        })
                      }
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex min-h-9 w-full items-center rounded px-2 py-2 text-left text-sm transition-colors md:min-h-8 md:py-1.5 md:text-xs',
                        isActive
                          ? 'bg-accent font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      {item.title}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="flex h-full w-[280px] max-w-[85vw] flex-col gap-0 border-r border-border bg-background p-0 sm:max-w-[280px] [&>button]:hidden md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <SheetTitle className="text-base font-semibold text-foreground">
              Documentation
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onMobileOpenChange(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{navBody}</div>
        </SheetContent>
      </Sheet>

      <aside
        className="fixed top-[70px] left-0 z-[1000] hidden h-[calc(100vh-70px)] min-h-[calc(100vh-70px)] w-[280px] min-w-[280px] overflow-y-auto border-r border-border bg-muted/20 md:block"
        aria-label="Documentation"
      >
        <div className="p-4">
          <p className="mb-3 text-base font-semibold text-foreground">
            Documentation
          </p>
          {navBody}
        </div>
      </aside>
    </>
  )
}

export default DocsSidebar
