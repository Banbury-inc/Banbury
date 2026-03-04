import { Sheet, SheetContent, SheetTitle } from '../../components/common/ui/sheet'
import { LeftPanel } from '../../components/LeftPanel/LeftPanel'
import { FileSystemItem } from '../../utils/fileTreeUtils'
import { CalendarEvent } from '../../../backend/api/calendar/calendar'
import { Task } from '../../pages/TaskStudio/types'
import { MeetingSession } from '../../types/meeting-types'
import { UserInfo, PanelGroup, OpenDatabaseTablePayload, FlowItem } from './types'

interface MobileFileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userInfo: UserInfo | null
  activeTab: string
  onTabChange: (tab: string) => void
  activePanelId: string
  selectedFile: FileSystemItem | null
  selectedTask: Task | null
  selectedMeeting: MeetingSession | null
  refreshTrigger: number
  folderCreationTrigger: boolean
  meetingsRefreshTrigger: number
  onAdminTabClick: (tabId: string) => void
  onFolderCreated: (folderPath: string) => void
  onEmailSelect: (email: any) => void
  onComposeEmail: () => void
  onEventSelect: (event: CalendarEvent) => void
  onOpenCalendar: () => void
  onTaskSelect: (task: Task) => void
  onCreateTask: () => void
  onMeetingSelect: (meeting: MeetingSession) => void
  onJoinMeeting: () => void
  onDesktopRecordingStarted: (data: { sessionId: string; windowId: string; platform: string; meetingTitle: string }) => void
  onOpenDatabaseTable: (payload: OpenDatabaseTablePayload) => void
  onClose: () => void
  // Workspace dependencies for FilesTab
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
  triggerSidebarRefresh: () => void
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
  // Workspace dependencies for EmailTab
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>
  setReplyToEmail: React.Dispatch<React.SetStateAction<any>>
  // Workspace dependencies for CalendarTab
  setCalendarJumpDate: React.Dispatch<React.SetStateAction<Date | null>>
  setCalendarSelectedEvent: React.Dispatch<React.SetStateAction<any | null>>
  // Workspace dependencies for TasksTab
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>
  // Workspace dependencies for MeetingsTab
  setSelectedMeeting: React.Dispatch<React.SetStateAction<MeetingSession | null>>
  // Workspace dependencies for FlowsTab
  selectedFlow?: FlowItem | null
  setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowItem | null>>
  onFlowSelect?: (flow: FlowItem) => void
}

export function MobileFileSidebar({
  open,
  onOpenChange,
  userInfo,
  activeTab,
  onTabChange,
  activePanelId,
  selectedFile,
  selectedTask,
  selectedMeeting,
  refreshTrigger,
  folderCreationTrigger,
  meetingsRefreshTrigger,
  onAdminTabClick,
  onFolderCreated,
  onEmailSelect,
  onComposeEmail,
  onEventSelect,
  onOpenCalendar,
  onTaskSelect,
  onCreateTask,
  onMeetingSelect,
  onJoinMeeting,
  onDesktopRecordingStarted,
  onOpenDatabaseTable,
  onClose,
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
  selectedFlow,
  setSelectedFlow,
  onFlowSelect,
}: MobileFileSidebarProps) {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          /* Mobile Sheet expanding animations - horizontal slide only */
          .mobile-sheet-expand[data-slot="sheet-content"][data-state="open"] {
            animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .mobile-sheet-expand[data-slot="sheet-content"][data-state="closed"] {
            animation: slideOutLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          @keyframes slideInRight {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOutLeft {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(-100%);
              opacity: 0;
            }
          }
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          /* Responsive typography */
          .mobile-text {
            font-size: 0.875rem;
            line-height: 1.5;
          }
        }
      `}</style>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[320px] sm:w-[360px] p-0 mobile-sheet-expand">
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 bg-card">
            <SheetTitle className="text-foreground mobile-text text-base font-semibold">Files</SheetTitle>
          </div>
          <div className="flex-1 overflow-hidden">
            <LeftPanel
              userInfo={userInfo}
              activeTab={activeTab}
              onAdminTabClick={(tabId) => {
                onAdminTabClick(tabId)
                onClose()
              }}
              selectedFile={selectedFile}
              refreshTrigger={refreshTrigger}
              onFolderCreated={onFolderCreated}
              triggerRootFolderCreation={folderCreationTrigger}
              onOpenCalendar={() => {
                onOpenCalendar()
                onClose()
              }}
              selectedTask={selectedTask}
              selectedMeeting={selectedMeeting}
              meetingsRefreshTrigger={meetingsRefreshTrigger}
              activePanelId={activePanelId}
              panelLayout={panelLayout}
              setPanelLayout={setPanelLayout}
              setActivePanelId={setActivePanelId}
              setSelectedFile={setSelectedFile}
              triggerSidebarRefresh={triggerSidebarRefresh}
              toast={toast}
              setSelectedEmail={setSelectedEmail}
              setReplyToEmail={setReplyToEmail}
              setCalendarJumpDate={setCalendarJumpDate}
              setCalendarSelectedEvent={setCalendarSelectedEvent}
              setSelectedTask={setSelectedTask}
              setSelectedMeeting={setSelectedMeeting}
              onOpenDatabaseTable={onOpenDatabaseTable}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
              onFlowSelect={onFlowSelect}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}
