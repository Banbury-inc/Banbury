import {
  Activity,
  Users,
  BarChart,
  Eye,
  Megaphone,
  MessageSquare,
  FileType
} from 'lucide-react'

export interface TabConfig {
  id: string
  label: string
  icon: any
}

export const workspaceTabs: TabConfig[] = [
  { id: 'files', icon: require('lucide-react').Folder, label: 'Files' },
  { id: 'email', icon: require('lucide-react').Mail, label: 'Email' },
  { id: 'calendar', icon: require('lucide-react').Calendar, label: 'Calendar' },
  { id: 'tasks', icon: require('lucide-react').CheckSquare, label: 'Tasks' },
  { id: 'meetings', icon: require('lucide-react').Video, label: 'Meetings' },
]

export const adminTabs: TabConfig[] = [
  { id: 'admin-overview', icon: Activity, label: 'Overview' },
  { id: 'admin-users', icon: Users, label: 'Users' },
  { id: 'admin-analytics-overview', icon: BarChart, label: 'Analytics' },
  { id: 'admin-visitors', icon: Eye, label: 'Visitors' },
  { id: 'admin-marketing', icon: Megaphone, label: 'Marketing' },
  { id: 'admin-conversations', icon: MessageSquare, label: 'AI Chats' },
  { id: 'admin-filetypes', icon: FileType, label: 'File Types' },
  { id: 'admin-api-usage', icon: BarChart, label: 'API Usage' },
  { id: 'admin-engagement', icon: Activity, label: 'Engagement' },
  { id: 'admin-retention', icon: Users, label: 'Retention' },
  { id: 'admin-features', icon: Activity, label: 'Features' },
  { id: 'admin-errors', icon: Activity, label: 'Errors' },
]
