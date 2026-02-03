import { Tooltip, TooltipContent, TooltipTrigger } from "../../../common/ui/tooltip"
import { Typography } from "../../../common/ui/typography"
import { formatTokenCount } from "../handlers/contextBudget"

interface ContextWheelProps {
  usagePercent: number
  estimatedPromptTokens: number
  contextWindowTokens: number
  estimatedRemainingTokens: number
  reservedOutputTokens: number
  className?: string
}

function getStrokeColor(percent: number): string {
  // Return Tailwind class names for different usage levels
  if (percent >= 90) return "stroke-destructive"
  if (percent >= 75) return "stroke-warning"
  return "stroke-primary"
}

export function ContextWheel({
  usagePercent,
  estimatedPromptTokens,
  contextWindowTokens,
  estimatedRemainingTokens,
  reservedOutputTokens,
  className = "",
}: ContextWheelProps) {
  const size = 24
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (usagePercent / 100) * circumference
  
  const strokeColorClass = getStrokeColor(usagePercent)
  
  const tooltipContent = [
    `~${formatTokenCount(estimatedPromptTokens)} / ${formatTokenCount(contextWindowTokens - reservedOutputTokens)} used`,
    `~${formatTokenCount(estimatedRemainingTokens)} remaining`,
    `(${reservedOutputTokens.toLocaleString()} reserved for output)`,
  ].join("\n")
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`relative inline-flex items-center justify-center cursor-help ${className}`}
          role="meter"
          aria-valuenow={Math.round(usagePercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Context usage: ${Math.round(usagePercent)}%`}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-zinc-500 dark:stroke-zinc-600"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`transition-all duration-300 ${strokeColorClass}`}
            />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs bg-accent">
        <div className="space-y-0.5">
          <Typography variant="xs" className="block font-medium">Context Budget</Typography>
          <Typography variant="xs" className="block text-muted-foreground">
            ~{formatTokenCount(estimatedPromptTokens)} / {formatTokenCount(contextWindowTokens - reservedOutputTokens)} used
          </Typography>
          <Typography variant="xs" className="block text-muted-foreground">
            ~{formatTokenCount(estimatedRemainingTokens)} remaining
          </Typography>
          <Typography variant="xs" className="block text-muted-foreground text-[10px]">
            ({reservedOutputTokens.toLocaleString()} reserved for output)
          </Typography>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

