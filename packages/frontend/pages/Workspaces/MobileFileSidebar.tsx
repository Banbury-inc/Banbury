import { Sheet, SheetContent, SheetTitle } from '../../components/ui/sheet'
import { LeftPanel } from '../../components/LeftPanel/LeftPanel'
import { FileSystemItem } from '../../utils/fileTreeUtils'
import { CalendarEvent } from '../../../backend/api/calendar/calendar'
import { Task } from '../../pages/TaskStudio/types'
import { MeetingSession } from '../../types/meeting-types'
import { UserInfo } from './types'

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
  onFileSelect: (file: FileSystemItem) => void
  onFileDeleted: (fileId: string) => void
  onFileRenamed: (oldPath: string, newPath: string) => void
  onFileMoved: (fileId: string, oldPath: string, newPath: string) => void
  onFolderCreated: (folderPath: string) => void
  onFolderRenamed: (oldPath: string, newPath: string) => void
  onEmailSelect: (email: any) => void
  onComposeEmail: () => void
  onCreateDocument: (documentName: string) => Promise<void>
  onCreateSpreadsheet: (spreadsheetName: string) => Promise<void>
  onCreateNotebook: (notebookName: string) => Promise<void>
  onCreateDrawio: (diagramName: string) => Promise<void>
  onCreateTldraw: (canvasName: string) => Promise<void>
  onCreatePowerpoint: (presentationName: string) => Promise<void>
  onGenerateImage: () => Promise<void>
  onCreateFolder: () => void
  onEventSelect: (event: CalendarEvent) => void
  onOpenCalendar: () => void
  onTaskSelect: (task: Task) => void
  onCreateTask: () => void
  onMeetingSelect: (meeting: MeetingSession) => void
  onJoinMeeting: () => void
  onDesktopRecordingStarted: (data: { sessionId: string; windowId: string; platform: string; meetingTitle: string }) => void
  onClose: () => void
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
  onFileSelect,
  onFileDeleted,
  onFileRenamed,
  onFileMoved,
  onFolderCreated,
  onFolderRenamed,
  onEmailSelect,
  onComposeEmail,
  onCreateDocument,
  onCreateSpreadsheet,
  onCreateNotebook,
  onCreateDrawio,
  onCreateTldraw,
  onCreatePowerpoint,
  onGenerateImage,
  onCreateFolder,
  onEventSelect,
  onOpenCalendar,
  onTaskSelect,
  onCreateTask,
  onMeetingSelect,
  onJoinMeeting,
  onDesktopRecordingStarted,
  onClose,
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
              currentView="workspaces"
              userInfo={userInfo}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onAdminTabClick={(tabId) => {
                onAdminTabClick(tabId)
                onClose()
              }}
              onFileSelect={(file) => {
                onFileSelect(file)
                onClose()
              }}
              selectedFile={selectedFile}
              refreshTrigger={refreshTrigger}
              onFileDeleted={onFileDeleted}
              onFileRenamed={onFileRenamed}
              onFileMoved={onFileMoved}
              onFolderCreated={onFolderCreated}
              onFolderRenamed={onFolderRenamed}
              triggerRootFolderCreation={folderCreationTrigger}
              onEmailSelect={(email) => {
                onEmailSelect(email)
                onClose()
              }}
              onComposeEmail={onComposeEmail}
              onCreateDocument={onCreateDocument}
              onCreateSpreadsheet={onCreateSpreadsheet}
              onCreateNotebook={onCreateNotebook}
              onCreateDrawio={onCreateDrawio}
              onCreateTldraw={onCreateTldraw}
              onCreatePowerpoint={onCreatePowerpoint}
              onGenerateImage={onGenerateImage}
              onCreateFolder={onCreateFolder}
              onEventSelect={(event) => {
                onEventSelect(event)
                onClose()
              }}
              onOpenCalendar={() => {
                onOpenCalendar()
                onClose()
              }}
              onTaskSelect={(task) => {
                onTaskSelect(task)
                onClose()
              }}
              selectedTask={selectedTask}
              onCreateTask={() => {
                onCreateTask()
                onClose()
              }}
              onMeetingSelect={(meeting) => {
                onMeetingSelect(meeting)
                onClose()
              }}
              selectedMeeting={selectedMeeting}
              onJoinMeeting={() => {
                onJoinMeeting()
                onClose()
              }}
              onDesktopRecordingStarted={(data) => {
                onDesktopRecordingStarted(data)
                onClose()
              }}
              meetingsRefreshTrigger={meetingsRefreshTrigger}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}
