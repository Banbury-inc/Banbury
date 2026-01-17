import { RefreshCw, Filter, Clock } from 'lucide-react'
import { useState } from 'react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/old-input'
import { Label } from '../../components/ui/label'

interface PageTimeAnalytics {
  result: string
  summary: {
    total_page_views: number
    total_time_spent: number
    avg_time_per_page: number
    unique_pages: number
    unique_users: number
    period_days: number
  }
  page_stats: Array<{
    path: string
    page_title: string
    content_type: string
    total_time: number
    count: number
    avg_time: number
    min_time: number
    max_time: number
  }>
  daily_stats: Array<{date: string, total_time: number, count: number, avg_time: number}>
  hourly_stats: Array<{hour: number, total_time: number, count: number, avg_time: number}>
  user_stats: Array<{username: string, total_time: number, count: number, avg_time: number}>
}

interface PageTimeTabProps {
  pageTimeAnalytics: PageTimeAnalytics | null
  pageTimeLoading: boolean
  loadPageTimeAnalytics: (days: number, excludedUsers?: string[]) => Promise<void>
  days: number
  excludedUsers: string[]
  setExcludedUsers: (users: string[]) => void
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function PageTimeTab({
  pageTimeAnalytics,
  pageTimeLoading,
  loadPageTimeAnalytics,
  days,
  excludedUsers,
  setExcludedUsers
}: PageTimeTabProps) {
  const [userExclusionInput, setUserExclusionInput] = useState<string>('')

  if (pageTimeLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!pageTimeAnalytics || pageTimeAnalytics.result !== 'success') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No page time data available
      </div>
    )
  }

  const { summary, page_stats, daily_stats, hourly_stats, user_stats } = pageTimeAnalytics

  const addUserExclusion = async () => {
    if (userExclusionInput.trim() && !excludedUsers.includes(userExclusionInput.trim())) {
      const newExcludedUsers = [...excludedUsers, userExclusionInput.trim()]
      setExcludedUsers(newExcludedUsers)
      setUserExclusionInput('')
      await loadPageTimeAnalytics(days, newExcludedUsers)
    }
  }

  const removeUserExclusion = async (userToRemove: string) => {
    const newExcludedUsers = excludedUsers.filter(user => user !== userToRemove)
    setExcludedUsers(newExcludedUsers)
    await loadPageTimeAnalytics(days, newExcludedUsers)
  }

  const clearUserExclusions = async () => {
    setExcludedUsers([])
    await loadPageTimeAnalytics(days, [])
  }

  // Prepare chart data
  const dailyChartData = daily_stats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Total Time (hrs)': stat.total_time / (1000 * 60 * 60),
    'Avg Time (min)': stat.avg_time / (1000 * 60),
    'Page Views': stat.count
  }))

  const hourlyChartData = hourly_stats.map(stat => ({
    hour: `${stat.hour}:00`,
    'Total Time (hrs)': stat.total_time / (1000 * 60 * 60),
    'Avg Time (min)': stat.avg_time / (1000 * 60),
    'Page Views': stat.count
  }))

  const topPagesData = page_stats.slice(0, 10).map(stat => ({
    page: stat.page_title || stat.path,
    'Total Time (hrs)': stat.total_time / (1000 * 60 * 60),
    'Avg Time (min)': stat.avg_time / (1000 * 60),
    'Views': stat.count
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Page Time Analytics</h2>
        <Button onClick={() => loadPageTimeAnalytics(days, excludedUsers)} variant="outline" className="border-zinc-200 dark:border-white/[0.06]">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* User Exclusion Filter */}
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Exclude Users
          </CardTitle>
          <CardDescription>Exclude specific users from analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={userExclusionInput}
              onChange={(e) => setUserExclusionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addUserExclusion()}
              placeholder="Enter username to exclude"
              className="border-zinc-200 dark:border-white/[0.06]"
            />
            <Button onClick={addUserExclusion} variant="outline" className="border-zinc-200 dark:border-white/[0.06]">
              Add
            </Button>
            {excludedUsers.length > 0 && (
              <Button onClick={clearUserExclusions} variant="outline" className="border-zinc-200 dark:border-white/[0.06]">
                Clear All
              </Button>
            )}
          </div>
          {excludedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludedUsers.map((user) => (
                <div
                  key={user}
                  className="flex items-center gap-2 px-3 py-1 bg-accent rounded-md text-sm"
                >
                  <span className="text-foreground">{user}</span>
                  <button
                    onClick={() => removeUserExclusion(user)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm">Total Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.total_page_views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Over {summary.period_days} days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm">Total Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatDuration(summary.total_time_spent)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all pages</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm">Avg Time per Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatDuration(summary.avg_time_per_page)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average session duration</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm">Unique Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.unique_pages}</div>
            <p className="text-xs text-muted-foreground mt-1">Different pages tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.unique_users}</div>
            <p className="text-xs text-muted-foreground mt-1">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Time Chart */}
      {dailyChartData.length > 0 && (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">Daily Time Spent</CardTitle>
            <CardDescription>Total and average time spent per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip />
                <Area type="monotone" dataKey="Total Time (hrs)" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                <Area type="monotone" dataKey="Avg Time (min)" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Hourly Distribution */}
      {hourlyChartData.length > 0 && (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">Hourly Distribution</CardTitle>
            <CardDescription>Time spent by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip />
                <Bar dataKey="Total Time (hrs)" fill="hsl(var(--primary))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Pages */}
      {topPagesData.length > 0 && (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">Top Pages by Time Spent</CardTitle>
            <CardDescription>Pages with the most total time spent</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px]">
              <BarChart data={topPagesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="page" type="category" width={200} className="text-xs" />
                <ChartTooltip />
                <Bar dataKey="Total Time (hrs)" fill="hsl(var(--primary))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Page Stats Table */}
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Page Statistics</CardTitle>
          <CardDescription>Detailed breakdown by page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                  <th className="text-left p-2 text-foreground">Page</th>
                  <th className="text-right p-2 text-foreground">Views</th>
                  <th className="text-right p-2 text-foreground">Total Time</th>
                  <th className="text-right p-2 text-foreground">Avg Time</th>
                  <th className="text-right p-2 text-foreground">Min Time</th>
                  <th className="text-right p-2 text-foreground">Max Time</th>
                </tr>
              </thead>
              <tbody>
                {page_stats.slice(0, 20).map((stat, index) => (
                  <tr key={index} className="border-b border-zinc-200 dark:border-white/[0.06]">
                    <td className="p-2 text-foreground">
                      <div className="font-medium">{stat.page_title || stat.path}</div>
                      <div className="text-xs text-muted-foreground">{stat.path}</div>
                    </td>
                    <td className="p-2 text-right text-foreground">{stat.count.toLocaleString()}</td>
                    <td className="p-2 text-right text-foreground">{formatDuration(stat.total_time)}</td>
                    <td className="p-2 text-right text-foreground">{formatDuration(stat.avg_time)}</td>
                    <td className="p-2 text-right text-foreground">{formatDuration(stat.min_time)}</td>
                    <td className="p-2 text-right text-foreground">{formatDuration(stat.max_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Stats Table */}
      {user_stats.length > 0 && (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">User Statistics</CardTitle>
            <CardDescription>Time spent by user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                    <th className="text-left p-2 text-foreground">Username</th>
                    <th className="text-right p-2 text-foreground">Page Views</th>
                    <th className="text-right p-2 text-foreground">Total Time</th>
                    <th className="text-right p-2 text-foreground">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {user_stats.slice(0, 20).map((stat, index) => (
                    <tr key={index} className="border-b border-zinc-200 dark:border-white/[0.06]">
                      <td className="p-2 text-foreground font-medium">{stat.username || 'Anonymous'}</td>
                      <td className="p-2 text-right text-foreground">{stat.count.toLocaleString()}</td>
                      <td className="p-2 text-right text-foreground">{formatDuration(stat.total_time)}</td>
                      <td className="p-2 text-right text-foreground">{formatDuration(stat.avg_time)}</td>
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
