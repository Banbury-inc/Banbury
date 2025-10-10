import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/old-input'
import { Label } from '../../components/ui/label'
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

interface AnalyticsTabProps {
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
  loadVisitorData: (days: number) => Promise<void>
  loadLoginData: (days: number) => Promise<void>
  loadScopesAnalytics: () => Promise<void>
  loadConversationsAnalytics: (days: number, userFilter: string) => Promise<void>
  loadConversationUsers: (days: number) => Promise<void>
  loadDashboardVisitStats: () => Promise<void>
  loadWorkspaceVisitStats: () => Promise<void>
  convertToEasternTime: (timestamp: string) => string
}

export function AnalyticsTab({
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
  loadVisitorData,
  loadLoginData,
  loadScopesAnalytics,
  loadConversationsAnalytics,
  loadConversationUsers,
  loadDashboardVisitStats,
  loadWorkspaceVisitStats,
  convertToEasternTime
}: AnalyticsTabProps) {
  const [analyticsSubTab, setAnalyticsSubTab] = useState<string>('overview')
  const [visitorIpExclusions, setVisitorIpExclusions] = useState<string[]>([])
  const [visitorIpInput, setVisitorIpInput] = useState<string>('')
  const [visitorLocationExclusions, setVisitorLocationExclusions] = useState<string[]>([])
  const [visitorLocationInput, setVisitorLocationInput] = useState<string>('')
  const [visitorLocationFilter, setVisitorLocationFilter] = useState<string>('')
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
  const [conversationDetails, setConversationDetails] = useState<any>(null)
  const [conversationDetailsLoading, setConversationDetailsLoading] = useState(false)

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
      setExpandedConversation(null)
      setConversationDetails(null)
    } else {
      loadConversationDetails(conversationId)
    }
  }

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

  return (
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
          {/* Filter Section */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Filter Analytics Data</CardTitle>
              <CardDescription className="text-zinc-400">Filter all visitor analytics by IP address or location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={clearAllFilters}
                  variant="outline"
                  className="text-white border-zinc-600 hover:bg-zinc-800"
                >
                  Clear All Filters
                </Button>
                {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                  <div className="text-zinc-400 text-sm flex items-center">
                    Showing {getFilteredVisitors().length} of {visitorData.length} visitors
                    {visitorIpExclusions.length > 0 && ` (${visitorIpExclusions.length} IPs excluded)`}
                    {visitorLocationExclusions.length > 0 && ` (${visitorLocationExclusions.length} locations excluded)`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
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
      </div>

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
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={clearAllFilters}
                  variant="outline"
                  className="text-white border-zinc-600 hover:bg-zinc-800"
                >
                  Clear All Filters
                </Button>
                {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && (
                  <div className="text-zinc-400 text-sm flex items-center">
                    Showing {getFilteredVisitors().length} of {visitorData.length} visitors
                    {visitorIpExclusions.length > 0 && ` (${visitorIpExclusions.length} IPs excluded)`}
                    {visitorLocationExclusions.length > 0 && ` (${visitorLocationExclusions.length} locations excluded)`}
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
  )
}

