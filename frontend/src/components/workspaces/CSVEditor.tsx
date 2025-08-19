import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer, registerRenderer } from 'handsontable/renderers';
import 'handsontable/dist/handsontable.full.css';
import {
  Add,
  ViewColumn,
  Undo,
  Redo,
  ContentCut,
  ContentCopy,
  ContentPaste,
  Delete,
  SelectAll,
  Clear,
  FilterList,
  Search,
  GetApp,
  CallSplit,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  ColorLens,
  BorderAll,
  FormatSize,
  AttachMoney,
  CalendarToday,
  Percent,
  Tag,
  Numbers,
  KeyboardArrowDown,
  Remove,
  TextFormat,
  BorderTop,
  BorderRight,
  BorderBottom,
  BorderLeft,
  Save,
  Download,
  MoreVert,
} from '@mui/icons-material';
import { Box, Typography, Alert, CircularProgress, Button, Toolbar, IconButton, Divider, Menu, MenuItem, TextField } from '@mui/material';
// Register all Handsontable modules
registerAllModules();

// Handsontable merge-cells icon as SVG component
const MergeCellsIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: sx?.fontSize || 16,
      height: sx?.fontSize || 16,
      fill: 'currentColor',
      ...sx
    }}
  >
    <path d="M3.1,9h1.8C4.955,9,5,8.955,5,8.9V6.1C5,6.045,5.045,6,5.1,6h5.8C10.955,6,11,5.955,11,5.9V4.1C11,4.045,10.955,4,10.9,4H3.1C3.045,4,3,4.045,3,4.1v4.8C3,8.955,3.045,9,3.1,9z M13,4.1v1.8C13,5.955,13.045,6,13.1,6h5.8C18.955,6,19,6.045,19,6.1v2.8C19,8.955,19.045,9,19.1,9h1.8C20.955,9,21,8.955,21,8.9V4.1C21,4.045,20.955,4,20.9,4h-7.8C13.045,4,13,4.045,13,4.1z M18.9,18h-5.8c-0.055,0-0.1,0.045-0.1,0.1v1.8c0,0.055,0.045,0.1,0.1,0.1h7.8c0.055,0,0.1-0.045,0.1-0.1v-4.8c0-0.055-0.045-0.1-0.1-0.1h-1.8c-0.055,0-0.1,0.045-0.1,0.1v2.8C19,17.955,18.955,18,18.9,18z M4.9,15H3.1C3.045,15,3,15.045,3,15.1v4.8C3,19.955,3.045,20,3.1,20h7.8c0.055,0,0.1-0.045,0.1-0.1v-1.8c0-0.055-0.045-0.1-0.1-0.1H5.1C5.045,18,5,17.955,5,17.9v-2.8C5,15.045,4.955,15,4.9,15z M6.9,11H3.1C3.045,11,3,11.045,3,11.1v1.8C3,12.955,3.045,13,3.1,13h3.8C6.955,13,7,13.045,7,13.1v2.659c0,0.089,0.108,0.134,0.171,0.071l3.759-3.759c0.039-0.039,0.039-0.102,0-0.141L7.171,8.171C7.108,8.108,7,8.152,7,8.241V10.9C7,10.955,6.955,11,6.9,11z M16.829,8.171l-3.759,3.759c-0.039,0.039-0.039,0.102,0,0.141l3.759,3.759C16.892,15.892,17,15.848,17,15.759V13.1c0-0.055,0.045-0.1,0.1-0.1h3.8c0.055,0,0.1-0.045,0.1-0.1v-1.8c0-0.055-0.045-0.1-0.1-0.1h-3.8c-0.055,0-0.1-0.045-0.1-0.1V8.241C17,8.152,16.892,8.108,16.829,8.171z"/>
  </svg>
);

// Handsontable fill-color icon as SVG component
const FillColorIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: sx?.fontSize || 16,
      height: sx?.fontSize || 16,
      fill: 'currentColor',
      ...sx
    }}
  >
    <path d="M17.54,14.032c-0.019-0.023-0.047-0.036-0.077-0.036L6.582,14l-0.457-0.457l7.462-6.396c0.042-0.036,0.047-0.099,0.011-0.141l-2.953-3.429c-0.036-0.042-0.099-0.047-0.141-0.011L9.496,4.434C9.454,4.47,9.45,4.533,9.486,4.575l1.953,2.267c0.036,0.042,0.031,0.105-0.011,0.141l-7.47,6.404c-0.044,0.038-0.047,0.105-0.006,0.147l7.437,7.437c0.037,0.037,0.095,0.039,0.135,0.006l6.89-5.741c0.042-0.035,0.048-0.098,0.013-0.141L17.54,14.032z M19.5,17.309c-0.206-0.412-0.793-0.412-0.999,0c0,0-1.506,3.186,0.5,3.186S19.5,17.309,19.5,17.309z"/>
  </svg>
);

// Handsontable text-color icon as SVG component
const TextColorIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: sx?.fontSize || 16,
      height: sx?.fontSize || 16,
      fill: 'currentColor',
      ...sx
    }}
  >
    <path d="M9.763,13.407L9.05,15.68c-0.013,0.042-0.052,0.07-0.095,0.07h-2.72c-0.069,0-0.117-0.068-0.094-0.133l4.125-11.81c0.014-0.04,0.052-0.067,0.094-0.067h3.223c0.044,0,0.082,0.028,0.095,0.07l3.753,11.81c0.02,0.064-0.028,0.13-0.095,0.13h-2.847c-0.045,0-0.085-0.03-0.097-0.074l-0.609-2.265c-0.012-0.044-0.051-0.074-0.097-0.074H9.859C9.815,13.337,9.776,13.366,9.763,13.407z M11.807,6.754l-1.315,4.239c-0.02,0.064,0.028,0.13,0.096,0.13h2.453c0.066,0,0.114-0.062,0.097-0.126l-1.137-4.239C11.973,6.661,11.836,6.658,11.807,6.754z"/>
    <path d="M20.9,21H3.1C3.045,21,3,20.955,3,20.9v-2.8C3,18.045,3.045,18,3.1,18h17.8c0.055,0,0.1,0.045,0.1,0.1v2.8C21,20.955,20.955,21,20.9,21z"/>
  </svg>
);


interface CSVEditorProps {
  src: string;
  fileName?: string;
  srcBlob?: Blob;
  onError?: () => void;
  onLoad?: () => void;
  onSave?: (content: string) => void;
  onSaveXlsx?: (blob: Blob, fileName: string) => void;
  onContentChange?: (data: any[][]) => void;
  onSaveDocument?: () => void;
  onDownloadDocument?: () => void;
  saving?: boolean;
  canSave?: boolean;
}

const CSVEditor: React.FC<CSVEditorProps> = ({
  src,
  fileName,
  srcBlob,
  onError,
  onLoad,
  onSave,
  onSaveXlsx,
  onContentChange,
  onSaveDocument,
  onDownloadDocument,
  saving = false,
  canSave = false,
}) => {
  const [data, setData] = useState<any[][]>([
    ['Name', 'Email', 'Phone', 'Department'],
    ['John Doe', 'john@example.com', '555-0101', 'Engineering'],
    ['Jane Smith', 'jane@example.com', '555-0102', 'Marketing'],
    ['', '', '', '']
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);
  const [alignmentAnchorEl, setAlignmentAnchorEl] = useState<null | HTMLElement>(null);
  const [fontSize, setFontSize] = useState<number>(12);
  const hotTableRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<[number, number, number, number] | null>(null);

  // Helper function to parse CSV content
  const parseCSV = (csvContent: string): any[][] => {
    if (!csvContent.trim()) {
      return [
        ['Name', 'Email', 'Phone', 'Department'],
        ['John Doe', 'john@example.com', '555-0101', 'Engineering'],
        ['Jane Smith', 'jane@example.com', '555-0102', 'Marketing'],
        ['', '', '', '']
      ];
    }
    
    const lines = csvContent.split('\n');
    const parsed = lines.map(line => 
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')) // Remove quotes
    ).filter(row => row.some(cell => cell !== '')); // Remove empty rows
    
    // Ensure we have at least some data
    if (parsed.length === 0) {
      return [
        ['Name', 'Email', 'Phone', 'Department'],
        ['', '', '', '']
      ];
    }
    
    return parsed;
  };

  // Helper function to convert data back to CSV
  const convertToCSV = (data: any[][]): string => {
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
  };

  // Load CSV/XLSX content (only when src changes)
  useEffect(() => {
    if (!src && !srcBlob) {
      setLoading(false);
      return;
    }

    const loadCSVContent = async () => {
      try {
        setLoading(true);
        setError(null);

        let filePath = src;
        
        // Remove file:// protocol if present
        if (filePath.startsWith('file://')) {
          filePath = filePath.replace('file://', '');
        }
        
        const parseXlsx = async (blob: Blob) => {
          const ExcelJSImport = await import('exceljs');
          const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport;
          const wb = new ExcelJS.Workbook();
          const ab = await blob.arrayBuffer();
          await wb.xlsx.load(ab);
          const ws = wb.worksheets[0];
          const maxRow = ws.actualRowCount || ws.rowCount || 0;
          const maxCol = ws.actualColumnCount || (ws.columns ? ws.columns.length : 0) || 0;
          const nextData: any[][] = [];
          const nextFormats: {[k:string]: {className?: string}} = {};
          const nextStyles: {[k:string]: React.CSSProperties} = {};
          const argbToCss = (argb?: string) => {
            if (!argb) return undefined;
            const hex = argb.replace(/^FF/i, '');
            if (hex.length === 6) return `#${hex}`;
            if (hex.length === 8) return `#${hex.slice(2)}`;
            return undefined;
          };
          for (let r = 1; r <= maxRow; r++) {
            const rowArr: any[] = [];
            for (let c = 1; c <= maxCol; c++) {
              const cell = ws.getCell(r, c) as any;
              let value: any = cell.value;
              if (value && typeof value === 'object') {
                if (value.text != null) value = value.text; else if (value.result != null) value = value.result; else if (value.richText) value = value.richText.map((t:any)=>t.text).join('');
              }
              if (value instanceof Date) value = value.toISOString();
              rowArr.push(value == null ? '' : value);

              const key = `${r-1}-${c-1}`;
              const classes: string[] = [];
              const styles: React.CSSProperties = {};
              const f = cell.font || {};
              if (f.bold) classes.push('ht-bold');
              if (f.italic) classes.push('ht-italic');
              if (f.underline) classes.push('ht-underline');
              if (f.size) styles.fontSize = `${f.size}px` as any;
              if (f.color?.argb) styles.color = argbToCss(f.color.argb) as any;
              const fill = cell.fill;
              if (fill && fill.fgColor?.argb) styles.backgroundColor = argbToCss(fill.fgColor.argb) as any;
              const align = cell.alignment || {};
              if (align.horizontal === 'left') classes.push('ht-align-left');
              if (align.horizontal === 'center') classes.push('ht-align-center');
              if (align.horizontal === 'right') classes.push('ht-align-right');
              const b = cell.border || {};
              const cssFor = (edge?: any) => edge ? `${edge.style === 'thick' ? '2px' : '1px'} ${edge.style === 'dashed' ? 'dashed' : 'solid'} ${argbToCss(edge.color?.argb) || '#000'}` : undefined;
              if (b.top) styles.borderTop = cssFor(b.top) as any;
              if (b.right) styles.borderRight = cssFor(b.right) as any;
              if (b.bottom) styles.borderBottom = cssFor(b.bottom) as any;
              if (b.left) styles.borderLeft = cssFor(b.left) as any;
              if (classes.length) nextFormats[key] = { className: classes.join(' ') };
              if (Object.keys(styles).length) nextStyles[key] = styles;
            }
            nextData.push(rowArr);
          }
          setData(nextData);
          setCellFormats(nextFormats);
          setCellStyles(nextStyles);
        };

        const needsXlsx = async (name: string, blob?: Blob) => {
          if (name.toLowerCase().endsWith('.xlsx')) return true;
          if (blob && /spreadsheetml|officedocument\.spreadsheetml\.sheet/i.test(blob.type)) return true;
          if (blob) {
            try {
              const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
              // XLSX is a ZIP: PK\x03\x04
              if (header.length >= 4 && header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) {
                return true;
              }
            } catch {}
          }
          return false;
        };

        if (srcBlob) {
          if (await needsXlsx(fileName || '', srcBlob)) {
            await parseXlsx(srcBlob);
          } else {
            const text = await srcBlob.text();
            const parsedData = parseCSV(text);
            setData(parsedData);
          }
        } else if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
          const response = await fetch(filePath);
          const blob = await response.blob();
          if (await needsXlsx(fileName || filePath, blob)) {
            await parseXlsx(blob);
          } else {
            const text = await blob.text();
            const parsedData = parseCSV(text);
            setData(parsedData);
          }
        } else {
          const response = await fetch(filePath);
          const contentType = response.headers.get('Content-Type') || '';
          if (/spreadsheetml|officedocument\.spreadsheetml\.sheet/i.test(contentType) || (fileName || filePath).toLowerCase().endsWith('.xlsx')) {
            const blob = await response.blob();
            await parseXlsx(blob);
          } else {
            const text = await response.text();
            const parsedData = parseCSV(text);
            setData(parsedData);
          }
        }
        
        onLoad?.();
      } catch (err) {
        const errorMessage = `Failed to load CSV: ${err instanceof Error ? err.message : 'Unable to parse CSV file'}`;
        setError(errorMessage);
        // Keep default data on error
        onError?.();
      } finally {
        setLoading(false);
      }
    };

    loadCSVContent();
  }, [src, srcBlob]);

  // Calculate container height dynamically
  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = rect.height;
        if (availableHeight > 100) {
          setContainerHeight(availableHeight);
        } else {
          // Fallback: try to get parent height
          const parent = containerRef.current.parentElement;
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            const calculatedHeight = Math.max(400, parentRect.height - 100); // Account for toolbar
            setContainerHeight(calculatedHeight);
          }
        }
      }
    };

    // Initial calculation with a slight delay to ensure DOM is ready
    const initialTimer = setTimeout(calculateHeight, 100);

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateHeight, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for more accurate container size changes
    let resizeObserver: ResizeObserver;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(calculateHeight, 100);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Force HotTable refresh when height changes
  useEffect(() => {
    if (hotTableRef.current?.hotInstance && containerHeight > 100) {
      setTimeout(() => {
        hotTableRef.current.hotInstance.render();
      }, 50);
    }
  }, [containerHeight]);

  // Listen for AI spreadsheet responses and apply to table
  useEffect(() => {
    const handler = (event: any) => {
      const detail = event?.detail || {};
      const { operations, csvContent } = detail as {
        operations?: Array<
          | { type: 'setCell'; row: number; col: number; value: string | number }
          | { type: 'setRange'; range: { startRow: number; startCol: number; endRow: number; endCol: number }; values: (string | number)[][] }
          | { type: 'insertRows'; index: number; count?: number }
          | { type: 'deleteRows'; index: number; count?: number }
          | { type: 'insertCols'; index: number; count?: number }
          | { type: 'deleteCols'; index: number; count?: number }
        >;
        csvContent?: string;
      };

      const hot = hotTableRef.current?.hotInstance;
      if (!hot) return;

      try {
        if (csvContent && csvContent.trim().length > 0) {
          // Replace entire data with provided CSV
          const parsed = parseCSV(csvContent);
          hot.loadData(parsed);
          setData(parsed);
          onContentChange?.(parsed);
          setHasChanges(true);
          return;
        }

        if (operations && operations.length > 0) {
          // Apply operations
          operations.forEach((op) => {
            switch (op.type) {
              case 'setCell': {
                const { row, col, value } = op as any;
                if (row >= 0 && col >= 0) {
                  hot.setDataAtCell(row, col, value);
                }
                break;
              }
              case 'setRange': {
                const { range, values } = op as any;
                const { startRow, startCol, endRow, endCol } = range;
                let r = 0;
                for (let i = startRow; i <= endRow; i++) {
                  let c = 0;
                  for (let j = startCol; j <= endCol; j++) {
                    const v = values?.[r]?.[c];
                    if (v !== undefined) hot.setDataAtCell(i, j, v);
                    c++;
                  }
                  r++;
                }
                break;
              }
              case 'insertRows': {
                const { index, count = 1 } = op as any;
                hot.alter('insert_row', index, count);
                break;
              }
              case 'deleteRows': {
                const { index, count = 1 } = op as any;
                hot.alter('remove_row', index, count);
                break;
              }
              case 'insertCols': {
                const { index, count = 1 } = op as any;
                hot.alter('insert_col', index, count);
                break;
              }
              case 'deleteCols': {
                const { index, count = 1 } = op as any;
                hot.alter('remove_col', index, count);
                break;
              }
              default:
                break;
            }
          });

          // Sync internal state after operations
          const currentData = hot.getData();
          setData(currentData);
          onContentChange?.(currentData);
          setHasChanges(true);
        }
      } catch {
        // Fail silently to avoid breaking user session
      }
    };

    window.addEventListener('sheet-ai-response', handler as EventListener);
    return () => window.removeEventListener('sheet-ai-response', handler as EventListener);
  }, [onContentChange]);

  // Configure plugins after table initialization
  useEffect(() => {
    if (hotTableRef.current?.hotInstance) {
      const hotInstance = hotTableRef.current.hotInstance;
      
      // Enable plugins if they exist
      try {
        if (hotInstance.getPlugin) {
          const undoRedo = hotInstance.getPlugin('undoRedo');
          if (undoRedo && !undoRedo.isEnabled()) {
            undoRedo.enablePlugin();
          }
          
          const copyPaste = hotInstance.getPlugin('copyPaste');
          if (copyPaste && !copyPaste.isEnabled()) {
            copyPaste.enablePlugin();
          }
          
          const search = hotInstance.getPlugin('search');
          if (search && !search.isEnabled()) {
            search.enablePlugin();
          }
          
          const columnSorting = hotInstance.getPlugin('columnSorting');
          if (columnSorting && !columnSorting.isEnabled()) {
            columnSorting.enablePlugin();
          }
        }
      } catch (error) {
        // Silently handle plugin initialization errors
      }
    }
  }, [data]);

  const handleDataChange = useCallback((changes: any, source: string) => {
    // Ignore programmatic changes to prevent infinite loops
    if (source === 'loadData' || source === 'updateData' || !changes) return;
    

    setHasChanges(true);
    
    // Only update our state for user-initiated changes
    if (source === 'edit' || source === 'paste' || source === 'autofill' || source === 'cut') {
      // Get current data from Handsontable
      if (hotTableRef.current?.hotInstance) {
        const currentData = hotTableRef.current.hotInstance.getData();
        // Use a timeout to avoid immediate re-render conflicts
        setTimeout(() => {
          setData(currentData);
          onContentChange?.(currentData);
        }, 0);
      }
    }
  }, [onContentChange]);

  const handleSave = useCallback(() => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const exportFile = hotInstance.getPlugin('exportFile');
      if (exportFile && exportFile.isEnabled && exportFile.isEnabled()) {
        try {
          const csvContent = exportFile.exportAsString('csv', {
            bom: false,
            columnDelimiter: ',',
            columnHeaders: false,
            exportHiddenColumns: true,
            exportHiddenRows: true,
            fileExtension: 'csv',
            filename: (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'export') + '_[YYYY]-[MM]-[DD]',
            mimeType: 'text/csv',
            rowDelimiter: '\r\n',
            rowHeaders: true,
          });
          onSave?.(csvContent);
          setHasChanges(false);
          return;
        } catch {
          // Fallback below
        }
      }
    }
    // Fallback: manual CSV generation
    const csvContent = convertToCSV(data);
    onSave?.(csvContent);
    setHasChanges(false);
  }, [data, fileName, onSave]);

  // Spreadsheet actions
  const handleAddRow = () => {

    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.alter) {
      hotInstance.alter('insert_row_below');
      setHasChanges(true);
    }
  };

  const handleAddColumn = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.alter) {
      hotInstance.alter('insert_col_end');
      setHasChanges(true);
    }
  };

  // Undo/Redo functions - using documented API
  const handleUndo = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance && hotInstance.isUndoAvailable && hotInstance.isUndoAvailable()) {
      hotInstance.undo();
    }
  };

  const handleRedo = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance && hotInstance.isRedoAvailable && hotInstance.isRedoAvailable()) {
      hotInstance.redo();
    }
  };

  // Clipboard functions - using documented API
  const handleCut = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const copyPaste = hotInstance.getPlugin('copyPaste');
      if (copyPaste && copyPaste.isEnabled()) {
        copyPaste.cut();
        setHasChanges(true);
      }
    }
  };

  const handleCopy = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const copyPaste = hotInstance.getPlugin('copyPaste');
      if (copyPaste && copyPaste.isEnabled()) {
        copyPaste.copy();
      }
    }
  };

  const handlePaste = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const copyPaste = hotInstance.getPlugin('copyPaste');
      if (copyPaste && copyPaste.isEnabled()) {
        copyPaste.paste();
        setHasChanges(true);
      }
    }
  };

  // Clear selected cells - using documented API
  const handleClear = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      hotInstance.emptySelectedCells();
      setHasChanges(true);
    }
  };

  // Select all - using documented API
  const handleSelectAll = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      hotInstance.selectAll();
    }
  };

  // Search function - using documented API
  const handleSearch = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const search = hotInstance.getPlugin('search');
      if (search && search.isEnabled()) {
        const searchTerm = prompt('Enter search term:');
        if (searchTerm) {
          const results = search.query(searchTerm);
          if (results.length > 0) {
            hotInstance.selectCell(results[0].row, results[0].col);
          } else {
            alert('No matches found');
          }
        }
      }
    }
  };

  // Filter toggle - using documented API
  const handleToggleFilters = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const filters = hotInstance.getPlugin('filters');
      if (filters) {
        if (filters.isEnabled()) {
          filters.disablePlugin();
        } else {
          filters.enablePlugin();
        }
        hotInstance.render();
      }
    }
  };

  // Export to CSV - using documented API
  const handleExport = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const exportFile = hotInstance.getPlugin('exportFile');
      if (exportFile && exportFile.isEnabled()) {
        exportFile.downloadFile('csv', {
          filename: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'export',
        });
      } else {
        // Fallback: manual CSV export
        const data = hotInstance.getData();
        const csvContent = data.map((row: any[]) => 
          row.map((cell: any) => {
            const value = String(cell || '');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName ? fileName.replace(/\.[^/.]+$/, '.csv') : 'export.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Merge cells - using documented API
  const handleMergeCells = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const mergeCells = hotInstance.getPlugin('mergeCells');
      if (mergeCells && mergeCells.isEnabled()) {
        const selected = hotInstance.getSelected();
        if (selected && selected.length > 0) {
          const [startRow, startCol, endRow, endCol] = selected[0];
          if (startRow !== endRow || startCol !== endCol) {
            mergeCells.merge(startRow, startCol, endRow, endCol);
            setHasChanges(true);
          }
        }
      }
    }
  };

  // Unmerge cells - using documented API
  const handleUnmergeCells = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance?.getPlugin) {
      const mergeCells = hotInstance.getPlugin('mergeCells');
      if (mergeCells && mergeCells.isEnabled()) {
        const selected = hotInstance.getSelected();
        if (selected && selected.length > 0) {
          const [row, col] = selected[0];
          const mergedCells = mergeCells.mergedCellsCollection.get(row, col);
          if (mergedCells) {
            mergeCells.unmerge(mergedCells.row, mergedCells.col, mergedCells.row + mergedCells.rowspan - 1, mergedCells.col + mergedCells.colspan - 1);
            setHasChanges(true);
          }
        }
      }
    }
  };

  // Delete row/column functions - using documented API
  const handleDeleteRow = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const row = selected[0][0];
        hotInstance.alter('remove_row', row);
        setHasChanges(true);
      }
    }
  };

  const handleDeleteColumn = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const col = selected[0][1];
        hotInstance.alter('remove_col', col);
        setHasChanges(true);
      }
    }
  };

  // Store cell formatting state
  const [cellFormats, setCellFormats] = useState<{[key: string]: {className?: string}}>({});
  const [cellStyles, setCellStyles] = useState<{[key: string]: React.CSSProperties}>({});

  // Cell formatting functions using proper Handsontable approach
  const toggleCellFormat = (className: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        const newCellFormats = { ...cellFormats };
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cellKey = `${row}-${col}`;
            const currentFormat = newCellFormats[cellKey] || {};
            const currentClassName = currentFormat.className || '';
            const classNames = currentClassName.split(' ').filter((c: string) => c.trim() !== '');
            
            // Check if the class is already applied
            const classIndex = classNames.indexOf(className);
            
            if (classIndex > -1) {
              // Remove the class (toggle off)
              classNames.splice(classIndex, 1);
            } else {
              // Add the class (toggle on)
              classNames.push(className);
            }
            
            // Update the cell format
            newCellFormats[cellKey] = {
              ...currentFormat,
              className: classNames.join(' ').trim()
            };
          }
        }
        setCellFormats(newCellFormats);
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  const handleBold = () => {
    toggleCellFormat('ht-bold');
  };

  const handleItalic = () => {
    toggleCellFormat('ht-italic');
  };

  const handleUnderline = () => {
    toggleCellFormat('ht-underline');
  };

  const handleAlignLeft = () => {
    setCellAlignment('ht-align-left');
  };

  const handleAlignCenter = () => {
    setCellAlignment('ht-align-center');
  };

  const handleAlignRight = () => {
    setCellAlignment('ht-align-right');
  };

  // Helper function to set cell alignment
  const setCellAlignment = (alignmentClass: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        const newCellFormats = { ...cellFormats };
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cellKey = `${row}-${col}`;
            const currentFormat = newCellFormats[cellKey] || {};
            const currentClassName = currentFormat.className || '';
            const classNames = currentClassName.split(' ').filter((c: string) => c.trim() !== '');
            
            // Remove any existing alignment classes
            const alignmentClasses = ['ht-align-left', 'ht-align-center', 'ht-align-right'];
            alignmentClasses.forEach(alignClass => {
              const index = classNames.indexOf(alignClass);
              if (index > -1) {
                classNames.splice(index, 1);
              }
            });
            
            // Add the new alignment class
            classNames.push(alignmentClass);
            
            // Update the cell format
            newCellFormats[cellKey] = {
              ...currentFormat,
              className: classNames.join(' ').trim()
            };
          }
        }
        setCellFormats(newCellFormats);
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  // Text/Fill color dropdown anchors
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [textColorMenuPosition, setTextColorMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [fillColorAnchorEl, setFillColorAnchorEl] = useState<null | HTMLElement>(null);

  const handleTextColorClick = (event: React.MouseEvent<HTMLElement>) => {
    setTextColorMenuPosition({ top: event.clientY + 8, left: event.clientX });
    setIsTextColorOpen(true);
  };
  const handleTextColorClose = () => setIsTextColorOpen(false);
  const handleBackgroundColorClick = (event: React.MouseEvent<HTMLElement>) => {
    setFillColorAnchorEl(event.currentTarget);
  };
  const handleBackgroundColorClose = () => setFillColorAnchorEl(null);

  // Helper function to apply styles via React state
  const applyCellStyle = (styleProperty: string, styleValue: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    let sel = hotInstance.getSelected();
    if (!sel || sel.length === 0) {
      if (lastSelectionRef.current) {
        const [r, c, r2, c2] = lastSelectionRef.current;
        sel = [[r, c, r2, c2]] as any;
      } else {
        return;
      }
    }
    const [startRow, startCol, endRow, endCol] = sel[0] as [number, number, number, number];
    const nextStyles: {[key: string]: React.CSSProperties} = { ...cellStyles };
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const key = `${row}-${col}`;
        const current = (nextStyles[key] || {}) as React.CSSProperties;
        nextStyles[key] = { ...current, [styleProperty]: styleValue } as React.CSSProperties;
      }
    }
    setCellStyles(nextStyles);
    hotInstance.render();
    setHasChanges(true);
  };

  const removeCellStyle = (styleProperty: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    let sel = hotInstance.getSelected();
    if (!sel || sel.length === 0) {
      if (lastSelectionRef.current) {
        const [r, c, r2, c2] = lastSelectionRef.current;
        sel = [[r, c, r2, c2]] as any;
      } else {
        return;
      }
    }
    const [startRow, startCol, endRow, endCol] = sel[0] as [number, number, number, number];
    const nextStyles: {[key: string]: React.CSSProperties} = { ...cellStyles };
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const key = `${row}-${col}`;
        const current = { ...(nextStyles[key] || {}) } as any;
        if (styleProperty in current) delete current[styleProperty];
        if (Object.keys(current).length) {
          nextStyles[key] = current;
        } else {
          delete nextStyles[key];
        }
      }
    }
    setCellStyles(nextStyles);
    hotInstance.render();
    setHasChanges(true);
  };

  const [borderAnchorEl, setBorderAnchorEl] = useState<null | HTMLElement>(null);
  const [borderStyle, setBorderStyle] = useState<'thin' | 'thick' | 'dashed'>('thin');
  const [customBordersDefs, setCustomBordersDefs] = useState<any[]>([]);
  
  // Responsive toolbar state
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [overflowAnchorEl, setOverflowAnchorEl] = useState<null | HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  // Register a stable renderer to apply meta.className and meta.style as per docs
  useEffect(() => {
    try {
      registerRenderer('banburyStyledRenderer', (instance: any, td: HTMLTableCellElement, ...rest: any[]) => {
        // Use default text renderer first
        // @ts-ignore
        textRenderer(instance, td, ...rest);
        const [row, col] = rest;
        const meta = instance.getCellMeta(row, col) || {};
        if (meta.className) td.className = meta.className;
        if (meta.style) {
          try { Object.assign(td.style, meta.style); } catch {}
        }
        return td;
      });
    } catch {}
  }, []);

  const handleBorders = () => {
    // Open dropdown if available elsewhere
    setBorderAnchorEl(document.body);
  };

  const handleSaveXlsx = useCallback(async () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    const tableData: any[][] = hotInstance.getData();

    const cssHexToARGB = (cssHex?: string) => {
      if (!cssHex) return undefined;
      const hex = cssHex.replace('#', '').trim();
      if (hex.length === 3) {
        const r = hex[0]; const g = hex[1]; const b = hex[2];
        return `FF${r}${r}${g}${g}${b}${b}`.toUpperCase();
      }
      if (hex.length === 6) return `FF${hex}`.toUpperCase();
      if (hex.length === 8) return hex.toUpperCase();
      return undefined;
    };

    const numeralToExcelNumFmt = (pattern?: string) => {
      if (!pattern) return undefined;
      let fmt = pattern;
      fmt = fmt.replace(/0,0(\.0+)?/g, (m) => m.replace('0,0', '#,##0'));
      fmt = fmt.replace(/\$#,##0/g, '[$$]#,##0');
      return fmt;
    };

    const ExcelJSImport = await import('exceljs');
    const ExcelJS = ExcelJSImport.default || ExcelJSImport;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    if (tableData && tableData.length) {
      worksheet.addRows(tableData.map(row => row.map((v) => v == null ? '' : v)));
    }

    const numRows = tableData?.length || 0;
    const numCols = Math.max(0, ...(tableData || []).map(r => r.length));

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const cell = worksheet.getCell(r + 1, c + 1);
        const key = `${r}-${c}`;
        const fmt = cellFormats[key];
        const sty = cellStyles[key] as any;

        if (fmt?.className) {
          const classes = fmt.className.split(' ').filter(Boolean);
          if (classes.includes('ht-bold')) cell.font = { ...(cell.font || {}), bold: true };
          if (classes.includes('ht-italic')) cell.font = { ...(cell.font || {}), italic: true };
          if (classes.includes('ht-underline')) cell.font = { ...(cell.font || {}), underline: true } as any;
          if (classes.includes('ht-align-left')) cell.alignment = { ...(cell.alignment || {}), horizontal: 'left' };
          if (classes.includes('ht-align-center')) cell.alignment = { ...(cell.alignment || {}), horizontal: 'center' };
          if (classes.includes('ht-align-right')) cell.alignment = { ...(cell.alignment || {}), horizontal: 'right' };
        }

        if (sty) {
          if (sty.fontSize) {
            const size = parseInt(String(sty.fontSize).replace('px',''), 10);
            if (!isNaN(size)) cell.font = { ...(cell.font || {}), size };
          }
          if (sty.color) {
            const argb = cssHexToARGB(sty.color);
            if (argb) cell.font = { ...(cell.font || {}), color: { argb } };
          }
          if (sty.backgroundColor) {
            const argb = cssHexToARGB(sty.backgroundColor);
            if (argb) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } } as any;
          }
          const parseBorder = (v?: string) => {
            if (!v) return undefined;
            const lower = v.toLowerCase();
            let style: 'thin' | 'thick' | 'dashed' = 'thin';
            if (lower.includes('2px') || lower.includes('thick')) style = 'thick';
            if (lower.includes('dashed')) style = 'dashed';
            const colorHex = (lower.match(/#([0-9a-f]{6})/) || [])[1];
            const argb = colorHex ? cssHexToARGB(`#${colorHex}`) : 'FF000000';
            return { style, color: { argb } } as any;
          };
          const top = parseBorder(sty.borderTop);
          const right = parseBorder(sty.borderRight);
          const bottom = parseBorder(sty.borderBottom);
          const left = parseBorder(sty.borderLeft);
          if (top || right || bottom || left) {
            cell.border = {
              ...(top ? { top } : {}),
              ...(right ? { right } : {}),
              ...(bottom ? { bottom } : {}),
              ...(left ? { left } : {}),
            } as any;
          }
        }

        try {
          const meta = hotInstance.getCellMeta(r, c) as any;
          if (meta) {
            if (meta.type === 'numeric' && meta.numericFormat?.pattern) {
              const fmtPattern = numeralToExcelNumFmt(meta.numericFormat.pattern);
              if (fmtPattern) (cell as any).numFmt = fmtPattern;
            }
            if (meta.type === 'date' && meta.dateFormat) {
              const fmtPattern = String(meta.dateFormat).replace(/MM/g, 'mm').replace(/YYYY/g, 'yyyy');
              (cell as any).numFmt = fmtPattern;
            }
          }
        } catch {}
      }
    }

    const base = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'export';
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    onSaveXlsx?.(blob, `${base}.xlsx`);
    setHasChanges(false);
  }, [cellFormats, cellStyles, fileName, onSaveXlsx, onSave]);

  const handleBorderClick = (event: React.MouseEvent<HTMLElement>) => {
    setBorderAnchorEl(event.currentTarget);
  };

  const handleBorderClose = () => setBorderAnchorEl(null);

  type BorderOption = 'all' | 'outer' | 'inner' | 'top' | 'right' | 'bottom' | 'left' | 'thick-outer' | 'dashed-outer' | 'none';

  const applyBordersOption = (option: BorderOption) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    // Use last selection if click caused selection to clear
    let sel = hotInstance.getSelected();
    if (!sel || sel.length === 0) {
      if (lastSelectionRef.current) {
        const [r, c, r2, c2] = lastSelectionRef.current;
        sel = [[r, c, r2, c2]] as any;
      } else {
        return;
      }
    }

    const [startRow, startCol, endRow, endCol] = sel[0] as [number, number, number, number];

    const nextStyles: {[key: string]: React.CSSProperties} = { ...cellStyles };
    const clearBorderKeys = (style: Record<string, any>) => {
      const { border, borderTop, borderRight, borderBottom, borderLeft, ...rest } = style || {};
      return rest;
    };

    const setEdge = (row: number, col: number, edges: Partial<Record<'top'|'right'|'bottom'|'left', string>>) => {
      const key = `${row}-${col}`;
      const current = (nextStyles[key] || {}) as any;
      const base = clearBorderKeys(current);
      const next: Record<string, any> = { ...base };
      if (edges.top) next.borderTop = edges.top;
      if (edges.right) next.borderRight = edges.right;
      if (edges.bottom) next.borderBottom = edges.bottom;
      if (edges.left) next.borderLeft = edges.left;
      nextStyles[key] = next as React.CSSProperties;
    };

    const styleFor = (kind: 'thin' | 'thick' | 'dashed') => {
      if (kind === 'thick') return '2px solid #000';
      if (kind === 'dashed') return '1px dashed #000';
      return '1px solid #000';
    };

    const writeAll = (value: string) => {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          setEdge(r, c, { top: value, right: value, bottom: value, left: value });
        }
      }
    };

    // Build CustomBorders plugin config based on selection
    const width = borderStyle === 'thick' ? 2 : 1; // dashed maps to thin (plugin doesn't support dashed style)
    const color = '#000';

    const defs: any[] = [];

    const pushOuterRange = () => {
      defs.push({
        range: {
          from: { row: startRow, col: startCol },
          to: { row: endRow, col: endCol },
        },
        top: { width, color },
        bottom: { width, color },
        start: { width, color },
        end: { width, color },
      });
    };

    const pushPerCell = (r: number, c: number, edges: Partial<Record<'top'|'right'|'bottom'|'left', boolean>>) => {
      const entry: any = { row: r, col: c };
      if (edges.top) entry.top = { width, color };
      if (edges.right) entry.right = { width, color };
      if (edges.bottom) entry.bottom = { width, color };
      if (edges.left) entry.left = { width, color };
      defs.push(entry);
    };

    switch (option) {
      case 'all': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            pushPerCell(r, c, { top: true, right: true, bottom: true, left: true });
            setEdge(r, c, { top: value, right: value, bottom: value, left: value });
          }
        }
        break;
      }
      case 'outer': {
        const value = styleFor(borderStyle);
        pushOuterRange();
        for (let c = startCol; c <= endCol; c++) {
          setEdge(startRow, c, { top: value });
          setEdge(endRow, c, { bottom: value });
        }
        for (let r = startRow; r <= endRow; r++) {
          setEdge(r, startCol, { left: value });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'thick-outer': {
        const value = styleFor('thick');
        defs.push({
          range: { from: { row: startRow, col: startCol }, to: { row: endRow, col: endCol } },
          top: { width: 2, color },
          bottom: { width: 2, color },
          start: { width: 2, color },
          end: { width: 2, color },
        });
        for (let c = startCol; c <= endCol; c++) {
          setEdge(startRow, c, { top: value });
          setEdge(endRow, c, { bottom: value });
        }
        for (let r = startRow; r <= endRow; r++) {
          setEdge(r, startCol, { left: value });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'dashed-outer': {
        // Fallback to thin since plugin doesn't support dashed. Could emulate via CSS if needed.
        pushOuterRange();
        const value = styleFor('dashed');
        for (let c = startCol; c <= endCol; c++) {
          setEdge(startRow, c, { top: value });
          setEdge(endRow, c, { bottom: value });
        }
        for (let r = startRow; r <= endRow; r++) {
          setEdge(r, startCol, { left: value });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'inner': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const edges: any = {};
            if (r > startRow) edges.top = true;
            if (c > startCol) edges.left = true;
            if (Object.keys(edges).length) pushPerCell(r, c, edges);
            const cssEdges: any = {};
            if (r > startRow) cssEdges.top = value;
            if (c > startCol) cssEdges.left = value;
            if (Object.keys(cssEdges).length) setEdge(r, c, cssEdges);
          }
        }
        break;
      }
      case 'top': {
        const value = styleFor(borderStyle);
        for (let c = startCol; c <= endCol; c++) {
          pushPerCell(startRow, c, { top: true });
          setEdge(startRow, c, { top: value });
        }
        break;
      }
      case 'bottom': {
        const value = styleFor(borderStyle);
        for (let c = startCol; c <= endCol; c++) {
          pushPerCell(endRow, c, { bottom: true });
          setEdge(endRow, c, { bottom: value });
        }
        break;
      }
      case 'left': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          pushPerCell(r, startCol, { left: true });
          setEdge(r, startCol, { left: value });
        }
        break;
      }
      case 'right': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          pushPerCell(r, endCol, { right: true });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'none':
        setCustomBordersDefs([]);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const key = `${r}-${c}`;
            const current = { ...(nextStyles[key] || {}) } as any;
            delete current.borderTop; delete current.borderRight; delete current.borderBottom; delete current.borderLeft; delete current.border;
            if (Object.keys(current).length) nextStyles[key] = current; else delete nextStyles[key];
          }
        }
        handleBorderClose();
        setCellStyles(nextStyles);
        hotInstance.render();
        setHasChanges(true);
        return;
    }

    setCustomBordersDefs(defs);
    setCellStyles(nextStyles);
    hotInstance.render();
    setHasChanges(true);
    handleBorderClose();
  };

  const handleFontSize = (newFontSize?: number) => {
    const fontSizeValue = newFontSize || fontSize;
    applyCellStyle('fontSize', `${fontSizeValue}px`);
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 72) {
      setFontSize(value);
      handleFontSize(value);
    }
  };

  const handleFontSizeIncrement = () => {
    const newSize = Math.min(fontSize + 1, 72);
    setFontSize(newSize);
    handleFontSize(newSize);
  };

  const handleFontSizeDecrement = () => {
    const newSize = Math.max(fontSize - 1, 6);
    setFontSize(newSize);
    handleFontSize(newSize);
  };

  // Data type formatting functions
  const handleCurrencyFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'numeric');
            hotInstance.setCellMeta(row, col, 'numericFormat', {
              pattern: '$0,0.00',
              culture: 'en-US'
            });
          }
        }
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  const handleDateFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'date');
            hotInstance.setCellMeta(row, col, 'dateFormat', 'MM/DD/YYYY');
          }
        }
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  const handlePercentageFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'numeric');
            hotInstance.setCellMeta(row, col, 'numericFormat', {
              pattern: '0.00%'
            });
          }
        }
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  const handleNumberFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'numeric');
            hotInstance.setCellMeta(row, col, 'numericFormat', {
              pattern: '0,0.00'
            });
          }
        }
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  const handleTextFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'text');
            // Remove any numeric formatting
            hotInstance.removeCellMeta(row, col, 'numericFormat');
            hotInstance.removeCellMeta(row, col, 'dateFormat');
          }
        }
        hotInstance.render();
        setHasChanges(true);
      }
    }
  };

  // Alignment dropdown handlers
  const handleAlignmentClick = (event: React.MouseEvent<HTMLElement>) => {
    setAlignmentAnchorEl(event.currentTarget);
  };

  const handleAlignmentClose = () => {
    setAlignmentAnchorEl(null);
  };

  const handleAlignmentSelect = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'left':
        handleAlignLeft();
        break;
      case 'center':
        handleAlignCenter();
        break;
      case 'right':
        handleAlignRight();
        break;
    }
    handleAlignmentClose();
  };

  // Define all toolbar buttons with their handlers and icons
  const toolbarButtons = [
    { id: 'undo', handler: () => handleUndo(), icon: <Undo sx={{ fontSize: 16 }} />, title: 'Undo' },
    { id: 'redo', handler: () => handleRedo(), icon: <Redo sx={{ fontSize: 16 }} />, title: 'Redo' },
    { id: 'currency', handler: () => handleCurrencyFormat(), icon: <AttachMoney sx={{ fontSize: 16 }} />, title: 'Currency Format' },
    { id: 'date', handler: () => handleDateFormat(), icon: <CalendarToday sx={{ fontSize: 16 }} />, title: 'Date Format' },
    { id: 'percentage', handler: () => handlePercentageFormat(), icon: <Percent sx={{ fontSize: 16 }} />, title: 'Percentage Format' },
    { id: 'number', handler: () => handleNumberFormat(), icon: <Numbers sx={{ fontSize: 16 }} />, title: 'Number Format' },
    { id: 'text', handler: () => handleTextFormat(), icon: <TextFormat sx={{ fontSize: 16 }} />, title: 'Text Format' },
    { id: 'bold', handler: () => handleBold(), icon: <FormatBold sx={{ fontSize: 16 }} />, title: 'Bold' },
    { id: 'italic', handler: () => handleItalic(), icon: <FormatItalic sx={{ fontSize: 16 }} />, title: 'Italic' },
    { id: 'underline', handler: () => handleUnderline(), icon: <FormatUnderlined sx={{ fontSize: 16 }} />, title: 'Underline' },
    { id: 'textColor', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleTextColorClick(e) : handleTextColorClick({} as any), icon: <TextColorIcon sx={{ fontSize: 16 }} />, title: 'Text Color' },
    { id: 'fillColor', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleBackgroundColorClick(e) : handleBackgroundColorClick({} as any), icon: <FillColorIcon sx={{ fontSize: 16 }} />, title: 'Fill Color' },
    { id: 'borders', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleBorderClick(e) : handleBorderClick({} as any), icon: <BorderAll sx={{ fontSize: 16 }} />, title: 'Borders' },
    { id: 'merge', handler: () => handleMergeCells(), icon: <MergeCellsIcon sx={{ fontSize: 16 }} />, title: 'Merge Selected Cells' },
    { id: 'alignment', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleAlignmentClick(e) : handleAlignmentClick({} as any), icon: <><FormatAlignLeft sx={{ fontSize: 16 }} /><KeyboardArrowDown sx={{ fontSize: 12, ml: 0.5 }} /></>, title: 'Text Alignment' },
    { id: 'filters', handler: () => handleToggleFilters(), icon: <FilterList sx={{ fontSize: 16 }} />, title: 'Toggle Filters' },
  ];

  // Calculate which buttons should be visible based on available space
  const calculateVisibleButtons = useCallback(() => {
    if (!toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const toolbarWidth = toolbar.offsetWidth;
    
    // If toolbar width is 0, it's not rendered yet
    if (toolbarWidth === 0) return;
    
    const buttonWidth = 32; // Width of each button
    const dividerWidth = 16; // Width of dividers
    const overflowButtonWidth = 40; // Width of overflow button
    const saveButtonsWidth = 80; // Approximate width for save/download buttons
    const fontControlWidth = 120; // Width of font size control
    
    // Reserve space for font control, save buttons and overflow button
    const availableWidth = toolbarWidth - fontControlWidth - saveButtonsWidth - overflowButtonWidth - 32; // 32px for padding
    
    // Calculate how many buttons can fit
    let currentWidth = 0;
    const visible: string[] = [];
    
    for (const button of toolbarButtons) {
      // Check if this button needs a divider before it
      const dividerGroups = ['bold', 'textColor', 'borders', 'merge', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
      const needsDivider = dividerGroups.includes(button.id);
      
      const buttonTotalWidth = buttonWidth + (needsDivider ? dividerWidth : 0);
      
      if (currentWidth + buttonTotalWidth <= availableWidth) {
        visible.push(button.id);
        currentWidth += buttonTotalWidth;
      } else {
        break;
      }
    }
    
    // Ensure at least some essential buttons are always visible
    if (visible.length === 0) {
      // Fallback: show at least the first few essential buttons
      const essentialButtons = ['undo', 'redo', 'bold', 'italic', 'underline'];
      setVisibleButtons(essentialButtons.filter(id => toolbarButtons.some(btn => btn.id === id)));
    } else {
      setVisibleButtons(visible);
    }
    
    // Debug log to help understand the calculation
    console.log('Toolbar calculation:', {
      toolbarWidth,
      availableWidth,
      visibleButtons: visible.length,
      totalButtons: toolbarButtons.length
    });
  }, [toolbarButtons]);

  // Handle overflow menu
  const handleOverflowClick = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowAnchorEl(event.currentTarget);
  };

  const handleOverflowClose = () => {
    setOverflowAnchorEl(null);
  };

  // Recalculate visible buttons on resize and after mount
  useEffect(() => {
    // Initial calculation with a delay to ensure DOM is ready
    const initialTimer = setTimeout(() => {
      calculateVisibleButtons();
    }, 100);
    
    const handleResize = () => {
      setTimeout(() => {
        calculateVisibleButtons();
      }, 50);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for more accurate container size changes
    let resizeObserver: ResizeObserver;
    if (toolbarRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
          calculateVisibleButtons();
        }, 50);
      });
      resizeObserver.observe(toolbarRef.current);
    }
    
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [calculateVisibleButtons]);

  // Add custom CSS styles for cell formatting
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .handsontable .ht-bold {
        font-weight: bold !important;
      }
      .handsontable .ht-italic {
        font-style: italic !important;
      }
      .handsontable .ht-underline {
        text-decoration: underline !important;
      }
      .handsontable .ht-align-left {
        text-align: left !important;
      }
      .handsontable .ht-align-center {
        text-align: center !important;
      }
      .handsontable .ht-align-right {
        text-align: right !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading spreadsheet...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {error && (
        <Alert severity="warning" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Responsive Toolbar */}
      <Box 
        ref={toolbarRef}
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          height: '40px',
          px: 1,
          py: 0,
          overflow: 'hidden',
        }}
      >
        {/* Visible Toolbar Buttons */}
        {toolbarButtons.map((button, index) => {
          if (visibleButtons.includes(button.id)) {
            const showDividerBefore = () => {
              // Show divider before these button groups
              const dividerGroups = ['currency','textColor', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
              return dividerGroups.includes(button.id);
            };

            return (
              <React.Fragment key={button.id}>
                {showDividerBefore() && (
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#e2e8f0' }} />
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    // For handlers that need event parameters, pass them through
                    if (button.id === 'textColor' || button.id === 'fillColor' || button.id === 'borders' || button.id === 'alignment') {
                      button.handler(e as any);
                    } else {
                      button.handler();
                  }
                  }}
                  title={button.title}
                  sx={{
                    width: 32,
                    height: 32,
                    color: '#64748b',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                    },
                  }}
                >
                  {button.icon}
                </IconButton>
                
                                 {/* Font Size Control - Positioned after text format button */}
                 {button.id === 'text' && (
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <IconButton
                       size="small"
                       onClick={handleFontSizeDecrement}
                       title="Decrease Font Size"
                       sx={{
                         width: 24,
                         height: 24,
                         color: '#64748b',
                         borderRadius: '2px 0 0 2px',
                         border: '1px solid #e2e8f0',
                         borderRight: 'none',
                         '&:hover': {
                           backgroundColor: '#e2e8f0',
                           color: '#475569',
                         },
                       }}
                     >
                       <Remove sx={{ fontSize: 12 }} />
                     </IconButton>
                     <TextField
                       value={fontSize}
                       onChange={handleFontSizeChange}
                       size="small"
                       inputProps={{
                         min: 6,
                         max: 72,
                         type: 'number',
                         style: {
                           textAlign: 'center',
                           padding: '2px 4px',
                           fontSize: '12px',
                           width: '32px',
                           height: '20px',
                           border: 'none',
                           outline: 'none',
                         }
                       }}
                       sx={{
                         '& .MuiOutlinedInput-root': {
                           height: '24px',
                           border: '1px solid #e2e8f0',
                           borderRadius: 0,
                           '& fieldset': {
                             border: 'none',
                           },
                           '&:hover fieldset': {
                             border: 'none',
                           },
                           '&.Mui-focused fieldset': {
                             border: 'none',
                           },
                         },
                         '& .MuiInputBase-input': {
                           padding: 0,
                           color: '#000000',
                           '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                             WebkitAppearance: 'none',
                             margin: 0,
                           },
                           '&[type=number]': {
                             MozAppearance: 'textfield',
                           },
                         },
                       }}
                     />
                     <IconButton
                       size="small"
                       onClick={handleFontSizeIncrement}
                       title="Increase Font Size"
                       sx={{
                         width: 24,
                         height: 24,
                         color: '#64748b',
                         borderRadius: '0 2px 2px 0',
                         border: '1px solid #e2e8f0',
                         borderLeft: 'none',
                         '&:hover': {
                           backgroundColor: '#e2e8f0',
                           color: '#475569',
                         },
                       }}
                     >
                       <Add sx={{ fontSize: 12 }} />
                     </IconButton>
                   </Box>
                 )}
              </React.Fragment>
            );
          }
          return null;
        })}

        {/* Overflow Button */}
        {toolbarButtons.some(button => !visibleButtons.includes(button.id)) && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#e2e8f0' }} />
            <IconButton
              size="small"
              onClick={handleOverflowClick}
              title="More tools"
              sx={{
                width: 32,
                height: 32,
                color: '#64748b',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                },
              }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </IconButton>
          </>
        )}

        {/* Document Actions - Save and Download */}
        {(onSaveDocument || onDownloadDocument) && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#e2e8f0' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              {onSaveDocument && (
                <IconButton
                  size="small"
                  onClick={handleSaveXlsx}
                  disabled={saving || !canSave}
                  title="Save as XLSX"
                  sx={{
                    width: 32,
                    height: 32,
                    color: saving || !canSave ? '#94a3b8' : '#64748b',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#e2e8f0',
                      color: saving || !canSave ? '#94a3b8' : '#475569',
                    },
                    '&:disabled': {
                      color: '#94a3b8',
                    },
                  }}
                >
                  <Save sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {onDownloadDocument && (
                <IconButton
                  size="small"
                  onClick={onDownloadDocument}
                  title="Download spreadsheet"
                  sx={{
                    width: 32,
                    height: 32,
                    color: '#64748b',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                    },
                  }}
                >
                  <Download sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          </>
        )}
      </Box>

             {/* Overflow Menu */}
       <Menu
         anchorEl={overflowAnchorEl}
         open={Boolean(overflowAnchorEl)}
         onClose={handleOverflowClose}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
         transformOrigin={{ vertical: 'top', horizontal: 'left' }}
         PaperProps={{
           sx: {
             minWidth: '200px',
             maxHeight: '400px',
             overflow: 'auto',
             boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
             border: '1px solid #e2e8f0',
           }
         }}
       >
         {toolbarButtons
           .filter(button => !visibleButtons.includes(button.id))
           .map((button) => (
             <MenuItem
               key={button.id}
               onClick={(e) => {
                 handleOverflowClose();
                 // For handlers that need event parameters, we need to handle them specially
                 if (button.id === 'textColor' || button.id === 'fillColor' || button.id === 'borders' || button.id === 'alignment') {
                   // These handlers need event parameters, so we'll trigger them differently
                   if (button.id === 'textColor') {
                     handleTextColorClick(e as any);
                   } else if (button.id === 'fillColor') {
                     handleBackgroundColorClick(e as any);
                   } else if (button.id === 'borders') {
                     handleBorderClick(e as any);
                   } else if (button.id === 'alignment') {
                     handleAlignmentClick(e as any);
                   }
                 } else {
                   button.handler();
                 }
               }}
               sx={{
                 fontSize: '14px',
                 py: 1,
                 display: 'flex',
                 alignItems: 'center',
                 gap: 1
               }}
             >
               {button.icon}
               {button.title}
             </MenuItem>
           ))}
       </Menu>

       {/* Text Color Menu */}
       <Menu
         anchorReference="anchorPosition"
         anchorPosition={textColorMenuPosition || { top: 0, left: 0 }}
         open={isTextColorOpen}
         onClose={handleTextColorClose}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
         transformOrigin={{ vertical: 'top', horizontal: 'left' }}
         PaperProps={{ sx: { minWidth: '220px', p: 1 } }}
       >
         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: '6px', p: 1 }} onMouseDown={(e) => e.preventDefault()}>
           {['#000000','#333333','#666666','#999999','#CCCCCC','#FFFFFF',
             '#E53935','#D81B60','#8E24AA','#5E35B1','#3949AB','#1E88E5','#039BE5','#00ACC1','#00897B','#43A047','#7CB342','#C0CA33','#FDD835','#FB8C00']
             .map((c) => (
               <Box key={c}
                 onMouseDown={(e) => e.preventDefault()}
                 onClick={() => { handleTextColorClose(); setTimeout(() => applyCellStyle('color', c), 0); }}
                 sx={{ width: 18, height: 18, backgroundColor: c, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
             ))}
         </Box>
         <Divider />
         <MenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => { handleTextColorClose(); setTimeout(() => removeCellStyle('color'), 0); }}>Clear text color</MenuItem>
       </Menu>

       {/* Fill Color Menu */}
       <Menu
         anchorEl={fillColorAnchorEl}
         open={Boolean(fillColorAnchorEl)}
         onClose={handleBackgroundColorClose}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
         transformOrigin={{ vertical: 'top', horizontal: 'left' }}
         PaperProps={{ sx: { minWidth: '220px', p: 1 } }}
       >
         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: '6px', p: 1 }} onMouseDown={(e) => e.preventDefault()}>
           {['#000000','#333333','#666666','#999999','#CCCCCC','#FFFFFF',
             '#E53935','#D81B60','#8E24AA','#5E35B1','#3949AB','#1E88E5','#039BE5','#00ACC1','#00897B','#43A047','#7CB342','#C0CA33','#FDD835','#FB8C00']
             .map((c) => (
               <Box key={c}
                 onMouseDown={(e) => e.preventDefault()}
                 onClick={() => { handleBackgroundColorClose(); setTimeout(() => applyCellStyle('backgroundColor', c), 0); }}
                 sx={{ width: 18, height: 18, backgroundColor: c, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
             ))}
         </Box>
         <Divider />
         <MenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => { handleBackgroundColorClose(); setTimeout(() => removeCellStyle('backgroundColor'), 0); }}>Clear fill color</MenuItem>
       </Menu>

       {/* Borders Menu */}
       <Menu
         anchorEl={borderAnchorEl}
         open={Boolean(borderAnchorEl)}
         onClose={handleBorderClose}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
         transformOrigin={{ vertical: 'top', horizontal: 'left' }}
         PaperProps={{ sx: { minWidth: '260px', border: '1px solid #e2e8f0', p: 1 } }}
       >
         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 40px)', gap: 1, p: 1 }}>
           {/* First row: All / Outer / Inner / None placeholder / None */}
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('all')} title="All borders"><BorderAll sx={{ fontSize: 18 }} /></IconButton>
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('outer')} title="Outer borders"><BorderAll sx={{ fontSize: 18 }} /></IconButton>
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('inner')} title="Inner borders"><BorderAll sx={{ fontSize: 18 }} /></IconButton>
           <Box />
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('none')} title="Clear borders"><Clear sx={{ fontSize: 18 }} /></IconButton>

           {/* Second row: Top / Right / Bottom / Left */}
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('top')} title="Top border"><BorderTop sx={{ fontSize: 18 }} /></IconButton>
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('right')} title="Right border"><BorderRight sx={{ fontSize: 18 }} /></IconButton>
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('bottom')} title="Bottom border"><BorderBottom sx={{ fontSize: 18 }} /></IconButton>
           <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBordersOption('left')} title="Left border"><BorderLeft sx={{ fontSize: 18 }} /></IconButton>
           <Box />
         </Box>
         <Divider sx={{ my: 1 }} />
         {/* Style subgroup */}
         <Box sx={{ display: 'flex', alignItems: 'center', px: 1, gap: 1 }}>
           <Typography variant="body2" sx={{ color: '#475569' }}>Style</Typography>
           <IconButton size="small" onClick={() => setBorderStyle('thin')} title="Thin"><Remove sx={{ fontSize: 18, borderBottom: '1px solid currentColor', width: 18 }} /></IconButton>
           <IconButton size="small" onClick={() => setBorderStyle('thick')} title="Thick"><Remove sx={{ fontSize: 18, borderBottom: '3px solid currentColor', width: 18 }} /></IconButton>
           <IconButton size="small" onClick={() => setBorderStyle('dashed')} title="Dashed"><Remove sx={{ fontSize: 18, borderBottom: '1px dashed currentColor', width: 18 }} /></IconButton>
         </Box>
       </Menu>

       {/* Alignment Menu */}
       <Menu
         anchorEl={alignmentAnchorEl}
         open={Boolean(alignmentAnchorEl)}
         onClose={handleAlignmentClose}
         anchorOrigin={{
           vertical: 'bottom',
           horizontal: 'left',
         }}
         transformOrigin={{
           vertical: 'top',
           horizontal: 'left',
         }}
         PaperProps={{
           sx: {
             minWidth: '120px',
             boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
             border: '1px solid #e2e8f0',
           }
         }}
       >
         <MenuItem 
           onClick={() => handleAlignmentSelect('left')}
           sx={{ 
             fontSize: '14px',
             py: 1,
             display: 'flex',
             alignItems: 'center',
             gap: 1
           }}
         >
           <FormatAlignLeft sx={{ fontSize: 16 }} />
           Align Left
         </MenuItem>
         <MenuItem 
           onClick={() => handleAlignmentSelect('center')}
           sx={{ 
             fontSize: '14px',
             py: 1,
             display: 'flex',
             alignItems: 'center',
             gap: 1
           }}
         >
           <FormatAlignCenter sx={{ fontSize: 16 }} />
           Align Center
         </MenuItem>
         <MenuItem 
           onClick={() => handleAlignmentSelect('right')}
           sx={{ 
             fontSize: '14px',
             py: 1,
             display: 'flex',
             alignItems: 'center',
             gap: 1
           }}
         >
           <FormatAlignRight sx={{ fontSize: 16 }} />
           Align Right
         </MenuItem>
       </Menu>
        

      {/* Spreadsheet component stretching to full height */}
      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1,
          position: 'relative',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="handsontable-container-full"
        >
          <HotTable
            ref={hotTableRef}
            data={data}
            colHeaders={true}
            rowHeaders={true}
            dropdownMenu={true}
            height={containerHeight}
            width="100%"
            licenseKey="non-commercial-and-evaluation"
            contextMenu={true}
            manualRowResize={true}
            manualColumnResize={true}
            outsideClickDeselects={false}
            selectionMode="multiple"
            afterChange={handleDataChange}
            afterSelectionEnd={(r,c,r2,c2) => { lastSelectionRef.current = [r,c,r2,c2]; }}
            stretchH="all"
            customBorders={customBordersDefs.length ? customBordersDefs : undefined}
            cells={(row: number, col: number) => {
              return {
                renderer: (instance: any, td: HTMLTableCellElement, r: number, c: number, prop: any, value: any, cellProperties: any) => {
                  textRenderer(instance, td, r, c, prop, value, cellProperties);
                  const cellKey = `${r}-${c}`;
                  const fmt = cellFormats[cellKey];
                  const sty = cellStyles[cellKey];
                  if (fmt?.className) {
                    try { fmt.className.split(' ').forEach((cls: string) => { if (cls) td.classList.add(cls); }); } catch {}
                  }
                  if (sty) {
                    try { Object.assign(td.style, sty); } catch {}
                  }
                  return td;
                }
              };
            }}
            key="hot-table"
          />

        </div>
      </Box>
    </Box>
  );
};

export default CSVEditor;

