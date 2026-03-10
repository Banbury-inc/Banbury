import { Handle, Position } from '@xyflow/react'
import { CheckCircle, Loader2, XCircle, LucideIcon } from 'lucide-react'
import { NodeCategory, CATEGORY_COLORS } from './nodeRegistry'

export type NodeRunStatus = 'idle' | 'running' | 'success' | 'failed'

interface BaseNodeProps {
  category: NodeCategory
  icon: LucideIcon
  title: string
  selected?: boolean
  hasInput?: boolean
  hasOutput?: boolean
  runStatus?: NodeRunStatus
  children?: React.ReactNode
}

function RunStatusIcon({ status }: { status: NodeRunStatus }) {
  if (status === 'running') return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
  if (status === 'success') return <CheckCircle className="h-3 w-3 text-green-400" />
  if (status === 'failed') return <XCircle className="h-3 w-3 text-red-400" />
  return null
}

export function BaseNode({
  category,
  icon: Icon,
  title,
  selected,
  hasInput = true,
  hasOutput = true,
  runStatus = 'idle',
  children,
}: BaseNodeProps) {
  const colors = CATEGORY_COLORS[category]

  return (
    <div
      className={`
        w-60 rounded-lg border-2 overflow-hidden bg-card
        ${colors.border}
        ${selected ? `ring-2 ${colors.ring} ring-offset-1 ring-offset-background` : ''}
      `}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className={`!w-3.5 !h-3.5 !border-2 !border-background ${colors.handle}`}
        />
      )}

      <div className={`flex items-center gap-2 px-3 py-2 border-b ${colors.header} ${colors.border.replace('border-', 'border-b-')}`}>
        <Icon className={`h-4 w-4 flex-shrink-0 ${colors.icon}`} />
        <span className={`text-sm font-semibold tracking-tight flex-1 truncate ${colors.icon}`}>
          {title}
        </span>
        <RunStatusIcon status={runStatus} />
      </div>

      {children && (
        <div className="px-3 py-2.5 min-h-[40px]">
          {children}
        </div>
      )}

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-3.5 !h-3.5 !border-2 !border-background ${colors.handle}`}
        />
      )}
    </div>
  )
}
