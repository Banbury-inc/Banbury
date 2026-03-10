'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Textarea } from '../../../common/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { XApiNodeData } from '../nodes/XApiNode'

interface Props {
  data: XApiNodeData
  onChange: (data: Partial<XApiNodeData>) => void
}

const OPERATIONS = [
  { value: 'search', label: 'Search Tweets' },
  { value: 'post-tweet', label: 'Post Tweet' },
  { value: 'get-user', label: 'Get User Info' },
  { value: 'get-tweets', label: 'Get User Tweets' },
  { value: 'trending', label: 'Trending Topics' },
]

export function XApiConfig({ data, onChange }: Props) {
  const op = data.operation ?? 'search'

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Operation</Label>
        <Select value={op} onValueChange={val => onChange({ operation: val as XApiNodeData['operation'] })}>
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

      {op === 'search' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Query</Label>
          <Input
            className="h-8 text-xs"
            placeholder="from:user keyword or {{query}}"
            value={data.query ?? ''}
            onChange={e => onChange({ query: e.target.value })}
          />
        </div>
      )}

      {op === 'post-tweet' && (
        <div className="space-y-1.5">
          <Label className="text-xs">
            Tweet Text
            <span className="text-muted-foreground font-normal ml-1">(280 chars max)</span>
          </Label>
          <Textarea
            className="text-xs min-h-[80px] resize-y"
            placeholder="Tweet content or {{text}}"
            maxLength={280}
            value={data.text ?? ''}
            onChange={e => onChange({ text: e.target.value })}
          />
        </div>
      )}

      {(op === 'get-user' || op === 'get-tweets') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Username</Label>
          <Input
            className="h-8 text-xs"
            placeholder="username (without @)"
            value={data.username ?? ''}
            onChange={e => onChange({ username: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
