import { useRouter } from 'next/router'
import { EmailTab } from "./components/EmailTab/EmailTab"
import { CalendarTab } from "./components/CalendarTab/CalendarTab"
import { FilesTab } from "./components/FilesTab/FilesTab"
import { TasksTab } from "./components/TasksTab/TasksTab"
import { MeetingsTab } from "./components/MeetingsTab/MeetingsTab"
import { MapsTab } from "./components/MapsTab/MapsTab"
import { DatabasesTab } from "./components/DatabasesTab/DatabasesTab"
import { FlowsTab } from "./components/FlowsTab/FlowsTab"
import { FileSystemItem } from "../../utils/fileTreeUtils"
import { Task } from "../../pages/TaskStudio/types"
import { MeetingSession } from "../../types/meeting-types"
import { FlowItem } from "../../pages/Workspaces/types"
import { adminTabs } from './components/AdminTabs/adminTabConfig'

import { OpenDatabaseTablePayload, PanelGroup, UserInfo } from '../../pages/Workspaces/types'

interface AppSidebarProps {
  userInfo?: UserInfo | null
  activeTab?: string
  onAdminTabClick?: (tabId: string) => void
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number
  onFolderCreated?: (folderPath: string) => void
  triggerRootFolderCreation?: boolean
  onOpenCalendar?: () => void
  onOpenFiles?: () => void
  onOpenEmailInbox?: () => void
  selectedTask?: Task | null
  selectedMeeting?: MeetingSession | null
  meetingsRefreshTrigger?: number
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
  setSelectedFile?: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
  triggerSidebarRefresh?: () => void
  toast?: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
  setSelectedEmail?: React.Dispatch<React.SetStateAction<any | null>>
  setReplyToEmail?: React.Dispatch<React.SetStateAction<any>>
  setCalendarJumpDate?: React.Dispatch<React.SetStateAction<Date | null>>
  setCalendarSelectedEvent?: React.Dispatch<React.SetStateAction<any | null>>
  setSelectedTask?: React.Dispatch<React.SetStateAction<Task | null>>
  setSelectedMeeting?: React.Dispatch<React.SetStateAction<MeetingSession | null>>
  onOpenDatabaseTable?: (payload: OpenDatabaseTablePayload) => void
  selectedFlow?: FlowItem | null
  setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowItem | null>>
  onFlowSelect?: (flow: FlowItem) => void
  eagerMountWorkspaceTabs?: boolean
}

const eagerWorkspaceTabs = ['email', 'calendar', 'tasks', 'meetings', 'maps', 'databases', 'flows']

export function LeftPanel({ 
  userInfo, 
  activeTab, 
  onAdminTabClick, 
  selectedFile, 
  onRefreshComplete, 
  refreshTrigger, 
  onFolderCreated, 
  triggerRootFolderCreation, 
  onOpenCalendar,
  onOpenFiles,
  onOpenEmailInbox,
  selectedTask, 
  selectedMeeting, 
  meetingsRefreshTrigger,
  activePanelId,
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setSelectedFile,
  triggerSidebarRefresh,
  toast,
  setSelectedEmail,
  setReplyToEmail,
  setCalendarJumpDate,
  setCalendarSelectedEvent,
  setSelectedTask,
  setSelectedMeeting,
  onOpenDatabaseTable,
  selectedFlow,
  setSelectedFlow,
  onFlowSelect,
  eagerMountWorkspaceTabs = false,
}: AppSidebarProps) {
  const router = useRouter()
  const currentActiveTab = activeTab || 'files'
  const shouldRenderTab = (tabId: string) => currentActiveTab === tabId || (eagerMountWorkspaceTabs && eagerWorkspaceTabs.includes(tabId))
  const getTabClassName = (tabId: string) => currentActiveTab === tabId
    ? 'flex-1 flex flex-col mt-0 overflow-hidden'
    : 'hidden'

  return (
    <div className="h-full w-full bg-card border-r border-zinc-200 dark:border-white/[0.06] flex flex-col relative z-10 shadow-soft left-panel-container">
      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {shouldRenderTab('files') && (
          <div className={getTabClassName('files')}>
            <FilesTab
              userInfo={userInfo}
              selectedFile={selectedFile}
              onRefreshComplete={onRefreshComplete}
              refreshTrigger={refreshTrigger}
              onFolderCreated={onFolderCreated}
              triggerRootFolderCreation={triggerRootFolderCreation}
              onCreateFolder={undefined}
              onOpenFilesApp={onOpenFiles}
              activePanelId={activePanelId || 'main-panel'}
              panelLayout={panelLayout!}
              setPanelLayout={setPanelLayout!}
              setActivePanelId={setActivePanelId!}
              setSelectedFile={setSelectedFile!}
              triggerSidebarRefresh={triggerSidebarRefresh || (() => {})}
              toast={toast || (() => {})}
            />
          </div>
        )}

        {shouldRenderTab('email') && (
          <div className={getTabClassName('email')}>
            <EmailTab 
              onOpenEmailApp={() => router.push('/email')}
              onOpenEmailInbox={onOpenEmailInbox}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setSelectedEmail={setSelectedEmail}
              setReplyToEmail={setReplyToEmail}
            />
          </div>
        )}

        {shouldRenderTab('calendar') && (
          <div className={getTabClassName('calendar')}>
            <CalendarTab 
              onOpenCalendarApp={onOpenCalendar}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setCalendarJumpDate={setCalendarJumpDate}
              setCalendarSelectedEvent={setCalendarSelectedEvent}
            />
          </div>
        )}

        {shouldRenderTab('tasks') && (
          <div className={getTabClassName('tasks')}>
            <TasksTab
              selectedTask={selectedTask}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setSelectedTask={setSelectedTask}
            />
          </div>
        )}

        {shouldRenderTab('meetings') && (
          <div className={getTabClassName('meetings')}>
            <MeetingsTab
              selectedMeeting={selectedMeeting}
              refreshTrigger={meetingsRefreshTrigger}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setSelectedMeeting={setSelectedMeeting}
            />
          </div>
        )}

        {shouldRenderTab('maps') && (
          <div className={getTabClassName('maps')}>
            <MapsTab
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
            />
          </div>
        )}

        {shouldRenderTab('databases') && (
          <div className={getTabClassName('databases')}>
            <DatabasesTab
              onOpenDatabaseTable={payload => onOpenDatabaseTable?.(payload)}
              toast={toast || (() => {})}
            />
          </div>
        )}

        {shouldRenderTab('flows') && (
          <div className={getTabClassName('flows')}>
            <FlowsTab
              selectedFlow={selectedFlow}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setSelectedFlow={setSelectedFlow}
              onFlowSelect={onFlowSelect}
            />
          </div>
        )}

        {currentActiveTab === 'admin' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <div className="h-full w-full bg-card">
              {/* Admin Header */}
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/[0.06]">
                <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
              </div>

              {/* Admin Tab Navigation */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col p-2 gap-1">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => onAdminTabClick?.(tab.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-foreground"
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
