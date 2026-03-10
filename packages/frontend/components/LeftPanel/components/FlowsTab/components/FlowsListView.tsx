import { GitBranch, Trash2, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '../../../../common/ui/button'
import { Typography } from '../../../../common/ui/typography'
import { FlowItem } from '../../../../../pages/Workspaces/types'

interface FlowsListViewProps {
  flows: FlowItem[]
  loading: boolean
  selectedFlow?: FlowItem | null
  onFlowSelect?: (flow: FlowItem) => void
  onFlowDeleted: (flowId: string) => void
}

function RunStatusIcon({ status }: { status?: FlowItem['last_run_status'] }) {
  if (!status) return null
  if (status === 'success') return <CheckCircle className="h-3 w-3 text-green-500" />
  if (status === 'failed') return <XCircle className="h-3 w-3 text-red-500" />
  if (status === 'running') return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
  if (status === 'pending') return <Clock className="h-3 w-3 text-yellow-500" />
  return null
}

export function FlowsListView({ flows, loading, selectedFlow, onFlowSelect, onFlowDeleted }: FlowsListViewProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (flows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center">
        <GitBranch className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1} />
        <Typography variant="small" className="text-muted-foreground">
          No flows yet. Create one to get started.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {flows.map((flow) => {
        const isSelected = selectedFlow?.id === flow.id
        return (
          <div
            key={flow.id}
            className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 text-foreground'
            }`}
            onClick={() => onFlowSelect?.(flow)}
          >
            <GitBranch className="h-4 w-4 flex-shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <Typography variant="small" className="truncate font-medium">
                {flow.name}
              </Typography>
            </div>
            <RunStatusIcon status={flow.last_run_status} />
            <Button
              variant="ghost"
              size="xs"
              className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onFlowDeleted(flow.id)
              }}
              title="Delete flow"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
