import { useState, useEffect } from 'react'
import { BarChart3, Database, Zap, RefreshCw, Infinity } from 'lucide-react'
import { Typography } from 'frontend/components/ui/typography'
import { Separator } from 'frontend/components/ui/separator'
import { Button } from 'frontend/components/ui/button'
import { Progress } from 'frontend/components/ui/progress'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip } from 'frontend/components/ui/chart'
import {
  getUsageSummary,
  getTokenUsageHistory,
  formatBytes,
  formatTokens,
  formatResetDate,
  type UsageSummary,
  type TokenUsageHistory
} from './handlers/usageHandlers'

export function UsageTab() {
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [tokenHistory, setTokenHistory] = useState<TokenUsageHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadUsage() {
    setIsLoading(true)
    setError(null)
    
    const [usageResult, historyResult] = await Promise.all([
      getUsageSummary(),
      getTokenUsageHistory()
    ])
    
    if (usageResult.success && usageResult.data) {
      setUsage(usageResult.data)
    } else {
      setError(usageResult.error || 'Failed to load usage data')
    }

    if (historyResult.success && historyResult.data) {
      setTokenHistory(historyResult.data)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    loadUsage()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Typography variant="h3" className="mb-4 flex items-center text-foreground">
          <BarChart3 className="h-5 w-5 mr-2" />
          Plan Usage
        </Typography>
        <Separator />
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Typography variant="h3" className="mb-4 flex items-center text-foreground">
          <BarChart3 className="h-5 w-5 mr-2" />
          Plan Usage
        </Typography>
        <Separator />
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Typography variant="p" className="text-destructive">
            {error}
          </Typography>
          <Button variant="outline" onClick={loadUsage}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!usage) return null

  const tokenPercent = usage.tokens.unlimited
    ? 0
    : Math.min(100, (usage.tokens.used / (usage.tokens.limit || 1)) * 100)
  
  const storagePercent = usage.storage.unlimited
    ? 0
    : Math.min(100, (usage.storage.used / (usage.storage.limit || 1)) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h3" className="flex items-center text-foreground">
          <BarChart3 className="h-5 w-5 mr-2" />
          Plan Usage
        </Typography>
        <Button variant="ghost" size="sm" onClick={loadUsage}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Separator />

      {/* Current Plan Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          usage.subscription === 'pro'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}>
          {usage.subscription === 'pro' ? 'Pro Plan' : 'Free Plan'}
        </span>
      </div>

      {/* Token Usage */}
      <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <Typography variant="h4" className="text-foreground">
            Token Usage
          </Typography>
        </div>
        
        {usage.tokens.unlimited ? (
          <div className="flex items-center gap-2">
            <Infinity className="h-5 w-5 text-primary" />
            <Typography variant="p" className="text-muted-foreground">
              Unlimited tokens with Pro plan
            </Typography>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatTokens(usage.tokens.used)} used
                </span>
                <span className="text-muted-foreground">
                  {formatTokens(usage.tokens.limit || 0)} limit
                </span>
              </div>
              <Progress 
                value={tokenPercent} 
                className={`h-2 ${tokenPercent >= 90 ? '[&>div]:bg-destructive' : tokenPercent >= 75 ? '[&>div]:bg-amber-500' : ''}`}
              />
            </div>
            <Typography variant="small" className="text-muted-foreground">
              Resets on {formatResetDate(usage.tokens.reset_at)}
            </Typography>
          </>
        )}
      </div>

      {/* Token Usage Over Time Chart */}
      {tokenHistory && tokenHistory.daily_usage.length > 0 && (
        <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
          <Typography variant="h4" className="text-foreground">
            Token Usage Over Time
          </Typography>
          <ChartContainer 
            config={{ tokens: { label: "Tokens", color: "hsl(var(--primary))" } }} 
            className="h-[300px]"
          >
            <AreaChart data={tokenHistory.daily_usage}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatTokens(value)}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const data = payload[0]
                  const date = new Date(data.payload.date)
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {formatTokens(data.value as number)} tokens
                      </p>
                    </div>
                  )
                }}
              />
              <Area 
                type="monotone" 
                dataKey="tokens" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      {/* Storage Usage */}
      <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          <Typography variant="h4" className="text-foreground">
            File Storage
          </Typography>
        </div>
        
        {usage.storage.unlimited ? (
          <div className="flex items-center gap-2">
            <Infinity className="h-5 w-5 text-primary" />
            <Typography variant="p" className="text-muted-foreground">
              Unlimited storage with Pro plan
            </Typography>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatBytes(usage.storage.used)} used
              </span>
              <span className="text-muted-foreground">
                {formatBytes(usage.storage.limit || 0)} limit
              </span>
            </div>
            <Progress 
              value={storagePercent} 
              className={`h-2 ${storagePercent >= 90 ? '[&>div]:bg-destructive' : storagePercent >= 75 ? '[&>div]:bg-amber-500' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Upgrade CTA for Free users */}
      {usage.subscription === 'free' && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <Typography variant="p" className="text-foreground font-medium mb-1">
            Need more?
          </Typography>
          <Typography variant="small" className="text-muted-foreground">
            Upgrade to Pro for unlimited tokens and storage. Visit the Subscription tab to upgrade.
          </Typography>
        </div>
      )}
    </div>
  )
}
