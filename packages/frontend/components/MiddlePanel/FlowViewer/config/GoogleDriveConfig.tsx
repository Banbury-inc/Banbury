'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { GoogleDriveNodeData } from '../nodes/GoogleDriveNode'

interface Props {
  data: GoogleDriveNodeData
  onChange: (data: Partial<GoogleDriveNodeData>) => void
}

const OPERATIONS = [
  { value: 'list', label: 'List Files' },
  { value: 'search', label: 'Search Files' },
  { value: 'get', label: 'Get File' },
]

export function GoogleDriveConfig({ data, onChange }: Props) {
  const op = data.operation ?? 'list'

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Operation</Label>
        <Select value={op} onValueChange={val => onChange({ operation: val as GoogleDriveNodeData['operation'] })}>
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
            placeholder="name contains 'report' or {{query}}"
            value={data.query ?? ''}
            onChange={e => onChange({ query: e.target.value })}
          />
        </div>
      )}

      {(op === 'list') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Folder ID (empty = root)</Label>
          <Input
            className="h-8 text-xs"
            placeholder="folder-id or leave blank"
            value={data.folderId ?? ''}
            onChange={e => onChange({ folderId: e.target.value })}
          />
        </div>
      )}

      {op === 'get' && (
        <div className="space-y-1.5">
          <Label className="text-xs">File ID</Label>
          <Input
            className="h-8 text-xs"
            placeholder="file-id or {{fileId}}"
            value={data.fileId ?? ''}
            onChange={e => onChange({ fileId: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
