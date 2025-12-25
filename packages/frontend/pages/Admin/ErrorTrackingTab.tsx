import { RefreshCw } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

interface ErrorAnalytics {
  result: string
  summary: {
    total_errors: number
    error_rate: number
    unique_error_types: number
  }
  error_by_type: Array<{error_type: string, count: number}>
  error_by_endpoint: Array<{endpoint: string, count: number}>
  daily_error_stats: Array<{date: string, count: number}>
}

interface ErrorTrackingTabProps {
  errorAnalytics: ErrorAnalytics | null
  errorLoading: boolean
  loadErrorAnalytics: (days: number) => Promise<void>
  days: number
}

const COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function ErrorTrackingTab({
  errorAnalytics,
  errorLoading,
  loadErrorAnalytics,
  days
}: ErrorTrackingTabProps) {
  if (errorLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!errorAnalytics || errorAnalytics.result !== 'success') {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No error data available
      </div>
    )
  }

  const { summary, error_by_type, error_by_endpoint, daily_error_stats } = errorAnalytics

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Error Tracking Analytics</h2>
        <Button onClick={() => loadErrorAnalytics(days)} variant="outline" className="border-zinc-300 dark:border-white/[0.06]">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground text-destructive">{summary.total_errors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground text-destructive">{summary.error_rate.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Unique Error Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.unique_error_types}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Error Trends */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Daily Error Trends</CardTitle>
          <CardDescription>Errors per day over the period</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Errors" } }} className="h-[300px]">
            <AreaChart data={daily_error_stats}>
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
                stroke="hsl(var(--destructive))" 
                fill="hsl(var(--destructive))" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Errors by Type */}
        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">Errors by Type</CardTitle>
            <CardDescription>Distribution of error types</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <PieChart>
                <Pie
                  data={error_by_type}
                  dataKey="count"
                  nameKey="error_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.error_type}: ${entry.count}`}
                >
                  {error_by_type.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Errors by Type Bar Chart */}
        <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">Errors by Type (Bar)</CardTitle>
            <CardDescription>Count of errors by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Errors" } }} className="h-[300px]">
              <BarChart data={error_by_type}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="error_type" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis className="text-xs" />
                <ChartTooltip />
                <Bar dataKey="count" fill="hsl(var(--destructive))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Errors by Endpoint */}
      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Errors by Endpoint</CardTitle>
          <CardDescription>Endpoints with most errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-300 dark:border-white/[0.06]">
                  <th className="text-left py-2 px-4 font-medium text-foreground">Endpoint</th>
                  <th className="text-right py-2 px-4 font-medium text-foreground">Error Count</th>
                </tr>
              </thead>
              <tbody>
                {error_by_endpoint.map((stat, index) => (
                  <tr key={index} className="border-b border-zinc-300 dark:border-white/[0.06]">
                    <td className="py-2 px-4 text-foreground font-mono text-xs">{stat.endpoint}</td>
                    <td className="py-2 px-4 text-right text-foreground text-destructive font-semibold">{stat.count}</td>
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

