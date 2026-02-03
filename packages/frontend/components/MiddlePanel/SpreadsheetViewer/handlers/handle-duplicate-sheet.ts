import React from 'react'
import type { SheetData } from './handle-csv-load'

export interface DuplicateSheetHandlerParams {
  allSheets: SheetData[]
  saveCurrentSheetState: () => void
  setAllSheets: (sheets: SheetData[]) => void
  setActiveSheetIndex: (index: number) => void
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
}

export function createDuplicateSheetHandler({
  allSheets,
  saveCurrentSheetState,
  setAllSheets,
  setActiveSheetIndex,
  setData,
  setCellFormats,
  setCellStyles,
  pendingCellMetaRef,
  setConditionalRules,
  setColumnWidths,
  setCharts
}: DuplicateSheetHandlerParams) {
  return function handleDuplicateSheet(index: number) {
    if (index < 0 || index >= allSheets.length) return
    
    // Save current sheet state
    saveCurrentSheetState()
    
    const sheetToDuplicate = allSheets[index]
    const newSheetName = `${sheetToDuplicate.name} (Copy)`
    const duplicatedSheet: SheetData = {
      ...sheetToDuplicate,
      name: newSheetName,
      // Deep copy the data and formatting
      data: sheetToDuplicate.data.map(row => [...row]),
      cellFormats: { ...sheetToDuplicate.cellFormats },
      cellStyles: { ...sheetToDuplicate.cellStyles },
      cellMeta: { ...sheetToDuplicate.cellMeta },
      conditionalRules: sheetToDuplicate.conditionalRules ? [...sheetToDuplicate.conditionalRules] : [],
      columnWidths: { ...sheetToDuplicate.columnWidths },
      charts: sheetToDuplicate.charts ? sheetToDuplicate.charts.map(chart => ({ 
        ...chart, 
        id: `chart-${Date.now()}-${Math.random()}` 
      })) : []
    }
    
    const updatedSheets = [...allSheets]
    updatedSheets.splice(index + 1, 0, duplicatedSheet)
    setAllSheets(updatedSheets)
    
    // Switch to the duplicated sheet
    setActiveSheetIndex(index + 1)
    setData(duplicatedSheet.data)
    setCellFormats(duplicatedSheet.cellFormats)
    setCellStyles(duplicatedSheet.cellStyles)
    pendingCellMetaRef.current = duplicatedSheet.cellMeta || {}
    setConditionalRules(duplicatedSheet.conditionalRules || [])
    setColumnWidths(duplicatedSheet.columnWidths || {})
    setCharts(duplicatedSheet.charts || [])
  }
}
