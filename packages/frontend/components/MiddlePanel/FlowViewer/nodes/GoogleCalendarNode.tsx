import { type NodeProps, type Node } from '@xyflow/react'
import { CalendarDays } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type GoogleCalendarNodeData = {
  label?: string
  operation?: 'list' | 'create' | 'get' | 'update' | 'delete'
  calendarId?: string
  timeMin?: string
  timeMax?: string
  event?: Record<string, unknown>
}

type GoogleCalendarNodeType = Node<GoogleCalendarNodeData, 'google-calendar'>

const OPERATION_LABELS: Record<string, string> = {
  list: 'List Events',
  create: 'Create Event',
  get: 'Get Event',
  update: 'Update Event',
  delete: 'Delete Event',
}

export function GoogleCalendarNode({ data, selected }: NodeProps<GoogleCalendarNodeType>) {
  const op = data.operation ?? 'list'

  return (
    <BaseNode
      category="calendar"
      icon={CalendarDays}
      title="Google Calendar"
      selected={selected}
    >
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Op:</span> {OPERATION_LABELS[op] ?? op}
        </p>
        {data.calendarId && (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium">Calendar:</span> {data.calendarId}
          </p>
        )}
      </div>
    </BaseNode>
  )
}
