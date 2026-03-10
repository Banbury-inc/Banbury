'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Textarea } from '../../../common/ui/textarea'
import { GmailSendNodeData } from '../nodes/GmailSendNode'

interface Props {
  data: GmailSendNodeData
  onChange: (data: Partial<GmailSendNodeData>) => void
}

export function GmailSendConfig({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">To</Label>
        <Input
          className="h-8 text-xs"
          placeholder="recipient@example.com or {{row.email}}"
          value={data.to ?? ''}
          onChange={e => onChange({ to: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">CC</Label>
        <Input
          className="h-8 text-xs"
          placeholder="cc@example.com"
          value={data.cc ?? ''}
          onChange={e => onChange({ cc: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">BCC</Label>
        <Input
          className="h-8 text-xs"
          placeholder="bcc@example.com"
          value={data.bcc ?? ''}
          onChange={e => onChange({ bcc: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Subject</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Your report for {{date}}"
          value={data.subject ?? ''}
          onChange={e => onChange({ subject: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          Body
          <span className="text-muted-foreground font-normal ml-1">(use {'{{field}}'} for variables)</span>
        </Label>
        <Textarea
          className="text-xs min-h-[120px] resize-y"
          placeholder={"Hi {{name}},\n\nHere is your data:\n{{result}}"}
          value={data.body ?? ''}
          onChange={e => onChange({ body: e.target.value })}
        />
      </div>
    </div>
  )
}
