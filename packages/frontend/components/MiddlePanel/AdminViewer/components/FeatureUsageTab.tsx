import { RefreshCw, Filter } from 'lucide-react'
import { useState } from 'react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../../ui/chart'
import { Button } from '../../../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card'
import { Input } from '../../../ui/old-input'
import { Label } from '../../../ui/label'

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

interface FeatureUsageTabProps {
  featureUsageAnalytics: FeatureUsageAnalytics | null
  featureUsageLoading: boolean
  loadFeatureUsageAnalytics: (days: number, excludedUsers?: string[]) => Promise<void>
  days: number
  excludedUsers: string[]
  setExcludedUsers: (users: string[]) => void
}

export function FeatureUsageTab({
  featureUsageAnalytics,
  featureUsageLoading,
  loadFeatureUsageAnalytics,
  days,
  excludedUsers,
  setExcludedUsers
}: FeatureUsageTabProps) {
  const [userExclusionInput, setUserExclusionInput] = useState<string>('')

  if (featureUsageLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!featureUsageAnalytics || featureUsageAnalytics.result !== 'success') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No feature usage data available
      </div>
    )
  }

  const { summary, feature_stats, daily_stats } = featureUsageAnalytics

  const addUserExclusion = async () => {
    if (userExclusionInput.trim() && !excludedUsers.includes(userExclusionInput.trim())) {
      const newExcludedUsers = [...excludedUsers, userExclusionInput.trim()]
      setExcludedUsers(newExcludedUsers)
      setUserExclusionInput('')
      await loadFeatureUsageAnalytics(days, newExcludedUsers)
    }
  }

  const removeUserExclusion = async (userToRemove: string) => {
    const newExcludedUsers = excludedUsers.filter(user => user !== userToRemove)
    setExcludedUsers(newExcludedUsers)
    await loadFeatureUsageAnalytics(days, newExcludedUsers)
  }

  const clearUserExclusions = async () => {
    setExcludedUsers([])
    await loadFeatureUsageAnalytics(days, [])
  }

  // Group daily stats by date for chart
  const dailyStatsByDate: Record<string, Record<string, number>> = {}
  daily_stats.forEach(stat => {
    if (!dailyStatsByDate[stat.date]) {
      dailyStatsByDate[stat.date] = {}
    }
    dailyStatsByDate[stat.date][stat.feature] = stat.count
  })

  // Get top features for chart
  const topFeatures = feature_stats.slice(0, 10).map(f => f.feature)
  const chartData = Object.entries(dailyStatsByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, features]) => {
      const dataPoint: any = { date }
      topFeatures.forEach(feature => {
        dataPoint[feature] = features[feature] || 0
      })
      return dataPoint
    })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Feature Usage Analytics</h2>
        <Button onClick={() => loadFeatureUsageAnalytics(days, excludedUsers)} variant="outline" className="border-zinc-200 dark:border-white/[0.06]">
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
          <CardDescription className="text-muted-foreground">
            Exclude specific users from feature usage analytics
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
                  className="bg-card text-foreground border-zinc-200 dark:border-white/[0.06] focus:border-blue-500"
                />
                <Button 
                  onClick={addUserExclusion}
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Feature Uses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.total_feature_uses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Unique Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.unique_features}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.unique_users}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Features Chart */}
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Top Features Usage Over Time</CardTitle>
          <CardDescription>Daily usage of top features</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-xs" />
              <ChartTooltip />
              {topFeatures.map((feature, index) => {
                const colors = [
                  'hsl(var(--primary))',
                  'hsl(var(--chart-2))',
                  'hsl(var(--chart-3))',
                  'hsl(var(--chart-4))',
                  'hsl(var(--chart-5))',
                ]
                const color = colors[index % colors.length]
                return (
                  <Area
                    key={feature}
                    type="monotone"
                    dataKey={feature}
                    stackId="1"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.6}
                  />
                )
              })}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Features Bar Chart */}
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Top Features</CardTitle>
          <CardDescription>Most used features by usage count</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Usage Count" } }} className="h-[300px]">
            <BarChart data={feature_stats.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="feature" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis className="text-xs" />
              <ChartTooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Feature Stats Table */}
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Feature Usage Statistics</CardTitle>
          <CardDescription>Detailed breakdown by feature</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                  <th className="text-left py-2 px-4 font-medium text-foreground">Feature</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Usage Count</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {feature_stats.map((stat, index) => (
                  <tr key={index} className="border-b border-zinc-200 dark:border-white/[0.06]">
                    <td className="py-2 px-4 text-foreground capitalize">{stat.feature.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 text-right text-foreground">{stat.count.toLocaleString()}</td>
                    <td className="py-2 px-4 text-right text-foreground">{stat.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

