import { useState, useEffect } from 'react'
import { RefreshCw, Infinity } from 'lucide-react'
import { Typography } from '@/components/common/ui/typography'
import { Button } from '@/components/common/ui/button'
import { Progress } from '@/components/common/ui/progress'
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/common/ui/chart'
import {
  getUsageSummary,
  getTokenUsageHistory,
  formatBytes,
  formatTokens,
  formatResetDate,
  type UsageSummary,
  type TokenUsageHistory
} from './handlers/usageHandlers'
import {
  SettingsTabBlock,
  SettingsTabCard,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabNote,
  SettingsTabSection,
} from './settings-tab-layout'

function UsageTabLoading() {
  return (
    <SettingsTabLayout>
      <SettingsTabHeader title="Plan Usage" />
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </SettingsTabLayout>
  )
}

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

  if (isLoading) return <UsageTabLoading />

  if (error) {
    return (
      <SettingsTabLayout>
        <SettingsTabHeader title="Plan Usage" />
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Typography variant="p" className="text-destructive">
            {error}
          </Typography>
          <Button variant="outline" onClick={loadUsage}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </SettingsTabLayout>
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
    <SettingsTabLayout>
      <SettingsTabHeader
        title="Plan Usage"
        action={
          <Button variant="ghost" size="sm" onClick={loadUsage}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${
          usage.subscription === 'pro'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}>
          {usage.subscription === 'pro' ? 'Pro Plan' : 'Free Plan'}
        </span>
      </div>

      <SettingsTabSection title="Token Usage">
        <SettingsTabCard>
          <SettingsTabBlock label="Monthly tokens">
            {usage.tokens.unlimited ? (
              <div className="flex items-center gap-2">
                <Infinity className="h-5 w-5 text-primary" />
                <Typography variant="small" className="text-muted-foreground">
                  Unlimited tokens with Pro plan
                </Typography>
              </div>
            ) : (
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
                  className={`h-2 ${tokenPercent >= 90 ? '[&>div]:bg-destructive' : tokenPercent >= 75 ? '[&>div]:bg-primary/80' : ''}`}
                />
                <Typography variant="xs" className="text-muted-foreground">
                  Resets on {formatResetDate(usage.tokens.reset_at)}
                </Typography>
              </div>
            )}
          </SettingsTabBlock>
        </SettingsTabCard>
      </SettingsTabSection>

      {tokenHistory && tokenHistory.daily_usage.length > 0 && (
        <SettingsTabSection title="Token Usage Over Time">
          <SettingsTabCard>
            <SettingsTabBlock label="Daily usage">
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
                        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-lg">
                          <p className="mb-1 text-xs text-muted-foreground">
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
            </SettingsTabBlock>
          </SettingsTabCard>
        </SettingsTabSection>
      )}

      <SettingsTabSection title="File Storage">
        <SettingsTabCard>
          <SettingsTabBlock label="Storage quota">
            {usage.storage.unlimited ? (
              <div className="flex items-center gap-2">
                <Infinity className="h-5 w-5 text-primary" />
                <Typography variant="small" className="text-muted-foreground">
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
                  className={`h-2 ${storagePercent >= 90 ? '[&>div]:bg-destructive' : storagePercent >= 75 ? '[&>div]:bg-primary/80' : ''}`}
                />
              </div>
            )}
          </SettingsTabBlock>
        </SettingsTabCard>
      </SettingsTabSection>

      {usage.subscription === 'free' && (
        <SettingsTabNote variant="primary">
          <strong className="text-foreground">Need more?</strong>{' '}
          Upgrade to Pro for unlimited tokens and storage. Visit the Subscription tab to upgrade.
        </SettingsTabNote>
      )}
    </SettingsTabLayout>
  )
}
