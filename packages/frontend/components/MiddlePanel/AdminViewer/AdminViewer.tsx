import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../../common/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../common/ui/card'
import { ApiService } from '../../../../backend/api/apiService'
import { UsersTab } from './components/UsersTab'
import { AnalyticsTab } from './components/AnalyticsTab'
import { MarketingTab } from './components/MarketingTab'
import { convertToEasternTime, formatBytes } from './utils/adminUtils'
import type {
  User,
  SystemStats,
  VisitorData,
  VisitorStats,
  LoginData,
  LoginStats,
  GoogleScopesAnalytics,
  ConversationsAnalytics,
  FileTypeAnalytics,
  ApiUsageAnalytics,
  UserEngagementAnalytics,
  RetentionAnalytics,
  FeatureUsageAnalytics,
  ErrorAnalytics
} from './types/adminTypes'

interface AdminViewerProps {
  activeTab: string
}

export function AdminViewer({ activeTab }: AdminViewerProps) {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0
  })
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
  const [apiUsageExcludedUsers, setApiUsageExcludedUsers] = useState<string[]>([])
  const [userEngagementExcludedUsers, setUserEngagementExcludedUsers] = useState<string[]>([])
  const [retentionExcludedUsers, setRetentionExcludedUsers] = useState<string[]>([])
  const [featureUsageExcludedUsers, setFeatureUsageExcludedUsers] = useState<string[]>([])
  const [errorExcludedUsers, setErrorExcludedUsers] = useState<string[]>([])

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    // Overview tab - loads only aggregate stats needed for overview
    if (activeTab === 'admin-analytics-overview' && !visitorLoading && !loginLoading && !conversationsLoading && !dashboardVisitLoading && !workspaceVisitLoading) {
      loadVisitorData(analyticsDays)
      loadLoginData(analyticsDays)
      loadConversationsAnalytics(analyticsDays, conversationUserFilter)
      loadDashboardVisitStats()
      loadWorkspaceVisitStats()
    }

    // Visitors tab - only loads visitor-specific data
    if (activeTab === 'admin-visitors' && !visitorLoading) {
      loadVisitorData(analyticsDays)
    }

    // Conversations tab - only loads conversation-specific data
    if (activeTab === 'admin-conversations' && !conversationsLoading && !usersLoading) {
      loadConversationsAnalytics(analyticsDays, conversationUserFilter)
      loadConversationUsers(analyticsDays)
    }

    if (activeTab === 'admin-filetypes' && !fileTypeLoading) {
      loadFileTypeAnalytics(analyticsDays)
    }

    if (activeTab === 'admin-api-usage' && !apiUsageLoading) {
      loadApiUsageAnalytics(analyticsDays, apiUsageExcludedUsers)
    }

    if (activeTab === 'admin-engagement' && !userEngagementLoading) {
      loadUserEngagementAnalytics(analyticsDays, userEngagementExcludedUsers)
    }

    if (activeTab === 'admin-retention' && !retentionLoading) {
      loadRetentionAnalytics(retentionExcludedUsers)
    }

    if (activeTab === 'admin-features' && !featureUsageLoading) {
      loadFeatureUsageAnalytics(analyticsDays, featureUsageExcludedUsers)
    }

    if (activeTab === 'admin-errors' && !errorLoading) {
      loadErrorAnalytics(analyticsDays, errorExcludedUsers)
    }

    if (activeTab === 'admin-users' && !scopesLoading && !scopesAnalytics) {
      loadScopesAnalytics()
    }
  }, [activeTab, analyticsDays])

  const loadAdminData = async () => {
    setLoading(true)

    try {
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

    setLoading(false)
  }

  const loadVisitorData = async (days: number = 30) => {
    setVisitorLoading(true)
    try {
      const response = await ApiService.getSiteVisitorInfoEnhanced(1000, days) as any

      const visitors = response.visitors || []
      setVisitorData(visitors)
      setVisitorPage(1)

      const dailyStatsMap: Record<string, number> = {}
      const countryStatsMap: Record<string, number> = {}
      const cityStatsMap: Record<string, number> = {}

      visitors.forEach((visitor: VisitorData) => {
        const date = new Date(visitor.time).toISOString().split('T')[0]
        dailyStatsMap[date] = (dailyStatsMap[date] || 0) + 1

        if (visitor.country) {
          countryStatsMap[visitor.country] = (countryStatsMap[visitor.country] || 0) + 1
        }

        if (visitor.city) {
          cityStatsMap[visitor.city] = (cityStatsMap[visitor.city] || 0) + 1
        }
      })

      const dailyStatsArray = Object.entries(dailyStatsMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const countryStatsArray = Object.entries(countryStatsMap)
        .map(([country, count]) => ({ _id: country, count }))
        .sort((a, b) => b.count - a.count)

      const cityStatsArray = Object.entries(cityStatsMap)
        .map(([city, count]) => ({ _id: city, count }))
        .sort((a, b) => b.count - a.count)

      const stats = {
        total_visitors: response.summary?.total_visitors || visitors.length,
        recent_visitors: response.summary?.total_visitors || visitors.length,
        period_days: response.summary?.date_range_days || days,
        country_stats: countryStatsArray,
        city_stats: cityStatsArray,
        hourly_stats: [],
        daily_stats: dailyStatsArray,
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

      try {
        const legacyResponse = await ApiService.getSiteVisitorInfo(1000, days) as any
        if (legacyResponse.result === 'success') {
          setVisitorData(legacyResponse.visitors || [])
          setVisitorPage(1)

          let processedDailyStats = legacyResponse.daily_stats || []
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
      const response = await ApiService.getLoginAnalytics(1000, days) as any
      if (response.result === 'success') {
        setLoginData(response.logins || [])

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
            cutoffDate.setDate(cutoffDate.getDate() - 30)
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
            cutoffDate.setDate(cutoffDate.getDate() - 30)
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
      const response = await ApiService.getFileTypeAnalytics(days, 1000, usersToExclude) as FileTypeAnalytics
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

  const loadApiUsageAnalytics = async (days: number = 30, excludedUsers: string[] = []) => {
    setApiUsageLoading(true)
    try {
      const response = await ApiService.getApiUsageAnalytics(days, excludedUsers) as ApiUsageAnalytics
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

  const loadUserEngagementAnalytics = async (days: number = 30, excludedUsers: string[] = []) => {
    setUserEngagementLoading(true)
    try {
      const response = await ApiService.getUserEngagementAnalytics(days, excludedUsers) as UserEngagementAnalytics
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

  const loadRetentionAnalytics = async (excludedUsers: string[] = []) => {
    setRetentionLoading(true)
    try {
      const response = await ApiService.getRetentionAnalytics(excludedUsers) as RetentionAnalytics
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

  const loadFeatureUsageAnalytics = async (days: number = 30, excludedUsers: string[] = []) => {
    setFeatureUsageLoading(true)
    try {
      const response = await ApiService.getFeatureUsageAnalytics(days, excludedUsers) as FeatureUsageAnalytics
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

  const loadErrorAnalytics = async (days: number = 30, excludedUsers: string[] = []) => {
    setErrorLoading(true)
    try {
      const response = await ApiService.getErrorAnalytics(days, excludedUsers) as ErrorAnalytics
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-foreground"></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-card">
      {activeTab === 'admin-overview' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl font-bold text-foreground">System Overview</h1>
            <Button onClick={loadAdminData} variant="outline" className="border-zinc-200 dark:border-white/[0.06]">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{systemStats.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
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

      {activeTab === 'admin-users' && (
        <UsersTab
          users={users}
          convertToEasternTime={convertToEasternTime}
          formatBytes={formatBytes}
          scopesAnalytics={scopesAnalytics}
        />
      )}

      {activeTab === 'admin-marketing' && (
        <MarketingTab />
      )}

      {(activeTab === 'admin-analytics-overview' || activeTab === 'admin-visitors' || activeTab === 'admin-conversations' || activeTab === 'admin-filetypes' || activeTab === 'admin-api-usage' || activeTab === 'admin-engagement' || activeTab === 'admin-retention' || activeTab === 'admin-features' || activeTab === 'admin-errors') && (
        <AnalyticsTab
          analyticsSubTab={
            activeTab === 'admin-analytics-overview' ? 'overview'
            : activeTab === 'admin-visitors' ? 'visitors'
            : activeTab === 'admin-conversations' ? 'conversations'
            : activeTab === 'admin-filetypes' ? 'filetypes'
            : activeTab === 'admin-api-usage' ? 'api-usage'
            : activeTab === 'admin-engagement' ? 'engagement'
            : activeTab === 'admin-retention' ? 'retention'
            : activeTab === 'admin-features' ? 'features'
            : activeTab === 'admin-errors' ? 'errors'
            : 'overview'
          }
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
          apiUsageExcludedUsers={apiUsageExcludedUsers}
          setApiUsageExcludedUsers={setApiUsageExcludedUsers}
          userEngagementExcludedUsers={userEngagementExcludedUsers}
          setUserEngagementExcludedUsers={setUserEngagementExcludedUsers}
          retentionExcludedUsers={retentionExcludedUsers}
          setRetentionExcludedUsers={setRetentionExcludedUsers}
          featureUsageExcludedUsers={featureUsageExcludedUsers}
          setFeatureUsageExcludedUsers={setFeatureUsageExcludedUsers}
          errorExcludedUsers={errorExcludedUsers}
          setErrorExcludedUsers={setErrorExcludedUsers}
        />
      )}
    </div>
  )
}
