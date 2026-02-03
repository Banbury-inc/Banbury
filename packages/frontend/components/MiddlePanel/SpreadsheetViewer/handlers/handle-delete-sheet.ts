import React from 'react'
import type { SheetData } from './handle-csv-load'

export interface DeleteSheetHandlerParams {
  allSheets: SheetData[]
  activeSheetIndex: number
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

export function createDeleteSheetHandler({
  allSheets,
  activeSheetIndex,
  setAllSheets,
  setActiveSheetIndex,
  setData,
  setCellFormats,
  setCellStyles,
  pendingCellMetaRef,
  setConditionalRules,
  setColumnWidths,
  setCharts
}: DeleteSheetHandlerParams) {
  return function handleDeleteSheet(index: number) {
    if (allSheets.length <= 1) return // Don't delete the last sheet
    
    const updatedSheets = allSheets.filter((_, i) => i !== index)
    setAllSheets(updatedSheets)
    
    // If we deleted the active sheet, switch to the previous one
    if (index === activeSheetIndex) {
      const newActiveIndex = Math.max(0, index - 1)
      setActiveSheetIndex(newActiveIndex)
      const sheet = updatedSheets[newActiveIndex]
      setData(sheet.data)
      setCellFormats(sheet.cellFormats)
      setCellStyles(sheet.cellStyles)
      pendingCellMetaRef.current = sheet.cellMeta || {}
      setConditionalRules(sheet.conditionalRules || [])
      setColumnWidths(sheet.columnWidths || {})
      setCharts(sheet.charts || [])
    } else if (index < activeSheetIndex) {
      // Adjust active index if we deleted a sheet before it
      setActiveSheetIndex(activeSheetIndex - 1)
    }
  }
}
