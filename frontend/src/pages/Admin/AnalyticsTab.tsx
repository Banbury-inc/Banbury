import { useState } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/old-input'
import { Label } from '../../components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { ApiService } from '../../services/apiService'
import { 
  getTotalPages, 
  getPageSlice, 
  nextPage as nextVisitorPage, 
  prevPage as prevVisitorPage, 
  canGoNext, 
  canGoPrev, 
  clampPage 
} from '../handlers/adminVisitors'
import { AIConversationsTab } from './AIConversationsTab'

interface VisitorData {
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

interface AnalyticsTabProps {
  analyticsSubTab: string
  visitorData: VisitorData[]
  visitorStats: VisitorStats | null
  visitorLoading: boolean
  visitorPage: number
  setVisitorPage: (page: number) => void
  visitorPageSize: number
  loginData: LoginData[]
  loginStats: LoginStats | null
  loginLoading: boolean
  scopesAnalytics: GoogleScopesAnalytics | null
  scopesLoading: boolean
  conversationsAnalytics: ConversationsAnalytics | null
  conversationsLoading: boolean
  conversationUserFilter: string
  setConversationUserFilter: (filter: string) => void
  conversationUsers: string[]
  usersLoading: boolean
  dashboardVisitStats: any
  dashboardVisitLoading: boolean
  workspaceVisitStats: any
  workspaceVisitLoading: boolean
  fileTypeAnalytics: FileTypeAnalytics | null
  fileTypeLoading: boolean
  excludedUsers: string[]
  setExcludedUsers: (users: string[]) => void
  loadVisitorData: (days: number) => Promise<void>
  loadLoginData: (days: number) => Promise<void>
  loadScopesAnalytics: () => Promise<void>
  loadConversationsAnalytics: (days: number, userFilter: string) => Promise<void>
  loadConversationUsers: (days: number) => Promise<void>
  loadDashboardVisitStats: () => Promise<void>
  loadWorkspaceVisitStats: () => Promise<void>
  loadFileTypeAnalytics: (days: number, usersToExclude?: string[]) => Promise<void>
  convertToEasternTime: (timestamp: string) => string
}

export function AnalyticsTab({
  analyticsSubTab,
  visitorData,
  visitorStats,
  visitorLoading,
  visitorPage,
  setVisitorPage,
  visitorPageSize,
  loginData,
  loginStats,
  loginLoading,
  scopesAnalytics,
  scopesLoading,
  conversationsAnalytics,
  conversationsLoading,
  conversationUserFilter,
  setConversationUserFilter,
  conversationUsers,
  usersLoading,
  dashboardVisitStats,
  dashboardVisitLoading,
  workspaceVisitStats,
  workspaceVisitLoading,
  fileTypeAnalytics,
  fileTypeLoading,
  excludedUsers,
  setExcludedUsers,
  loadVisitorData,
  loadLoginData,
  loadScopesAnalytics,
  loadConversationsAnalytics,
  loadConversationUsers,
  loadDashboardVisitStats,
  loadWorkspaceVisitStats,
  loadFileTypeAnalytics,
  convertToEasternTime
}: AnalyticsTabProps) {
  const [visitorIpExclusions, setVisitorIpExclusions] = useState<string[]>([])
  const [visitorIpInput, setVisitorIpInput] = useState<string>('')
  const [visitorLocationExclusions, setVisitorLocationExclusions] = useState<string[]>(['New York'])
  const [visitorLocationInput, setVisitorLocationInput] = useState<string>('')
  const [visitorLocationFilter, setVisitorLocationFilter] = useState<string>('')
  const [userExclusionInput, setUserExclusionInput] = useState<string>('')

  const getFilteredVisitors = () => {
    if (!visitorData || visitorData.length === 0) return []
    
    return visitorData.filter(visitor => {
      const isIpExcluded = visitorIpExclusions.some(excludedIp => 
        visitor.ip_address?.toLowerCase().includes(excludedIp.toLowerCase())
      )
      
      const isLocationExcluded = visitorLocationExclusions.some(excludedLocation => 
        visitor.city?.toLowerCase().includes(excludedLocation.toLowerCase()) ||
        visitor.region?.toLowerCase().includes(excludedLocation.toLowerCase()) ||
        visitor.country?.toLowerCase().includes(excludedLocation.toLowerCase())
      )
      
      const matchesLocation = !visitorLocationFilter || 
        visitor.city?.toLowerCase().includes(visitorLocationFilter.toLowerCase()) ||
        visitor.region?.toLowerCase().includes(visitorLocationFilter.toLowerCase()) ||
        visitor.country?.toLowerCase().includes(visitorLocationFilter.toLowerCase())
      
      return !isIpExcluded && !isLocationExcluded && matchesLocation
    })
  }

  // Process filtered visitor stats for overview tab
  const getFilteredVisitorStats = () => {
    const filteredVisitors = getFilteredVisitors()
    if (filteredVisitors.length === 0) return null
    
    const dailyStatsMap: Record<string, number> = {}
    const countryStatsMap: Record<string, number> = {}
    const cityStatsMap: Record<string, number> = {}
    
    filteredVisitors.forEach(visitor => {
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
    
    const dailyStatsArray = Object.entries(dailyStatsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const countryStatsArray = Object.entries(countryStatsMap)
      .map(([country, count]) => ({ _id: country, count }))
      .sort((a, b) => b.count - a.count)
    
    const cityStatsArray = Object.entries(cityStatsMap)
      .map(([city, count]) => ({ _id: city, count }))
      .sort((a, b) => b.count - a.count)
    
    return {
      total_visitors: visitorStats?.total_visitors || 0,
      recent_visitors: filteredVisitors.length,
      period_days: visitorStats?.period_days || 30,
      country_stats: countryStatsArray,
      city_stats: cityStatsArray,
      hourly_stats: [],
      daily_stats: dailyStatsArray
    }
  }

  // Process page-specific daily stats using filtered data
  const getPageSpecificStats = (pageFilter: (path: string) => boolean) => {
    const filteredVisitors = getFilteredVisitors()
    if (filteredVisitors.length === 0) return []
    
    const dailyStatsMap: Record<string, number> = {}
    
    filteredVisitors.forEach(visitor => {
      if (visitor.path && pageFilter(visitor.path)) {
        const date = new Date(visitor.time).toISOString().split('T')[0]
        dailyStatsMap[date] = (dailyStatsMap[date] || 0) + 1
      }
    })
    
    return Object.entries(dailyStatsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const filteredStats = getFilteredVisitorStats()
  const homePageStats = getPageSpecificStats(path => path === '/' || path === '/home' || path.startsWith('/?'))
  const docsPageStats = getPageSpecificStats(path => path === '/docs' || path.startsWith('/docs/') || path.startsWith('/docs?'))
  const workspacesPageStats = getPageSpecificStats(path => path === '/workspaces' || path.startsWith('/workspaces/') || path.startsWith('/workspaces?'))
  const authPageStats = getPageSpecificStats(path => path === '/login' || path.startsWith('/login') || path === '/auth/callback' || path.startsWith('/auth/callback'))
  const taskStudioPageStats = getPageSpecificStats(path => path === '/task-studio' || path.startsWith('/task-studio/') || path.startsWith('/task-studio?'))
  const meetingsPageStats = getPageSpecificStats(path => path === '/meeting-agent' || path.startsWith('/meeting-agent/') || path.startsWith('/meeting-agent?'))

  // Get documentation page breakdown by individual pages with time-series data
  const getDocsPageBreakdown = () => {
    const filteredVisitors = getFilteredVisitors()
    const docsPages: Record<string, Record<string, number>> = {}
    
    // Collect daily stats for each documentation page
    filteredVisitors.forEach(visitor => {
      if (visitor.content_type && visitor.content_type.startsWith('documentation -')) {
        const pageName = visitor.content_type.replace('documentation - ', '').trim()
        const date = new Date(visitor.time).toISOString().split('T')[0]
        
        if (!docsPages[pageName]) {
          docsPages[pageName] = {}
        }
        docsPages[pageName][date] = (docsPages[pageName][date] || 0) + 1
      }
    })
    
    // Convert to array format with daily stats for each page
    return Object.entries(docsPages)
      .map(([page, dailyStats]) => {
        const dailyStatsArray = Object.entries(dailyStats)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        const totalCount = dailyStatsArray.reduce((sum, stat) => sum + stat.count, 0)
        
        return {
          page,
          totalCount,
          dailyStats: dailyStatsArray
        }
      })
      .sort((a, b) => b.totalCount - a.totalCount)
  }

  const docsPageBreakdown = getDocsPageBreakdown()


  const addIpExclusion = () => {
    if (visitorIpInput.trim() && !visitorIpExclusions.includes(visitorIpInput.trim())) {
      setVisitorIpExclusions([...visitorIpExclusions, visitorIpInput.trim()])
      setVisitorIpInput('')
    }
  }

  const removeIpExclusion = (ipToRemove: string) => {
    setVisitorIpExclusions(visitorIpExclusions.filter(ip => ip !== ipToRemove))
  }

  const addLocationExclusion = () => {
    if (visitorLocationInput.trim() && !visitorLocationExclusions.includes(visitorLocationInput.trim())) {
      setVisitorLocationExclusions([...visitorLocationExclusions, visitorLocationInput.trim()])
      setVisitorLocationInput('')
    }
  }

  const removeLocationExclusion = (locationToRemove: string) => {
    setVisitorLocationExclusions(visitorLocationExclusions.filter(location => location !== locationToRemove))
  }

  const clearAllFilters = () => {
    setVisitorIpExclusions([])
    setVisitorIpInput('')
    setVisitorLocationExclusions([])
    setVisitorLocationInput('')
    setVisitorLocationFilter('')
  }

  const addUserExclusion = async () => {
    if (userExclusionInput.trim() && !excludedUsers.includes(userExclusionInput.trim())) {
      const newExcludedUsers = [...excludedUsers, userExclusionInput.trim()]
      setExcludedUsers(newExcludedUsers)
      setUserExclusionInput('')
      // Reload data with new exclusions
      await loadFileTypeAnalytics(30, newExcludedUsers)
    }
  }

  const removeUserExclusion = async (userToRemove: string) => {
    const newExcludedUsers = excludedUsers.filter(user => user !== userToRemove)
    setExcludedUsers(newExcludedUsers)
    // Reload data with updated exclusions
    await loadFileTypeAnalytics(30, newExcludedUsers)
  }

  const clearUserExclusions = async () => {
    setExcludedUsers([])
    await loadFileTypeAnalytics(30, [])
  }

  const getPageTitle = () => {
    switch (analyticsSubTab) {
      case 'overview':
        return 'Analytics Overview'
      case 'visitors':
        return 'Site Visitors'
      case 'conversations':
        return 'AI Conversations'
      case 'filetypes':
        return 'File Types Analytics'
      default:
        return 'Analytics'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
        <div className="flex gap-2">
          <select 
            onChange={(e) => {
              const days = parseInt(e.target.value)
              loadVisitorData(days)
              loadLoginData(days)
              loadScopesAnalytics()
              loadConversationsAnalytics(days, conversationUserFilter)
              loadConversationUsers(days)
              loadFileTypeAnalytics(days)
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
            loadFileTypeAnalytics(30)
          }} variant="outline" className="text-white border-zinc-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Overview Tab */}
      {analyticsSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Filter Section */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-white border-zinc-600 hover:bg-zinc-800"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Analytics Data
                  {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                    <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                      {visitorIpExclusions.length + visitorLocationExclusions.length + (visitorLocationFilter ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Filter Analytics Data</h3>
                    <p className="text-zinc-400 text-sm">Filter all visitor analytics by IP address or location</p>
                  </div>
                  <div>
                    <Label htmlFor="overview-ip-exclusion" className="text-white text-sm mb-2 block">
                      Exclude IP Addresses
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="overview-ip-exclusion"
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
                        size="sm"
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
                    <Label htmlFor="overview-location-exclusion" className="text-white text-sm mb-2 block">
                      Exclude Locations (City, Region, or Country)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="overview-location-exclusion"
                        type="text"
                        placeholder="Enter location to exclude..."
                        value={visitorLocationInput}
                        onChange={(e) => setVisitorLocationInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addLocationExclusion()}
                        className="bg-zinc-800 text-white border-zinc-600 focus:border-blue-500"
                      />
                      <Button 
                        onClick={addLocationExclusion}
                        variant="outline"
                        size="sm"
                        className="text-white border-zinc-600 hover:bg-zinc-800"
                      >
                        Add
                      </Button>
                    </div>
                    {visitorLocationExclusions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-zinc-400 text-xs mb-1">Excluded Locations:</div>
                        <div className="flex flex-wrap gap-2">
                          {visitorLocationExclusions.map((location) => (
                            <span
                              key={location}
                              className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              {location}
                              <button
                                onClick={() => removeLocationExclusion(location)}
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
                    <Label htmlFor="overview-location-filter" className="text-white text-sm mb-2 block">
                      Location Filter (City, Region, Country)
                    </Label>
                    <Input
                      id="overview-location-filter"
                      type="text"
                      placeholder="Enter location to filter..."
                      value={visitorLocationFilter}
                      onChange={(e) => setVisitorLocationFilter(e.target.value)}
                      className="bg-zinc-800 text-white border-zinc-600 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button 
                      onClick={clearAllFilters}
                      variant="outline"
                      className="w-full text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      Clear All Filters
                    </Button>
                    {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                      <div className="text-zinc-400 text-xs text-center">
                        Showing {getFilteredVisitors().length} of {visitorData.length} visitors
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Enhanced Tracking Summary */}
          {getFilteredVisitors().some(v => v.tracking_version) && (
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
                        const filteredVisitors = getFilteredVisitors()
                        filteredVisitors.forEach(visitor => {
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
                        const filteredVisitors = getFilteredVisitors()
                        filteredVisitors.forEach(visitor => {
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
                        const filteredVisitors = getFilteredVisitors()
                        filteredVisitors.forEach(visitor => {
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
              {filteredStats?.recent_visitors?.toLocaleString() || '0'}
            </div>
            <div className="text-zinc-400 text-sm">
              Last {filteredStats?.period_days || 30} days
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </div>
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
          ) : filteredStats?.daily_stats && filteredStats.daily_stats.length > 0 ? (
            <div className="w-full h-72 p-4">
              {/* Debug info */}
              <div className="text-xs text-zinc-500 mb-2">
                Chart data points: {filteredStats.daily_stats.length} | 
                Date range: {filteredStats.daily_stats[0]?.date} to {filteredStats.daily_stats[filteredStats.daily_stats.length - 1]?.date} |
                Today: {new Date().toISOString().split('T')[0]}
                {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' | Filtered'}
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
                  data={filteredStats.daily_stats}
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
                {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                  <div className="mt-2 text-xs text-yellow-400">
                    Try clearing filters to see data
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page-Specific Visitors Over Time Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Home Page Visitors */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Home Page Visitors</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Daily trends for home page
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visitorLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : homePageStats.length > 0 ? (
              <div className="w-full h-48 p-3">
                <ChartContainer
                  config={{
                    visitors: {
                      label: "Home Visitors",
                      color: "#8b5cf6",
                    },
                  }}
                  className="w-full h-full !flex-none"
                >
                  <AreaChart 
                    data={homePageStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={8}
                      type="category"
                      scale="point"
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00')
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={8}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={30}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const date = new Date(label + 'T12:00:00')
                        return (
                          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 shadow-lg">
                            <div className="text-white font-medium text-xs">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-purple-400 text-xs">
                              {payload[0].value} visitors
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fill="url(#homeGradient)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                No home page data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Docs Page Visitors */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Docs Page Visitors</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Daily trends for docs page
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visitorLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : docsPageStats.length > 0 ? (
              <div className="w-full h-48 p-3">
                <ChartContainer
                  config={{
                    visitors: {
                      label: "Docs Visitors",
                      color: "#06b6d4",
                    },
                  }}
                  className="w-full h-full !flex-none"
                >
                  <AreaChart 
                    data={docsPageStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="docsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={8}
                      type="category"
                      scale="point"
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00')
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={8}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={30}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const date = new Date(label + 'T12:00:00')
                        return (
                          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 shadow-lg">
                            <div className="text-white font-medium text-xs">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-cyan-400 text-xs">
                              {payload[0].value} visitors
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      fill="url(#docsGradient)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                No docs page data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workspaces Page Visitors */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Workspaces Page Visitors</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">Daily trends for workspaces page</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visitorLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : workspacesPageStats.length > 0 ? (
              <div className="w-full h-48 p-3">
                <ChartContainer
                  config={{
                    visitors: {
                      label: "Workspaces Visitors",
                      color: "#10b981",
                    },
                  }}
                  className="w-full h-full !flex-none"
                >
                  <AreaChart 
                    data={workspacesPageStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="workspacesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={8}
                      type="category"
                      scale="point"
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00')
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={8}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={30}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const date = new Date(label + 'T12:00:00')
                        return (
                          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 shadow-lg">
                            <div className="text-white font-medium text-xs">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-green-400 text-xs">
                              {payload[0].value} visitors
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
                      fill="url(#workspacesGradient)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                No workspaces page data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login / Auth Page Visitors */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Login / Auth Visitors</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Daily trends for login and auth pages
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visitorLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : authPageStats.length > 0 ? (
              <div className="w-full h-48 p-3">
                <ChartContainer
                  config={{
                    visitors: {
                      label: "Auth Visitors",
                      color: "#f59e0b",
                    },
                  }}
                  className="w-full h-full !flex-none"
                >
                  <AreaChart 
                    data={authPageStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="authGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={8}
                      type="category"
                      scale="point"
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00')
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={8}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={30}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const date = new Date(label + 'T12:00:00')
                        return (
                          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 shadow-lg">
                            <div className="text-white font-medium text-xs">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-amber-400 text-xs">
                              {payload[0].value} visitors
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fill="url(#authGradient)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                No auth page data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Studio Page Visitors */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Task Studio Visitors</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Daily trends for task studio page
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visitorLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : taskStudioPageStats.length > 0 ? (
              <div className="w-full h-48 p-3">
                <ChartContainer
                  config={{
                    visitors: {
                      label: "Task Studio Visitors",
                      color: "#ec4899",
                    },
                  }}
                  className="w-full h-full !flex-none"
                >
                  <AreaChart 
                    data={taskStudioPageStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="taskStudioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={8}
                      type="category"
                      scale="point"
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00')
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={8}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={30}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const date = new Date(label + 'T12:00:00')
                        return (
                          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 shadow-lg">
                            <div className="text-white font-medium text-xs">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-pink-400 text-xs">
                              {payload[0].value} visitors
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      fill="url(#taskStudioGradient)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                No task studio data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meetings Page Visitors */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Meetings Visitors</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Daily trends for meetings page
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visitorLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : meetingsPageStats.length > 0 ? (
              <div className="w-full h-48 p-3">
                <ChartContainer
                  config={{
                    visitors: {
                      label: "Meetings Visitors",
                      color: "#6366f1",
                    },
                  }}
                  className="w-full h-full !flex-none"
                >
                  <AreaChart 
                    data={meetingsPageStats}
                    margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="meetingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={8}
                      type="category"
                      scale="point"
                      tickFormatter={(value) => {
                        const date = new Date(value + 'T12:00:00')
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={8}
                      tickFormatter={(value) => value.toLocaleString()}
                      width={30}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const date = new Date(label + 'T12:00:00')
                        return (
                          <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-2 shadow-lg">
                            <div className="text-white font-medium text-xs">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-indigo-400 text-xs">
                              {payload[0].value} visitors
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fill="url(#meetingsGradient)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                No meetings page data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documentation Pages Breakdown */}
      {docsPageBreakdown.length > 0 && (
        <div className="mb-4">
          <h3 className="text-white text-lg font-semibold mb-3">
            Documentation Pages Breakdown
            {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
              <span className="text-zinc-400 text-sm font-normal ml-2">(filtered)</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docsPageBreakdown.map(({ page, totalCount, dailyStats }, index) => {
              // Generate a unique color for each documentation page
              const colors = [
                { stroke: '#06b6d4', gradient: 'docsGradient0', stopColor: '#06b6d4' }, // cyan
                { stroke: '#8b5cf6', gradient: 'docsGradient1', stopColor: '#8b5cf6' }, // purple
                { stroke: '#f59e0b', gradient: 'docsGradient2', stopColor: '#f59e0b' }, // amber
                { stroke: '#10b981', gradient: 'docsGradient3', stopColor: '#10b981' }, // green
                { stroke: '#ef4444', gradient: 'docsGradient4', stopColor: '#ef4444' }, // red
                { stroke: '#ec4899', gradient: 'docsGradient5', stopColor: '#ec4899' }, // pink
                { stroke: '#6366f1', gradient: 'docsGradient6', stopColor: '#6366f1' }, // indigo
                { stroke: '#14b8a6', gradient: 'docsGradient7', stopColor: '#14b8a6' }, // teal
              ]
              const colorScheme = colors[index % colors.length]
              
              return (
                <Card key={page} className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base capitalize">{page}</CardTitle>
                    </div>
                    <CardDescription className="text-zinc-400 text-xs">
                      Documentation page visits over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dailyStats.length > 0 ? (
                      <div className="w-full h-32">
                        <ChartContainer
                          config={{
                            visitors: {
                              label: `${page} Visitors`,
                              color: colorScheme.stroke,
                            },
                          }}
                          className="w-full h-full !flex-none"
                        >
                          <AreaChart 
                            data={dailyStats}
                            margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
                          >
                            <defs>
                              <linearGradient id={colorScheme.gradient} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colorScheme.stopColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={colorScheme.stopColor} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#6b7280"
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getMonth() + 1}/${date.getDate()}`
                              }}
                            />
                            <YAxis 
                              stroke="#6b7280"
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              width={30}
                            />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  return (
                                    <div className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg shadow-lg">
                                      <p className="text-zinc-400 text-xs mb-1">
                                        {new Date(data.date).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-white font-semibold text-sm">
                                        {data.count} {data.count === 1 ? 'visit' : 'visits'}
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stroke={colorScheme.stroke}
                              strokeWidth={2}
                              fill={`url(#${colorScheme.gradient})`}
                              fillOpacity={1}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4 text-zinc-400 text-xs">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

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
            <CardDescription className="text-zinc-400">
              Most visited countries
              {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStats?.country_stats && filteredStats.country_stats.length > 0 ? (
              <div className="space-y-3">
                {filteredStats.country_stats.slice(0, 8).map((country, index) => (
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
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-white border-zinc-600 hover:bg-zinc-800"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Visitors
                  {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                    <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                      {visitorIpExclusions.length + visitorLocationExclusions.length + (visitorLocationFilter ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Filter Visitors</h3>
                    <p className="text-zinc-400 text-sm">Filter visitors by IP address or location</p>
                  </div>
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
                        size="sm"
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
                    <Label htmlFor="location-exclusion" className="text-white text-sm mb-2 block">
                      Exclude Locations (City, Region, or Country)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="location-exclusion"
                        type="text"
                        placeholder="Enter location to exclude..."
                        value={visitorLocationInput}
                        onChange={(e) => setVisitorLocationInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addLocationExclusion()}
                        className="bg-zinc-800 text-white border-zinc-600 focus:border-blue-500"
                      />
                      <Button 
                        onClick={addLocationExclusion}
                        variant="outline"
                        size="sm"
                        className="text-white border-zinc-600 hover:bg-zinc-800"
                      >
                        Add
                      </Button>
                    </div>
                    {visitorLocationExclusions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-zinc-400 text-xs mb-1">Excluded Locations:</div>
                        <div className="flex flex-wrap gap-2">
                          {visitorLocationExclusions.map((location) => (
                            <span
                              key={location}
                              className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              {location}
                              <button
                                onClick={() => removeLocationExclusion(location)}
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
                  <div className="flex flex-col gap-2 pt-2">
                    <Button 
                      onClick={clearAllFilters}
                      variant="outline"
                      className="w-full text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      Clear All Filters
                    </Button>
                    {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                      <div className="text-zinc-400 text-xs text-center">
                        Showing {getFilteredVisitors().length} of {visitorData.length} visitors
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Visitors</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Latest site visitors with location data
                    {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
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
                      {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ` (filtered from ${visitorData.length})`}
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
                            visitor.content_type.startsWith('documentation -') ? 'bg-cyan-900/50 text-cyan-300' :
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
        <AIConversationsTab 
          conversationsAnalytics={conversationsAnalytics}
          conversationsLoading={conversationsLoading}
          conversationUserFilter={conversationUserFilter}
          setConversationUserFilter={setConversationUserFilter}
          conversationUsers={conversationUsers}
          usersLoading={usersLoading}
          loadConversationsAnalytics={loadConversationsAnalytics}
          convertToEasternTime={convertToEasternTime}
        />
      )}

      {/* File Types Tab */}
      {analyticsSubTab === 'filetypes' && (
        <div className="space-y-6">
          {fileTypeLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : fileTypeAnalytics ? (
            <>
              {/* User Filter Section */}
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="text-white border-zinc-600 hover:bg-zinc-800"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter by User
                      {excludedUsers.length > 0 && (
                        <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                          {excludedUsers.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white font-semibold mb-1">Filter by User</h3>
                        <p className="text-zinc-400 text-sm">Exclude specific users from file type analytics</p>
                      </div>
                      <div>
                        <Label htmlFor="user-exclusion" className="text-white text-sm mb-2 block">
                          Exclude Users (username or email)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="user-exclusion"
                            type="text"
                            placeholder="Enter username or email to exclude..."
                            value={userExclusionInput}
                            onChange={(e) => setUserExclusionInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addUserExclusion()}
                            className="bg-zinc-800 text-white border-zinc-600 focus:border-blue-500"
                          />
                          <Button 
                            onClick={addUserExclusion}
                            variant="outline"
                            size="sm"
                            className="text-white border-zinc-600 hover:bg-zinc-800"
                          >
                            Add
                          </Button>
                        </div>
                        {excludedUsers.length > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-zinc-400 text-xs">Excluded Users:</div>
                              <button
                                onClick={clearUserExclusions}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {excludedUsers.map((user) => (
                                <span
                                  key={user}
                                  className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  {user}
                                  <button
                                    onClick={() => removeUserExclusion(user)}
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
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {fileTypeAnalytics.summary.total_files.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {fileTypeAnalytics.summary.recent_files.toLocaleString()} in last {fileTypeAnalytics.summary.period_days} days
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">Total Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {(fileTypeAnalytics.summary.total_storage / (1024 ** 3)).toFixed(2)} GB
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {(fileTypeAnalytics.summary.recent_storage / (1024 ** 3)).toFixed(2)} GB recent
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">File Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {fileTypeAnalytics.summary.unique_file_types}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Most common: {fileTypeAnalytics.summary.most_common_type || 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {fileTypeAnalytics.summary.unique_categories}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Most common: {fileTypeAnalytics.summary.most_common_category || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* File Types by Category */}
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Files by Category</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Distribution of files across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fileTypeAnalytics.category_stats.slice(0, 10).map((category, index) => {
                      const percentage = (category.count / fileTypeAnalytics.summary.total_files) * 100
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-white font-medium">{category.category}</span>
                            <span className="text-zinc-400">
                              {category.count} files ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>Storage: {(category.size / (1024 ** 2)).toFixed(2)} MB</span>
                            <span>{((category.size / fileTypeAnalytics.summary.total_storage) * 100).toFixed(1)}% of total</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
    </div>
  )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top File Types */}
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Top File Types</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Most common file extensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-zinc-800 sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-white text-sm font-medium">File Type</th>
                          <th className="text-left p-3 text-white text-sm font-medium">Category</th>
                          <th className="text-right p-3 text-white text-sm font-medium">Count</th>
                          <th className="text-right p-3 text-white text-sm font-medium">Total Size</th>
                          <th className="text-right p-3 text-white text-sm font-medium">Avg Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileTypeAnalytics.file_type_stats.slice(0, 20).map((fileType, index) => (
                          <tr key={index} className="border-b border-zinc-700">
                            <td className="p-3 text-white">.{fileType.file_type}</td>
                            <td className="p-3 text-zinc-400">{fileType.category}</td>
                            <td className="p-3 text-right text-zinc-300">{fileType.count.toLocaleString()}</td>
                            <td className="p-3 text-right text-zinc-300">
                              {(fileType.size / (1024 ** 2)).toFixed(2)} MB
                            </td>
                            <td className="p-3 text-right text-zinc-300">
                              {(fileType.size / fileType.count / 1024).toFixed(2)} KB
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Upload Trends */}
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Daily Upload Trends</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Total file uploads over the last {fileTypeAnalytics.summary.period_days} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fileTypeAnalytics.daily_stats.length > 0 ? (
                    <div className="h-64">
                      <ChartContainer
                        config={{
                          total: {
                            label: 'Total Uploads',
                            color: '#3b82f6'
                          }
                        }}
                        className="h-full w-full"
                      >
                        <AreaChart data={fileTypeAnalytics.daily_stats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af' }}
                          />
                          <ChartTooltip />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No daily upload data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Types Over Time by Category - Stacked Area Chart */}
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">File Types Over Time by Category</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Breakdown of uploads by category over the last {fileTypeAnalytics.summary.period_days} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fileTypeAnalytics.daily_stats.length > 0 ? (
                    <>
                      <div className="h-80">
                        <ChartContainer
                          config={{
                            Images: { label: 'Images', color: '#3b82f6' },
                            Videos: { label: 'Videos', color: '#8b5cf6' },
                            Audio: { label: 'Audio', color: '#ec4899' },
                            Documents: { label: 'Documents', color: '#10b981' },
                            Spreadsheets: { label: 'Spreadsheets', color: '#f59e0b' },
                            Presentations: { label: 'Presentations', color: '#ef4444' },
                            Archives: { label: 'Archives', color: '#6366f1' },
                            Code: { label: 'Code', color: '#14b8a6' },
                            Other: { label: 'Other', color: '#64748b' }
                          }}
                          className="h-full w-full"
                        >
                          <AreaChart 
                            data={fileTypeAnalytics.daily_stats.map(stat => ({
                              date: stat.date,
                              Images: stat.by_category.Images || 0,
                              Videos: stat.by_category.Videos || 0,
                              Audio: stat.by_category.Audio || 0,
                              Documents: stat.by_category.Documents || 0,
                              Spreadsheets: stat.by_category.Spreadsheets || 0,
                              Presentations: stat.by_category.Presentations || 0,
                              Archives: stat.by_category.Archives || 0,
                              Code: stat.by_category.Code || 0,
                              Other: stat.by_category.Other || 0
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9ca3af"
                              tick={{ fill: '#9ca3af', fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis 
                              stroke="#9ca3af"
                              tick={{ fill: '#9ca3af' }}
                            />
                            <ChartTooltip />
                            <Area type="monotone" dataKey="Images" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Videos" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Audio" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Documents" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Spreadsheets" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Presentations" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Archives" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Code" stackId="1" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.8} />
                            <Area type="monotone" dataKey="Other" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.8} />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                      
                      {/* Legend */}
                      <div className="mt-4 flex flex-wrap gap-4 justify-center">
                        {[
                          { name: 'Images', color: '#3b82f6' },
                          { name: 'Videos', color: '#8b5cf6' },
                          { name: 'Audio', color: '#ec4899' },
                          { name: 'Documents', color: '#10b981' },
                          { name: 'Spreadsheets', color: '#f59e0b' },
                          { name: 'Presentations', color: '#ef4444' },
                          { name: 'Archives', color: '#6366f1' },
                          { name: 'Code', color: '#14b8a6' },
                          { name: 'Other', color: '#64748b' }
                        ].map((category) => (
                          <div key={category.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="text-xs text-zinc-400">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      No daily upload data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Category Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fileTypeAnalytics.category_stats.slice(0, 4).map((category, index) => {
                  const categoryData = fileTypeAnalytics.daily_stats.map(stat => ({
                    date: stat.date,
                    count: stat.by_category[category.category] || 0
                  })).filter(d => d.count > 0)
                  
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444']
                  const color = colors[index % colors.length]
                  
                  return categoryData.length > 0 ? (
                    <Card key={category.category} className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">{category.category} Uploads</CardTitle>
                        <CardDescription className="text-zinc-400 text-xs">
                          {category.count} total files
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32">
                          <ChartContainer
                            config={{
                              count: {
                                label: category.category,
                                color: color
                              }
                            }}
                            className="h-full w-full"
                          >
                            <AreaChart data={categoryData}>
                              <XAxis 
                                dataKey="date" 
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                hide
                              />
                              <YAxis 
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                width={30}
                              />
                              <ChartTooltip />
                              <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke={color}
                                fill={color}
                                fillOpacity={0.3}
                              />
                            </AreaChart>
                          </ChartContainer>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null
                })}
              </div>

              {/* Recent File Type Activity */}
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity (Last {fileTypeAnalytics.summary.period_days} Days)</CardTitle>
                  <CardDescription className="text-zinc-400">
                    File types uploaded in the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fileTypeAnalytics.recent_category_stats.length > 0 ? (
                      fileTypeAnalytics.recent_category_stats.map((category, index) => {
                        const percentage = (category.count / fileTypeAnalytics.summary.recent_files) * 100
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-white font-medium">{category.category}</span>
                              <span className="text-zinc-400">
                                {category.count} files ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4 text-zinc-400">
                        No recent file activity
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-zinc-400">
                  No file type analytics available
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

