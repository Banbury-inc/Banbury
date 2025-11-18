interface CellRange {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

type NumericOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between' | 'topN' | 'bottomN'
type TextOperator = 'contains' | 'startsWith' | 'endsWith' | 'eq' | 'neq' | 'isEmpty' | 'isNotEmpty' | 'duplicate' | 'unique'
type DateOperator = 'before' | 'after' | 'on' | 'notOn' | 'today' | 'yesterday' | 'tomorrow' | 'inLastNDays' | 'inNextNDays' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth'

interface NumericCondition {
  kind: 'numeric'
  operator: NumericOperator
  value?: number
  value2?: number
}

interface TextCondition {
  kind: 'text'
  operator: TextOperator
  value?: string
}

interface DateCondition {
  kind: 'date'
  operator: DateOperator
  value?: string // ISO date string or number for N-days operators
}

interface FormulaCondition {
  kind: 'formula'
  formula: string // Future use
}

interface ColorScaleCondition {
  kind: 'colorScale'
  minColor: string
  maxColor: string
}

export interface ConditionalFormattingRule {
  id: string
  range: CellRange
  condition: NumericCondition | TextCondition | DateCondition | FormulaCondition | ColorScaleCondition
  format: { className?: string; styles?: React.CSSProperties }
  stopIfTrue?: boolean
  priority: number
  label?: string
}

export interface ConditionalFormatsMaps {
  classes: { [key: string]: string }
  styles: { [key: string]: React.CSSProperties }
}

interface CreateConditionalFormattingHandlersParams {
  setConditionalRules: (rules: ConditionalFormattingRule[]) => void
  getConditionalRules: () => ConditionalFormattingRule[]
  setConditionalClasses: (m: { [key: string]: string }) => void
  setConditionalStyles: (m: { [key: string]: React.CSSProperties }) => void
}

function normalizeRange(range: CellRange): CellRange {
  const sr = Math.min(range.startRow, range.endRow)
  const er = Math.max(range.startRow, range.endRow)
  const sc = Math.min(range.startCol, range.endCol)
  const ec = Math.max(range.startCol, range.endCol)
  return { startRow: sr, endRow: er, startCol: sc, endCol: ec }
}

function isInRange(r: number, c: number, range: CellRange): boolean {
  return r >= range.startRow && r <= range.endRow && c >= range.startCol && c <= range.endCol
}

function coerceNumber(value: any): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const num = parseFloat(String(value).replace(/,/g, ''))
  return Number.isNaN(num) ? null : num
}

function coerceString(value: any): string {
  if (value == null) return ''
  return String(value)
}

function coerceDate(value: any): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function evaluateCondition(value: any, condition: ConditionalFormattingRule['condition']): boolean {
  switch (condition.kind) {
    case 'numeric': {
      const v = coerceNumber(value)
      if (v == null) return false
      const a = condition.value ?? 0
      switch (condition.operator) {
        case 'gt': return v > a
        case 'gte': return v >= a
        case 'lt': return v < a
        case 'lte': return v <= a
        case 'eq': return v === a
        case 'neq': return v !== a
        case 'between': return typeof condition.value === 'number' && typeof condition.value2 === 'number' ? v >= condition.value && v <= condition.value2 : false
      }
      return false
    }
    case 'text': {
      const s = coerceString(value)
      const a = condition.value ?? ''
      switch (condition.operator) {
        case 'contains': return s.toLowerCase().includes(String(a).toLowerCase())
        case 'startsWith': return s.toLowerCase().startsWith(String(a).toLowerCase())
        case 'endsWith': return s.toLowerCase().endsWith(String(a).toLowerCase())
        case 'eq': return s === String(a)
        case 'neq': return s !== String(a)
        case 'isEmpty': return s.trim() === ''
        case 'isNotEmpty': return s.trim() !== ''
      }
      return false
    }
    case 'date': {
      const d = coerceDate(value)
      if (!d) return false
      const today = new Date()
      const normalize = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
      const dn = normalize(d).getTime()
      switch (condition.operator) {
        case 'today': return dn === normalize(today).getTime()
        case 'yesterday': {
          const y = new Date(today); y.setDate(y.getDate() - 1); return dn === normalize(y).getTime()
        }
        case 'tomorrow': {
          const t = new Date(today); t.setDate(t.getDate() + 1); return dn === normalize(t).getTime()
        }
        case 'inLastNDays': {
          const n = Number(condition.value || 0)
          if (!Number.isFinite(n)) return false
          const start = new Date(today); start.setDate(start.getDate() - n)
          return dn >= normalize(start).getTime() && dn <= normalize(today).getTime()
        }
        case 'inNextNDays': {
          const n = Number(condition.value || 0)
          if (!Number.isFinite(n)) return false
          const end = new Date(today); end.setDate(end.getDate() + n)
          return dn >= normalize(today).getTime() && dn <= normalize(end).getTime()
        }
        case 'thisWeek': {
          const day = today.getDay(); const start = new Date(today); start.setDate(today.getDate() - day)
          const end = new Date(start); end.setDate(start.getDate() + 6)
          return dn >= normalize(start).getTime() && dn <= normalize(end).getTime()
        }
        case 'lastWeek': {
          const day = today.getDay(); const start = new Date(today); start.setDate(today.getDate() - day - 7)
          const end = new Date(start); end.setDate(start.getDate() + 6)
          return dn >= normalize(start).getTime() && dn <= normalize(end).getTime()
        }
        case 'nextWeek': {
          const day = today.getDay(); const start = new Date(today); start.setDate(today.getDate() - day + 7)
          const end = new Date(start); end.setDate(start.getDate() + 6)
          return dn >= normalize(start).getTime() && dn <= normalize(end).getTime()
        }
        case 'thisMonth': {
          const start = new Date(today.getFullYear(), today.getMonth(), 1)
          const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          return dn >= normalize(start).getTime() && dn <= normalize(end).getTime()
        }
        case 'lastMonth': {
          const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          const end = new Date(today.getFullYear(), today.getMonth(), 0)
          return dn >= normalize(start).getTime() && dn <= normalize(end).getTime()
        }
        case 'nextMonth': {
          const start = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          const end = new Date(today.getFullYear(), today.getMonth() + 2, 0)
          return dn >= normalize(start).getTime() && dn <= normalize(end).getTime()
        }
        case 'before': {
          const a = condition.value ? coerceDate(condition.value) : null
          return a ? dn < normalize(a).getTime() : false
        }
        case 'after': {
          const a = condition.value ? coerceDate(condition.value) : null
          return a ? dn > normalize(a).getTime() : false
        }
        case 'on': {
          const a = condition.value ? coerceDate(condition.value) : null
          return a ? dn === normalize(a).getTime() : false
        }
        case 'notOn': {
          const a = condition.value ? coerceDate(condition.value) : null
          return a ? dn !== normalize(a).getTime() : false
        }
      }
      return false
    }
    case 'formula': {
      // Placeholder for future support
      return false
    }
  }
}

export function computeConditionalFormats(params: {
  data: any[][]
  rules: ConditionalFormattingRule[]
}): ConditionalFormatsMaps {
  const { data, rules } = params
  if (!Array.isArray(data) || !Array.isArray(rules) || rules.length === 0) return { classes: {}, styles: {} }

  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  const classes: { [key: string]: string } = {}
  const styles: { [key: string]: React.CSSProperties } = {}

  const numRows = data.length
  const numCols = data.reduce((m, r) => Math.max(m, r.length), 0)

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const h = hex.replace('#', '')
    if (h.length !== 6) return null
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return { r, g, b }
  }

  function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

  function interpolateColor(minHex: string, maxHex: string, t: number): string | null {
    const c1 = hexToRgb(minHex)
    const c2 = hexToRgb(maxHex)
    if (!c1 || !c2) return null
    const r = Math.round(lerp(c1.r, c2.r, t))
    const g = Math.round(lerp(c1.g, c2.g, t))
    const b = Math.round(lerp(c1.b, c2.b, t))
    return `rgb(${r}, ${g}, ${b})`
  }

  // Pre-compute aggregates for range-dependent rules
  const cachedRangeValues: Record<string, number[]> = {}
  const cachedTextCounts: Record<string, Record<string, number>> = {}

  function rangeKey(range: CellRange): string {
    return `${range.startRow}:${range.startCol}:${range.endRow}:${range.endCol}`
  }

  function collectNumericInRange(range: CellRange): number[] {
    const key = rangeKey(range)
    if (cachedRangeValues[key]) return cachedRangeValues[key]
    const values: number[] = []
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        const v = coerceNumber(data[r]?.[c])
        if (v != null) values.push(v)
      }
    }
    cachedRangeValues[key] = values
    return values
  }

  function collectTextCountsInRange(range: CellRange): Record<string, number> {
    const key = rangeKey(range)
    if (cachedTextCounts[key]) return cachedTextCounts[key]
    const counts: Record<string, number> = {}
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        const s = coerceString(data[r]?.[c])
        if (s.trim() === '') continue
        counts[s] = (counts[s] || 0) + 1
      }
    }
    cachedTextCounts[key] = counts
    return counts
  }

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const value = (data[r] && data[r][c] != null) ? data[r][c] : ''
      let applied = false
      for (const rule of sorted) {
        if (!isInRange(r, c, rule.range)) continue
        let match = false
        // Range-dependent rules
        if (rule.condition.kind === 'colorScale') {
          const nums = collectNumericInRange(rule.range)
          if (nums.length > 0) {
            const v = coerceNumber(value)
            if (v != null) {
              const min = Math.min(...nums)
              const max = Math.max(...nums)
              const t = max === min ? 0.5 : (v - min) / (max - min)
              const bg = interpolateColor(rule.condition.minColor, rule.condition.maxColor, Math.max(0, Math.min(1, t)))
              if (bg) {
                const key = `${r}-${c}`
                styles[key] = { ...(styles[key] || {}), backgroundColor: bg }
                match = true
              }
            }
          }
        } else if (rule.condition.kind === 'numeric' && (rule.condition.operator === 'topN' || rule.condition.operator === 'bottomN')) {
          const n = typeof rule.condition.value === 'number' ? rule.condition.value : 10
          const nums = collectNumericInRange(rule.range).slice().sort((a,b)=>a-b)
          if (nums.length > 0) {
            const v = coerceNumber(value)
            if (v != null) {
              if (rule.condition.operator === 'topN') {
                const threshold = nums[Math.max(0, nums.length - n)]
                match = v >= threshold
              } else {
                const threshold = nums[Math.min(nums.length - 1, n - 1)]
                match = v <= threshold
              }
            }
          }
        } else if (rule.condition.kind === 'text' && (rule.condition.operator === 'duplicate' || rule.condition.operator === 'unique')) {
          const counts = collectTextCountsInRange(rule.range)
          const s = coerceString(value)
          const cnt = counts[s] || 0
          match = rule.condition.operator === 'duplicate' ? cnt > 1 : cnt <= 1
        } else if (evaluateCondition(value, rule.condition)) {
          match = true
        }

        if (match) {
          const key = `${r}-${c}`
          if (rule.format.className) {
            const existing = classes[key]
            const next = existing ? `${existing} ${rule.format.className}`.trim() : rule.format.className
            classes[key] = next
          }
          if (rule.format.styles && Object.keys(rule.format.styles).length > 0) {
            styles[key] = { ...(styles[key] || {}), ...rule.format.styles }
          }
          if (rule.stopIfTrue) { applied = true; break }
        }
      }
      if (applied) continue
    }
  }

  return { classes, styles }
}

export function createConditionalFormattingHandlers({
  setConditionalRules,
  getConditionalRules,
  setConditionalClasses,
  setConditionalStyles
}: CreateConditionalFormattingHandlersParams) {
  function addRule(rule: Omit<ConditionalFormattingRule, 'id' | 'priority'> & Partial<Pick<ConditionalFormattingRule, 'priority'>>) {
    const current = getConditionalRules()
    const id = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const priority = typeof rule.priority === 'number' ? rule.priority : current.length
    const normalized = { ...rule, id, priority, range: normalizeRange(rule.range) } as ConditionalFormattingRule
    const next = [...current, normalized]
    setConditionalRules(next)
  }

  function updateRule(id: string, updates: Partial<Omit<ConditionalFormattingRule, 'id'>>) {
    const current = getConditionalRules()
    const next = current.map((r) => r.id === id ? normalizeRule({ ...r, ...updates }) : r)
    setConditionalRules(next)
  }

  function removeRule(id: string) {
    const current = getConditionalRules()
    const next = current.filter((r) => r.id !== id)
    setConditionalRules(next)
  }

  function normalizeRule(rule: ConditionalFormattingRule): ConditionalFormattingRule {
    return { ...rule, range: normalizeRange(rule.range) }
  }

  function recompute({ data }: { data: any[][] }) {
    const maps = computeConditionalFormats({ data, rules: getConditionalRules() })
    setConditionalClasses(maps.classes)
    setConditionalStyles(maps.styles)
  }

  return { addRule, updateRule, removeRule, recompute }
}

export type { CellRange, NumericCondition, TextCondition, DateCondition }


