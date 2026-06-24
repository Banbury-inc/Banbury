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
  adminTabType: 'overview' | 'users' | 'analytics-overview' | 'visitors' | 'marketing' | 'conversations' | 'filetypes' | 'api-usage' | 'engagement' | 'retention' | 'features' | 'errors'
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

export interface TerminalTab {
  id: string
  title: string
  type: 'terminal'
  cwd?: string
}

export type DatabaseProvider = 'postgres' | 'mysql' | 'mongodb'

export interface DatabaseSshConfig {
  enabled: boolean
  host: string
  port: number
  username: string
  authMethod: 'password' | 'publicKey'
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface DatabaseConnectionConfig {
  provider: DatabaseProvider
  uri?: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  ssh?: DatabaseSshConfig
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

export interface FlowNode {
  id: string
  type?: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  [key: string]: unknown
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  [key: string]: unknown
}

export type FlowSchedulePattern =
  | 'every_minute'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom_interval'

export interface FlowSchedule {
  schedule_enabled: boolean
  schedule_pattern: FlowSchedulePattern | null
  schedule_time: string | null
  schedule_days_of_week: number[] | null
  schedule_day_of_month: number | null
  schedule_interval_minutes: number | null
  schedule_timezone: string
  schedule_next_run: string | null
  schedule_end_date: string | null
  schedule_last_triggered: string | null
}

export interface FlowItem {
  id: string
  name: string
  graph_json: { nodes: FlowNode[]; edges: FlowEdge[]; viewport?: { x: number; y: number; zoom: number } }
  created_at: string
  updated_at: string
  last_run_status?: 'pending' | 'running' | 'success' | 'failed' | null
  last_run_at?: string | null
  schedule_enabled?: boolean
  schedule_pattern?: FlowSchedulePattern | null
  schedule_time?: string | null
  schedule_days_of_week?: number[] | null
  schedule_day_of_month?: number | null
  schedule_interval_minutes?: number | null
  schedule_timezone?: string
  schedule_next_run?: string | null
  schedule_end_date?: string | null
  schedule_last_triggered?: string | null
}

export interface FlowTab {
  id: string
  flowId: string
  title: string
  flow: FlowItem | null
  type: 'flow'
}

export interface MapPlace {
  id: string
  name: string
  longitude: number
  latitude: number
  zoom: number
  is_favorite: boolean
  drawings?: MapDrawingFeatureCollection
  last_visited_at?: string
  created_at?: string
}

export type MapDrawingGeometryType = 'Point' | 'LineString' | 'Polygon'

export type MapDrawingCoordinates =
  | [number, number]
  | [number, number][]
  | [number, number][][]

export interface MapDrawingGeometry {
  type: MapDrawingGeometryType
  coordinates: MapDrawingCoordinates
}

export interface MapDrawingMeasurement {
  label: string
  value: number
  unit: 'm' | 'km' | 'm2' | 'km2'
}

export interface MapDrawingProperties {
  id?: string
  label?: string
  measurement?: MapDrawingMeasurement
  [key: string]: unknown
}

export interface MapDrawingFeature {
  id?: string
  type: 'Feature'
  geometry: MapDrawingGeometry
  properties: MapDrawingProperties
}

export interface MapDrawingFeatureCollection {
  type: 'FeatureCollection'
  features: MapDrawingFeature[]
}

export interface MapPlaceLocation {
  id?: string
  name?: string
  address?: string
  categories?: string[]
  mapboxId?: string
  longitude: number
  latitude: number
  zoom: number
  drawings?: MapDrawingFeatureCollection
}

export interface MapTab {
  id: string
  title: string
  type: 'map'
  place?: MapPlaceLocation | null
  highlightedPlaces?: MapPlaceLocation[]
}

export interface ImageUrlTab {
  id: string
  title: string
  type: 'image-url'
  imageUrl: string
  alt: string
}

export interface ImageUrlTabPayload {
  imageUrl: string
  title: string
  alt: string
}

export type WorkspaceTab = FileTab | EmailTab | CalendarTab | AiTab | TaskTab | MeetingTab | AdminTab | FileBrowserTab | EmailInboxTab | TerminalTab | DatabaseTableTab | FlowTab | MapTab | ImageUrlTab

export interface Panel {
  id: string
  tabs: WorkspaceTab[]
  activeTabId: string | null
}

export type SplitDirection = 'horizontal' | 'vertical'
export type SplitPlacement = 'before' | 'after'

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
export type WorkspaceLeftPanelTabId = 'files' | 'email' | 'calendar' | 'tasks' | 'meetings' | 'maps' | 'databases' | 'flows' | 'admin'
export type AdminTabId =
  | 'admin-overview'
  | 'admin-users'
  | 'admin-analytics-overview'
  | 'admin-visitors'
  | 'admin-marketing'
  | 'admin-conversations'
  | 'admin-filetypes'
  | 'admin-api-usage'
  | 'admin-engagement'
  | 'admin-retention'
  | 'admin-features'
  | 'admin-errors'
export type LeftPanelTabId = WorkspaceLeftPanelTabId | AdminTabId

