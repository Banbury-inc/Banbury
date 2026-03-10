'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { Textarea } from '../../../common/ui/textarea'
import { GoogleCalendarNodeData } from '../nodes/GoogleCalendarNode'

interface Props {
  data: GoogleCalendarNodeData
  onChange: (data: Partial<GoogleCalendarNodeData>) => void
}

const OPERATIONS = [
  { value: 'list', label: 'List Events' },
  { value: 'get', label: 'Get Event' },
  { value: 'create', label: 'Create Event' },
  { value: 'update', label: 'Update Event' },
  { value: 'delete', label: 'Delete Event' },
]

export function GoogleCalendarConfig({ data, onChange }: Props) {
  const op = data.operation ?? 'list'

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Operation</Label>
        <Select value={op} onValueChange={val => onChange({ operation: val as GoogleCalendarNodeData['operation'] })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Calendar ID</Label>
        <Input
          className="h-8 text-xs"
          placeholder="primary"
          value={data.calendarId ?? ''}
          onChange={e => onChange({ calendarId: e.target.value })}
        />
      </div>

      {(op === 'list') && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Time Min (ISO 8601)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="2024-01-01T00:00:00Z or {{date}}"
              value={data.timeMin ?? ''}
              onChange={e => onChange({ timeMin: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Time Max (ISO 8601)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="2024-12-31T23:59:59Z or {{date}}"
              value={data.timeMax ?? ''}
              onChange={e => onChange({ timeMax: e.target.value })}
            />
          </div>
        </>
      )}

      {(op === 'create' || op === 'update') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Event JSON</Label>
          <Textarea
            className="text-xs min-h-[100px] resize-y font-mono"
            placeholder={'{\n  "summary": "{{title}}",\n  "start": {"dateTime": "{{start}}"},\n  "end": {"dateTime": "{{end}}"}\n}'}
            value={data.event ? JSON.stringify(data.event, null, 2) : ''}
            onChange={e => {
              try { onChange({ event: JSON.parse(e.target.value) }) }
              catch { /* keep typing */ }
            }}
          />
        </div>
      )}
    </div>
  )
}
