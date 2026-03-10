import { type NodeProps, type Node } from '@xyflow/react'
import { CalendarCheck } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type MicrosoftCalendarNodeData = {
  label?: string
  operation?: 'list' | 'create' | 'get' | 'update' | 'delete' | 'list-calendars'
  calendarId?: string
  timeMin?: string
  timeMax?: string
  event?: Record<string, unknown>
}

type MicrosoftCalendarNodeType = Node<MicrosoftCalendarNodeData, 'microsoft-calendar'>

const OPERATION_LABELS: Record<string, string> = {
  'list-calendars': 'List Calendars',
  list: 'List Events',
  create: 'Create Event',
  get: 'Get Event',
  update: 'Update Event',
  delete: 'Delete Event',
}

export function MicrosoftCalendarNode({ data, selected }: NodeProps<MicrosoftCalendarNodeType>) {
  const op = data.operation ?? 'list'

  return (
    <BaseNode
      category="calendar"
      icon={CalendarCheck}
      title="Microsoft Calendar"
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
