import React from 'react'
import type { SheetData } from './handle-csv-load'

export interface SheetChangeHandlerParams {
  allSheets: SheetData[]
  activeSheetIndex: number
  saveCurrentSheetState: () => void
  setData: (data: any[][]) => void
  setCellFormats: (formats: { [k: string]: { className?: string } }) => void
  setCellStyles: (styles: { [k: string]: React.CSSProperties }) => void
  pendingCellMetaRef: React.MutableRefObject<Record<string, {
    type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'
    source?: string[]
    numericFormat?: { pattern?: string; culture?: string }
    dateFormat?: string
  }> | null>
  setConditionalRules: (rules: any[]) => void
  setColumnWidths: (widths: { [k: string]: number }) => void
  setCharts: (charts: any[]) => void
  setActiveSheetIndex: (index: number) => void
  hotTableRef: React.MutableRefObject<any>
}

export function createSheetChangeHandler({
  allSheets,
  activeSheetIndex,
  saveCurrentSheetState,
  setData,
  setCellFormats,
  setCellStyles,
  pendingCellMetaRef,
  setConditionalRules,
  setColumnWidths,
  setCharts,
  setActiveSheetIndex,
  hotTableRef
}: SheetChangeHandlerParams) {
  return function handleSheetChange(newIndex: number) {
    if (newIndex < 0 || newIndex >= allSheets.length || newIndex === activeSheetIndex) return
    
    // Save current sheet state
    saveCurrentSheetState()
    
    // Load new sheet
    const sheet = allSheets[newIndex]
    setData(sheet.data)
    setCellFormats(sheet.cellFormats)
    setCellStyles(sheet.cellStyles)
    pendingCellMetaRef.current = sheet.cellMeta || {}
    setConditionalRules(sheet.conditionalRules || [])
    setColumnWidths(sheet.columnWidths || {})
    setCharts(sheet.charts || [])
    setActiveSheetIndex(newIndex)
    
    // Apply cell metadata to Handsontable
    setTimeout(() => {
      if (hotTableRef.current) {
        const hot = hotTableRef.current.hotInstance
        if (hot && sheet.cellMeta) {
          Object.entries(sheet.cellMeta).forEach(([key, meta]: [string, any]) => {
            const [row, col] = key.split('-').map(Number)
            if (!isNaN(row) && !isNaN(col)) {
              hot.setCellMeta(row, col, 'type', meta.type)
              if (meta.source) hot.setCellMeta(row, col, 'source', meta.source)
            }
          })
          hot.render()
        }
      }
    }, 100)
  }
}
