import { Menu } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { Button } from '../../components/common/ui/button'
import DocsSidebar from './components/DocsSidebar'
import WhatIsBanburyTab from './components/Tabs/WhatIsBanburyTab'
import FeaturesTab from './components/Tabs/FeaturesTab'
import UsingBanburyTab from './components/UsingBanbury'
import TaskStudioTab from './components/Tabs/TaskStudioTab'
import KnowledgeGraphTab from './components/Tabs/KnowledgeGraphTab'
import IntegrationsTab from './components/Tabs/IntegrationsTab'
import GmailTab from './components/Tabs/GmailTab'
import GoogleDocsTab from './components/Tabs/GoogleDocsTab'
import GoogleSheetsTab from './components/Tabs/GoogleSheetsTab'
import OutlookTab from './components/Tabs/OutlookTab'
import MicrosoftCalendarTab from './components/Tabs/MicrosoftCalendarTab'
import OneDriveTab from './components/Tabs/OneDriveTab'
import XTab from './components/Tabs/XTab'
import MemoriesTab from './components/Tabs/MemoriesTab'
import DocsFeatureTab from './components/Tabs/DocsFeatureTab'
import SpreadsheetsFeatureTab from './components/Tabs/SpreadsheetsFeatureTab'
import FoldersFeatureTab from './components/Tabs/FoldersFeatureTab'
import BrowseFeatureTab from './components/Tabs/BrowseFeatureTab'
import CalendarFeatureTab from './components/Tabs/CalendarFeatureTab'
import CanvasFeatureTab from './components/Tabs/CanvasFeatureTab'
import GmailFeatureTab from './components/Tabs/GmailFeatureTab'
import MeetingAgentFeatureTab from './components/Tabs/MeetingAgentFeatureTab'
import PowerPointFeatureTab from './components/Tabs/PowerPointFeatureTab'
import ContextWheelTab from './components/Tabs/ContextWheelTab'
import FileSharingTab from './components/Tabs/FileSharingTab'
import BillingTab from './components/Tabs/BillingTab'
import AgentModesTab from './components/Tabs/AgentModesTab'
import ParallelAgentsTab from './components/Tabs/ParallelAgentsTab'
import QueuedMessagesTab from './components/Tabs/QueuedMessagesTab'
import VideoGenerationTab from './components/Tabs/VideoGenerationTab'
import DesktopAppTab from './components/Tabs/DesktopAppTab'
import {
  handleDocsMobileOpenToggle,
  handleDocsMobileSheetOpenChange,
} from './handlers/docs-mobile-nav'

const Docs = () => {
  const router = useRouter()
  const section = router.query.section as string | undefined
  const activeSection = section || 'what-is-banbury'
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    function closeSheetOnDesktop() {
      if (mq.matches) setMobileOpen(false)
    }
    closeSheetOnDesktop()
    mq.addEventListener('change', closeSheetOnDesktop)
    return () => mq.removeEventListener('change', closeSheetOnDesktop)
  }, [])

  return (
    <div className="flex flex-col overflow-visible bg-background">
      <div className="sticky top-0 z-[100] flex items-center border-b border-border bg-muted/30 px-4 py-3 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="me-2 shrink-0 text-foreground"
          aria-label="Open navigation menu"
          onClick={() => handleDocsMobileOpenToggle(setMobileOpen)}
        >
          <Menu className="size-5" />
        </Button>
        <span className="text-sm font-medium text-foreground">
          Documentation
        </span>
      </div>

      <div className="flex min-h-[calc(100vh-120px)] flex-col md:h-[calc(100vh-200px)] md:min-h-[calc(100vh-200px)] md:flex-row">
        <DocsSidebar
          activeSection={activeSection}
          mobileOpen={mobileOpen}
          onMobileOpenChange={(open) =>
            handleDocsMobileSheetOpenChange(open, setMobileOpen)
          }
        />

        <div
          className="ms-0 min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:ms-[280px] md:min-h-[calc(100vh-70px)] md:h-[calc(100vh-70px)] md:px-8 md:py-6 [scrollbar-color:var(--muted-foreground)_var(--muted)] [scrollbar-width:thin]"
        >
          <div className="mx-auto max-w-[1800px]">
            {activeSection === 'what-is-banbury' && <WhatIsBanburyTab />}

            {activeSection === 'features' && <FeaturesTab />}

            {activeSection === 'using-banbury' && <UsingBanburyTab />}

            {activeSection === 'task-studio' && <TaskStudioTab />}

            {activeSection === 'knowledge-graph' && <KnowledgeGraphTab />}

            {activeSection === 'memories' && <MemoriesTab />}

            {activeSection === 'integrations' && <IntegrationsTab />}

            {activeSection === 'gmail' && <GmailTab />}

            {activeSection === 'google-docs' && <GoogleDocsTab />}

            {activeSection === 'google-sheets' && <GoogleSheetsTab />}

            {activeSection === 'outlook' && <OutlookTab />}

            {activeSection === 'microsoft-calendar' && <MicrosoftCalendarTab />}

            {activeSection === 'onedrive' && <OneDriveTab />}

            {activeSection === 'x' && <XTab />}

            {activeSection === 'docs-feature' && <DocsFeatureTab />}

            {activeSection === 'spreadsheets-feature' && (
              <SpreadsheetsFeatureTab />
            )}

            {activeSection === 'calendar-feature' && <CalendarFeatureTab />}

            {activeSection === 'folders-feature' && <FoldersFeatureTab />}

            {activeSection === 'browse-feature' && <BrowseFeatureTab />}

            {activeSection === 'canvas-feature' && <CanvasFeatureTab />}

            {activeSection === 'gmail-feature' && <GmailFeatureTab />}

            {activeSection === 'meeting-agent-feature' && (
              <MeetingAgentFeatureTab />
            )}

            {activeSection === 'powerpoint-feature' && (
              <PowerPointFeatureTab />
            )}

            {activeSection === 'context-wheel' && <ContextWheelTab />}

            {activeSection === 'file-sharing' && <FileSharingTab />}

            {activeSection === 'billing' && <BillingTab />}

            {activeSection === 'agent-modes' && <AgentModesTab />}

            {activeSection === 'parallel-agents' && <ParallelAgentsTab />}

            {activeSection === 'queued-messages' && <QueuedMessagesTab />}

            {activeSection === 'video-generation' && <VideoGenerationTab />}

            {activeSection === 'desktop-app' && <DesktopAppTab />}

            {!['what-is-banbury', 'features', 'using-banbury', 'task-studio', 'knowledge-graph', 'memories', 'integrations', 'gmail', 'google-docs', 'google-sheets', 'outlook', 'microsoft-calendar', 'onedrive', 'x', 'docs-feature', 'spreadsheets-feature', 'folders-feature', 'browse-feature', 'calendar-feature', 'canvas-feature', 'gmail-feature', 'meeting-agent-feature', 'powerpoint-feature', 'context-wheel', 'file-sharing', 'billing', 'agent-modes', 'parallel-agents', 'queued-messages', 'video-generation', 'desktop-app'].includes(activeSection) && (
              <WhatIsBanburyTab />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Docs
