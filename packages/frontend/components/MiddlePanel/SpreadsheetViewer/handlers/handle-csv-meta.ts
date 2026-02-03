import React from 'react'
import { parseCSV } from '../utils/csv-parser'
import type { ConditionalFormattingRule } from './handle-conditional-formatting'
import type { ChartDefinition } from '../types/chart-types'

export interface ParseCSVWithMetaParams {
  setCellLinks: (links: { [key: string]: string }) => void
  setColumnWidths: (widths: { [key: string]: number }) => void
  pendingCellMetaRef: React.MutableRefObject<Record<string, { 
    type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; 
    source?: string[]; 
    numericFormat?: { pattern?: string; culture?: string };
    dateFormat?: string;
  }> | null>
  setCellFormats: (formats: { [key: string]: { className?: string } }) => void
  setCellStyles: (styles: { [key: string]: React.CSSProperties }) => void
  setCellTypeMeta: (meta: { [key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string } }) => void
  setConditionalRules: (rules: ConditionalFormattingRule[]) => void
  setCharts: (charts: ChartDefinition[]) => void
}

export function parseCSVWithMeta(
  content: string,
  params: ParseCSVWithMetaParams
): { parsed: any[][]; metaObj: any } {
  const {
    setCellLinks,
    setColumnWidths,
    pendingCellMetaRef,
    setCellFormats,
    setCellStyles,
    setCellTypeMeta,
    setConditionalRules,
    setCharts
  } = params

  const parsed = parseCSV(content)
  
  let metaObj: any = {}
  if (content.startsWith('##BANBURY_META=')) {
    const lines = content.split('\n')
    const metaLine = lines[0]
    
    try {
      const encoded = metaLine.replace('##BANBURY_META=', '')
      const decoded = atob(encoded)
      metaObj = JSON.parse(decoded)
      if (metaObj && metaObj.cells && typeof metaObj.cells === 'object') {
        // Store cell type metadata
        const cellTypeMeta: any = {}
        const cellFormats: any = {}
        const cellStyles: any = {}
        
        const loadedLinks: {[key: string]: string} = {}
        
        Object.entries(metaObj.cells).forEach(([key, cellMeta]: [string, any]) => {
          // Extract type metadata
          if (cellMeta.type) {
            const typeMeta: any = { type: cellMeta.type }
            if (cellMeta.source) typeMeta.source = cellMeta.source
            if (cellMeta.numericFormat) typeMeta.numericFormat = cellMeta.numericFormat
            if (cellMeta.dateFormat) typeMeta.dateFormat = cellMeta.dateFormat
            cellTypeMeta[key] = typeMeta
          }
          
          // Extract formatting metadata
          if (cellMeta.className) {
            cellFormats[key] = { className: cellMeta.className }
          }
          
          if (cellMeta.styles) {
            cellStyles[key] = cellMeta.styles
          }
          
          // Extract link metadata
          if (cellMeta.link) {
            loadedLinks[key] = cellMeta.link
          }
        })
        
        if (Object.keys(loadedLinks).length > 0) {
          setCellLinks(loadedLinks)
        }
        
        // Extract column widths if present
        if (metaObj.columnWidths && typeof metaObj.columnWidths === 'object') {
          setColumnWidths(metaObj.columnWidths)
        }
        
        // Store for Handsontable meta application
        pendingCellMetaRef.current = cellTypeMeta
        
        // Apply formatting immediately (only if there's actual data)
        if (Object.keys(cellFormats).length > 0) {
          setCellFormats(prev => {
            // Only update if different to prevent unnecessary re-renders
            if (JSON.stringify(prev) !== JSON.stringify(cellFormats)) {
              return cellFormats
            }
            return prev
          })
        }
        if (Object.keys(cellStyles).length > 0) {
          setCellStyles(prev => {
            // Only update if different to prevent unnecessary re-renders
            if (JSON.stringify(prev) !== JSON.stringify(cellStyles)) {
              return cellStyles
            }
            return prev
          })
        }
        if (Object.keys(cellTypeMeta).length > 0) {
          setCellTypeMeta(prev => {
            // Only update if different to prevent unnecessary re-renders
            if (JSON.stringify(prev) !== JSON.stringify(cellTypeMeta)) {
              return cellTypeMeta
            }
            return prev
          })
        }
        // Load conditional formatting rules if present
        if (metaObj.conditionalFormatting && Array.isArray(metaObj.conditionalFormatting)) {
          try { setConditionalRules(metaObj.conditionalFormatting) } catch {}
        }
        // Load charts if present
        if (metaObj.charts && Array.isArray(metaObj.charts)) {
          try { setCharts(metaObj.charts) } catch {}
        }
      }
    } catch {
      // Invalid metadata, ignore
    }
  }
  
  return { parsed, metaObj }
}
