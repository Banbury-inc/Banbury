import { FileSystemItem } from '../../utils/fileTreeUtils'
import { Task } from '../../pages/TaskStudio/types'
import { MeetingSession } from '../../types/meeting-types'

export interface UserInfo {
  username: string
  email?: string
  first_name?: string
  last_name?: string
  picture?: any
  phone_number?: string
  auth_method?: string
}

export interface FileTab {
  id: string
  fileName: string
  filePath: string
  fileType: string
  file: FileSystemItem
  type: 'file'
}

export interface EmailTab {
  id: string
  subject: string
  emailId: string
  email: any // Gmail message object
  type: 'email'
}

export interface CalendarTab {
  id: string
  title: string
  type: 'calendar'
}

export interface AiTab {
  id: string
  label: string
  type: 'ai'
  threadId: string // Stable identifier for conversation thread (used for todo list persistence)
}

export interface TaskTab {
  id: string
  taskId: string
  title: string
  task: Task | null // null for create task composer
  type: 'task'
}

export interface MeetingTab {
  id: string
  meetingId: string
  title: string
  meeting: MeetingSession | null // null for join meeting composer
  type: 'meeting'
}

export interface AdminTab {
  id: string
  adminTabType: 'overview' | 'users' | 'analytics-overview' | 'visitors' | 'conversations' | 'filetypes' | 'api-usage' | 'engagement' | 'retention' | 'features' | 'errors'
  title: string
  type: 'admin'
}

export interface FileBrowserTab {
  id: string
  title: string
  type: 'file-browser'
}

export interface EmailInboxTab {
  id: string
  title: string
  type: 'email-inbox'
  provider?: 'gmail' | 'outlook'
}

export type DatabaseProvider = 'postgres' | 'mysql' | 'mongodb'

export interface DatabaseConnectionConfig {
  provider: DatabaseProvider
  uri?: string
  host: string
  port: number
  username: string
  password: string
  database?: string
}

export interface DatabaseTableTab {
  id: string
  title: string
  type: 'database-table'
  provider: DatabaseProvider
  connection: DatabaseConnectionConfig
  database: string
  schema?: string
  table?: string
  collection?: string
}

export interface OpenDatabaseTablePayload {
  provider: DatabaseProvider
  connection: DatabaseConnectionConfig
  database: string
  schema?: string
  table?: string
  collection?: string
}

export type WorkspaceTab = FileTab | EmailTab | CalendarTab | AiTab | TaskTab | MeetingTab | AdminTab | FileBrowserTab | EmailInboxTab | DatabaseTableTab

export interface Panel {
  id: string
  tabs: WorkspaceTab[]
  activeTabId: string | null
}

export type SplitDirection = 'horizontal' | 'vertical'

export interface PanelGroup {
  id: string
  type: 'panel' | 'group'
  direction?: SplitDirection
  children?: PanelGroup[]
  panel?: Panel
  size?: number
}

export interface DragState {
  isDragging: boolean
  draggedTab: WorkspaceTab | null
  draggedFromPanel: string | null
  dragStartPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  dragDirection: 'horizontal' | 'vertical' | null
  dropZone: 'left' | 'right' | 'top' | 'bottom' | null
  dropTargetPanel: string | null
}

// Left panel tab types
export type WorkspaceLeftPanelTabId = 'files' | 'email' | 'calendar' | 'tasks' | 'meetings' | 'databases' | 'admin'
export type AdminTabId =
  | 'admin-overview'
  | 'admin-users'
  | 'admin-analytics-overview'
  | 'admin-visitors'
  | 'admin-conversations'
  | 'admin-filetypes'
  | 'admin-api-usage'
  | 'admin-engagement'
  | 'admin-retention'
  | 'admin-features'
  | 'admin-errors'
export type LeftPanelTabId = WorkspaceLeftPanelTabId | AdminTabId

