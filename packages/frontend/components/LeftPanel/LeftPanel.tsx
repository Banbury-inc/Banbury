import { 
  Folder, 
  Mail,
  Calendar as CalendarIcon,
} from "lucide-react"
import { useRouter } from 'next/router'
import { useState } from 'react'
import { EmailTab } from "./components/EmailTab"
import { CalendarTab } from "./components/CalendarTab"
import { FilesTab } from "./components/FilesTab/FilesTab"
import { FileSystemItem } from "../../utils/fileTreeUtils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/old-tabs"
import { Typography } from "../ui/typography"

interface AppSidebarProps {
  currentView: 'dashboard' | 'workspaces'
  userInfo?: {
    username: string
    email?: string
  } | null
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
  onCreateFolder?: () => void
  onGenerateImage?: () => void
  onEventSelect?: (event: any) => void
  onOpenCalendar?: () => void
}

export function LeftPanel({ currentView, userInfo, onFileSelect, selectedFile, onRefreshComplete, refreshTrigger, onFileDeleted, onFileRenamed, onFileMoved, onFolderCreated, onFolderRenamed, onFolderDeleted, triggerRootFolderCreation, onEmailSelect, onComposeEmail, onCreateDocument, onCreateSpreadsheet, onCreateNotebook, onCreateDrawio, onCreateTldraw, onCreateFolder, onGenerateImage, onEventSelect, onOpenCalendar }: AppSidebarProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('files')

  return (
    <div className="h-full w-full bg-background border-r border-zinc-200 dark:border-white/[0.06] flex flex-col relative z-10 shadow-soft left-panel-container">
      {/* Search Bar - Above tabs */}
      {/* {onFileSelect && (
        <div className="px-4 py-3 bg-background border-b border-zinc-200 dark:border-white/[0.06]">
          <InlineFileSearch
            onFileSelect={onFileSelect}
            onEmailSelect={onEmailSelect} />
        </div>
      )} */}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 tab-list-responsive">
          <TabsTrigger value="files" className="flex items-center justify-center min-w-0" title="Files">
            <Folder className="h-4 w-4 flex-shrink-0" strokeWidth={1} />
            <Typography
              variant="small"
              className="text-sm font-medium ml-2 tab-label"
            >
              Files
            </Typography>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center justify-center min-w-0" title="Email">
            <Mail className="h-4 w-4 flex-shrink-0" strokeWidth={1} />
            <Typography
              variant="small"
              className="text-sm ml-2 tab-label"
            >
              Email
            </Typography>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center justify-center min-w-0" title="Calendar">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" strokeWidth={1} />
            <Typography
              variant="small"
              className="text-sm ml-2 tab-label"
            >
              Calendar
            </Typography>
          </TabsTrigger>
        </TabsList>
        
        <style>{`
          /* Container query setup */
          .left-panel-container {
            container-type: inline-size;
            container-name: left-panel;
          }
          
          /* Hide labels when panel width is less than 240px */
          @container left-panel (max-width: 240px) {
            .tab-label {
              display: none !important;
            }
            .tab-list-responsive button {
              padding-left: 0.5rem;
              padding-right: 0.5rem;
            }
          }
        `}</style>

        {activeTab === 'files' && (
          <TabsContent value="files" className="flex-1 flex flex-col mt-0 overflow-hidden">
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
              onCreateFolder={onCreateFolder}
            />
          </TabsContent>
        )}
        
        {activeTab === 'email' && (
          <TabsContent value="email" className="flex-1 flex flex-col mt-0 overflow-hidden">
            <EmailTab 
              onOpenEmailApp={() => router.push('/email')} 
              onMessageSelect={onEmailSelect}
              onComposeEmail={onComposeEmail}
            />
          </TabsContent>
        )}
        
        {activeTab === 'calendar' && (
          <TabsContent value="calendar" className="flex-1 flex flex-col mt-0 overflow-hidden">
            <CalendarTab 
              onOpenCalendarApp={onOpenCalendar}
              onEventSelect={onEventSelect}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
