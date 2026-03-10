'use client'

import { useState, useEffect, useCallback } from 'react'
import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Button } from '../../../common/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { ApiService } from '../../../../../backend/api/apiService'
import { SavedConnectionRecord } from '../../../../../backend/api/databases/databases'
import { DatabaseQueryNodeData } from '../nodes/DatabaseQueryNode'

interface Props {
  data: DatabaseQueryNodeData
  onChange: (data: Partial<DatabaseQueryNodeData>) => void
}

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'contains']

export function DatabaseQueryConfig({ data, onChange }: Props) {
  const [connections, setConnections] = useState<SavedConnectionRecord[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)

  const loadConnections = useCallback(async () => {
    setLoadingConnections(true)
    try {
      const result = await ApiService.Databases.listConnections()
      setConnections(result.connections ?? [])
    } finally {
      setLoadingConnections(false)
    }
  }, [])

  useEffect(() => { loadConnections() }, [loadConnections])

  const filters = data.filters ?? []

  function addFilter() {
    onChange({ filters: [...filters, { field: '', operator: '=', value: '' }] })
  }

  function updateFilter(i: number, patch: Partial<{ field: string; operator: string; value: string }>) {
    const next = filters.map((f, idx) => idx === i ? { ...f, ...patch } : f)
    onChange({ filters: next })
  }

  function removeFilter(i: number) {
    onChange({ filters: filters.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Connection</Label>
        <Select
          value={data.connectionId ?? ''}
          onValueChange={val => {
            const conn = connections.find(c => c.id === val)
            onChange({ connectionId: val, connectionName: conn?.name ?? val })
          }}
          disabled={loadingConnections}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={loadingConnections ? 'Loading…' : 'Select connection'} />
          </SelectTrigger>
          <SelectContent>
            {connections.map(c => (
              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Table / Collection</Label>
        <Input
          className="h-8 text-xs"
          placeholder="users"
          value={data.table ?? ''}
          onChange={e => onChange({ table: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Columns (comma-separated, empty = all)</Label>
        <Input
          className="h-8 text-xs"
          placeholder="id, name, email"
          value={(data.columns ?? []).join(', ')}
          onChange={e => {
            const cols = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            onChange({ columns: cols })
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Filters</Label>
          <Button size="xs" variant="ghost" onClick={addFilter} className="h-6 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {filters.map((f, i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              className="h-7 text-xs flex-1"
              placeholder="field"
              value={f.field}
              onChange={e => updateFilter(i, { field: e.target.value })}
            />
            <Select value={f.operator} onValueChange={val => updateFilter(i, { operator: val })}>
              <SelectTrigger className="h-7 text-xs w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map(op => (
                  <SelectItem key={op} value={op} className="text-xs">{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-7 text-xs flex-1"
              placeholder="value"
              value={f.value}
              onChange={e => updateFilter(i, { value: e.target.value })}
            />
            <Button size="xs" variant="ghost" onClick={() => removeFilter(i)} className="h-7 w-7 p-0">
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
