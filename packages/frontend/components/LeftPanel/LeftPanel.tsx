import { useRouter } from 'next/router'
import { EmailTab } from "./components/EmailTab/EmailTab"
import { CalendarTab } from "./components/CalendarTab/CalendarTab"
import { FilesTab } from "./components/FilesTab/FilesTab"
import { TasksTab } from "./components/TasksTab/TasksTab"
import { MeetingsTab } from "./components/MeetingsTab/MeetingsTab"
import { FileSystemItem } from "../../utils/fileTreeUtils"
import { Task } from "../../pages/TaskStudio/types"
import { MeetingSession } from "../../types/meeting-types"
import { adminTabs } from './components/AdminTabs/adminTabConfig'

import { PanelGroup, UserInfo } from '../../pages/Workspaces/types'

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
  selectedTask?: Task | null
  selectedMeeting?: MeetingSession | null
  meetingsRefreshTrigger?: number
  // Workspace dependencies for FilesTab
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
  setSelectedFile?: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
  triggerSidebarRefresh?: () => void
  toast?: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
  // Workspace dependencies for EmailTab
  setSelectedEmail?: React.Dispatch<React.SetStateAction<any | null>>
  setReplyToEmail?: React.Dispatch<React.SetStateAction<any>>
  // Workspace dependencies for CalendarTab
  setCalendarJumpDate?: React.Dispatch<React.SetStateAction<Date | null>>
  setCalendarSelectedEvent?: React.Dispatch<React.SetStateAction<any | null>>
  // Workspace dependencies for TasksTab
  setSelectedTask?: React.Dispatch<React.SetStateAction<Task | null>>
  // Workspace dependencies for MeetingsTab
  setSelectedMeeting?: React.Dispatch<React.SetStateAction<MeetingSession | null>>
}

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
  setSelectedMeeting
}: AppSidebarProps) {
  const router = useRouter()
  const currentActiveTab = activeTab || 'files'

  return (
    <div className="h-full w-full bg-card border-r border-zinc-200 dark:border-white/[0.06] flex flex-col relative z-10 shadow-soft left-panel-container">
      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentActiveTab === 'files' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <FilesTab
              userInfo={userInfo}
              selectedFile={selectedFile}
              onRefreshComplete={onRefreshComplete}
              refreshTrigger={refreshTrigger}
              onFolderCreated={onFolderCreated}
              triggerRootFolderCreation={triggerRootFolderCreation}
              onCreateFolder={undefined}
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

        {currentActiveTab === 'email' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <EmailTab 
              onOpenEmailApp={() => router.push('/email')}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setSelectedEmail={setSelectedEmail}
              setReplyToEmail={setReplyToEmail}
            />
          </div>
        )}

        {currentActiveTab === 'calendar' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
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

        {currentActiveTab === 'tasks' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
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

        {currentActiveTab === 'meetings' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
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
