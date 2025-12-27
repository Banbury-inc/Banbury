import { RefreshCw, Filter } from 'lucide-react'
import { useState } from 'react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/old-input'
import { Label } from '../../components/ui/label'

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

interface UserEngagementTabProps {
  userEngagementAnalytics: UserEngagementAnalytics | null
  userEngagementLoading: boolean
  loadUserEngagementAnalytics: (days: number, excludedUsers?: string[]) => Promise<void>
  days: number
  excludedUsers: string[]
  setExcludedUsers: (users: string[]) => void
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function UserEngagementTab({
  userEngagementAnalytics,
  userEngagementLoading,
  loadUserEngagementAnalytics,
  days,
  excludedUsers,
  setExcludedUsers
}: UserEngagementTabProps) {
  const [userExclusionInput, setUserExclusionInput] = useState<string>('')

  if (userEngagementLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!userEngagementAnalytics || userEngagementAnalytics.result !== 'success') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No user engagement data available
      </div>
    )
  }

  const { summary, daily_stats, session_duration_distribution } = userEngagementAnalytics

  const addUserExclusion = async () => {
    if (userExclusionInput.trim() && !excludedUsers.includes(userExclusionInput.trim())) {
      const newExcludedUsers = [...excludedUsers, userExclusionInput.trim()]
      setExcludedUsers(newExcludedUsers)
      setUserExclusionInput('')
      await loadUserEngagementAnalytics(days, newExcludedUsers)
    }
  }

  const removeUserExclusion = async (userToRemove: string) => {
    const newExcludedUsers = excludedUsers.filter(user => user !== userToRemove)
    setExcludedUsers(newExcludedUsers)
    await loadUserEngagementAnalytics(days, newExcludedUsers)
  }

  const clearUserExclusions = async () => {
    setExcludedUsers([])
    await loadUserEngagementAnalytics(days, [])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">User Engagement Analytics</h2>
        <Button onClick={() => loadUserEngagementAnalytics(days, excludedUsers)} variant="outline" className="border-zinc-300 dark:border-white/[0.06]">
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
            Exclude specific users from user engagement analytics
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
            <CardTitle className="text-sm font-medium text-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.total_sessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSeconds(summary.avg_session_duration)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Active Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSeconds(summary.total_active_time)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg Active Time/Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatSeconds(summary.avg_active_time_per_session)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sessions Chart */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Daily Sessions</CardTitle>
          <CardDescription>Sessions and active time per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ sessions: { label: "Sessions" }, active_time: { label: "Active Time (s)" } }} className="h-[300px]">
            <AreaChart data={daily_stats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <ChartTooltip />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="sessions" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.2}
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="active_time" 
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Session Duration Distribution */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Session Duration Distribution</CardTitle>
          <CardDescription>Distribution of session durations</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Sessions" } }} className="h-[300px]">
            <BarChart data={session_duration_distribution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="range" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

