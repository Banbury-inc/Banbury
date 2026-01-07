import { useRouter } from 'next/router'
import { EmailTab } from "./components/EmailTab"
import { CalendarTab } from "./components/CalendarTab"
import { FilesTab } from "./components/FilesTab/FilesTab"
import { TasksTab } from "./components/TasksTab/TasksTab"
import { MeetingsTab } from "./components/MeetingsTab/MeetingsTab"
import { FileSystemItem } from "../../utils/fileTreeUtils"
import { Task } from "../../pages/TaskStudio/types"
import { MeetingSession } from "../../types/meeting-types"
import { adminTabs } from './components/AdminTabs/adminTabConfig'

interface AppSidebarProps {
  currentView: 'dashboard' | 'workspaces'
  userInfo?: {
    username: string
    email?: string
  } | null
  activeTab?: string
  onTabChange?: (tab: string) => void
  onAdminTabClick?: (tabId: string) => void
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFileMoved?: (fileId: string, oldPath: string, newPath: string) => void
  onFolderCreated?: (folderPath: string) => void
  onFolderRenamed?: (oldPath: string, newPath: string) => void
  onFolderDeleted?: (folderPath: string) => void
  triggerRootFolderCreation?: boolean
  onEmailSelect?: (email: any) => void
  onComposeEmail?: () => void
  onCreateDocument?: (documentName: string) => void
  onCreateSpreadsheet?: (spreadsheetName: string) => void
  onCreateNotebook?: (notebookName: string) => void
  onCreateDrawio?: (diagramName: string) => void
  onCreateTldraw?: (drawingName: string) => void
  onCreatePowerpoint?: (presentationName: string) => void
  onCreateFolder?: () => void
  onGenerateImage?: () => void
  onEventSelect?: (event: any) => void
  onOpenCalendar?: () => void
  onTaskSelect?: (task: Task) => void
  selectedTask?: Task | null
  onCreateTask?: () => void
  onMeetingSelect?: (meeting: MeetingSession) => void
  selectedMeeting?: MeetingSession | null
  onJoinMeeting?: () => void
}

export function LeftPanel({ currentView, userInfo, activeTab, onTabChange, onAdminTabClick, onFileSelect, selectedFile, onRefreshComplete, refreshTrigger, onFileDeleted, onFileRenamed, onFileMoved, onFolderCreated, onFolderRenamed, onFolderDeleted, triggerRootFolderCreation, onEmailSelect, onComposeEmail, onCreateDocument, onCreateSpreadsheet, onCreateNotebook, onCreateDrawio, onCreateTldraw, onCreatePowerpoint, onCreateFolder, onGenerateImage, onEventSelect, onOpenCalendar, onTaskSelect, selectedTask, onCreateTask, onMeetingSelect, selectedMeeting, onJoinMeeting }: AppSidebarProps) {
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
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onRefreshComplete={onRefreshComplete}
              refreshTrigger={refreshTrigger}
              onFileDeleted={onFileDeleted}
              onFileRenamed={onFileRenamed}
              onFileMoved={onFileMoved}
              onFolderCreated={onFolderCreated}
              onFolderRenamed={onFolderRenamed}
              onFolderDeleted={onFolderDeleted}
              triggerRootFolderCreation={triggerRootFolderCreation}
              onCreateDocument={onCreateDocument}
              onCreateSpreadsheet={onCreateSpreadsheet}
              onCreateNotebook={onCreateNotebook}
              onCreateDrawio={onCreateDrawio}
              onCreateTldraw={onCreateTldraw}
              onCreatePowerpoint={onCreatePowerpoint}
              onCreateFolder={onCreateFolder}
            />
          </div>
        )}

        {currentActiveTab === 'email' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <EmailTab 
              onOpenEmailApp={() => router.push('/email')} 
              onMessageSelect={onEmailSelect}
              onComposeEmail={onComposeEmail}
            />
          </div>
        )}

        {currentActiveTab === 'calendar' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <CalendarTab 
              onOpenCalendarApp={onOpenCalendar}
              onEventSelect={onEventSelect}
            />
          </div>
        )}

        {currentActiveTab === 'tasks' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <TasksTab
              onTaskSelect={onTaskSelect}
              selectedTask={selectedTask}
              onCreateTask={onCreateTask}
            />
          </div>
        )}

        {currentActiveTab === 'meetings' && (
          <div className="flex-1 flex flex-col mt-0 overflow-hidden">
            <MeetingsTab
              onMeetingSelect={onMeetingSelect}
              selectedMeeting={selectedMeeting}
              onJoinMeeting={onJoinMeeting}
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
