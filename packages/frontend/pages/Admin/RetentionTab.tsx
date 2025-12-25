import { RefreshCw } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

interface RetentionAnalytics {
  result: string
  dau: number
  wau: number
  mau: number
  retention_cohorts: Array<{
    cohort: string
    day_0: number
    day_7: number
    day_30: number
    total?: number
  }>
  daily_active_users: Array<{date: string, count: number}>
}

interface RetentionTabProps {
  retentionAnalytics: RetentionAnalytics | null
  retentionLoading: boolean
  loadRetentionAnalytics: () => Promise<void>
}

export function RetentionTab({
  retentionAnalytics,
  retentionLoading,
  loadRetentionAnalytics
}: RetentionTabProps) {
  if (retentionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!retentionAnalytics || retentionAnalytics.result !== 'success') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No retention data available
      </div>
    )
  }

  const { dau, wau, mau, retention_cohorts, daily_active_users } = retentionAnalytics

  const retentionRate7 = wau > 0 ? ((dau / wau) * 100).toFixed(1) : '0'
  const retentionRate30 = mau > 0 ? ((wau / mau) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">User Retention Analytics</h2>
        <Button onClick={loadRetentionAnalytics} variant="outline" className="border-zinc-300 dark:border-white/[0.06]">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Daily Active Users (DAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dau.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active today</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Weekly Active Users (WAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{wau.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active in last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Monthly Active Users (MAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mau.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active in last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{retentionRate7}%</div>
            <p className="text-xs text-muted-foreground mt-1">DAU/WAU ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Active Users Chart */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Daily Active Users</CardTitle>
          <CardDescription>Unique users active per day over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Users" } }} className="h-[300px]">
            <AreaChart data={daily_active_users}>
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

      {/* Cohort Retention Table */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Cohort Retention</CardTitle>
          <CardDescription>User retention by signup cohort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-300 dark:border-white/[0.06]">
                  <th className="text-left py-2 px-4 font-medium text-foreground">Cohort</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Total Users</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Day 0</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Day 7</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Day 30</th>
                </tr>
              </thead>
              <tbody>
                {retention_cohorts.map((cohort, index) => {
                  const total = cohort.total || 0
                  const day0Rate = total > 0 ? ((cohort.day_0 / total) * 100).toFixed(1) : '0'
                  const day7Rate = total > 0 ? ((cohort.day_7 / total) * 100).toFixed(1) : '0'
                  const day30Rate = total > 0 ? ((cohort.day_30 / total) * 100).toFixed(1) : '0'
                  
                  return (
                    <tr key={index} className="border-b border-zinc-300 dark:border-white/[0.06]">
                      <td className="py-2 px-4 text-foreground">{cohort.cohort}</td>
                      <td className="py-2 px-4 text-right text-foreground">{total}</td>
                      <td className="py-2 px-4 text-right text-foreground">{day0Rate}% ({cohort.day_0})</td>
                      <td className="py-2 px-4 text-right text-foreground">{day7Rate}% ({cohort.day_7})</td>
                      <td className="py-2 px-4 text-right text-foreground">{day30Rate}% ({cohort.day_30})</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

