import { ApiService } from '../../../../../backend/api/apiService';
import { FileSystemItem } from '../../../../utils/fileTreeUtils';
import type { SheetData } from './handle-csv-load';

interface SaveSpreadsheetParams {
  currentFile: FileSystemItem;
  latestData: any[][];
  onSaveComplete?: () => void;
  toast: (options: {
    title: string;
    description: string;
    variant: 'success' | 'destructive' | 'error';
  }) => void;
  setError: (error: string | null) => void;
  documentUrl: string | null;
  cellFormats?: {[key: string]: {className?: string}};
  cellStyles?: {[key: string]: React.CSSProperties};
  cellTypeMeta?: {[key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string }};
  columnWidths?: {[key: string]: number};
  conditionalFormatting?: any[];
  charts?: any[];
  cellLinks?: {[key: string]: string};
  allSheets?: SheetData[];
  activeSheetIndex?: number;
}

// Convert table data to XLSX blob using ExcelJS with formatting
export async function convertToXLSX(
  data: any[][], 
  cellFormats?: {[key: string]: {className?: string}}, 
  cellStyles?: {[key: string]: React.CSSProperties},
  cellTypeMeta?: {[key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string }},
  columnWidths?: {[key: string]: number},
  conditionalFormatting?: any[],
  charts?: any[],
  cellLinks?: {[key: string]: string}
): Promise<Blob> {
  const ExcelJSImport = await import('exceljs');
  const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  // Helper function to convert CSS color to ARGB
  const cssToArgb = (cssColor: string): string => {
    if (cssColor.startsWith('#')) {
      const hex = cssColor.slice(1);
      if (hex.length === 6) {
        return `FF${hex.toUpperCase()}`;
      }
    }
    // Handle named colors - basic mapping
    const colorMap: {[key: string]: string} = {
      'black': 'FF000000',
      'white': 'FFFFFFFF',
      'red': 'FFFF0000',
      'blue': 'FF0000FF',
      'green': 'FF00FF00',
      'yellow': 'FFFFFF00',
    };
    return colorMap[cssColor.toLowerCase()] || 'FF000000';
  };
  
  // Add the data to the worksheet with formatting
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1);
      // Preserve formulas on save: if cell is a string starting with '=', write as Excel formula
      if (typeof cell === 'string' && cell.startsWith('=')) {
        excelCell.value = { formula: cell.slice(1) } as any
      } else {
        excelCell.value = cell ?? ''
      }
      
      const cellKey = `${rowIndex}-${colIndex}`;
      const formats = cellFormats?.[cellKey];
      const styles = cellStyles?.[cellKey];
      const typeMeta = cellTypeMeta?.[cellKey];
      const link = cellLinks?.[cellKey];
      
      // Apply text formatting
      if (formats?.className) {
        const classes = formats.className.split(' ');
        const font: any = {};
        
        if (classes.includes('ht-bold')) font.bold = true;
        if (classes.includes('ht-italic')) font.italic = true;
        if (classes.includes('ht-underline')) font.underline = true;
        
        if (Object.keys(font).length > 0) {
          excelCell.font = font;
        }
        
        // Apply alignment
        const alignment: any = {};
        if (classes.includes('ht-align-left')) alignment.horizontal = 'left';
        if (classes.includes('ht-align-center')) alignment.horizontal = 'center';
        if (classes.includes('ht-align-right')) alignment.horizontal = 'right';
        
        if (Object.keys(alignment).length > 0) {
          excelCell.alignment = alignment;
        }
      }
      
      // Apply direct styles
      if (styles) {
        const font: any = excelCell.font || {};
        const fill: any = {};
        const border: any = {};
        
        // Font color
        if (styles.color) {
          font.color = { argb: cssToArgb(styles.color as string) };
        }
        
        // Font size
        if (styles.fontSize) {
          const size = parseInt(String(styles.fontSize).replace('px', ''));
          if (!isNaN(size)) font.size = size;
        }
        
        // Background color
        if (styles.backgroundColor) {
          fill.type = 'pattern';
          fill.pattern = 'solid';
          fill.fgColor = { argb: cssToArgb(styles.backgroundColor as string) };
        }
        
        // Borders
        if (styles.borderTop) border.top = { style: 'thin', color: { argb: 'FF000000' } };
        if (styles.borderRight) border.right = { style: 'thin', color: { argb: 'FF000000' } };
        if (styles.borderBottom) border.bottom = { style: 'thin', color: { argb: 'FF000000' } };
        if (styles.borderLeft) border.left = { style: 'thin', color: { argb: 'FF000000' } };
        
        if (Object.keys(font).length > 0) excelCell.font = font;
        if (Object.keys(fill).length > 0) excelCell.fill = fill;
        if (Object.keys(border).length > 0) excelCell.border = border;
      }
      
      // Apply data validation for dropdowns
      if (typeMeta?.type === 'dropdown' && typeMeta.source && Array.isArray(typeMeta.source)) {
        excelCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${typeMeta.source.join(',')}"`]
        };
      }
      
      // Apply numeric formatting
      if (typeMeta?.type === 'numeric' && typeMeta.numericFormat?.pattern) {
        excelCell.numFmt = typeMeta.numericFormat.pattern;
      }
      
      // Apply date formatting
      if (typeMeta?.type === 'date' && typeMeta.dateFormat) {
        // Convert our date format to Excel date format
        let excelDateFormat = typeMeta.dateFormat;
        
        // Map our formats to proper Excel formats
        const formatMap: {[key: string]: string} = {
          'MM/DD/YYYY': 'mm/dd/yyyy',
          'DD/MM/YYYY': 'dd/mm/yyyy', 
          'YYYY-MM-DD': 'yyyy-mm-dd',
          'DD-MM-YYYY': 'dd-mm-yyyy',
          'MM-DD-YYYY': 'mm-dd-yyyy'
        };
        
        excelDateFormat = formatMap[typeMeta.dateFormat] || 'mm/dd/yyyy';
        excelCell.numFmt = excelDateFormat;
      }
      
      // Apply hyperlink
      if (link) {
        excelCell.value = {
          text: excelCell.value || link,
          hyperlink: link
        } as any;
        excelCell.font = { ...(excelCell.font || {}), underline: true, color: { argb: 'FF0000FF' } };
      }
    });
  });
  
  // Apply saved column widths or auto-fit columns
  worksheet.columns.forEach((column: any, index: number) => {
    if (columnWidths && columnWidths[index.toString()]) {
      // Use saved column width (convert from pixels to Excel units)
      column.width = columnWidths[index.toString()] / 7; // Approximate conversion from pixels to Excel units
    } else {
      // Auto-fit columns if no saved width
      let maxLength = 0;
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: false }, (cell: any) => {
          const columnLength = cell.value ? String(cell.value).length : 0;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50); // Set max width to 50
      }
    }
  });
  
  // Generate XLSX buffer and return as blob
  // Persist conditional formatting rules and charts in a hidden metadata sheet for round-trip
  if ((conditionalFormatting && Array.isArray(conditionalFormatting)) || (charts && Array.isArray(charts))) {
    try {
      const metaSheet = workbook.addWorksheet('_banbury_meta', { state: 'veryHidden' } as any)
      metaSheet.getCell(1,1).value = 'BANBURY_META_JSON'
      const metadata: any = {}
      if (conditionalFormatting && Array.isArray(conditionalFormatting)) {
        metadata.conditionalFormatting = conditionalFormatting
      }
      if (charts && Array.isArray(charts)) {
        metadata.charts = charts
      }
      metaSheet.getCell(2,1).value = JSON.stringify(metadata)
    } catch {}
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// Convert multiple sheets to XLSX blob
export async function convertMultiSheetToXLSX(sheets: SheetData[]): Promise<Blob> {
  const ExcelJSImport = await import('exceljs');
  const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport;
  
  const workbook = new ExcelJS.Workbook();
  
  // Helper function to convert CSS color to ARGB
  const cssToArgb = (cssColor: string): string => {
    if (cssColor.startsWith('#')) {
      const hex = cssColor.slice(1);
      if (hex.length === 6) {
        return `FF${hex.toUpperCase()}`;
      }
    }
    const colorMap: {[key: string]: string} = {
      'black': 'FF000000',
      'white': 'FFFFFFFF',
      'red': 'FFFF0000',
      'blue': 'FF0000FF',
      'green': 'FF00FF00',
      'yellow': 'FFFFFF00',
    };
    return colorMap[cssColor.toLowerCase()] || 'FF000000';
  };
  
  // Process each sheet
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    
    // Add the data to the worksheet with formatting
    sheet.data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1);
        // Preserve formulas
        if (typeof cell === 'string' && cell.startsWith('=')) {
          excelCell.value = { formula: cell.slice(1) } as any
        } else {
          excelCell.value = cell ?? ''
        }
        
        const cellKey = `${rowIndex}-${colIndex}`;
        const formats = sheet.cellFormats[cellKey];
        const styles = sheet.cellStyles[cellKey];
        const typeMeta = sheet.cellMeta[cellKey];
        
        // Apply text formatting
        if (formats?.className) {
          const classes = formats.className.split(' ');
          const font: any = {};
          
          if (classes.includes('ht-bold')) font.bold = true;
          if (classes.includes('ht-italic')) font.italic = true;
          if (classes.includes('ht-underline')) font.underline = true;
          
          if (Object.keys(font).length > 0) {
            excelCell.font = font;
          }
          
          // Apply alignment
          const alignment: any = {};
          if (classes.includes('ht-align-left')) alignment.horizontal = 'left';
          if (classes.includes('ht-align-center')) alignment.horizontal = 'center';
          if (classes.includes('ht-align-right')) alignment.horizontal = 'right';
          
          if (Object.keys(alignment).length > 0) {
            excelCell.alignment = alignment;
          }
        }
        
        // Apply direct styles
        if (styles) {
          const font: any = excelCell.font || {};
          const fill: any = {};
          const border: any = {};
          
          if (styles.color) {
            font.color = { argb: cssToArgb(styles.color as string) };
          }
          
          if (styles.fontSize) {
            const size = parseInt(String(styles.fontSize).replace('px', ''));
            if (!isNaN(size)) font.size = size;
          }
          
          if (styles.backgroundColor) {
            fill.type = 'pattern';
            fill.pattern = 'solid';
            fill.fgColor = { argb: cssToArgb(styles.backgroundColor as string) };
          }
          
          if (styles.borderTop) border.top = { style: 'thin', color: { argb: 'FF000000' } };
          if (styles.borderRight) border.right = { style: 'thin', color: { argb: 'FF000000' } };
          if (styles.borderBottom) border.bottom = { style: 'thin', color: { argb: 'FF000000' } };
          if (styles.borderLeft) border.left = { style: 'thin', color: { argb: 'FF000000' } };
          
          if (Object.keys(font).length > 0) excelCell.font = font;
          if (Object.keys(fill).length > 0) excelCell.fill = fill;
          if (Object.keys(border).length > 0) excelCell.border = border;
        }
        
        // Apply data validation for dropdowns
        if (typeMeta?.type === 'dropdown' && typeMeta.source && Array.isArray(typeMeta.source)) {
          excelCell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${typeMeta.source.join(',')}"`]
          };
        }
        
        // Apply numeric formatting
        if (typeMeta?.type === 'numeric' && typeMeta.numericFormat?.pattern) {
          excelCell.numFmt = typeMeta.numericFormat.pattern;
        }
        
        // Apply date formatting
        if (typeMeta?.type === 'date' && typeMeta.dateFormat) {
          const formatMap: {[key: string]: string} = {
            'MM/DD/YYYY': 'mm/dd/yyyy',
            'DD/MM/YYYY': 'dd/mm/yyyy', 
            'YYYY-MM-DD': 'yyyy-mm-dd',
            'DD-MM-YYYY': 'dd-mm-yyyy',
            'MM-DD-YYYY': 'mm-dd-yyyy'
          };
          
          const excelDateFormat = formatMap[typeMeta.dateFormat] || 'mm/dd/yyyy';
          excelCell.numFmt = excelDateFormat;
        }
      });
    });
    
    // Apply column widths
    if (sheet.columnWidths) {
      worksheet.columns?.forEach((column: any, index: number) => {
        if (sheet.columnWidths && sheet.columnWidths[index.toString()]) {
          column.width = sheet.columnWidths[index.toString()] / 7;
        } else {
          // Auto-fit columns if no saved width
          let maxLength = 0;
          if (column && column.eachCell) {
            column.eachCell({ includeEmpty: false }, (cell: any) => {
              const columnLength = cell.value ? String(cell.value).length : 0;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            column.width = Math.min(maxLength + 2, 50);
          }
        }
      });
    }
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

export async function handleSpreadsheetSave({
  currentFile,
  latestData,
  onSaveComplete,
  toast,
  setError,
  documentUrl,
  cellFormats,
  cellStyles,
  cellTypeMeta,
  columnWidths,
  conditionalFormatting,
  cellLinks,
  allSheets,
  activeSheetIndex
}: SaveSpreadsheetParams): Promise<void> {
  if (!currentFile.file_id) return;
  if (!latestData || latestData.length === 0) return;
  
  try {
    // Check if this is a Google Drive file
    const isDriveFile = currentFile.path?.startsWith('drive://');
    const isGoogleSheet = currentFile.mimeType?.includes('vnd.google-apps.spreadsheet');
    
    // Clean up the current blob URL before saving
    if (documentUrl && documentUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(documentUrl);
    }
    
    // Create XLSX blob - use multi-sheet if available, otherwise single sheet
    let xlsxBlob: Blob;
    if (allSheets && allSheets.length > 0) {
      // Update current sheet data in allSheets before saving
      const updatedSheets = [...allSheets];
      if (activeSheetIndex !== undefined && updatedSheets[activeSheetIndex]) {
        updatedSheets[activeSheetIndex] = {
          ...updatedSheets[activeSheetIndex],
          data: latestData,
          cellFormats: cellFormats || {},
          cellStyles: cellStyles || {},
          cellMeta: cellTypeMeta || {},
          conditionalRules: conditionalFormatting || [],
          columnWidths: columnWidths || {}
        };
      }
      xlsxBlob = await convertMultiSheetToXLSX(updatedSheets);
    } else {
      xlsxBlob = await convertToXLSX(latestData, cellFormats, cellStyles, cellTypeMeta, columnWidths, conditionalFormatting, undefined, cellLinks);
    }
    
    // Ensure the filename has .xlsx extension
    let fileName = currentFile.name;
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      // Replace existing extension or add .xlsx
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        fileName = fileName.substring(0, lastDotIndex) + '.xlsx';
      } else {
        fileName = fileName + '.xlsx';
      }
    }
    
    // Save to Google Drive or S3 depending on file type
    if (isDriveFile && isGoogleSheet) {
      await ApiService.Drive.updateFile(
        currentFile.file_id,
        xlsxBlob,
        fileName
      );
      
      // Call the save complete callback to refresh the sidebar
      onSaveComplete?.();
      // Show success toast
      toast({
        title: "Spreadsheet saved to Google Drive",
        description: "Your Google Sheet has been updated successfully.",
        variant: "success",
      });
    } else {
      // Use updateS3File endpoint to update the file content
      const updateResult = await ApiService.Files.updateS3File(
        currentFile.file_id,
        xlsxBlob,
        fileName
      );
      
      if (updateResult.success) {
        // Call the save complete callback to refresh the sidebar
        onSaveComplete?.();
        // Show success toast
        toast({
          title: "Spreadsheet saved successfully",
          description: "Your spreadsheet has been saved.",
          variant: "success",
        });
      } else {
        throw new Error('Update failed');
      }
    }
    
  } catch (err) {
    console.error('Save error:', err);
    setError('Failed to save spreadsheet');
    // Show error toast notification
    toast({
      title: "Failed to save spreadsheet",
      description: "There was an error saving your spreadsheet. Please try again.",
      variant: "error",
    });
    throw err;
  }
}
