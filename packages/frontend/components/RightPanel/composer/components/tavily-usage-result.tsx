import { useMemo } from "react"
import ToolCallCard from "./ToolCallCard"
import type { ReactNode, SVGProps } from "react"

interface UsageResponse {
  success: boolean
  key: {
    usage: number
    limit: number
    percentage: number
  }
  account: {
    current_plan: string
    plan_usage: number
    plan_limit: number
    plan_percentage: number
    paygo_usage: number
    paygo_limit: number
    paygo_percentage: number
  }
  error?: string
  details?: string
}

const UsageIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

interface ToolCallProps {
  toolName: string
  toolCallId?: string
  argsText: string
  args?: any
  result?: unknown
}

const ProgressBar = ({ percentage, usage, limit }: { percentage: number; usage: number; limit: number }) => {
  const getColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {usage.toLocaleString()} / {limit.toLocaleString()}
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(percentage)} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

export const TavilyUsageTool = ({ toolName, toolCallId, argsText, args, result }: ToolCallProps) => {
  const parsedArgs = useMemo(() => {
    if (args) return args
    try {
      return JSON.parse(argsText || "{}")
    } catch {
      return {}
    }
  }, [args, argsText])

  if (toolName !== "web_usage") return null

  const renderOutput = (value: unknown): ReactNode => {
    let parsed: UsageResponse | null = null
    try {
      if (typeof value === "string") parsed = JSON.parse(value)
      else parsed = value as UsageResponse
    } catch {
      parsed = null
    }

    // Error state
    if (parsed && !parsed.success) {
      return (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertIcon className="size-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">{parsed.error || "Failed to retrieve usage"}</div>
            {parsed.details && <div className="text-xs mt-0.5">{parsed.details}</div>}
          </div>
        </div>
      )
    }

    // Loading state
    if (!parsed) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No usage data found." : "Fetching usage..."}</div>
      )
    }

    const { key, account } = parsed

    return (
      <div className="space-y-4">
        {/* Plan Info */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Plan:</div>
          <div className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {account.current_plan}
          </div>
        </div>

        {/* API Key Usage */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">API Key Usage</div>
          <ProgressBar percentage={key.percentage} usage={key.usage} limit={key.limit} />
        </div>

        {/* Plan Usage */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">Plan Usage</div>
          <ProgressBar
            percentage={account.plan_percentage}
            usage={account.plan_usage}
            limit={account.plan_limit}
          />
        </div>

        {/* Pay-as-you-go Usage */}
        {account.paygo_limit > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-foreground">Pay-as-you-go Usage</div>
            <ProgressBar
              percentage={account.paygo_percentage}
              usage={account.paygo_usage}
              limit={account.paygo_limit}
            />
          </div>
        )}

        {/* Summary Table */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-muted-foreground mb-1">Total Plan</div>
            <div className="font-medium text-foreground">
              {account.plan_usage.toLocaleString()} / {account.plan_limit.toLocaleString()}
            </div>
          </div>
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-muted-foreground mb-1">Remaining</div>
            <div className="font-medium text-foreground">
              {(account.plan_limit - account.plan_usage).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ToolCallCard
      toolName="web_usage"
      label="API Usage Statistics"
      argsText={argsText}
      result={result}
      icon={<UsageIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  )
}
