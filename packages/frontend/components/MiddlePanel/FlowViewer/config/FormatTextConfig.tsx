'use client'

import { Label } from '../../../common/ui/label'
import { Textarea } from '../../../common/ui/textarea'
import { FormatTextNodeData } from '../nodes/FormatTextNode'

interface Props {
  data: FormatTextNodeData
  onChange: (data: Partial<FormatTextNodeData>) => void
}

export function FormatTextConfig({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">
          Template
          <span className="text-muted-foreground font-normal ml-1">(use {'{{field}}'} for variables)</span>
        </Label>
        <Textarea
          className="text-xs min-h-[120px] resize-y font-mono"
          placeholder={"Name: {{name}}\nEmail: {{email}}\nStatus: {{status}}"}
          value={data.template ?? ''}
          onChange={e => onChange({ template: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{field}}'} to reference fields from connected upstream nodes. Nested paths like {'{{user.email}}'} are supported.
        </p>
      </div>
    </div>
  )
}
