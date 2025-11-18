import type React from 'react'
import type { ConditionalFormattingRule } from './handle-conditional-formatting'

interface CellRange {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

interface CreateAddCFRuleHandlerParams {
  hotTableRef: React.RefObject<any>
  getCFState: () => {
    cfMode: 'numeric' | 'text' | 'date' | 'colorScale' | 'topN' | 'bottomN'
    cfOperator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between'
    cfTextOperator: 'contains' | 'startsWith' | 'endsWith' | 'eq' | 'neq' | 'isEmpty' | 'isNotEmpty' | 'duplicate' | 'unique'
    cfDateOperator: 'today' | 'yesterday' | 'tomorrow' | 'inLastNDays' | 'inNextNDays' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'before' | 'after' | 'on' | 'notOn'
    cfA1Range: string
    cfValue: string
    cfValue2: string
    cfStopIfTrue: boolean
    cfMinColor: string
    cfMaxColor: string
    cfTextColor: string
    cfFillColor: string
    cfBold: boolean
    cfItalic: boolean
    cfUnderline: boolean
  }
  addConditionalRule: (rule: Omit<ConditionalFormattingRule, 'id' | 'priority'> & Partial<Pick<ConditionalFormattingRule, 'priority'>>) => void
  getDataSize: () => { rows: number; cols: number }
}

function parseA1Range(a1: string): CellRange | null {
  try {
    const m = a1.trim().toUpperCase().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
    if (!m) return null
    const colToIndex = (s: string) => s.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
    const r1 = parseInt(m[2], 10) - 1
    const c1 = colToIndex(m[1])
    const r2 = parseInt(m[4], 10) - 1
    const c2 = colToIndex(m[3])
    return { startRow: Math.min(r1, r2), endRow: Math.max(r1, r2), startCol: Math.min(c1, c2), endCol: Math.max(c1, c2) }
  } catch { return null }
}

export function createAddCFRuleHandler({ hotTableRef, getCFState, addConditionalRule, getDataSize }: CreateAddCFRuleHandlerParams) {
  function clampRangeToData(range: CellRange): CellRange {
    const { rows, cols } = getDataSize()
    const maxRow = Math.max(0, rows - 1)
    const maxCol = Math.max(0, cols - 1)
    const sr = Math.max(0, Math.min(range.startRow, maxRow))
    const er = Math.max(0, Math.min(range.endRow, maxRow))
    const sc = Math.max(0, Math.min(range.startCol, maxCol))
    const ec = Math.max(0, Math.min(range.endCol, maxCol))
    return { startRow: Math.min(sr, er), endRow: Math.max(sr, er), startCol: Math.min(sc, ec), endCol: Math.max(sc, ec) }
  }

  return function addRuleFromPanel() {
    const hot = hotTableRef.current?.hotInstance
    const state = getCFState()
    const { rows, cols } = getDataSize()

    // Resolve target range: A1 range > current selection > entire sheet > first cell
    let range: CellRange | null = null
    if (state.cfA1Range.trim()) range = parseA1Range(state.cfA1Range)
    if (!range && hot?.getSelectedLast) {
      const sel = hot.getSelectedLast()
      if (sel && Array.isArray(sel)) {
        const [r1, c1, r2, c2] = sel
        range = { startRow: Math.min(r1, r2), endRow: Math.max(r1, r2), startCol: Math.min(c1, c2), endCol: Math.max(c1, c2) }
      }
    }
    if (!range && rows > 0 && cols > 0) {
      range = { startRow: 0, endRow: rows - 1, startCol: 0, endCol: cols - 1 }
    }
    if (!range) range = { startRow: 0, endRow: 0, startCol: 0, endCol: 0 }

    range = clampRangeToData(range)

    // Build format styles common
    const commonStyles: React.CSSProperties = {
      backgroundColor: state.cfFillColor || '#FACC15',
      color: state.cfTextColor || '#111827',
      fontWeight: state.cfBold ? '700' : undefined,
      fontStyle: state.cfItalic ? 'italic' : undefined,
      textDecoration: state.cfUnderline ? 'underline' : undefined,
    }

    // Color scale rule
    if (state.cfMode === 'colorScale') {
      addConditionalRule({
        range,
        condition: { kind: 'colorScale', minColor: state.cfMinColor, maxColor: state.cfMaxColor } as any,
        format: { styles: {} },
        stopIfTrue: false,
      })
      return
    }

    // Top/Bottom N rule
    if (state.cfMode === 'topN' || state.cfMode === 'bottomN') {
      const n = state.cfValue.trim() === '' ? 10 : Number(state.cfValue)
      addConditionalRule({
        range,
        condition: { kind: 'numeric', operator: state.cfMode === 'topN' ? 'topN' : 'bottomN', value: Number.isFinite(n) ? n : 10 } as any,
        format: { styles: commonStyles },
        stopIfTrue: state.cfStopIfTrue,
      })
      return
    }

    // Text rule
    if (state.cfMode === 'text') {
      addConditionalRule({
        range,
        condition: { kind: 'text', operator: state.cfTextOperator, value: state.cfValue } as any,
        format: { styles: commonStyles },
        stopIfTrue: state.cfStopIfTrue,
      })
      return
    }

    // Date rule
    if (state.cfMode === 'date') {
      addConditionalRule({
        range,
        condition: { kind: 'date', operator: state.cfDateOperator, value: state.cfValue } as any,
        format: { styles: commonStyles },
        stopIfTrue: state.cfStopIfTrue,
      })
      return
    }

    // Numeric rule (default)
    const num1 = state.cfValue.trim() === '' ? undefined : Number(state.cfValue)
    const num2 = state.cfValue2.trim() === '' ? undefined : Number(state.cfValue2)
    addConditionalRule({
      range,
      condition: { kind: 'numeric', operator: state.cfOperator, value: typeof num1 === 'number' && !Number.isNaN(num1) ? num1 : undefined, value2: typeof num2 === 'number' && !Number.isNaN(num2) ? num2 : undefined } as any,
      format: { styles: commonStyles },
      stopIfTrue: state.cfStopIfTrue,
    })
  }
}


