// Helper function to parse CSV content  
function parseCSV(content: string): any[][] {
  if (!content || content.trim() === '') {
    return [
      ['Name', 'Email', 'Phone', 'Department'],
      ['', '', '', '']
    ];
  }

  // Check for metadata header
  let csvContent = content;
  let metaObj: any = {};
  
  if (content.startsWith('##BANBURY_META=')) {
    const lines = content.split('\n');
    const metaLine = lines[0];
    csvContent = lines.slice(1).join('\n');
    
    try {
      const encoded = metaLine.replace('##BANBURY_META=', '');
      const decoded = atob(encoded);
      metaObj = JSON.parse(decoded);
    } catch {
      // Invalid metadata, ignore
    }
  }

  const lines = csvContent.trim().split('\n');
  const parsed: any[][] = [];
  
  for (const line of lines) {
    const row: any[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    row.push(current);
    parsed.push(row);
  }
  
  // Ensure minimum structure
  if (parsed.length === 0) {
    return [
      ['Name', 'Email', 'Phone', 'Department'],
      ['', '', '', '']
    ];
  }
  
  return parsed;
}

// Helper function to convert data back to CSV
function convertToCSV(data: any[][]): string {
  return data.map(row => 
    row.map(cell => {
      const value = String(cell || '');
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');
}

// Convert to CSV with metadata header for all formatting and types
function convertToCSVWithMeta(
  data: any[][], 
  hotTableRef: React.RefObject<any>, 
  cellTypeMeta: { [key: string]: any },
  cellFormats?: {[key: string]: {className?: string}},
  cellStyles?: {[key: string]: React.CSSProperties},
  columnWidths?: {[key: string]: number},
  conditionalFormatting?: any[],
  charts?: any[],
  cellLinks?: {[key: string]: string}
): string {
  const hotInstance = hotTableRef.current?.hotInstance;
  const cellsMeta: Record<string, any> = {};
  
  if (hotInstance) {
    const numRows = data.length;
    const numCols = Math.max(0, ...data.map(r => r.length));
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        try {
          const cellKey = `${r}-${c}`;
          const meta = hotInstance.getCellMeta(r, c) || {};
          const cellMeta: any = {};
          
          // Cell type metadata
          if (meta.type === 'checkbox') {
            cellMeta.type = 'checkbox';
          } else if (meta.type === 'dropdown' && Array.isArray(meta.source) && meta.source.length > 0) {
            cellMeta.type = 'dropdown';
            cellMeta.source = meta.source;
          } else if (meta.type === 'numeric' && meta.numericFormat) {
            const pattern = meta.numericFormat.pattern;
            const culture = meta.numericFormat.culture;
            cellMeta.type = 'numeric';
            cellMeta.numericFormat = { ...(pattern ? { pattern } : {}), ...(culture ? { culture } : {}) };
          } else if (meta.type === 'date') {
            const dateFormat = meta.dateFormat || 'MM/DD/YYYY';
            cellMeta.type = 'date';
            cellMeta.dateFormat = dateFormat;
          }
          
          // Cell formatting metadata
          const formats = cellFormats?.[cellKey];
          const styles = cellStyles?.[cellKey];
          
          if (formats?.className) {
            cellMeta.className = formats.className;
          }
          
          if (styles && Object.keys(styles).length > 0) {
            cellMeta.styles = styles;
          }
          
          // Add link metadata
          const link = cellLinks?.[cellKey];
          if (link) {
            cellMeta.link = link;
          }
          
          // Only add to meta if there's actual data
          if (Object.keys(cellMeta).length > 0) {
            cellsMeta[cellKey] = cellMeta;
          }
        } catch {}
      }
    }
  }
  
  // Merge in any locally tracked type meta to ensure persistence even if Handsontable meta gets reset on navigation
  Object.entries(cellTypeMeta).forEach(([key, m]) => {
    cellsMeta[key] = { ...(cellsMeta[key] || {}), ...m };
  });
  
  // Merge in cell formats and styles
  if (cellFormats) {
    Object.entries(cellFormats).forEach(([key, formats]) => {
      if (formats.className) {
        cellsMeta[key] = { ...(cellsMeta[key] || {}), className: formats.className };
      }
    });
  }
  
  if (cellStyles) {
    Object.entries(cellStyles).forEach(([key, styles]) => {
      if (styles && Object.keys(styles).length > 0) {
        cellsMeta[key] = { ...(cellsMeta[key] || {}), styles };
      }
    });
  }
  
  if (cellLinks) {
    Object.entries(cellLinks).forEach(([key, link]) => {
      if (link) {
        cellsMeta[key] = { ...(cellsMeta[key] || {}), link };
      }
    });
  }
  
  const baseCsv = convertToCSV(data);
  
  // Create metadata object with cells and column widths
  const metaObj: any = {};
  if (Object.keys(cellsMeta).length > 0) {
    metaObj.cells = cellsMeta;
  }
  if (columnWidths && Object.keys(columnWidths).length > 0) {
    metaObj.columnWidths = columnWidths;
  }
  if (conditionalFormatting && Array.isArray(conditionalFormatting) && conditionalFormatting.length > 0) {
    metaObj.conditionalFormatting = conditionalFormatting;
  }
  if (charts && Array.isArray(charts) && charts.length > 0) {
    metaObj.charts = charts;
  }
  
  // Only add metadata header if there's actual metadata
  if (Object.keys(metaObj).length === 0) return baseCsv;
  
  const encoded = btoa(JSON.stringify(metaObj));
  return `##BANBURY_META=${encoded}\n` + baseCsv;
}

export { parseCSV, convertToCSV, convertToCSVWithMeta };
