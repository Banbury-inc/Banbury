import { 
  Users, 
  Activity, 
  RefreshCw,
  BarChart,
  Eye,
  MessageSquare,
  FileType,
  Menu,
  ArrowLeft,
  FolderOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { NavSidebar } from '../../components/nav-sidebar'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { ApiService } from '../../../backend/api/apiService'
import { UsersTab } from './UsersTab'
import { AnalyticsTab } from './AnalyticsTab'
import { handleTabSelect } from './handlers/admin-mobile-nav'

// Utility function to convert UTC timestamp to Eastern time
const convertToEasternTime = (timestamp: string): string => {
  try {
    // All timestamps from backend are now in UTC
    // If no timezone info, assume UTC and add 'Z'
    const utcTimestamp = timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-') 
      ? timestamp 
      : timestamp + 'Z'
    
    const date = new Date(utcTimestamp)
    
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error converting timestamp to Eastern time:', error)
    return timestamp // Fallback to original timestamp
  }
}

// Utility function to format bytes into human readable format
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

interface User {
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
  // Individual scope flags
  hasEmailScope?: boolean
  hasProfileScope?: boolean
  hasGmailScope?: boolean
  hasDriveScope?: boolean
  hasCalendarScope?: boolean
  hasContactsScope?: boolean
}

interface SystemStats {
  totalUsers: number
  totalFiles: number
}

interface VisitorData {
  _id: string
  ip_address: string
  time: string
  city: string
  region: string
  country: string
  path?: string
  client_timestamp?: string
  // Enhanced tracking fields
  page_title?: string
  referrer_source?: string
  campaign_id?: string
  content_type?: string
  user_agent?: string
  device_type?: string
  tracking_version?: string
}

interface VisitorStats {
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

interface LoginData {
  _id: string
  username: string
  user_id: string
  timestamp: string
  ip_address: string
  user_agent: string
  auth_method: string
}

interface LoginStats {
  total_logins: number
  recent_logins: number
  period_days: number
  auth_method_stats: Array<{_id: string, count: number}>
  hourly_stats: Array<{_id: number, count: number}>
  daily_stats: Array<{date: string, count: number}>
  top_users_stats: Array<{_id: string, count: number}>
}

interface GoogleScopesAnalytics {
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

interface ConversationData {
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

interface ConversationsAnalytics {
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

interface FileTypeStats {
  file_type: string
  category: string
  count: number
  size: number
}

interface CategoryStats {
  category: string
  count: number
  size: number
}

interface DailyFileStats {
  date: string
  count: number
  by_category: Record<string, number>
}

interface FileTypeAnalytics {
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

interface ApiUsageAnalytics {
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

interface UserEngagementAnalytics {
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

interface RetentionAnalytics {
  result: string
  dau: number
  wau: number
  mau: number
  retention_cohorts: Array<{cohort: string, day_0: number, day_7: number, day_30: number, total?: number}>
  daily_active_users: Array<{date: string, count: number}>
}

interface FeatureUsageAnalytics {
  result: string
  summary: {
    total_feature_uses: number
    unique_features: number
    unique_users: number
  }
  feature_stats: Array<{feature: string, count: number, unique_users: number}>
  daily_stats: Array<{date: string, feature: string, count: number}>
}

interface ErrorAnalytics {
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

export default function Admin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0
  })
  const [username, setUsername] = useState<string>('')
  const [visitorData, setVisitorData] = useState<VisitorData[]>([])
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null)
  const [visitorLoading, setVisitorLoading] = useState(false)
  const [visitorPage, setVisitorPage] = useState<number>(1)
  const [visitorPageSize] = useState<number>(20)
  const [loginData, setLoginData] = useState<LoginData[]>([])
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [scopesAnalytics, setScopesAnalytics] = useState<GoogleScopesAnalytics | null>(null)
  const [scopesLoading, setScopesLoading] = useState(false)
  const [conversationsAnalytics, setConversationsAnalytics] = useState<ConversationsAnalytics | null>(null)
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [conversationUserFilter, setConversationUserFilter] = useState<string>('')
  const [conversationUsers, setConversationUsers] = useState<string[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [dashboardVisitStats, setDashboardVisitStats] = useState<any>(null)
  const [dashboardVisitLoading, setDashboardVisitLoading] = useState(false)
  const [workspaceVisitStats, setWorkspaceVisitStats] = useState<any>(null)
  const [workspaceVisitLoading, setWorkspaceVisitLoading] = useState(false)
  const [fileTypeAnalytics, setFileTypeAnalytics] = useState<FileTypeAnalytics | null>(null)
  const [fileTypeLoading, setFileTypeLoading] = useState(false)
  const [excludedUsers, setExcludedUsers] = useState<string[]>([])
  const [apiUsageAnalytics, setApiUsageAnalytics] = useState<ApiUsageAnalytics | null>(null)
  const [apiUsageLoading, setApiUsageLoading] = useState(false)
  const [userEngagementAnalytics, setUserEngagementAnalytics] = useState<UserEngagementAnalytics | null>(null)
  const [userEngagementLoading, setUserEngagementLoading] = useState(false)
  const [retentionAnalytics, setRetentionAnalytics] = useState<RetentionAnalytics | null>(null)
  const [retentionLoading, setRetentionLoading] = useState(false)
  const [featureUsageAnalytics, setFeatureUsageAnalytics] = useState<FeatureUsageAnalytics | null>(null)
  const [featureUsageLoading, setFeatureUsageLoading] = useState(false)
  const [errorAnalytics, setErrorAnalytics] = useState<ErrorAnalytics | null>(null)
  const [errorLoading, setErrorLoading] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState<number>(30)

  useEffect(() => {
    // Check if user is authorized (mmills only)
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      setUsername(storedUsername || '')
      
      if (storedUsername !== 'mmills' && storedUsername !== 'mmills6060@gmail.com') {
        router.push('/workspaces')
        return
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      router.push('/login')
      return
    }
    
    loadAdminData()
  }, [router])

  // Load visitor, login, scopes, and conversations data when analytics tab is selected
  useEffect(() => {
        if ((activeTab === 'analytics-overview' || activeTab === 'analytics-visitors' || activeTab === 'analytics-conversations') && !visitorLoading && !loginLoading && !scopesLoading && !conversationsLoading && !usersLoading && !dashboardVisitLoading && !workspaceVisitLoading) {
          loadVisitorData(analyticsDays)
          loadLoginData(analyticsDays)
          loadScopesAnalytics()
          loadConversationsAnalytics(analyticsDays, conversationUserFilter)
          loadConversationUsers(analyticsDays)
          loadDashboardVisitStats()
          loadWorkspaceVisitStats()
        }
        
        if (activeTab === 'analytics-filetypes' && !fileTypeLoading) {
          loadFileTypeAnalytics(analyticsDays)
        }
        
        if (activeTab === 'analytics-api-usage' && !apiUsageLoading) {
          loadApiUsageAnalytics(analyticsDays)
        }
        
        if (activeTab === 'analytics-engagement' && !userEngagementLoading) {
          loadUserEngagementAnalytics(analyticsDays)
        }
        
        if (activeTab === 'analytics-retention' && !retentionLoading) {
          loadRetentionAnalytics()
        }
        
        if (activeTab === 'analytics-features' && !featureUsageLoading) {
          loadFeatureUsageAnalytics(analyticsDays)
        }
        
        if (activeTab === 'analytics-errors' && !errorLoading) {
          loadErrorAnalytics(analyticsDays)
        }
        
        // Load scopes analytics when users tab is active (for Google integrations display)
        if (activeTab === 'users' && !scopesLoading && !scopesAnalytics) {
          loadScopesAnalytics()
        }
  }, [activeTab, analyticsDays])

  // Debug daily_stats changes
  useEffect(() => {
    if (visitorStats?.daily_stats) {
      const today = new Date().toISOString().split('T')[0]
      const todayData = visitorStats.daily_stats.find(stat => stat.date === today)
    }
  }, [visitorStats?.daily_stats])

  const loadAdminData = async () => {
    setLoading(true)
    
    try {
      // Load real users data
      const usersResponse = await ApiService.get('/users/list_all_users/') as any
      if (usersResponse.result === 'success') {
        setUsers(usersResponse.users || [])
        setSystemStats({
          totalUsers: usersResponse.total_count || 0,
          totalFiles: usersResponse.system_total_files || 0
        })
      } else {
        setUsers([])
      }
    } catch (error) {
      setUsers([])
    }

    // Load visitor data if analytics tab is active
    if (activeTab === 'analytics-overview' || activeTab === 'analytics-visitors' || activeTab === 'analytics-conversations') {
      await loadVisitorData(30)
    }

    setLoading(false)
  }

  const loadVisitorData = async (days: number = 30) => {
    setVisitorLoading(true)
    try {
      const response = await ApiService.getSiteVisitorInfoEnhanced(10000, days) as any
      
      // Enhanced API returns data in a different format
      const visitors = response.visitors || []
      setVisitorData(visitors)
      setVisitorPage(1)
      
      // Process daily stats from visitor data
      const dailyStatsMap: Record<string, number> = {}
      const countryStatsMap: Record<string, number> = {}
      const cityStatsMap: Record<string, number> = {}
      
      visitors.forEach((visitor: VisitorData) => {
        // Daily stats
        const date = new Date(visitor.time).toISOString().split('T')[0]
        dailyStatsMap[date] = (dailyStatsMap[date] || 0) + 1
        
        // Country stats
        if (visitor.country) {
          countryStatsMap[visitor.country] = (countryStatsMap[visitor.country] || 0) + 1
        }
        
        // City stats
        if (visitor.city) {
          cityStatsMap[visitor.city] = (cityStatsMap[visitor.city] || 0) + 1
        }
      })
      
      // Convert to arrays and sort
      const dailyStatsArray = Object.entries(dailyStatsMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      const countryStatsArray = Object.entries(countryStatsMap)
        .map(([country, count]) => ({ _id: country, count }))
        .sort((a, b) => b.count - a.count)
      
      const cityStatsArray = Object.entries(cityStatsMap)
        .map(([city, count]) => ({ _id: city, count }))
        .sort((a, b) => b.count - a.count)
      
      // Process enhanced visitor stats
      const stats = {
        total_visitors: response.summary?.total_visitors || visitors.length,
        recent_visitors: response.summary?.total_visitors || visitors.length,
        period_days: response.summary?.date_range_days || days,
        country_stats: countryStatsArray,
        city_stats: cityStatsArray,
        hourly_stats: [],
        daily_stats: dailyStatsArray,
        // Enhanced analytics from backend
        device_type_breakdown: response.summary?.device_type_breakdown || {},
        browser_breakdown: response.summary?.browser_breakdown || {},
        os_breakdown: response.summary?.os_breakdown || {},
        top_pages: response.summary?.top_pages || {},
        unique_visitors: response.summary?.unique_visitors || 0,
        return_visitors: response.summary?.return_visitors || 0,
        total_return_visits: response.summary?.total_return_visits || 0,
        referrer_breakdown: response.summary?.referrer_breakdown || {},
        content_type_breakdown: response.summary?.content_type_breakdown || {}
      }
      
      setVisitorStats(stats)
    } catch (error) {
      console.error('Enhanced visitor data failed, falling back to legacy:', error)
      
      // Fallback to legacy API
      try {
        const legacyResponse = await ApiService.getSiteVisitorInfo(10000, days) as any
        if (legacyResponse.result === 'success') {
          setVisitorData(legacyResponse.visitors || [])
          setVisitorPage(1)
          
          // Process daily stats to ensure proper sorting and today's data inclusion
          let processedDailyStats = legacyResponse.daily_stats || []
          
          // Sort by date to ensure chronological order
          processedDailyStats = processedDailyStats.sort((a: any, b: any) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime()
          })
          
          const stats = {
            ...legacyResponse.summary,
            country_stats: legacyResponse.country_stats || [],
            city_stats: legacyResponse.city_stats || [],
            hourly_stats: legacyResponse.hourly_stats || [],
            daily_stats: processedDailyStats
          }
          setVisitorStats(stats)
        }
      } catch (legacyError) {
        console.error('Failed to load legacy visitor data:', legacyError)
        setVisitorData([])
        setVisitorStats(null)
      }
    } finally {
      setVisitorLoading(false)
    }
  }

  const loadLoginData = async (days: number = 30) => {
    setLoginLoading(true)
    try {
      const response = await ApiService.getLoginAnalytics(10000, days) as any
      if (response.result === 'success') {
        setLoginData(response.logins || [])
        
        // Process daily stats to ensure proper sorting
        let processedDailyStats = response.daily_stats || []
        processedDailyStats = processedDailyStats.sort((a: any, b: any) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        
        const stats = {
          ...response.summary,
          auth_method_stats: response.auth_method_stats || [],
          hourly_stats: response.hourly_stats || [],
          daily_stats: processedDailyStats,
          top_users_stats: response.top_users_stats || []
        }
        setLoginStats(stats)
      }
    } catch (error) {
      console.error('Failed to load login analytics:', error)
      setLoginData([])
      setLoginStats(null)
    } finally {
      setLoginLoading(false)
    }
  }

  const loadScopesAnalytics = async () => {
    setScopesLoading(true)
    try {
      const response = await ApiService.getGoogleScopesAnalytics() as any
      if (response.result === 'success') {
        setScopesAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load Google scopes analytics:', error)
      setScopesAnalytics(null)
    } finally {
      setScopesLoading(false)
    }
  }

  const loadConversationsAnalytics = async (days: number = 30, userFilter: string = '') => {
    setConversationsLoading(true)
    try {
      const response = await ApiService.getConversationsAnalytics(1000, 0, days, userFilter) as ConversationsAnalytics
      if (response.success) {
        setConversationsAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load conversations analytics:', error)
      setConversationsAnalytics(null)
    } finally {
      setConversationsLoading(false)
    }
  }

  const loadConversationUsers = async (days: number = 30) => {
    setUsersLoading(true)
    try {
      const response = await ApiService.getConversationUsers(days) as any
      if (response.success) {
        setConversationUsers(response.users || [])
      }
    } catch (error) {
      console.error('Failed to load conversation users:', error)
      setConversationUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const loadDashboardVisitStats = async () => {
    try {
      setDashboardVisitLoading(true)
      const response = await ApiService.get('/users/list_all_users/') as any
      if (response && response.users) {
        const totalDashboardVisits = response.users.reduce((sum: number, user: User) => 
          sum + (user.dashboardVisitCount || 0), 0)
        
        const recentDashboardVisits = response.users.reduce((sum: number, user: User) => {
          if (user.lastDashboardVisitDate) {
            const visitDate = new Date(user.lastDashboardVisitDate)
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - 30) // Last 30 days
            if (visitDate >= cutoffDate) {
              return sum + (user.dashboardVisitCount || 0)
            }
          }
          return sum
        }, 0)

        setDashboardVisitStats({
          total_dashboard_visits: totalDashboardVisits,
          recent_dashboard_visits: recentDashboardVisits,
          period_days: 30
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard visit stats:', error)
    } finally {
      setDashboardVisitLoading(false)
    }
  }

  const loadWorkspaceVisitStats = async () => {
    try {
      setWorkspaceVisitLoading(true)
      const response = await ApiService.get('/users/list_all_users/') as any
      if (response && response.users) {
        const totalWorkspaceVisits = response.users.reduce((sum: number, user: User) => 
          sum + (user.workspaceVisitCount || 0), 0)
        
        const recentWorkspaceVisits = response.users.reduce((sum: number, user: User) => {
          if (user.lastWorkspaceVisitDate) {
            const visitDate = new Date(user.lastWorkspaceVisitDate)
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - 30) // Last 30 days
            if (visitDate >= cutoffDate) {
              return sum + (user.workspaceVisitCount || 0)
            }
          }
          return sum
        }, 0)

        setWorkspaceVisitStats({
          total_workspace_visits: totalWorkspaceVisits,
          recent_workspace_visits: recentWorkspaceVisits,
          period_days: 30
        })
      }
    } catch (error) {
      console.error('Failed to load workspace visit stats:', error)
    } finally {
      setWorkspaceVisitLoading(false)
    }
  }

  const loadFileTypeAnalytics = async (days: number = 30, usersToExclude: string[] = excludedUsers) => {
    setFileTypeLoading(true)
    try {
      const response = await ApiService.getFileTypeAnalytics(days, 10000, usersToExclude) as FileTypeAnalytics
      if (response.result === 'success') {
        setFileTypeAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load file type analytics:', error)
      setFileTypeAnalytics(null)
    } finally {
      setFileTypeLoading(false)
    }
  }

  const loadApiUsageAnalytics = async (days: number = 30) => {
    setApiUsageLoading(true)
    try {
      const response = await ApiService.getApiUsageAnalytics(days) as ApiUsageAnalytics
      if (response.result === 'success') {
        setApiUsageAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load API usage analytics:', error)
      setApiUsageAnalytics(null)
    } finally {
      setApiUsageLoading(false)
    }
  }

  const loadUserEngagementAnalytics = async (days: number = 30) => {
    setUserEngagementLoading(true)
    try {
      const response = await ApiService.getUserEngagementAnalytics(days) as UserEngagementAnalytics
      if (response.result === 'success') {
        setUserEngagementAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load user engagement analytics:', error)
      setUserEngagementAnalytics(null)
    } finally {
      setUserEngagementLoading(false)
    }
  }

  const loadRetentionAnalytics = async () => {
    setRetentionLoading(true)
    try {
      const response = await ApiService.getRetentionAnalytics() as RetentionAnalytics
      if (response.result === 'success') {
        setRetentionAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load retention analytics:', error)
      setRetentionAnalytics(null)
    } finally {
      setRetentionLoading(false)
    }
  }

  const loadFeatureUsageAnalytics = async (days: number = 30) => {
    setFeatureUsageLoading(true)
    try {
      const response = await ApiService.getFeatureUsageAnalytics(days) as FeatureUsageAnalytics
      if (response.result === 'success') {
        setFeatureUsageAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load feature usage analytics:', error)
      setFeatureUsageAnalytics(null)
    } finally {
      setFeatureUsageLoading(false)
    }
  }

  const loadErrorAnalytics = async (days: number = 30) => {
    setErrorLoading(true)
    try {
      const response = await ApiService.getErrorAnalytics(days) as ErrorAnalytics
      if (response.result === 'success') {
        setErrorAnalytics(response)
      }
    } catch (error) {
      console.error('Failed to load error analytics:', error)
      setErrorAnalytics(null)
    } finally {
      setErrorLoading(false)
    }
  }


  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics-overview', label: 'Analytics Overview', icon: BarChart },
    { id: 'analytics-visitors', label: 'Visitors', icon: Eye },
    { id: 'analytics-conversations', label: 'AI Conversations', icon: MessageSquare },
    { id: 'analytics-filetypes', label: 'File Types', icon: FileType },
    { id: 'analytics-api-usage', label: 'API Usage', icon: BarChart },
    { id: 'analytics-engagement', label: 'User Engagement', icon: Activity },
    { id: 'analytics-retention', label: 'Retention', icon: Users },
    { id: 'analytics-features', label: 'Feature Usage', icon: Activity },
    { id: 'analytics-errors', label: 'Errors', icon: Activity }
  ]

  if (loading) {
    return (
      <div className="flex min-h-dvh bg-background">
        <div className="hidden md:block">
          <NavSidebar />
        </div>
        <div className="flex-1 md:ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <div className="hidden md:block">
        <NavSidebar />
      </div>
      <div className="flex-1 md:ml-16 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-card border-b border-zinc-300 dark:border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="border-zinc-300 dark:border-white/[0.06]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Admin Panel</SheetTitle>
                </SheetHeader>
                <nav className="space-y-2 mt-6">
                  <button
                    onClick={() => {
                      router.push('/workspaces')
                      setMobileSheetOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Back to Workspaces
                  </button>
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabSelect(tab.id, setActiveTab, () => setMobileSheetOpen(false))}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-accent dark:bg-accent text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
            <h2 className="text-foreground text-lg font-semibold">Admin</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/workspaces')}
            className="border-zinc-300 dark:border-white/[0.06]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-card border-r border-zinc-300 dark:border-white/[0.06] p-4">
          <h2 className="text-foreground text-lg font-semibold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent dark:bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-2xl font-bold text-foreground">System Overview</h1>
                <Button onClick={loadAdminData} variant="outline" className="border-zinc-300 dark:border-white/[0.06]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-sm">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{systemStats.totalUsers.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-sm">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{systemStats.totalFiles.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <UsersTab 
              users={users}
              convertToEasternTime={convertToEasternTime}
              formatBytes={formatBytes}
              scopesAnalytics={scopesAnalytics}
            />
          )}

          {(activeTab === 'analytics-overview' || activeTab === 'analytics-visitors' || activeTab === 'analytics-conversations' || activeTab === 'analytics-filetypes' || activeTab === 'analytics-api-usage' || activeTab === 'analytics-engagement' || activeTab === 'analytics-retention' || activeTab === 'analytics-features' || activeTab === 'analytics-errors') && (
            <AnalyticsTab 
              analyticsSubTab={activeTab === 'analytics-overview' ? 'overview' : activeTab === 'analytics-visitors' ? 'visitors' : activeTab === 'analytics-conversations' ? 'conversations' : activeTab === 'analytics-filetypes' ? 'filetypes' : activeTab === 'analytics-api-usage' ? 'api-usage' : activeTab === 'analytics-engagement' ? 'engagement' : activeTab === 'analytics-retention' ? 'retention' : activeTab === 'analytics-features' ? 'features' : activeTab === 'analytics-errors' ? 'errors' : 'overview'}
              visitorData={visitorData}
              visitorStats={visitorStats}
              visitorLoading={visitorLoading}
              visitorPage={visitorPage}
              setVisitorPage={setVisitorPage}
              visitorPageSize={visitorPageSize}
              loginData={loginData}
              loginStats={loginStats}
              loginLoading={loginLoading}
              scopesAnalytics={scopesAnalytics}
              scopesLoading={scopesLoading}
              conversationsAnalytics={conversationsAnalytics}
              conversationsLoading={conversationsLoading}
              conversationUserFilter={conversationUserFilter}
              setConversationUserFilter={setConversationUserFilter}
              conversationUsers={conversationUsers}
              usersLoading={usersLoading}
              dashboardVisitStats={dashboardVisitStats}
              dashboardVisitLoading={dashboardVisitLoading}
              workspaceVisitStats={workspaceVisitStats}
              workspaceVisitLoading={workspaceVisitLoading}
              fileTypeAnalytics={fileTypeAnalytics}
              fileTypeLoading={fileTypeLoading}
              excludedUsers={excludedUsers}
              setExcludedUsers={setExcludedUsers}
              apiUsageAnalytics={apiUsageAnalytics}
              apiUsageLoading={apiUsageLoading}
              userEngagementAnalytics={userEngagementAnalytics}
              userEngagementLoading={userEngagementLoading}
              retentionAnalytics={retentionAnalytics}
              retentionLoading={retentionLoading}
              featureUsageAnalytics={featureUsageAnalytics}
              featureUsageLoading={featureUsageLoading}
              errorAnalytics={errorAnalytics}
              errorLoading={errorLoading}
              loadVisitorData={loadVisitorData}
              loadLoginData={loadLoginData}
              loadScopesAnalytics={loadScopesAnalytics}
              loadConversationsAnalytics={loadConversationsAnalytics}
              loadConversationUsers={loadConversationUsers}
              loadDashboardVisitStats={loadDashboardVisitStats}
              loadWorkspaceVisitStats={loadWorkspaceVisitStats}
              loadFileTypeAnalytics={loadFileTypeAnalytics}
              loadApiUsageAnalytics={loadApiUsageAnalytics}
              loadUserEngagementAnalytics={loadUserEngagementAnalytics}
              loadRetentionAnalytics={loadRetentionAnalytics}
              loadFeatureUsageAnalytics={loadFeatureUsageAnalytics}
              loadErrorAnalytics={loadErrorAnalytics}
              analyticsDays={analyticsDays}
              setAnalyticsDays={setAnalyticsDays}
              convertToEasternTime={convertToEasternTime}
            />
                        )}
                      </div>
      </div>
    </div>
  )
}
