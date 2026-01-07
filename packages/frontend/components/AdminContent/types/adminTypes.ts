export interface User {
  _id: string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  auth_method?: string
  created_at?: string
  last_login?: string
  is_active?: boolean
  subscription?: string
  totalFiles?: number
  totalFileSize?: number
  lastFileUploadAt?: string
  aiMessageCount?: number
  lastAiMessageAt?: string
  loginCount?: number
  lastLoginDate?: string
  dashboardVisitCount?: number
  lastDashboardVisitDate?: string
  workspaceVisitCount?: number
  lastWorkspaceVisitDate?: string
  preferredAuthMethod?: string
  googleScopes?: string[]
  scopeCount?: number
  hasEmailScope?: boolean
  hasProfileScope?: boolean
  hasGmailScope?: boolean
  hasDriveScope?: boolean
  hasCalendarScope?: boolean
  hasContactsScope?: boolean
}

export interface SystemStats {
  totalUsers: number
  totalFiles: number
}

export interface VisitorData {
  _id: string
  ip_address: string
  time: string
  city: string
  region: string
  country: string
  path?: string
  client_timestamp?: string
  page_title?: string
  referrer_source?: string
  campaign_id?: string
  content_type?: string
  user_agent?: string
  device_type?: string
  tracking_version?: string
}

export interface VisitorStats {
  total_visitors: number
  recent_visitors: number
  period_days: number
  country_stats: Array<{_id: string, count: number}>
  city_stats: Array<{_id: string, count: number}>
  hourly_stats: Array<{_id: number, count: number}>
  daily_stats: Array<{date: string, count: number}>
  device_type_breakdown?: Record<string, number>
  browser_breakdown?: Record<string, number>
  os_breakdown?: Record<string, number>
  top_pages?: Record<string, number>
  unique_visitors?: number
  return_visitors?: number
  total_return_visits?: number
  referrer_breakdown?: Record<string, number>
  content_type_breakdown?: Record<string, number>
}

export interface LoginData {
  _id: string
  username: string
  user_id: string
  timestamp: string
  ip_address: string
  user_agent: string
  auth_method: string
}

export interface LoginStats {
  total_logins: number
  recent_logins: number
  period_days: number
  auth_method_stats: Array<{_id: string, count: number}>
  hourly_stats: Array<{_id: number, count: number}>
  daily_stats: Array<{date: string, count: number}>
  top_users_stats: Array<{_id: string, count: number}>
}

export interface GoogleScopesAnalytics {
  summary: {
    total_google_users: number
    users_with_scopes: number
    unique_scopes: number
    most_common_scope: string
    average_scopes_per_user: number
  }
  scope_stats: Array<{scope: string, count: number, percentage: number}>
  category_stats: Array<{category: string, count: number}>
  distribution_stats: Array<{scope_count: number, user_count: number}>
  users_with_scopes: Array<{user_id: string, username: string, email: string, scopes: string[], scope_count: number}>
}

export interface ConversationData {
  _id: string
  username: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
  last_message_at?: string
  messages: any[]
  metadata?: any
}

export interface ConversationsAnalytics {
  success: boolean
  conversations: ConversationData[]
  summary: {
    total_conversations: number
    unique_users: number
    total_messages: number
    avg_messages_per_conversation: number
    period_days: number
  }
  error?: string
}

export interface FileTypeStats {
  file_type: string
  category: string
  count: number
  size: number
}

export interface CategoryStats {
  category: string
  count: number
  size: number
}

export interface DailyFileStats {
  date: string
  count: number
  by_category: Record<string, number>
}

export interface FileTypeAnalytics {
  result: string
  summary: {
    total_files: number
    total_storage: number
    recent_files: number
    recent_storage: number
    unique_file_types: number
    unique_categories: number
    period_days: number
    most_common_type: string | null
    most_common_category: string | null
  }
  file_type_stats: FileTypeStats[]
  category_stats: CategoryStats[]
  recent_file_type_stats: FileTypeStats[]
  recent_category_stats: CategoryStats[]
  daily_stats: DailyFileStats[]
}

export interface ApiUsageAnalytics {
  result: string
  summary: {
    total_requests: number
    unique_endpoints: number
    avg_response_time: number
    error_rate: number
    period_days: number
  }
  endpoint_stats: Array<{
    endpoint: string
    count: number
    avg_response_time: number
    error_count: number
    p95_response_time: number
  }>
  daily_stats: Array<{date: string, count: number, avg_response_time: number}>
  hourly_stats: Array<{hour: number, count: number}>
  user_stats: Array<{username: string, count: number}>
}

export interface UserEngagementAnalytics {
  result: string
  summary: {
    total_sessions: number
    avg_session_duration: number
    total_active_time: number
    avg_active_time_per_session: number
  }
  daily_stats: Array<{date: string, sessions: number, active_time: number}>
  session_duration_distribution: Array<{range: string, count: number}>
}

export interface RetentionAnalytics {
  result: string
  dau: number
  wau: number
  mau: number
  retention_cohorts: Array<{cohort: string, day_0: number, day_7: number, day_30: number, total?: number}>
  daily_active_users: Array<{date: string, count: number}>
}

export interface FeatureUsageAnalytics {
  result: string
  summary: {
    total_feature_uses: number
    unique_features: number
    unique_users: number
  }
  feature_stats: Array<{feature: string, count: number, unique_users: number}>
  daily_stats: Array<{date: string, feature: string, count: number}>
}

export interface ErrorAnalytics {
  result: string
  summary: {
    total_errors: number
    error_rate: number
    unique_error_types: number
  }
  error_by_type: Array<{error_type: string, count: number}>
  error_by_endpoint: Array<{endpoint: string, count: number}>
  daily_error_stats: Array<{date: string, count: number}>
}
