'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Button } from '../../../common/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { FilterCondition, FilterDataNodeData } from '../nodes/FilterDataNode'

interface Props {
  data: FilterDataNodeData
  onChange: (data: Partial<FilterDataNodeData>) => void
}

const OPERATORS: FilterCondition['operator'][] = ['=', '!=', '>', '<', '>=', '<=', 'contains']

export function FilterDataConfig({ data, onChange }: Props) {
  const conditions = data.conditions ?? []

  function addCondition() {
    onChange({ conditions: [...conditions, { field: '', operator: '=', value: '' }] })
  }

  function updateCondition(i: number, patch: Partial<FilterCondition>) {
    const next = conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c)
    onChange({ conditions: next })
  }

  function removeCondition(i: number) {
    onChange({ conditions: conditions.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Conditions (all must match)</Label>
        <Button size="xs" variant="ghost" onClick={addCondition} className="h-6 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {conditions.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No conditions — all data passes through.</p>
      )}

      {conditions.map((c, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            className="h-7 text-xs flex-1"
            placeholder="field"
            value={c.field}
            onChange={e => updateCondition(i, { field: e.target.value })}
          />
          <Select value={c.operator} onValueChange={val => updateCondition(i, { operator: val as FilterCondition['operator'] })}>
            <SelectTrigger className="h-7 text-xs w-24">
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
            value={c.value}
            onChange={e => updateCondition(i, { value: e.target.value })}
          />
          <Button size="xs" variant="ghost" onClick={() => removeCondition(i)} className="h-7 w-7 p-0">
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  )
}
