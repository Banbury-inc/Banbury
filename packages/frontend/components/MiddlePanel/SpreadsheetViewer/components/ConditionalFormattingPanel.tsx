import React, { useState, useMemo } from 'react'
import { Button } from '../../../common/ui/button'
import { Input } from '../../../common/ui/old-input'
import { Label } from '../../../common/ui/label'
import { Separator } from '../../../common/ui/separator'
import { ArrowUpward, ArrowDownward, BorderAll as BorderAllIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { ConditionalFormattingRule } from '../handlers/handle-conditional-formatting'
import { createAddCFRuleHandler } from '../handlers/handle-add-cf-rule'

interface ConditionalFormattingPanelProps {
  isOpen: boolean
  onClose: () => void
  conditionalRules: ConditionalFormattingRule[]
  onAddRule: (rule: Omit<ConditionalFormattingRule, 'id' | 'priority'> & Partial<Pick<ConditionalFormattingRule, 'priority'>>) => void
  onUpdateRule: (id: string, updates: Partial<Omit<ConditionalFormattingRule, 'id'>>) => void
  onRemoveRule: (id: string) => void
  hotTableRef: React.RefObject<any>
  data: any[][]
  onMoveRule: (id: string, direction: 'up' | 'down') => void
}

export function ConditionalFormattingPanel({
  isOpen,
  onClose,
  conditionalRules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  hotTableRef,
  data,
  onMoveRule
}: ConditionalFormattingPanelProps) {
  const [cfOperator, setCfOperator] = useState<'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between'>('gt')
  const [cfValue, setCfValue] = useState<string>('')
  const [cfValue2, setCfValue2] = useState<string>('')
  const [cfStopIfTrue, setCfStopIfTrue] = useState<boolean>(false)
  const [cfTextOperator, setCfTextOperator] = useState<'contains' | 'startsWith' | 'endsWith' | 'eq' | 'neq' | 'isEmpty' | 'isNotEmpty' | 'duplicate' | 'unique'>('contains')
  const [cfDateOperator, setCfDateOperator] = useState<'today' | 'yesterday' | 'tomorrow' | 'inLastNDays' | 'inNextNDays' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'before' | 'after' | 'on' | 'notOn'>('today')
  const [cfMode, setCfMode] = useState<'numeric' | 'text' | 'date' | 'colorScale' | 'topN' | 'bottomN'>('numeric')
  const [cfA1Range, setCfA1Range] = useState<string>('')
  const [cfMinColor, setCfMinColor] = useState<string>('#FDE68A')
  const [cfMaxColor, setCfMaxColor] = useState<string>('#F59E0B')
  const [cfTextColor, setCfTextColor] = useState<string>('')
  const [cfFillColor, setCfFillColor] = useState<string>('#FACC15')
  const [cfBold, setCfBold] = useState<boolean>(false)
  const [cfItalic, setCfItalic] = useState<boolean>(false)
  const [cfUnderline, setCfUnderline] = useState<boolean>(false)

  const addRuleFromPanel = useMemo(() => {
    const handler = createAddCFRuleHandler({
      hotTableRef,
      getCFState: () => ({
        cfMode,
        cfOperator,
        cfTextOperator,
        cfDateOperator,
        cfA1Range,
        cfValue,
        cfValue2,
        cfStopIfTrue,
        cfMinColor,
        cfMaxColor,
        cfTextColor,
        cfFillColor,
        cfBold,
        cfItalic,
        cfUnderline,
      }),
      addConditionalRule: onAddRule,
      getDataSize: () => ({ rows: data.length, cols: data.reduce((m, r) => Math.max(m, r.length), 0) })
    })
    return () => handler()
  }, [hotTableRef, data, cfMode, cfOperator, cfTextOperator, cfDateOperator, cfA1Range, cfValue, cfValue2, cfStopIfTrue, cfMinColor, cfMaxColor, cfTextColor, cfFillColor, cfBold, cfItalic, cfUnderline, onAddRule])

  const applySelectionToRule = (id: string) => {
    const hot = hotTableRef.current?.hotInstance
    if (!hot) return
    const sel = hot.getSelectedLast?.()
    if (!sel) return
    const [r1, c1, r2, c2] = sel
    onUpdateRule(id, { range: { startRow: Math.min(r1, r2), endRow: Math.max(r1, r2), startCol: Math.min(c1, c2), endCol: Math.max(c1, c2) } as any })
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: 360,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        boxShadow: '-6px 0 16px rgba(0,0,0,0.08)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Conditional formatting</h3>
        <Button size="sm" style={{ color: '#ffffff', backgroundColor: '#111827' , border: '1px solid #111827' }} onClick={onClose}>Close</Button>
      </div>
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-range" style={{ color: '#111827' }}>Apply to range</Label>
            <Input id="cf-range" value={cfA1Range} onChange={(e) => setCfA1Range(e.target.value)} placeholder="e.g. A1:D10" style={{ color: '#111827' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-mode" style={{ color: '#111827' }}>Rule type</Label>
            <select id="cf-mode" value={cfMode} onChange={(e) => setCfMode(e.target.value as any)} className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
              <option value="numeric">Numeric</option>
              <option value="text">Text</option>
              <option value="date">Date</option>
              <option value="topN">Top N</option>
              <option value="bottomN">Bottom N</option>
              <option value="colorScale">Color scale</option>
            </select>
          </div>
        </div>
        {cfMode === 'numeric' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-op" style={{ color: '#111827' }}>Condition</Label>
            <select id="cf-op" value={cfOperator} onChange={(e) => setCfOperator(e.target.value as any)}
              className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
              <option value="gt">Greater than</option>
              <option value="gte">Greater than or equal</option>
              <option value="lt">Less than</option>
              <option value="lte">Less than or equal</option>
              <option value="eq">Equal to</option>
              <option value="neq">Not equal to</option>
              <option value="between">Between</option>
            </select>
          </div>
        )}
        {cfMode === 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-text-op" style={{ color: '#111827' }}>Text condition</Label>
            <select id="cf-text-op" value={cfTextOperator} onChange={(e) => setCfTextOperator(e.target.value as any)} className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
              <option value="contains">Contains</option>
              <option value="startsWith">Starts with</option>
              <option value="endsWith">Ends with</option>
              <option value="eq">Equals</option>
              <option value="neq">Not equal</option>
              <option value="isEmpty">Is empty</option>
              <option value="isNotEmpty">Is not empty</option>
              <option value="duplicate">Duplicate</option>
              <option value="unique">Unique</option>
            </select>
          </div>
        )}
        {cfMode === 'date' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-date-op" style={{ color: '#111827' }}>Date condition</Label>
            <select id="cf-date-op" value={cfDateOperator} onChange={(e) => setCfDateOperator(e.target.value as any)} className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="inLastNDays">In last N days</option>
              <option value="inNextNDays">In next N days</option>
              <option value="thisWeek">This week</option>
              <option value="lastWeek">Last week</option>
              <option value="nextWeek">Next week</option>
              <option value="thisMonth">This month</option>
              <option value="lastMonth">Last month</option>
              <option value="nextMonth">Next month</option>
              <option value="before">Before</option>
              <option value="after">After</option>
              <option value="on">On</option>
              <option value="notOn">Not on</option>
            </select>
          </div>
        )}
        {cfMode === 'colorScale' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Label htmlFor="cf-min-color" style={{ color: '#111827' }}>Min color</Label>
              <input id="cf-min-color" type="color" value={cfMinColor} onChange={(e) => setCfMinColor(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Label htmlFor="cf-max-color" style={{ color: '#111827' }}>Max color</Label>
              <input id="cf-max-color" type="color" value={cfMaxColor} onChange={(e) => setCfMaxColor(e.target.value)} />
            </div>
          </div>
        )}
        <div style={{ display: cfMode === 'colorScale' ? 'none' : 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Label htmlFor="cf-val1" style={{ color: '#111827' }}>Value</Label>
            <Input id="cf-val1" style={{ color: '#111827' }} value={cfValue} onChange={(e) => setCfValue(e.target.value)} />
          </div>
          {cfOperator === 'between' && (
            <div style={{ flex: 1 }}>
              <Label htmlFor="cf-val2" style={{ color: '#111827' }}>and</Label>
              <Input id="cf-val2" value={cfValue2} onChange={(e) => setCfValue2(e.target.value)} />
            </div>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={cfStopIfTrue} onChange={(e) => setCfStopIfTrue(e.target.checked)} />
          <span style={{ color: '#111827' }}>Stop if true</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-fill" style={{ color: '#111827' }}>Fill</Label>
            <input id="cf-fill" type="color" value={cfFillColor} onChange={(e) => setCfFillColor(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Label htmlFor="cf-text" style={{ color: '#111827' }}>Text</Label>
            <input id="cf-text" type="color" value={cfTextColor} onChange={(e) => setCfTextColor(e.target.value)} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={cfBold} onChange={(e) => setCfBold(e.target.checked)} />
            <span style={{ color: '#111827' }}>Bold</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={cfItalic} onChange={(e) => setCfItalic(e.target.checked)} />
            <span style={{ color: '#111827' }}>Italic</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={cfUnderline} onChange={(e) => setCfUnderline(e.target.checked)} />
            <span style={{ color: '#111827' }}>Underline</span>
          </label>
        </div>
        <Button style={{ backgroundColor: '#111827', color: '#ffffff' }} onClick={addRuleFromPanel}>Add rule</Button>

        <Separator className="my-2" style={{ borderColor: '#e5e7eb' }} />
        <p style={{ color: '#111827', fontSize: 12, fontWeight: 600 }}>Rules</p>
        <div style={{ overflowY: 'auto' }}>
          {[...conditionalRules].sort((a, b) => a.priority - b.priority).map((rule) => (
            <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>
                {rule.label || `${rule.condition.kind === 'numeric' ? rule.condition.operator : 'rule'} R${rule.range.startRow + 1}:C${rule.range.startCol + 1}–R${rule.range.endRow + 1}:C${rule.range.endCol + 1}`}
                {rule.stopIfTrue ? <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>(Stop if true)</span> : null}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => onMoveRule(rule.id, 'up')} title="Move up"><ArrowUpward sx={{ fontSize: 16, color: '#111827' }} /></Button>
                <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => onMoveRule(rule.id, 'down')} title="Move down"><ArrowDownward sx={{ fontSize: 16, color: '#111827' }} /></Button>
                <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => applySelectionToRule(rule.id)} title="Use selection"><BorderAllIcon sx={{ fontSize: 16, color: '#111827' }} /></Button>
                <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => onRemoveRule(rule.id)} title="Delete"><DeleteIcon sx={{ fontSize: 16, color: '#111827' }} /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
