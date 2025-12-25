import { RefreshCw, Filter } from 'lucide-react'
import { useState } from 'react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/old-input'
import { Label } from '../../components/ui/label'

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

interface ApiUsageTabProps {
  apiUsageAnalytics: ApiUsageAnalytics | null
  apiUsageLoading: boolean
  loadApiUsageAnalytics: (days: number, excludedUsers?: string[]) => Promise<void>
  days: number
  excludedUsers: string[]
  setExcludedUsers: (users: string[]) => void
}

export function ApiUsageTab({
  apiUsageAnalytics,
  apiUsageLoading,
  loadApiUsageAnalytics,
  days,
  excludedUsers,
  setExcludedUsers
}: ApiUsageTabProps) {
  if (apiUsageLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!apiUsageAnalytics || apiUsageAnalytics.result !== 'success') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No API usage data available
      </div>
    )
  }

  const { summary, endpoint_stats, daily_stats, hourly_stats, user_stats } = apiUsageAnalytics

  const [userExclusionInput, setUserExclusionInput] = useState<string>('')

  const addUserExclusion = async () => {
    if (userExclusionInput.trim() && !excludedUsers.includes(userExclusionInput.trim())) {
      const newExcludedUsers = [...excludedUsers, userExclusionInput.trim()]
      setExcludedUsers(newExcludedUsers)
      setUserExclusionInput('')
      await loadApiUsageAnalytics(days, newExcludedUsers)
    }
  }

  const removeUserExclusion = async (userToRemove: string) => {
    const newExcludedUsers = excludedUsers.filter(user => user !== userToRemove)
    setExcludedUsers(newExcludedUsers)
    await loadApiUsageAnalytics(days, newExcludedUsers)
  }

  const clearUserExclusions = async () => {
    setExcludedUsers([])
    await loadApiUsageAnalytics(days, [])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">API Usage Analytics</h2>
        <Button onClick={() => loadApiUsageAnalytics(days, excludedUsers)} variant="outline" className="border-zinc-300 dark:border-white/[0.06]">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* User Exclusion Filter */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Exclude Users
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Exclude specific users from API usage analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-exclusion" className="text-foreground text-sm mb-2 block">
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
                  className="bg-card text-foreground border-zinc-300 dark:border-white/[0.06] focus:border-blue-500"
                />
                <Button 
                  onClick={addUserExclusion}
                  variant="outline"
                  size="sm"
                  className="border-zinc-300 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
                >
                  Add
                </Button>
              </div>
              {excludedUsers.length > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-muted-foreground text-xs">Excluded Users:</div>
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
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.period_days} days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Unique Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.unique_endpoints}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.avg_response_time.toFixed(2)}ms</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.error_rate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Requests Chart */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Daily API Requests</CardTitle>
          <CardDescription>Total requests per day over the period</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Requests" } }} className="h-[300px]">
            <AreaChart data={daily_stats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-xs" />
              <ChartTooltip />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Hourly Distribution</CardTitle>
          <CardDescription>Requests by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Requests" } }} className="h-[300px]">
            <BarChart data={hourly_stats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Endpoints */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Top Endpoints</CardTitle>
          <CardDescription>Most frequently called endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-300 dark:border-white/[0.06]">
                  <th className="text-left py-2 px-4 font-medium text-foreground">Endpoint</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Requests</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Avg Response (ms)</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">P95 Response (ms)</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Errors</th>
                </tr>
              </thead>
              <tbody>
                {endpoint_stats.slice(0, 20).map((stat, index) => (
                  <tr key={index} className="border-b border-zinc-300 dark:border-white/[0.06]">
                    <td className="py-2 px-4 text-foreground font-mono text-xs">{stat.endpoint}</td>
                    <td className="py-2 px-4 text-right text-foreground">{stat.count.toLocaleString()}</td>
                    <td className="py-2 px-4 text-right text-foreground">{stat.avg_response_time.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right text-foreground">{stat.p95_response_time.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right text-foreground">{stat.error_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      {user_stats.length > 0 && (
        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">Top Users by API Usage</CardTitle>
            <CardDescription>Users with most API requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-300 dark:border-white/[0.06]">
                    <th className="text-left py-2 px-4 font-medium text-foreground">Username</th>
                    <th className="text-right py-2 px-4 font-medium text-foreground">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {user_stats.map((stat, index) => (
                    <tr key={index} className="border-b border-zinc-300 dark:border-white/[0.06]">
                      <td className="py-2 px-4 text-foreground">{stat.username}</td>
                      <td className="py-2 px-4 text-right text-foreground">{stat.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

