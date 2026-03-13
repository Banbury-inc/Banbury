'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Textarea } from '../../../common/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { PythonCodeNodeData, PythonExecutionMode } from '../nodes/PythonCodeNode'

interface Props {
  data: PythonCodeNodeData
  onChange: (data: Partial<PythonCodeNodeData>) => void
}

const EXECUTION_MODE_LABELS: Record<PythonExecutionMode, string> = {
  inline: 'Inline Script',
  file: 'Python File',
}

const MIN_TIMEOUT_SECONDS = 1
const MAX_TIMEOUT_SECONDS = 300

function coerceTimeoutSeconds(value: string): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 30
  if (parsed < MIN_TIMEOUT_SECONDS) return MIN_TIMEOUT_SECONDS
  if (parsed > MAX_TIMEOUT_SECONDS) return MAX_TIMEOUT_SECONDS
  return Math.floor(parsed)
}

export function PythonCodeConfig({ data, onChange }: Props) {
  const executionMode = data.executionMode ?? 'inline'
  const timeoutSeconds = data.timeoutSeconds ?? 30

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Execution mode</Label>
        <Select
          value={executionMode}
          onValueChange={(value: PythonExecutionMode) => onChange({ executionMode: value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXECUTION_MODE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(executionMode === 'inline') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Python script</Label>
          <Textarea
            className="text-xs min-h-[140px] resize-y font-mono"
            placeholder={'import json\n\nprint(json.dumps({"ok": True}))'}
            value={data.script ?? ''}
            onChange={event => onChange({ script: event.target.value })}
          />
        </div>
      )}

      {(executionMode === 'file') && (
        <div className="space-y-1.5">
          <Label className="text-xs">File path</Label>
          <Input
            className="h-8 text-xs font-mono"
            placeholder="scripts/my_flow_task.py"
            value={data.filePath ?? ''}
            onChange={event => onChange({ filePath: event.target.value })}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Input payload (JSON or text)</Label>
        <Textarea
          className="text-xs min-h-[84px] resize-y font-mono"
          placeholder='{"message":"hello"}'
          value={data.input ?? ''}
          onChange={event => onChange({ input: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Timeout seconds</Label>
        <Input
          type="number"
          min={MIN_TIMEOUT_SECONDS}
          max={MAX_TIMEOUT_SECONDS}
          className="h-8 text-xs"
          value={timeoutSeconds}
          onChange={event => onChange({ timeoutSeconds: coerceTimeoutSeconds(event.target.value) })}
        />
      </div>
    </div>
  )
}
