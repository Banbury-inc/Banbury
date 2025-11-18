export interface SheetData {
  name: string
  data: any[][]
  cellFormats: { [k: string]: { className?: string } }
  cellStyles: { [k: string]: React.CSSProperties }
  cellMeta: any
  conditionalRules?: any[]
  columnWidths?: { [k: string]: number }
  charts?: any[]
}

interface ExcelRichTextSegment {
  text?: string
}

interface ExcelFormulaValue {
  formula?: string
  sharedFormula?: string
  result?: unknown
  text?: unknown
  richText?: ExcelRichTextSegment[]
  hyperlink?: string
  address?: string
}

function normalizeExcelCellValue(value: unknown, depth = 0): string | number | boolean {
  if (value == null) return ''
  if (depth > 5) return ''
  if (value instanceof Date) return value.toISOString()
  const valueType = typeof value
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') return value as string | number | boolean
  if (Array.isArray(value)) {
    const normalized = value.map(item => normalizeExcelCellValue(item, depth + 1)).join('')
    return normalized
  }
  if (valueType === 'object') {
    const objectValue = value as ExcelFormulaValue
    if (objectValue.formula && typeof objectValue.formula === 'string') return `=${objectValue.formula}`
    if (objectValue.sharedFormula && typeof objectValue.sharedFormula === 'string') return `=${objectValue.sharedFormula}`
    if (Array.isArray(objectValue.richText)) {
      const richText = objectValue.richText.map(segment => (typeof segment?.text === 'string' ? segment.text : '')).join('')
      if (richText !== '') return richText
    }
    if (objectValue.text !== undefined) {
      const normalizedText = normalizeExcelCellValue(objectValue.text, depth + 1)
      if (normalizedText !== '') return normalizedText
    }
    if (objectValue.result !== undefined) {
      const normalizedResult = normalizeExcelCellValue(objectValue.result, depth + 1)
      if (normalizedResult !== '') return normalizedResult
    }
    if (typeof objectValue.hyperlink === 'string' && objectValue.hyperlink !== '') return objectValue.hyperlink
    if (typeof objectValue.address === 'string' && objectValue.address !== '') return objectValue.address
  }
  return ''
}

export interface CSVLoadHandlerParams {
  src: string
  srcBlob?: Blob
  fileName?: string
  onLoad?: () => void
  onError?: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setData: (data: any[][]) => void
  setCellFormats: (formats: { [k: string]: { className?: string } }) => void
  setCellStyles: (styles: { [k: string]: React.CSSProperties }) => void
  setCellLinks?: (links: { [k: string]: string }) => void
  pendingCellMetaRef: React.MutableRefObject<any>
  parseCSVWithMeta: (text: string) => { parsed: any[][] }
  setConditionalRulesFromLoad?: (rules: any[]) => void
  onSheetsLoaded?: (sheets: SheetData[], activeSheetIndex: number) => void
}

export function createCSVLoadHandler({
  src,
  srcBlob,
  fileName,
  onLoad,
  onError,
  setLoading,
  setError,
  setData,
  setCellFormats,
  setCellStyles,
  setCellLinks,
  pendingCellMetaRef,
  parseCSVWithMeta,
  setConditionalRulesFromLoad,
  onSheetsLoaded
}: CSVLoadHandlerParams) {
  return async function loadCSVContent() {
    try {
      setLoading(true)
      setError(null)

      let filePath = src
      
      // Remove file:// protocol if present
      if (filePath.startsWith('file://')) {
        filePath = filePath.replace('file://', '')
      }
      
      const parseXlsx = async (blob: Blob) => {
        console.log('parseXlsx: Starting to parse XLSX, blob size:', blob.size, 'type:', blob.type)
        const ExcelJSImport = await import('exceljs')
        const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport
        const wb = new ExcelJS.Workbook()
        const ab = await blob.arrayBuffer()
        console.log('parseXlsx: ArrayBuffer size:', ab.byteLength)
        
        // Check if this might be an error response instead of XLSX
        if (ab.byteLength < 1000) {
          const decoder = new TextDecoder()
          const text = decoder.decode(ab)
          console.log('parseXlsx: Small file, checking if it\'s text:', text.substring(0, 200))
          
          // Check if it's JSON error
          try {
            const json = JSON.parse(text)
            console.error('parseXlsx: Received JSON error response:', json)
            throw new Error(json.error || json.message || 'Server returned an error response instead of XLSX file')
          } catch (jsonError) {
            // Not JSON, might be HTML or plain text error
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              console.error('parseXlsx: Received HTML error page')
              throw new Error('Server returned an HTML error page instead of XLSX file')
            }
          }
        }
        
        await wb.xlsx.load(ab)
        
        // Parse all sheets
        const allSheets: SheetData[] = []
        
        for (let sheetIndex = 0; sheetIndex < wb.worksheets.length; sheetIndex++) {
          const ws = wb.worksheets[sheetIndex]
          
          // Skip hidden metadata sheet
          if (ws.name === '_banbury_meta') continue
          
          const maxRow = ws.actualRowCount || ws.rowCount || 0
          const maxCol = ws.actualColumnCount || (ws.columns ? ws.columns.length : 0) || 0
          const nextData: any[][] = []
          const nextMeta: {[k:string]: { type: 'dropdown' | 'checkbox'; source?: string[] }} = {}
          const nextFormats: {[k:string]: {className?: string}} = {}
          const nextStyles: {[k:string]: React.CSSProperties} = {}
          const colWidths: {[k:string]: number} = {}
          let loadedLinks: {[k:string]: string} = {}
          const argbToCss = (argb?: string) => {
            if (!argb) return undefined
            const hex = argb.replace(/^FF/i, '')
            if (hex.length === 6) return `#${hex}`
            if (hex.length === 8) return `#${hex.slice(2)}`
            return undefined
          }
          
          // Extract column widths
          ws.columns?.forEach((col: any, index: number) => {
            if (col.width) {
              colWidths[index.toString()] = col.width * 7 // Convert Excel units to approximate pixels
            }
          })
          
          for (let r = 1; r <= maxRow; r++) {
          const rowArr: any[] = []
          for (let c = 1; c <= maxCol; c++) {
            const cell = ws.getCell(r, c) as any
            const rawValue = cell.value
            const value = normalizeExcelCellValue(rawValue)
            const hyperlink = (cell.value && typeof cell.value === 'object' && cell.value.hyperlink)
              ? cell.value.hyperlink
              : (cell.hyperlink ? cell.hyperlink : null)

            if (hyperlink) {
              const linkKey = `${r-1}-${c-1}`
              const linkValue = typeof hyperlink === 'string' ? hyperlink : (hyperlink.text || hyperlink.address || hyperlink)
              if (linkValue) {
                loadedLinks[linkKey] = String(linkValue)
              }
            }
            const wasDate = rawValue instanceof Date
            if (typeof value === 'boolean') {
              nextMeta[`${r-1}-${c-1}`] = { type: 'checkbox' }
            }
            rowArr.push(value)

            const key = `${r-1}-${c-1}`
            const classes: string[] = []
            const styles: React.CSSProperties = {}
            const f = cell.font || {}
            if (f.bold) classes.push('ht-bold')
            if (f.italic) classes.push('ht-italic')
            if (f.underline) classes.push('ht-underline')
            if (f.size) styles.fontSize = `${f.size}px` as any
            if (f.color?.argb) styles.color = argbToCss(f.color.argb) as any
            const fill = cell.fill
            if (fill && fill.fgColor?.argb) styles.backgroundColor = argbToCss(fill.fgColor.argb) as any
            const align = cell.alignment || {}
            if (align.horizontal === 'left') classes.push('ht-align-left')
            if (align.horizontal === 'center') classes.push('ht-align-center')
            if (align.horizontal === 'right') classes.push('ht-align-right')
            const b = cell.border || {}
            const cssFor = (edge?: any) => edge ? `${edge.style === 'thick' ? '2px' : '1px'} ${edge.style === 'dashed' ? 'dashed' : 'solid'} ${argbToCss(edge.color?.argb) || '#000'}` : undefined
            if (b.top) styles.borderTop = cssFor(b.top) as any
            if (b.right) styles.borderRight = cssFor(b.right) as any
            if (b.bottom) styles.borderBottom = cssFor(b.bottom) as any
            if (b.left) styles.borderLeft = cssFor(b.left) as any
            // Capture dropdown data validation if present and literal list
            const dv = (cell as any).dataValidation
            if (dv && dv.type === 'list' && Array.isArray(dv.formulae) && typeof dv.formulae[0] === 'string') {
              const f = String(dv.formulae[0])
              const m = f.match(/^"([\s\S]*)"$/)
              if (m) {
                const options = m[1].split(',').map((s) => s.trim()).filter(Boolean)
                if (options.length > 0) nextMeta[key] = { type: 'dropdown', source: options }
              }
            }
            // Capture date formatting from Excel if present
            const numFmt: string | undefined = (cell as any).numFmt
            const looksLikeDateFmt = (fmt?: string) => {
              if (!fmt) return false
              const f = String(fmt).toLowerCase()
              // Enhanced check: contains date format patterns
              return f.includes('y') && (f.includes('m') || f.includes('mm')) && (f.includes('d') || f.includes('dd'))
            }
            
            // Check if this cell should be treated as a date
            if (wasDate || looksLikeDateFmt(numFmt)) {
              // Map Excel date formats to our format
              let dateFormat = 'MM/DD/YYYY' // Default
              if (numFmt) {
                const f = String(numFmt).toLowerCase()
                
                // Map common Excel date formats to our formats
                if (f.includes('mm/dd/yyyy') || f.includes('m/d/yyyy')) {
                  dateFormat = 'MM/DD/YYYY'
                } else if (f.includes('dd/mm/yyyy') || f.includes('d/m/yyyy')) {
                  dateFormat = 'DD/MM/YYYY'
                } else if (f.includes('yyyy-mm-dd') || f.includes('yyyy-m-d')) {
                  dateFormat = 'YYYY-MM-DD'
                } else if (f.includes('dd-mm-yyyy') || f.includes('d-m-yyyy')) {
                  dateFormat = 'DD-MM-YYYY'
                } else if (f.includes('mm-dd-yyyy') || f.includes('m-d-yyyy')) {
                  dateFormat = 'MM-DD-YYYY'
                }
              }
              nextMeta[key] = { ...(nextMeta[key] || {}), type: 'date', dateFormat } as any
            }
            if (classes.length) nextFormats[key] = { className: classes.join(' ') }
            if (Object.keys(styles).length) nextStyles[key] = styles
          }
            nextData.push(rowArr)
          }
          
          // Store this sheet's data
          allSheets.push({
            name: ws.name,
            data: nextData,
            cellFormats: nextFormats,
            cellStyles: nextStyles,
            cellMeta: nextMeta,
            columnWidths: colWidths,
            cellLinks: loadedLinks
          } as any)
          
          // Set links for the first sheet (active sheet)
          if (sheetIndex === 0 && setCellLinks && Object.keys(loadedLinks).length > 0) {
            setCellLinks(loadedLinks)
          }
        }
        
        // Load the first sheet (or all sheets if callback is provided)
        if (onSheetsLoaded && allSheets.length > 0) {
          onSheetsLoaded(allSheets, 0)
          // Also load the first sheet into the editor
          const firstSheet = allSheets[0]
          setData(firstSheet.data)
          setCellFormats(firstSheet.cellFormats)
          setCellStyles(firstSheet.cellStyles)
          if (setCellLinks && (firstSheet as any).cellLinks && Object.keys((firstSheet as any).cellLinks).length > 0) {
            setCellLinks((firstSheet as any).cellLinks)
          }
          if (Object.keys(firstSheet.cellMeta).length) {
            pendingCellMetaRef.current = firstSheet.cellMeta
          }
        } else if (allSheets.length > 0) {
          // Fallback to old behavior if no callback
          const firstSheet = allSheets[0]
          setData(firstSheet.data)
          setCellFormats(firstSheet.cellFormats)
          setCellStyles(firstSheet.cellStyles)
          if (setCellLinks && (firstSheet as any).cellLinks && Object.keys((firstSheet as any).cellLinks).length > 0) {
            setCellLinks((firstSheet as any).cellLinks)
          }
          if (Object.keys(firstSheet.cellMeta).length) {
            pendingCellMetaRef.current = firstSheet.cellMeta
          }
        }
        // Load conditional formatting and charts metadata from hidden sheet, if present
        try {
          const metaSheet = wb.getWorksheet('_banbury_meta') as any
          const key = metaSheet?.getCell(1,1)?.value
          const payload = metaSheet?.getCell(2,1)?.value
          if (key === 'BANBURY_META_JSON' && typeof payload === 'string') {
            const parsed = JSON.parse(payload)
            if (Array.isArray(parsed?.conditionalFormatting)) {
              const event = new CustomEvent('spreadsheet-conditional-formatting-loaded', { detail: { rules: parsed.conditionalFormatting } })
              window.dispatchEvent(event)
            }
            if (Array.isArray(parsed?.charts)) {
              const event = new CustomEvent('spreadsheet-charts-loaded', { detail: { charts: parsed.charts } })
              window.dispatchEvent(event)
            }
          }
        } catch {}
      }

      const needsXlsx = async (name: string, blob?: Blob) => {
        console.log('needsXlsx: checking name:', name, 'blob type:', blob?.type)
        if (name.toLowerCase().endsWith('.xlsx')) {
          console.log('needsXlsx: true - file ends with .xlsx')
          return true
        }
        if (blob && /spreadsheetml|officedocument\.spreadsheetml\.sheet/i.test(blob.type)) {
          console.log('needsXlsx: true - blob type matches xlsx')
          return true
        }
        if (blob) {
          try {
            const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
            // XLSX is a ZIP: PK\x03\x04
            if (header.length >= 4 && header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) {
              console.log('needsXlsx: true - file header is ZIP/XLSX')
              return true
            }
          } catch (e) {
            console.log('needsXlsx: error checking header:', e)
          }
        }
        console.log('needsXlsx: false - not an xlsx file')
        return false
      }

      if (srcBlob) {
        const isXlsx = await needsXlsx(fileName || '', srcBlob)
        console.log('handle-csv-load: srcBlob provided, isXlsx:', isXlsx, 'fileName:', fileName)
        if (isXlsx) {
          await parseXlsx(srcBlob)
        } else {
          const text = await srcBlob.text()
          const { parsed } = parseCSVWithMeta(text)
          setData(parsed)
        }
      } else if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
        const response = await fetch(filePath)
        const blob = await response.blob()
        if (await needsXlsx(fileName || filePath, blob)) {
          await parseXlsx(blob)
        } else {
          const text = await blob.text()
          const { parsed } = parseCSVWithMeta(text)
          setData(parsed)
        }
      } else {
        const response = await fetch(filePath)
        const contentType = response.headers.get('Content-Type') || ''
        if (/spreadsheetml|officedocument\.spreadsheetml\.sheet/i.test(contentType) || (fileName || filePath).toLowerCase().endsWith('.xlsx')) {
          const blob = await response.blob()
          await parseXlsx(blob)
        } else {
          const text = await response.text()
          const { parsed } = parseCSVWithMeta(text)
          setData(parsed)
        }
      }
      
      onLoad?.()
    } catch (err) {
      console.error('CSV Load Error:', err)
      const errorMessage = `Failed to load CSV: ${err instanceof Error ? err.message : 'Unable to parse CSV file'}`
      setError(errorMessage)
      // Keep default data on error
      onError?.()
    } finally {
      setLoading(false)
    }
  }
}
