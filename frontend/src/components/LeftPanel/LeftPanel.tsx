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
import InlineFileSearch from "./components/InlineFileSearch"
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
    <div className="h-full w-full bg-background border-r flex flex-col relative z-10">
      {/* Search Bar - Above tabs */}
      {onFileSelect && (
        <div className="px-4 py-2 bg-background border-b">
          <InlineFileSearch
            onFileSelect={onFileSelect}
            onEmailSelect={onEmailSelect} />
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="files" className="gap-2 flex items-center">
            <Folder className="h-4 w-4" />
            <Typography
              variant="small"
              className="text-sm font-medium"
            >
              Files
            </Typography>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2 flex items-center">
            <Mail className="h-4 w-4" />
            <Typography
              variant="small"
              className="text-sm"
            >
              Email
            </Typography>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 flex items-center">
            <CalendarIcon className="h-4 w-4" />
            <Typography
              variant="small"
              className="text-sm"
            >
              Calendar
            </Typography>
          </TabsTrigger>
        </TabsList>

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
