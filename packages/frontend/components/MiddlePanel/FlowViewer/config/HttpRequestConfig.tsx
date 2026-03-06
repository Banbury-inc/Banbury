'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Textarea } from '../../../common/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { Button } from '../../../common/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { HttpRequestNodeData } from '../nodes/HttpRequestNode'

interface Props {
  data: HttpRequestNodeData
  onChange: (data: Partial<HttpRequestNodeData>) => void
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export function HttpRequestConfig({ data, onChange }: Props) {
  const headers = data.headers ?? {}
  const headerEntries = Object.entries(headers)

  function addHeader() {
    onChange({ headers: { ...headers, '': '' } })
  }

  function updateHeader(oldKey: string, newKey: string, value: string) {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(headers)) {
      if (k === oldKey) next[newKey] = value
      else next[k] = v
    }
    onChange({ headers: next })
  }

  function removeHeader(key: string) {
    const next = { ...headers }
    delete next[key]
    onChange({ headers: next })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="w-24 space-y-1.5">
          <Label className="text-xs">Method</Label>
          <Select
            value={data.method ?? 'GET'}
            onValueChange={val => onChange({ method: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map(m => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">URL</Label>
          <Input
            className="h-8 text-xs"
            placeholder="https://api.example.com/data"
            value={data.url ?? ''}
            onChange={e => onChange({ url: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Headers</Label>
          <Button size="xs" variant="ghost" onClick={addHeader} className="h-6 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {headerEntries.map(([k, v], i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              className="h-7 text-xs flex-1"
              placeholder="Header-Name"
              value={k}
              onChange={e => updateHeader(k, e.target.value, v)}
            />
            <Input
              className="h-7 text-xs flex-1"
              placeholder="value"
              value={v}
              onChange={e => updateHeader(k, k, e.target.value)}
            />
            <Button size="xs" variant="ghost" onClick={() => removeHeader(k)} className="h-7 w-7 p-0">
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {(data.method !== 'GET' && data.method !== 'DELETE') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Body (JSON)</Label>
          <Textarea
            className="text-xs min-h-[80px] resize-y font-mono"
            placeholder={'{"key": "{{value}}"}'}
            value={data.body ?? ''}
            onChange={e => onChange({ body: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
