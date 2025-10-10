import { 
  Users, 
  Activity, 
  RefreshCw,
  BarChart3,
  BarChart,
  Eye,
  MessageSquare,
  FileType
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { NavSidebar } from '../../components/nav-sidebar'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { ApiService } from '../../services/apiService'
import { UsersTab } from './UsersTab'
import { AnalyticsTab } from './AnalyticsTab'

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

export default function Admin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
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
          loadVisitorData(30)
          loadLoginData(30)
          loadScopesAnalytics()
          loadConversationsAnalytics(30, conversationUserFilter)
          loadConversationUsers(30)
          loadDashboardVisitStats()
          loadWorkspaceVisitStats()
        }
        
        if (activeTab === 'analytics-filetypes' && !fileTypeLoading) {
          loadFileTypeAnalytics(30)
        }
  }, [activeTab])

  // Debug daily_stats changes
  useEffect(() => {
    if (visitorStats?.daily_stats) {
      console.log('Daily stats updated:', visitorStats.daily_stats)
      console.log('Today date:', new Date().toISOString().split('T')[0])
      const today = new Date().toISOString().split('T')[0]
      const todayData = visitorStats.daily_stats.find(stat => stat.date === today)
      console.log('Today data found:', todayData)
    }
  }, [visitorStats?.daily_stats])

  const loadAdminData = async () => {
    setLoading(true)
    
    try {
      // Load real users data
      const usersResponse = await ApiService.get('/users/list_all_users/') as any
      if (usersResponse.result === 'success') {
        console.log('Users response:', usersResponse.users)
        // Debug first user's scope data
        if (usersResponse.users && usersResponse.users.length > 0) {
          console.log('First user scope data:', {
            username: usersResponse.users[0].username,
            auth_method: usersResponse.users[0].auth_method,
            googleScopes: usersResponse.users[0].googleScopes,
            hasEmailScope: usersResponse.users[0].hasEmailScope,
            hasProfileScope: usersResponse.users[0].hasProfileScope,
            hasGmailScope: usersResponse.users[0].hasGmailScope,
            hasDriveScope: usersResponse.users[0].hasDriveScope,
            hasCalendarScope: usersResponse.users[0].hasCalendarScope,
            hasContactsScope: usersResponse.users[0].hasContactsScope
          })
        }
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
      console.log('Enhanced visitor data response:', response)
      
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
        daily_stats: dailyStatsArray
      }
      
      console.log('Processed enhanced visitor stats:', stats)
      setVisitorStats(stats)
    } catch (error) {
      console.error('Enhanced visitor data failed, falling back to legacy:', error)
      
      // Fallback to legacy API
      try {
        const legacyResponse = await ApiService.getSiteVisitorInfo(10000, days) as any
        console.log('Legacy visitor data response:', legacyResponse)
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
      console.log('Login analytics response:', response)
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
        console.log('Processed login stats:', stats)
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
      console.log('Google scopes analytics response:', response)
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
      console.log('Conversations analytics response:', response)
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
      console.log('Conversation users response:', response)
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
      console.log('File type analytics response:', response)
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


  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics-overview', label: 'Analytics Overview', icon: BarChart },
    { id: 'analytics-visitors', label: 'Visitors', icon: Eye },
    { id: 'analytics-conversations', label: 'AI Conversations', icon: MessageSquare },
    { id: 'analytics-filetypes', label: 'File Types', icon: FileType }
  ]

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <NavSidebar />
      <div className="flex-1 ml-16 flex">
        {/* Sidebar */}
        <div className="w-64 bg-background border-r border-zinc-700 p-4">
          <h2 className="text-white text-lg font-semibold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-background text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
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
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">System Overview</h1>
                <Button onClick={loadAdminData} variant="outline" className="text-white border-zinc-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-background border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{systemStats.totalUsers.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalFiles.toLocaleString()}</div>
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
            />
          )}

          {(activeTab === 'analytics-overview' || activeTab === 'analytics-visitors' || activeTab === 'analytics-conversations' || activeTab === 'analytics-filetypes') && (
            <AnalyticsTab 
              analyticsSubTab={activeTab === 'analytics-overview' ? 'overview' : activeTab === 'analytics-visitors' ? 'visitors' : activeTab === 'analytics-conversations' ? 'conversations' : 'filetypes'}
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
              loadVisitorData={loadVisitorData}
              loadLoginData={loadLoginData}
              loadScopesAnalytics={loadScopesAnalytics}
              loadConversationsAnalytics={loadConversationsAnalytics}
              loadConversationUsers={loadConversationUsers}
              loadDashboardVisitStats={loadDashboardVisitStats}
              loadWorkspaceVisitStats={loadWorkspaceVisitStats}
              loadFileTypeAnalytics={loadFileTypeAnalytics}
              convertToEasternTime={convertToEasternTime}
            />
                        )}
                      </div>
      </div>
    </div>
  )
}
