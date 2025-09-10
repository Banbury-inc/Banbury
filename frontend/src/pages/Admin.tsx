import { 
  Users, 
  Settings, 
  Database, 
  Activity, 
  Shield, 
  Key, 
  Trash2, 
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  Server,
  HardDrive,
  Network,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { NavSidebar } from '../components/nav-sidebar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ApiService } from '../services/apiService'
import { 
  getTotalPages, 
  getPageSlice, 
  nextPage as nextVisitorPage, 
  prevPage as prevVisitorPage, 
  canGoNext, 
  canGoPrev, 
  clampPage 
} from './handlers/adminVisitors'

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

interface ApiKey {
  key: string
  user_id: string
  role: string
  created_at: string
  last_used?: string
  permissions?: string[]
}

interface SystemStats {
  totalUsers: number
  totalFiles: number
  activeSessions: number
  systemUptime: string
  storageUsed: string
  storageTotal: string
  cpuUsage: number
  memoryUsage: number
  networkTraffic: number
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'file_upload' | 'api_key_generated' | 'login' | 'error'
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'error'
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

export default function Admin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('user')
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0,
    activeSessions: 0,
    systemUptime: '0 days',
    storageUsed: '0 GB',
    storageTotal: '100 GB',
    cpuUsage: 0,
    memoryUsage: 0,
    networkTraffic: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
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
  const [analyticsSubTab, setAnalyticsSubTab] = useState<string>('overview')
  const [conversationUserFilter, setConversationUserFilter] = useState<string>('')
  const [conversationUsers, setConversationUsers] = useState<string[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
  const [conversationDetails, setConversationDetails] = useState<any>(null)
  const [conversationDetailsLoading, setConversationDetailsLoading] = useState(false)
  const [visitorIpExclusions, setVisitorIpExclusions] = useState<string[]>([])
  const [visitorIpInput, setVisitorIpInput] = useState<string>('')
  const [visitorLocationFilter, setVisitorLocationFilter] = useState<string>('')
  const [dashboardVisitStats, setDashboardVisitStats] = useState<any>(null)
  const [dashboardVisitLoading, setDashboardVisitLoading] = useState(false)
  const [workspaceVisitStats, setWorkspaceVisitStats] = useState<any>(null)
  const [workspaceVisitLoading, setWorkspaceVisitLoading] = useState(false)

  useEffect(() => {
    // Check if user is authorized (mmills only)
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      setUsername(storedUsername || '')
      
      if (storedUsername !== 'mmills' && storedUsername !== 'mmills6060@gmail.com') {
        router.push('/dashboard')
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
        if (activeTab === 'analytics' && !visitorLoading && !loginLoading && !scopesLoading && !conversationsLoading && !usersLoading && !dashboardVisitLoading && !workspaceVisitLoading) {
          loadVisitorData(30)
          loadLoginData(30)
          loadScopesAnalytics()
          loadConversationsAnalytics(30, conversationUserFilter)
          loadConversationUsers(30)
          loadDashboardVisitStats()
          loadWorkspaceVisitStats()
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
        setSystemStats(prev => ({
          ...prev,
          totalUsers: usersResponse.total_count || 0,
          totalFiles: usersResponse.system_total_files || prev.totalFiles,
          activeSessions: 89,
          systemUptime: '15 days, 7 hours',
          storageUsed: '2.4 GB',
          storageTotal: '100 GB',
          cpuUsage: 23,
          memoryUsage: 67,
          networkTraffic: 145
        }))
      } else {
        setUsers([])
      }
    } catch (error) {
      setUsers([])
    }

    // Load visitor data if analytics tab is active
    if (activeTab === 'analytics') {
      await loadVisitorData(30)
    }

    // Mock recent activity
    setRecentActivity([
      {
        id: '1',
        type: 'user_registration',
        description: 'New user registered: john.doe@example.com',
        timestamp: '2 minutes ago',
        severity: 'info'
      },
      {
        id: '2',
        type: 'file_upload',
        description: 'File uploaded: document.pdf (2.3 MB)',
        timestamp: '5 minutes ago',
        severity: 'info'
      },
      {
        id: '3',
        type: 'api_key_generated',
        description: 'API key generated for user: admin',
        timestamp: '10 minutes ago',
        severity: 'info'
      },
      {
        id: '4',
        type: 'login',
        description: 'User login: mmills',
        timestamp: '15 minutes ago',
        severity: 'info'
      },
      {
        id: '5',
        type: 'error',
        description: 'Database connection timeout',
        timestamp: '1 hour ago',
        severity: 'warning'
      }
    ])

    try {
      // Load API keys
      const keysResponse = await ApiService.get('/authentication/api-key/list/') as any
      setApiKeys(keysResponse.api_keys || [])
    } catch (error) {
      setApiKeys([])
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    try {
      const response = await ApiService.post('/authentication/api-key/generate/', {
        role: selectedRole
      }) as any
      setNewApiKey(response.api_key)
      await loadAdminData() // Refresh the list
    } catch (error) {
      // Handle error silently
    }
  }

  const deleteApiKey = async (key: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return
    
    try {
      await ApiService.post('/authentication/api-key/delete/', { api_key: key })
      await loadAdminData() // Refresh the list
    } catch (error) {
      // Handle error silently
    }
  }

  const loadVisitorData = async (days: number = 30) => {
    setVisitorLoading(true)
    try {
      const response = await ApiService.getSiteVisitorInfoEnhanced(100, days) as any
      console.log('Enhanced visitor data response:', response)
      
      // Enhanced API returns data in a different format
      setVisitorData(response.visitors || [])
      setVisitorPage(1)
      
      // Process enhanced visitor stats
      const stats = {
        total_visitors: response.summary?.total_visitors || 0,
        recent_visitors: response.summary?.total_visitors || 0, // Enhanced API doesn't split this
        period_days: response.summary?.date_range_days || days,
        country_stats: Object.entries(response.summary?.referrer_breakdown || {}).map(([country, count]) => ({
          _id: country,
          count: count as number
        })),
        city_stats: [],
        hourly_stats: [],
        daily_stats: [] // Enhanced API doesn't provide daily breakdown yet
      }
      
      console.log('Processed enhanced visitor stats:', stats)
      setVisitorStats(stats)
    } catch (error) {
      console.error('Enhanced visitor data failed, falling back to legacy:', error)
      
      // Fallback to legacy API
      try {
        const legacyResponse = await ApiService.getSiteVisitorInfo(100, days) as any
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
      const response = await ApiService.getLoginAnalytics(100, days) as any
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
      const response = await ApiService.getConversationsAnalytics(50, 0, days, userFilter) as ConversationsAnalytics
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

  const loadConversationDetails = async (conversationId: string) => {
    setConversationDetailsLoading(true)
    try {
      const response = await ApiService.getConversation(conversationId) as any
      console.log('Conversation details response:', response)
      if (response.success) {
        setConversationDetails(response.conversation)
        setExpandedConversation(conversationId)
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error)
      setConversationDetails(null)
    } finally {
      setConversationDetailsLoading(false)
    }
  }

  const handleConversationRowClick = (conversationId: string) => {
    if (expandedConversation === conversationId) {
      // If already expanded, collapse it
      setExpandedConversation(null)
      setConversationDetails(null)
    } else {
      // Load and expand the conversation
      loadConversationDetails(conversationId)
    }
  }

  const getFilteredVisitors = () => {
    if (!visitorData || visitorData.length === 0) return []
    
    return visitorData.filter(visitor => {
      // Exclude visitors with IP addresses in the exclusion list
      const isIpExcluded = visitorIpExclusions.some(excludedIp => 
        visitor.ip_address?.toLowerCase().includes(excludedIp.toLowerCase())
      )
      
      // Include visitors that match location filter (if specified)
      const matchesLocation = !visitorLocationFilter || 
        visitor.city?.toLowerCase().includes(visitorLocationFilter.toLowerCase()) ||
        visitor.region?.toLowerCase().includes(visitorLocationFilter.toLowerCase()) ||
        visitor.country?.toLowerCase().includes(visitorLocationFilter.toLowerCase())
      
      return !isIpExcluded && matchesLocation
    })
  }

  // Reset visitor page when filters change
  useEffect(() => {
    setVisitorPage(1)
  }, [visitorIpExclusions, visitorLocationFilter])

  const addIpExclusion = () => {
    if (visitorIpInput.trim() && !visitorIpExclusions.includes(visitorIpInput.trim())) {
      setVisitorIpExclusions([...visitorIpExclusions, visitorIpInput.trim()])
      setVisitorIpInput('')
    }
  }

  const removeIpExclusion = (ipToRemove: string) => {
    setVisitorIpExclusions(visitorIpExclusions.filter(ip => ip !== ipToRemove))
  }

  const clearAllFilters = () => {
    setVisitorIpExclusions([])
    setVisitorIpInput('')
    setVisitorLocationFilter('')
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4" />
      case 'file_upload':
        return <Database className="h-4 w-4" />
      case 'api_key_generated':
        return <Key className="h-4 w-4" />
      case 'login':
        return <Shield className="h-4 w-4" />
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'text-blue-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getActivityBgColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
    <div className="flex h-screen bg-black">
      <NavSidebar />
      <div className="flex-1 ml-16 flex">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-700 p-4">
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
                      ? 'bg-zinc-800 text-white'
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
                <h1 className="text-2xl font-bold text-white">System Overview</h1>
                <Button onClick={loadAdminData} variant="outline" className="text-white border-zinc-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalUsers.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalFiles.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.activeSessions}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">System Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.systemUptime}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">System Resources</CardTitle>
                    <CardDescription className="text-zinc-400">Current system resource usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">CPU Usage</span>
                        <span className="text-white">{systemStats.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${systemStats.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">Memory Usage</span>
                        <span className="text-white">{systemStats.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${systemStats.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">Storage</span>
                        <span className="text-white">{systemStats.storageUsed} / {systemStats.storageTotal}</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(parseInt(systemStats.storageUsed) / parseInt(systemStats.storageTotal)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-zinc-400">Latest system events and user actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <div className={`w-2 h-2 rounded-full ${getActivityBgColor(activity.severity)}`}></div>
                          <div className={`${getActivityColor(activity.severity)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <span className="text-zinc-300 flex-1">{activity.description}</span>
                          <span className="text-zinc-500">{activity.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
              </div>
              
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">All Users</CardTitle>
                  <CardDescription className="text-zinc-400">Manage user accounts and view file statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto border border-zinc-700 rounded-lg">
                    <table className="w-full min-w-full">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-2 px-2 text-zinc-300 font-medium text-sm">User</th>
                          <th className="text-left py-2 px-2 text-zinc-300 font-medium text-sm">Email</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Plan</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Files</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Storage</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">AI Msgs</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Logins</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Last Login</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Dashboard Visits</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Last Dashboard Visit</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Workspace Visits</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Last Workspace Visit</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs" title="Email Scope">Email</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs" title="Profile Scope">Profile</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs" title="Gmail Scope">Gmail</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs" title="Drive Scope">Drive</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs" title="Calendar Scope">Calendar</th>
                          <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs" title="Contacts Scope">Contacts</th>
                          <th className="text-center py-2 px-2 text-zinc-300 font-medium text-xs">Auth</th>
                          <th className="text-center py-2 px-2 text-zinc-300 font-medium text-xs">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center">
                                  <Users className="h-3 w-3 text-zinc-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-white font-medium text-sm truncate">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-zinc-400 text-xs truncate">@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-zinc-300 text-sm truncate">{user.email}</td>
                            <td className="py-2 px-1 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.subscription === 'pro' 
                                  ? 'bg-purple-900/50 text-purple-300' 
                                  : 'bg-green-900/50 text-green-300'
                              }`}>
                                {user.subscription === 'pro' ? 'Pro' : 'Free'}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className="text-white font-medium text-sm">{user.totalFiles?.toLocaleString() || 0}</span>
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className="text-white font-medium text-sm" title={user.lastFileUploadAt ? convertToEasternTime(user.lastFileUploadAt) : 'Never'}>
                                {user.totalFileSize ? formatBytes(user.totalFileSize) : '0 B'}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className="text-white font-medium text-sm">{user.aiMessageCount?.toLocaleString() || 0}</span>
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className="text-white font-medium text-sm">{user.loginCount?.toLocaleString() || 0}</span>
                            </td>
                            <td className="py-2 px-1 text-center text-zinc-400 text-xs">
                              {user.lastLoginDate ? convertToEasternTime(user.lastLoginDate) : 'Never'}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className="text-white font-medium text-sm">{user.dashboardVisitCount?.toLocaleString() || 0}</span>
                            </td>
                            <td className="py-2 px-1 text-center text-zinc-400 text-xs">
                              {user.lastDashboardVisitDate ? convertToEasternTime(user.lastDashboardVisitDate) : 'Never'}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className="text-white font-medium text-sm">{user.workspaceVisitCount?.toLocaleString() || 0}</span>
                            </td>
                            <td className="py-2 px-1 text-center text-zinc-400 text-xs">
                              {user.lastWorkspaceVisitDate ? convertToEasternTime(user.lastWorkspaceVisitDate) : 'Never'}
                            </td>
                            {/* Individual Scope Columns */}
                            <td className="py-2 px-1 text-center">
                              {user.hasEmailScope ? (
                                <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
                              ) : user.auth_method === 'google_oauth' ? (
                                <XCircle className="h-3 w-3 text-red-400 mx-auto" />
                              ) : (
                                <span className="text-zinc-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {user.hasProfileScope ? (
                                <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
                              ) : user.auth_method === 'google_oauth' ? (
                                <XCircle className="h-3 w-3 text-red-400 mx-auto" />
                              ) : (
                                <span className="text-zinc-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {user.hasGmailScope ? (
                                <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
                              ) : user.auth_method === 'google_oauth' ? (
                                <XCircle className="h-3 w-3 text-red-400 mx-auto" />
                              ) : (
                                <span className="text-zinc-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {user.hasDriveScope ? (
                                <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
                              ) : user.auth_method === 'google_oauth' ? (
                                <XCircle className="h-3 w-3 text-red-400 mx-auto" />
                              ) : (
                                <span className="text-zinc-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {user.hasCalendarScope ? (
                                <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
                              ) : user.auth_method === 'google_oauth' ? (
                                <XCircle className="h-3 w-3 text-red-400 mx-auto" />
                              ) : (
                                <span className="text-zinc-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {user.hasContactsScope ? (
                                <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
                              ) : user.auth_method === 'google_oauth' ? (
                                <XCircle className="h-3 w-3 text-red-400 mx-auto" />
                              ) : (
                                <span className="text-zinc-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                user.auth_method === 'google_oauth' 
                                  ? 'bg-blue-900/50 text-blue-300' 
                                  : 'bg-green-900/50 text-green-300'
                              }`}>
                                {user.auth_method === 'google_oauth' ? 'Google' : 'Email'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center text-zinc-400 text-xs">
                              {user.created_at ? convertToEasternTime(user.created_at) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {users.length === 0 && (
                    <div className="text-center py-8 text-zinc-400">
                      No users found.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">API Key Management</h1>
                <div className="flex gap-2">
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="readonly">Read Only</option>
                  </select>
                  <Button onClick={generateApiKey} className="bg-zinc-800 hover:bg-zinc-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
              </div>

              {newApiKey && (
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">New API Key Generated</CardTitle>
                    <CardDescription className="text-zinc-400">Copy this key now - it won&apos;t be shown again</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={newApiKey} 
                        readOnly 
                        className="bg-zinc-800 text-white border-zinc-600"
                      />
                      <Button 
                        onClick={() => navigator.clipboard.writeText(newApiKey)}
                        className="bg-zinc-800 hover:bg-zinc-700"
                      >
                        Copy
                      </Button>
                      <Button 
                        onClick={() => setNewApiKey(null)}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <CardDescription className="text-zinc-400">Manage API keys for external integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.key} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <Key className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{key.key.substring(0, 8)}...</div>
                          <div className="text-zinc-400 text-sm">Role: {key.role}</div>
                          <div className="text-zinc-500 text-xs">Created: {convertToEasternTime(key.created_at)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === key.key ? null : key.key)}
                            className="text-zinc-400 hover:text-white"
                          >
                            {showApiKey === key.key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(key.key)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {showApiKey === key.key && (
                          <div className="mt-2 p-2 bg-zinc-700 rounded text-sm font-mono text-white">
                            {key.key}
                          </div>
                        )}
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <div className="text-center py-8 text-zinc-400">
                        No API keys found. Generate one to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">System Settings</h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Database</CardTitle>
                    <CardDescription className="text-zinc-400">Database connection and performance settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Connection Status</Label>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-400">Connected</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Database Size</Label>
                      <span className="text-zinc-300">2.4 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Response Time</Label>
                      <span className="text-zinc-300">12ms avg</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Security</CardTitle>
                    <CardDescription className="text-zinc-400">Security and authentication settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Two-Factor Authentication</Label>
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Session Timeout</Label>
                      <span className="text-zinc-300">7 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Rate Limiting</Label>
                      <span className="text-zinc-300">1000 req/min</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Network</CardTitle>
                    <CardDescription className="text-zinc-400">Network configuration and monitoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Network Status</Label>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-400">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Traffic</Label>
                      <span className="text-zinc-300">{systemStats.networkTraffic} MB/s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Uptime</Label>
                      <span className="text-zinc-300">{systemStats.systemUptime}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Backup</CardTitle>
                    <CardDescription className="text-zinc-400">Backup and recovery settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Last Backup</Label>
                      <span className="text-zinc-300">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Backup Schedule</Label>
                      <span className="text-zinc-300">Daily at 2 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Retention</Label>
                      <span className="text-zinc-300">30 days</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Site Analytics</h1>
                <div className="flex gap-2">
                  <select 
                    onChange={(e) => {
                      const days = parseInt(e.target.value)
                      loadVisitorData(days)
                      loadLoginData(days)
                      loadScopesAnalytics()
                      loadConversationsAnalytics(days, conversationUserFilter)
                      loadConversationUsers(days)
                    }}
                    className="bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-2"
                    defaultValue="30"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                  <Button onClick={() => {
                    loadVisitorData(30)
                    loadLoginData(30)
                    loadScopesAnalytics()
                    loadConversationsAnalytics(30, conversationUserFilter)
                    loadConversationUsers(30)
                    loadDashboardVisitStats()
                    loadWorkspaceVisitStats()
                  }} variant="outline" className="text-white border-zinc-600">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Analytics Sub-tabs */}
              <div className="border-b border-zinc-700">
                <nav className="flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'visitors', label: 'Visitors' },
                    { id: 'conversations', label: 'AI Conversations' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAnalyticsSubTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        analyticsSubTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Overview Tab */}
              {analyticsSubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Enhanced Tracking Summary */}
                  {visitorData.some(v => v.tracking_version) && (
                    <Card className="bg-zinc-900 border-zinc-700 mb-4">
                      <CardHeader>
                        <CardTitle className="text-white">Enhanced Tracking Summary</CardTitle>
                        <CardDescription className="text-zinc-400">Insights from social media and campaign tracking</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-white font-medium mb-3">Traffic Sources</h4>
                            <div className="space-y-2">
                              {(() => {
                                const sourceStats: Record<string, number> = {}
                                visitorData.forEach(visitor => {
                                  const source = visitor.referrer_source || 'Direct'
                                  sourceStats[source] = (sourceStats[source] || 0) + 1
                                })
                                return Object.entries(sourceStats)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 5)
                                  .map(([source, count]) => (
                                    <div key={source} className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                          source === 'twitter' ? 'bg-blue-500' :
                                          source === 'facebook' ? 'bg-blue-600' :
                                          source === 'google' ? 'bg-green-500' :
                                          source === 'linkedin' ? 'bg-purple-500' :
                                          'bg-zinc-500'
                                        }`}></div>
                                        <span className="text-white capitalize">{source}</span>
                                      </div>
                                      <span className="text-zinc-400 font-medium">{count}</span>
                                    </div>
                                  ))
                              })()}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium mb-3">Content Types</h4>
                            <div className="space-y-2">
                              {(() => {
                                const contentStats: Record<string, number> = {}
                                visitorData.forEach(visitor => {
                                  const content = visitor.content_type || 'Unknown'
                                  contentStats[content] = (contentStats[content] || 0) + 1
                                })
                                return Object.entries(contentStats)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 5)
                                  .map(([content, count]) => (
                                    <div key={content} className="flex items-center justify-between">
                                      <span className="text-white">{content.replace('_', ' ')}</span>
                                      <span className="text-zinc-400 font-medium">{count}</span>
                                    </div>
                                  ))
                              })()}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium mb-3">Active Campaigns</h4>
                            <div className="space-y-2">
                              {(() => {
                                const campaignStats: Record<string, number> = {}
                                visitorData.forEach(visitor => {
                                  if (visitor.campaign_id) {
                                    const campaign = visitor.campaign_id.length > 15 
                                      ? `${visitor.campaign_id.substring(0, 15)}...` 
                                      : visitor.campaign_id
                                    campaignStats[campaign] = (campaignStats[campaign] || 0) + 1
                                  }
                                })
                                const campaigns = Object.entries(campaignStats)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 5)
                                
                                return campaigns.length > 0 ? campaigns.map(([campaign, count]) => (
                                  <div key={campaign} className="flex items-center justify-between">
                                    <span className="text-white text-sm font-mono truncate flex-1" title={campaign}>{campaign}</span>
                                    <span className="text-zinc-400 font-medium ml-2">{count}</span>
                                  </div>
                                )) : (
                                  <div className="text-zinc-500 text-sm">No active campaigns</div>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Visitors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {visitorStats?.total_visitors?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">All time</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Recent Visitors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {visitorStats?.recent_visitors?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">Last {visitorStats?.period_days || 30} days</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Logins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {loginStats?.total_logins?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">All time</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Recent Logins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {loginStats?.recent_logins?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">Last {loginStats?.period_days || 30} days</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">AI Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {conversationsAnalytics?.summary?.total_conversations?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">Last {conversationsAnalytics?.summary?.period_days || 30} days</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">AI Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {conversationsAnalytics?.summary?.total_messages?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">Avg {conversationsAnalytics?.summary?.avg_messages_per_conversation || 0} per chat</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Dashboard Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {dashboardVisitStats?.total_dashboard_visits?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">All time</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Recent Dashboard Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {dashboardVisitStats?.recent_dashboard_visits?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">Last {dashboardVisitStats?.period_days || 30} days</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Workspace Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {workspaceVisitStats?.total_workspace_visits?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">All time</div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Recent Workspace Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {workspaceVisitStats?.recent_workspace_visits?.toLocaleString() || '0'}
                    </div>
                    <div className="text-zinc-400 text-sm">Last {workspaceVisitStats?.period_days || 30} days</div>
                  </CardContent>
                </Card>
                  </div>

                  {/* Google Scopes Analytics Section */}
              <Card className="bg-zinc-900 border-zinc-700 mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">Google OAuth Scopes Analytics</CardTitle>
                      <CardDescription className="text-zinc-400">Analysis of Google permissions granted by users</CardDescription>
                    </div>
                    <Button 
                      onClick={() => loadScopesAnalytics()} 
                      variant="outline" 
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {scopesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : scopesAnalytics ? (
                    <div className="space-y-6">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{scopesAnalytics.summary.total_google_users}</div>
                          <div className="text-zinc-400 text-sm">Google Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{scopesAnalytics.summary.users_with_scopes}</div>
                          <div className="text-zinc-400 text-sm">With Scopes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{scopesAnalytics.summary.unique_scopes}</div>
                          <div className="text-zinc-400 text-sm">Unique Scopes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{scopesAnalytics.summary.average_scopes_per_user}</div>
                          <div className="text-zinc-400 text-sm">Avg per User</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white truncate" title={scopesAnalytics.summary.most_common_scope}>
                            {scopesAnalytics.summary.most_common_scope ? 
                              scopesAnalytics.summary.most_common_scope.split('/').pop() : 'N/A'}
                          </div>
                          <div className="text-zinc-400 text-sm">Most Common</div>
                        </div>
                      </div>

                      {/* Scope Categories and Top Scopes */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-white font-medium mb-3">Scope Categories</h4>
                          <div className="space-y-2">
                            {scopesAnalytics.category_stats.slice(0, 6).map((category, index) => (
                              <div key={category.category} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 bg-purple-500 rounded" style={{
                                    backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'][index % 6]
                                  }}></div>
                                  <span className="text-white">{category.category}</span>
                                </div>
                                <span className="text-zinc-400 font-medium">{category.count} users</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-3">Top Scopes</h4>
                          <div className="space-y-2">
                            {scopesAnalytics.scope_stats.slice(0, 6).map((scope, index) => (
                              <div key={scope.scope} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-white">
                                    {index + 1}
                                  </div>
                                  <span className="text-white text-sm truncate" title={scope.scope}>
                                    {scope.scope.includes('userinfo.email') ? 'User Email' :
                                     scope.scope.includes('userinfo.profile') ? 'User Profile' :
                                     scope.scope.includes('gmail') ? 'Gmail Access' :
                                     scope.scope.includes('drive') ? 'Google Drive' :
                                     scope.scope.includes('calendar') ? 'Google Calendar' : 
                                     scope.scope.split('/').pop() || scope.scope}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-zinc-400 font-medium">{scope.count}</div>
                                  <div className="text-zinc-500 text-xs">{scope.percentage}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                      <div className="text-center">
                        <div>No Google scopes data available</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-700 mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">Visitors Over Time</CardTitle>
                      <CardDescription className="text-zinc-400">Daily visitor trends for the selected period</CardDescription>
                    </div>
                    <Button 
                      onClick={() => loadVisitorData(30)} 
                      variant="outline" 
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {visitorLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : visitorStats?.daily_stats && visitorStats.daily_stats.length > 0 ? (
                    <div className="w-full h-72 p-4">
                      {/* Debug info */}
                      <div className="text-xs text-zinc-500 mb-2">
                        Chart data points: {visitorStats.daily_stats.length} | 
                        Date range: {visitorStats.daily_stats[0]?.date} to {visitorStats.daily_stats[visitorStats.daily_stats.length - 1]?.date} |
                        Today: {new Date().toISOString().split('T')[0]}
                      </div>
                      <ChartContainer
                        config={{
                          visitors: {
                            label: "Visitors",
                            color: "#3b82f6",
                          },
                        }}
                        className="w-full h-full !flex-none"
                      >
                        <AreaChart 
                          data={visitorStats.daily_stats}
                          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
                        >
                          <defs>
                            <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af"
                            fontSize={10}
                            type="category"
                            scale="point"
                            tickFormatter={(value) => {
                              // Fix timezone issue by explicitly treating as local date
                              const date = new Date(value + 'T12:00:00')
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            }}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            fontSize={10}
                            tickFormatter={(value) => value.toLocaleString()}
                            width={45}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null
                              // Fix timezone issue by explicitly treating as local date
                              const date = new Date(label + 'T12:00:00')
                              return (
                                <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
                                  <div className="text-white font-medium">
                                    {date.toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                  <div className="text-blue-400">
                                    {payload[0].value} visitors
                                  </div>
                                </div>
                              )
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            fill="url(#visitorGradient)"
                            fillOpacity={1}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                      <div className="text-center">
                        <div>No visitor data available for the selected period</div>
                        {visitorStats && (
                          <div className="mt-2 text-xs">
                            <div>Daily stats length: {visitorStats.daily_stats?.length || 0}</div>
                            <div>Daily stats data: {JSON.stringify(visitorStats.daily_stats || [])}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-700 mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">User Logins Over Time</CardTitle>
                      <CardDescription className="text-zinc-400">Daily login trends for the selected period</CardDescription>
                    </div>
                    <Button 
                      onClick={() => loadLoginData(30)} 
                      variant="outline" 
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loginLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : loginStats?.daily_stats && loginStats.daily_stats.length > 0 ? (
                    <div className="w-full h-72 p-4">
                      {/* Debug info */}
                      <div className="text-xs text-zinc-500 mb-2">
                        Login data points: {loginStats.daily_stats.length} | 
                        Date range: {loginStats.daily_stats[0]?.date} to {loginStats.daily_stats[loginStats.daily_stats.length - 1]?.date} |
                        Today: {new Date().toISOString().split('T')[0]}
                      </div>
                      <ChartContainer
                        config={{
                          logins: {
                            label: "Logins",
                            color: "#10b981",
                          },
                        }}
                        className="w-full h-full !flex-none"
                      >
                        <AreaChart 
                          data={loginStats.daily_stats}
                          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
                        >
                          <defs>
                            <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af"
                            fontSize={10}
                            type="category"
                            scale="point"
                            tickFormatter={(value) => {
                              // Fix timezone issue by explicitly treating as local date
                              const date = new Date(value + 'T12:00:00')
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            }}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            fontSize={10}
                            tickFormatter={(value) => value.toLocaleString()}
                            width={45}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null
                              // Fix timezone issue by explicitly treating as local date
                              const date = new Date(label + 'T12:00:00')
                              return (
                                <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
                                  <div className="text-white font-medium">
                                    {date.toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                  <div className="text-green-400">
                                    {payload[0].value} logins
                                  </div>
                                </div>
                              )
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fill="url(#loginGradient)"
                            fillOpacity={1}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                      <div className="text-center">
                        <div>No login data available for the selected period</div>
                        {loginStats && (
                          <div className="mt-2 text-xs">
                            <div>Daily stats length: {loginStats.daily_stats?.length || 0}</div>
                            <div>Daily stats data: {JSON.stringify(loginStats.daily_stats || [])}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Top Countries</CardTitle>
                    <CardDescription className="text-zinc-400">Most visited countries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {visitorStats?.country_stats && visitorStats.country_stats.length > 0 ? (
                      <div className="space-y-3">
                        {visitorStats.country_stats.slice(0, 8).map((country, index) => (
                          <div key={country._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-white">
                                {index + 1}
                              </div>
                              <span className="text-white">{country._id}</span>
                            </div>
                            <span className="text-zinc-400 font-medium">{country.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-zinc-400">
                        No country data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Authentication Methods</CardTitle>
                    <CardDescription className="text-zinc-400">Login methods breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loginStats?.auth_method_stats && loginStats.auth_method_stats.length > 0 ? (
                      <div className="space-y-3">
                        {loginStats.auth_method_stats.map((method, index) => (
                          <div key={method._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-white">
                                {index + 1}
                              </div>
                              <span className="text-white capitalize">
                                {method._id === 'google_oauth' ? 'Google OAuth' : method._id === 'password' ? 'Password' : method._id}
                              </span>
                            </div>
                            <span className="text-zinc-400 font-medium">{method.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-zinc-400">
                        No authentication data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Top Users by Logins</CardTitle>
                    <CardDescription className="text-zinc-400">Most active users in the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loginStats?.top_users_stats && loginStats.top_users_stats.length > 0 ? (
                      <div className="space-y-3">
                        {loginStats.top_users_stats.slice(0, 8).map((user, index) => (
                          <div key={user._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-white">
                                {index + 1}
                              </div>
                              <span className="text-white">{user._id}</span>
                            </div>
                            <span className="text-zinc-400 font-medium">{user.count} logins</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-zinc-400">
                        No user login data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Logins</CardTitle>
                    <CardDescription className="text-zinc-400">Latest user authentication events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loginLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : loginData.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {loginData.slice(0, 10).map((login) => (
                          <div key={login._id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                login.auth_method === 'google_oauth' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                              <div>
                                <div className="text-white font-medium">{login.username}</div>
                                <div className="text-zinc-500 text-xs">
                                  {login.auth_method === 'google_oauth' ? 'Google OAuth' : 'Password'}
                                </div>
                              </div>
                            </div>
                            <span className="text-zinc-400 text-xs">
                              {convertToEasternTime(login.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-zinc-400">
                        No recent login data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
                </div>
              )}

              {/* Visitors Tab */}
              {analyticsSubTab === 'visitors' && (
                <div className="space-y-6">
                  {/* Visitor Filters */}
                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-white">Filter Visitors</CardTitle>
                      <CardDescription className="text-zinc-400">Filter visitors by IP address or location</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ip-exclusion" className="text-white text-sm mb-2 block">
                            Exclude IP Addresses
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="ip-exclusion"
                              type="text"
                              placeholder="Enter IP address to exclude..."
                              value={visitorIpInput}
                              onChange={(e) => setVisitorIpInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addIpExclusion()}
                              className="bg-zinc-800 text-white border-zinc-600 focus:border-blue-500"
                            />
                            <Button 
                              onClick={addIpExclusion}
                              variant="outline"
                              className="text-white border-zinc-600 hover:bg-zinc-800"
                            >
                              Add
                            </Button>
                          </div>
                          {visitorIpExclusions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-zinc-400 text-xs mb-1">Excluded IPs:</div>
                              <div className="flex flex-wrap gap-2">
                                {visitorIpExclusions.map((ip) => (
                                  <span
                                    key={ip}
                                    className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-xs flex items-center gap-1"
                                  >
                                    {ip}
                                    <button
                                      onClick={() => removeIpExclusion(ip)}
                                      className="text-red-400 hover:text-red-200 ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="location-filter" className="text-white text-sm mb-2 block">
                            Location Filter (City, Region, Country)
                          </Label>
                          <Input
                            id="location-filter"
                            type="text"
                            placeholder="Enter location to filter..."
                            value={visitorLocationFilter}
                            onChange={(e) => setVisitorLocationFilter(e.target.value)}
                            className="bg-zinc-800 text-white border-zinc-600 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={clearAllFilters}
                          variant="outline"
                          className="text-white border-zinc-600 hover:bg-zinc-800"
                        >
                          Clear All Filters
                        </Button>
                        {(visitorIpExclusions.length > 0 || visitorLocationFilter) && (
                          <div className="text-zinc-400 text-sm flex items-center">
                            Showing {getFilteredVisitors().length} of {visitorData.length} visitors
                            {visitorIpExclusions.length > 0 && ` (${visitorIpExclusions.length} IPs excluded)`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">Recent Visitors</CardTitle>
                          <CardDescription className="text-zinc-400">
                            Latest site visitors with location data
                            {(visitorIpExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                      {(() => {
                        const filteredVisitors = getFilteredVisitors()
                        const totalPages = getTotalPages({ totalItems: filteredVisitors.length, pageSize: visitorPageSize })
                        const currentPage = clampPage({ page: visitorPage, totalPages })
                        return (
                          <>
                            <span className="text-zinc-400 text-xs hidden md:inline">
                              Page {currentPage} of {totalPages} • {filteredVisitors.length} total
                              {(visitorIpExclusions.length > 0 || visitorLocationFilter) && ` (filtered from ${visitorData.length})`}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setVisitorPage(prevVisitorPage({ page: currentPage }))}
                              disabled={!canGoPrev({ page: currentPage })}
                              className="text-white border-zinc-600"
                            >
                              Prev
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setVisitorPage(nextVisitorPage({ page: currentPage, totalPages }))}
                              disabled={!canGoNext({ page: currentPage, totalPages })}
                              className="text-white border-zinc-600"
                            >
                              Next
                            </Button>
                          </>
                        )
                      })()}
                        </div>
                      </div>
                    </CardHeader>
                <CardContent>
                  {visitorLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : visitorData.length > 0 ? (
                    <div className="overflow-x-auto border border-zinc-700 rounded-lg">
                      <table className="w-full min-w-full">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">IP Address</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Page</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Source</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Campaign</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Content Type</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Location</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredVisitors = getFilteredVisitors()
                            const totalPages = getTotalPages({ totalItems: filteredVisitors.length, pageSize: visitorPageSize })
                            const currentPage = clampPage({ page: visitorPage, totalPages })
                            const paged = getPageSlice({ items: filteredVisitors, page: currentPage, pageSize: visitorPageSize })
                            return paged
                          })().map((visitor) => (
                            <tr key={visitor._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="text-white font-mono text-sm">{visitor.ip_address}</span>
                              </td>
                              <td className="py-3 px-4 max-w-[200px]">
                                <div>
                                  <div className="text-white text-sm font-medium truncate" title={visitor.page_title || visitor.path || 'Unknown'}>
                                    {visitor.page_title || (visitor.path ? visitor.path.split('?')[0] : 'Unknown')}
                                  </div>
                                  {visitor.path && visitor.path !== visitor.page_title && (
                                    <div className="text-zinc-500 text-xs font-mono truncate" title={visitor.path}>
                                      {visitor.path}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {visitor.referrer_source ? (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    visitor.referrer_source === 'twitter' ? 'bg-blue-900/50 text-blue-300' :
                                    visitor.referrer_source === 'facebook' ? 'bg-blue-800/50 text-blue-200' :
                                    visitor.referrer_source === 'google' ? 'bg-green-900/50 text-green-300' :
                                    visitor.referrer_source === 'linkedin' ? 'bg-purple-900/50 text-purple-300' :
                                    'bg-zinc-700/50 text-zinc-300'
                                  }`}>
                                    {visitor.referrer_source}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Direct</span>
                                )}
                              </td>
                              <td className="py-3 px-4 max-w-[120px]">
                                {visitor.campaign_id ? (
                                  <span className="text-zinc-300 text-xs font-mono truncate inline-block max-w-full" title={visitor.campaign_id}>
                                    {visitor.campaign_id.length > 12 ? `${visitor.campaign_id.substring(0, 12)}...` : visitor.campaign_id}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {visitor.content_type ? (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    visitor.content_type === 'landing_page' ? 'bg-green-900/50 text-green-300' :
                                    visitor.content_type === 'dashboard' ? 'bg-blue-900/50 text-blue-300' :
                                    visitor.content_type === 'auth_page' ? 'bg-yellow-900/50 text-yellow-300' :
                                    visitor.content_type === 'features_page' ? 'bg-purple-900/50 text-purple-300' :
                                    'bg-zinc-700/50 text-zinc-300'
                                  }`}>
                                    {visitor.content_type.replace('_', ' ')}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Unknown</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="text-white text-sm">{visitor.city}</div>
                                  <div className="text-zinc-400 text-xs">{visitor.region}, {visitor.country}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-zinc-400 text-sm">
                                {convertToEasternTime(visitor.time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No visitor data available
                    </div>
                  )}
                </CardContent>
                  </Card>
                </div>
              )}

              {/* Conversations Tab */}
              {analyticsSubTab === 'conversations' && (
                <div className="space-y-6">
                  {/* User Filter */}
                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-white">Filter Conversations</CardTitle>
                      <CardDescription className="text-zinc-400">Filter conversations by username</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label htmlFor="user-filter" className="text-white text-sm mb-2 block">
                            Select User
                          </Label>
                          <select
                            id="user-filter"
                            value={conversationUserFilter}
                            onChange={(e) => setConversationUserFilter(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">All Users</option>
                            {usersLoading ? (
                              <option disabled>Loading users...</option>
                            ) : (
                              conversationUsers.map((username) => (
                                <option key={username} value={username}>
                                  {username}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        <Button 
                          onClick={() => loadConversationsAnalytics(30, conversationUserFilter)}
                          variant="outline"
                          className="text-white border-zinc-600 hover:bg-zinc-800"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Apply Filter
                        </Button>
                        {conversationUserFilter && (
                          <Button 
                            onClick={() => {
                              setConversationUserFilter('')
                              loadConversationsAnalytics(30, '')
                            }}
                            variant="outline"
                            className="text-white border-zinc-600 hover:bg-zinc-800"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">AI Conversations</CardTitle>
                          <CardDescription className="text-zinc-400">
                            Recent AI conversations with users
                            {conversationUserFilter && ` (filtered by: ${conversationUserFilter})`}
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => loadConversationsAnalytics(30, conversationUserFilter)} 
                          variant="outline" 
                          size="sm"
                          className="text-white border-zinc-600 hover:bg-zinc-800"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                <CardContent>
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : conversationsAnalytics?.conversations && conversationsAnalytics.conversations.length > 0 ? (
                    <div className="overflow-x-auto border border-zinc-700 rounded-lg">
                      <table className="w-full min-w-full">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">User</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Conversation Title</th>
                            <th className="text-center py-3 px-4 text-zinc-300 font-medium">Messages</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Created</th>
                            <th className="text-left py-3 px-4 text-zinc-300 font-medium">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversationsAnalytics.conversations.slice(0, 20).map((conversation) => (
                            <>
                              <tr 
                                key={conversation._id} 
                                onClick={() => handleConversationRowClick(conversation._id)}
                                className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                              >
                                <td className="py-3 px-4">
                                  <span className="text-white font-medium">{conversation.username}</span>
                                </td>
                                <td className="py-3 px-4 max-w-[300px]">
                                  <span className="text-zinc-300 text-sm truncate inline-block max-w-full" title={conversation.title}>
                                    {conversation.title || 'Untitled Conversation'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="text-white font-medium">{conversation.message_count}</span>
                                </td>
                                <td className="py-3 px-4 text-zinc-400 text-sm">
                                  {convertToEasternTime(conversation.created_at)}
                                </td>
                                <td className="py-3 px-4 text-zinc-400 text-sm">
                                  {conversation.last_message_at ? convertToEasternTime(conversation.last_message_at) : convertToEasternTime(conversation.updated_at)}
                                </td>
                              </tr>
                              {expandedConversation === conversation._id && (
                                <tr>
                                  <td colSpan={5} className="p-0">
                                    <div className="bg-zinc-800/30 border-l-4 border-blue-500">
                                      {conversationDetailsLoading ? (
                                        <div className="p-6 text-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                                          <div className="text-zinc-400">Loading conversation details...</div>
                                        </div>
                                      ) : conversationDetails ? (
                                        <div className="p-6">
                                          <div className="flex justify-between items-start mb-4">
                                            <div>
                                              <h3 className="text-white font-semibold text-lg mb-2">
                                                {conversationDetails.title || 'Untitled Conversation'}
                                              </h3>
                                              <div className="text-zinc-400 text-sm">
                                                <span className="mr-4">User: {conversationDetails.username}</span>
                                                <span className="mr-4">Messages: {conversationDetails.messages?.length || 0}</span>
                                                <span>Created: {convertToEasternTime(conversationDetails.created_at)}</span>
                                              </div>
                                            </div>
                                            <Button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setExpandedConversation(null)
                                                setConversationDetails(null)
                                              }}
                                              variant="outline"
                                              size="sm"
                                              className="text-white border-zinc-600 hover:bg-zinc-800"
                                            >
                                              Close
                                            </Button>
                                          </div>
                                          <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {conversationDetails.messages?.map((message: any, index: number) => (
                                              <div key={index} className="bg-zinc-900/50 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                  <span className="text-blue-400 font-medium text-sm">
                                                    {message.role === 'user' ? 'User' : 'AI Assistant'}
                                                  </span>
                                                  <span className="text-zinc-500 text-xs">
                                                    {message.timestamp ? convertToEasternTime(message.timestamp) : 'Unknown time'}
                                                  </span>
                                                </div>
                                                <div className="text-zinc-200 text-sm whitespace-pre-wrap">
                                                  {(() => {
                                                    const content = message.content || message.text || 'No content'
                                                    if (typeof content === 'string') {
                                                      return content
                                                    } else if (typeof content === 'object' && content !== null) {
                                                      // Handle object content (e.g., from LangGraph)
                                                      if (content.text) {
                                                        return content.text
                                                      } else if (content.type && content.text) {
                                                        return content.text
                                                      } else {
                                                        return JSON.stringify(content)
                                                      }
                                                    } else {
                                                      return String(content)
                                                    }
                                                  })()}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-6 text-center text-zinc-400">
                                          Failed to load conversation details
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                      {conversationsAnalytics.conversations.length > 20 && (
                        <div className="p-3 text-center text-zinc-400 text-sm bg-zinc-800">
                          Showing 20 of {conversationsAnalytics.conversations.length} conversations
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No conversation data available
                    </div>
                  )}
                </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
