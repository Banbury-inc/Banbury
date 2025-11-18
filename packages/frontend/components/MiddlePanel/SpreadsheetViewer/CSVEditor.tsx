import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer, registerRenderer, checkboxRenderer } from 'handsontable/renderers';
import 'handsontable/dist/handsontable.full.css';
import { createAiResponseHandler, createRejectHandler } from './handlers/handle-ai-response';
import { createDataChangeHandler } from './handlers/handle-data-change';
import { createCellStyleHandlers } from './handlers/handle-cell-styles';
import { createAlignmentHandlers } from './handlers/handle-alignment';
import { createBorderHandlers } from './handlers/handle-borders';
import { createFormatHandlers } from './handlers/handle-formats';
import { createFontHandlers } from './handlers/handle-font';
import { createKeyboardHandler } from './handlers/handle-keyboard';
import { createCSVLoadHandler } from './handlers/handle-csv-load';
import { createFormulaEngine } from './handlers/handle-formulas';
import { createCopyPasteHandlers } from './handlers/handle-copy-paste';
import { createTableOperationsHandlers } from './handlers/handle-table-operations';
import { handleEditDropdownOptions } from './handlers/handle-edit-dropdown-options';
import { parseCSV, convertToCSV, convertToCSVWithMeta } from './utils/csv-parser';
import { createFormulaSuggestionHandlers } from './handlers/handle-formula-suggestions';
import CSVEditorToolbar from './components/CSVEditorToolbar';
import { SheetTabs } from './components/SheetTabs';
import { Button } from '../../ui/button'
import { Input } from '../../ui/old-input'
import { Label } from '../../ui/label'
import { Separator } from '../../ui/separator'
import { ArrowUpward, ArrowDownward, BorderAll as BorderAllIcon, Delete as DeleteIcon, Link as LinkIcon, Edit as EditIcon, ContentCopy as CopyIcon, LinkOff as UnlinkIcon } from '@mui/icons-material';
import { createConditionalFormattingHandlers, computeConditionalFormats } from './handlers/handle-conditional-formatting';
import { createAddCFRuleHandler } from './handlers/handle-add-cf-rule'
import type { ConditionalFormattingRule } from './handlers/handle-conditional-formatting';
import type { SheetData } from './handlers/handle-csv-load';
import { SpreadsheetChart } from './components/SpreadsheetChart';
import { ChartEditor } from './components/ChartEditor';
import { createChartHandlers, extractChartData } from './handlers/handle-charts';
import type { ChartDefinition } from './types/chart-types';
import { createLinkHandlers } from './handlers/handle-links';
// Register all Handsontable modules
registerAllModules();

interface CSVEditorProps {
  src: string;
  fileName?: string;
  srcBlob?: Blob;
  onError?: () => void;
  onLoad?: () => void;
  onSave?: (content: string) => void;
  onSaveXlsx?: (blob: Blob, fileName: string) => void;
  onContentChange?: (data: any[][]) => void;
  onFormattingChange?: (formatting: {
    cellFormats: {[key: string]: {className?: string}};
    cellStyles: {[key: string]: React.CSSProperties};
    cellTypeMeta: {[key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string }};
    columnWidths: {[key: string]: number};
    conditionalFormatting: ConditionalFormattingRule[];
    cellLinks: {[key: string]: string};
  }) => void;
  onSaveDocument?: () => void;
  onDownloadDocument?: () => void;
  onSheetsLoaded?: (sheets: SheetData[], activeSheetIndex: number) => void;
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
  onContentChange,
  onFormattingChange,
  onSaveDocument,
  onDownloadDocument,
  onSheetsLoaded,
  saving = false,
  canSave = false,
}) => {
  const [data, setData] = useState<any[][]>([
    ['', '', '', '']
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [containerHeight, setContainerHeight] = useState(600);
  const [fontSize, setFontSize] = useState<number>(12);
  const hotTableRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<[number, number, number, number] | null>(null);
  const [cellFormats, setCellFormats] = useState<{[key: string]: {className?: string}}>({});
  const [cellStyles, setCellStyles] = useState<{[key: string]: React.CSSProperties}>({});
  const [borderStyle, setBorderStyle] = useState<'thin' | 'thick' | 'dashed'>('thin');
  const [customBordersDefs, setCustomBordersDefs] = useState<any[]>([]);
  const [cellTypeMeta, setCellTypeMeta] = useState<{[key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string }} >({});
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({});
  const [conditionalRules, setConditionalRules] = useState<ConditionalFormattingRule[]>([]);
  const [conditionalClassOverlay, setConditionalClassOverlay] = useState<{[key: string]: string}>({});
  const [conditionalStyleOverlay, setConditionalStyleOverlay] = useState<{[key: string]: React.CSSProperties}>({});
  const [queryResultIndex, setQueryResultIndex] = useState<number>(0);
  
  // Link state - automatically detected URLs
  const [cellLinks, setCellLinks] = useState<{[key: string]: string}>({});
  const [linkPopover, setLinkPopover] = useState<{row: number; col: number; url: string; position: {top: number; left: number}} | null>(null);
  
  // Chart state
  const [charts, setCharts] = useState<ChartDefinition[]>([]);
  const [isChartEditorOpen, setIsChartEditorOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartDefinition | undefined>(undefined);
  
  // Multi-sheet support
  const [allSheets, setAllSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResultCount, setSearchResultCount] = useState(0);
  const searchMatchesRef = useRef<Array<{ row: number; col: number }>>([]);
  const searchCurrentIndexRef = useRef<number>(-1);

  const pendingCellMetaRef = useRef<Record<string, { 
    type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; 
    source?: string[]; 
    numericFormat?: { pattern?: string; culture?: string };
    dateFormat?: string;
  }> | null>(null);



  const parseCSVWithMeta = (content: string) => {
    const parsed = parseCSV(content);
    
    let metaObj: any = {};
    if (content.startsWith('##BANBURY_META=')) {
      const lines = content.split('\n');
      const metaLine = lines[0];
      
      try {
        const encoded = metaLine.replace('##BANBURY_META=', '');
        const decoded = atob(encoded);
        metaObj = JSON.parse(decoded);
        if (metaObj && metaObj.cells && typeof metaObj.cells === 'object') {
          // Store cell type metadata
          const cellTypeMeta: any = {};
          const cellFormats: any = {};
          const cellStyles: any = {};
          
          const loadedLinks: {[key: string]: string} = {};
          
          Object.entries(metaObj.cells).forEach(([key, cellMeta]: [string, any]) => {
            // Extract type metadata
            if (cellMeta.type) {
              const typeMeta: any = { type: cellMeta.type };
              if (cellMeta.source) typeMeta.source = cellMeta.source;
              if (cellMeta.numericFormat) typeMeta.numericFormat = cellMeta.numericFormat;
              if (cellMeta.dateFormat) typeMeta.dateFormat = cellMeta.dateFormat;
              cellTypeMeta[key] = typeMeta;
            }
            
            // Extract formatting metadata
            if (cellMeta.className) {
              cellFormats[key] = { className: cellMeta.className };
            }
            
            if (cellMeta.styles) {
              cellStyles[key] = cellMeta.styles;
            }
            
            // Extract link metadata
            if (cellMeta.link) {
              loadedLinks[key] = cellMeta.link;
            }
          });
          
          if (Object.keys(loadedLinks).length > 0) {
            setCellLinks(loadedLinks);
          }
          
          // Extract column widths if present
          if (metaObj.columnWidths && typeof metaObj.columnWidths === 'object') {
            setColumnWidths(metaObj.columnWidths);
          }
          
          // Store for Handsontable meta application
          pendingCellMetaRef.current = cellTypeMeta;
          
          // Apply formatting immediately (only if there's actual data)
          if (Object.keys(cellFormats).length > 0) {
            setCellFormats(prev => {
              // Only update if different to prevent unnecessary re-renders
              if (JSON.stringify(prev) !== JSON.stringify(cellFormats)) {
                return cellFormats;
              }
              return prev;
            });
          }
          if (Object.keys(cellStyles).length > 0) {
            setCellStyles(prev => {
              // Only update if different to prevent unnecessary re-renders
              if (JSON.stringify(prev) !== JSON.stringify(cellStyles)) {
                return cellStyles;
              }
              return prev;
            });
          }
          if (Object.keys(cellTypeMeta).length > 0) {
            setCellTypeMeta(prev => {
              // Only update if different to prevent unnecessary re-renders
              if (JSON.stringify(prev) !== JSON.stringify(cellTypeMeta)) {
                return cellTypeMeta;
              }
              return prev;
            });
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
    
    return { parsed, metaObj };
  };



  // Calculate container height to use full viewport
  useEffect(() => {
    const calculateHeight = () => {
      // Use viewport height minus toolbar height and some padding
      const viewportHeight = window.innerHeight;
      const toolbarHeight = 40; // Height of the toolbar
      const padding = 20; // Some padding for margins
      const calculatedHeight = Math.max(600, viewportHeight - toolbarHeight - padding);
      setContainerHeight(calculatedHeight);
    };

    // Initial calculation
    calculateHeight();

    // Recalculate on window resize
    const handleResize = () => {
      calculateHeight();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Create HyperFormula engine and store it for HotTable formulas config
  const [formulaEngine, setFormulaEngine] = useState<any | null>(null)
  useEffect(() => {
    let active = true
    ;(async () => {
      const engine = await createFormulaEngine({ sheetName: 'Sheet1' })
      if (!active) return
      setFormulaEngine(engine)
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    const pending = pendingCellMetaRef.current;
    if (!pending) return;
    try {
      const entries = Object.entries(pending);
      for (const [key, meta] of entries) {
        const [rs, cs] = key.split('-');
        const r = parseInt(rs, 10);
        const c = parseInt(cs, 10);
        if (Number.isNaN(r) || Number.isNaN(c)) continue;
        hotInstance.setCellMeta(r, c, 'type', meta.type);
        if (meta.type === 'dropdown' && Array.isArray((meta as any).source)) {
          hotInstance.setCellMeta(r, c, 'source', meta.source);
          hotInstance.setCellMeta(r, c, 'strict', false); // Allow typing custom values
        }
        if (meta.type === 'numeric' && (meta as any).numericFormat) {
          hotInstance.setCellMeta(r, c, 'numericFormat', (meta as any).numericFormat);
        }
        if (meta.type === 'date' && (meta as any).dateFormat) {
          hotInstance.setCellMeta(r, c, 'dateFormat', (meta as any).dateFormat);
        }
        // Clean numeric/date format if switching from them
        if (meta.type === 'dropdown' || meta.type === 'checkbox') {
          hotInstance.removeCellMeta(r, c, 'numericFormat');
          hotInstance.removeCellMeta(r, c, 'dateFormat');
        }
      }
      hotInstance.render();
      // Mirror to our local state so it persists on subsequent renders and edits
      const mirrored: {[key:string]: any} = {};
      Object.entries(pending).forEach(([k, m]) => { mirrored[k] = m as any; });
      setCellTypeMeta((prev) => ({ ...prev, ...mirrored }));
    } catch {}
    pendingCellMetaRef.current = null;
  }, [data]); // Run when data changes

  // Restore column widths when they change
  useEffect(() => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance || Object.keys(columnWidths).length === 0) return;

    try {
      const manualColumnResize = hotInstance.getPlugin('manualColumnResize');
      if (manualColumnResize && manualColumnResize.setManualSize) {
        Object.entries(columnWidths).forEach(([colIndex, width]) => {
          const col = parseInt(colIndex, 10);
          if (!isNaN(col) && width > 0) {
            manualColumnResize.setManualSize(col, width);
          }
        });
        hotInstance.render();
      }
    } catch (error) {
      console.warn('Failed to restore column widths:', error);
    }
  }, [columnWidths]);

  // Use ref to capture latest onContentChange to avoid dependency issues
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;
  const onFormattingChangeRef = useRef(onFormattingChange);
  onFormattingChangeRef.current = onFormattingChange;

  // Listen for AI spreadsheet responses and apply to table
  useEffect(() => {
    const handlerParams = {
      hotTableRef,
      setData,
      onContentChange: (data: any[][]) => onContentChangeRef.current?.(data),
      setHasChanges
    };
    
    const handler = createAiResponseHandler(handlerParams);
    const rejectHandler = createRejectHandler(handlerParams);

    window.addEventListener('sheet-ai-response', handler as EventListener);
    window.addEventListener('sheet-ai-response-reject', rejectHandler as EventListener);
    
    return () => {
      window.removeEventListener('sheet-ai-response', handler as EventListener);
      window.removeEventListener('sheet-ai-response-reject', rejectHandler as EventListener);
    };
  }, []); // Empty dependency array since we use refs for dynamic values

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
  }, []); // Remove data dependency to prevent infinite re-renders

  // Attach formula suggestions to the in-cell editor lifecycle
  useEffect(() => {
    const { attach, detach } = createFormulaSuggestionHandlers({ hotTableRef })
    attach()
    return () => detach()
  }, [])

  // Conditional formatting handlers
  const getConditionalRules = useCallback(() => conditionalRules, [conditionalRules])
  const { addRule: addConditionalRule, updateRule: updateConditionalRule, removeRule: removeConditionalRule } = useMemo(() => 
    createConditionalFormattingHandlers({
      setConditionalRules: setConditionalRules,
      getConditionalRules,
      setConditionalClasses: (m) => setConditionalClassOverlay(m),
      setConditionalStyles: (m) => setConditionalStyleOverlay(m)
    }), [getConditionalRules]
  )

  // Chart handlers
  const { addChart, updateChart, deleteChart, moveChart, resizeChart } = useMemo(
    () => createChartHandlers({ setCharts, setHasChanges }),
    []
  )

  // Recompute conditional formats whenever data or rules change
  useEffect(() => {
    try {
      const maps = computeConditionalFormats({ data, rules: conditionalRules })
      setConditionalClassOverlay(maps.classes)
      setConditionalStyleOverlay(maps.styles)
    } catch {}
  }, [data, conditionalRules])

  const handleDataChange = useCallback(
    (changes: any, source: string) => {
      // First call the original handler
      createDataChangeHandler({
        hotTableRef,
        setData,
        onContentChange,
        setHasChanges,
        cellTypeMeta,
        setCellTypeMeta
      })(changes, source);
      
      // Handle link removal when cell content changes
      if (source === 'edit' && changes) {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        
        for (const [row, col, oldValue, newValue] of changes) {
          const cellKey = `${row}-${col}`;
          const hasLink = cellLinks[cellKey];
          
          if (hasLink) {
            // Check if the new value is still a URL
            const isStillUrl = isUrl(newValue);
            
            if (!isStillUrl) {
              // Remove the link if the new value is not a URL
              setCellLinks(prev => {
                const next = { ...prev };
                delete next[cellKey];
                return next;
              });
              setHasChanges(true);
            } else {
              // Update the link URL if it changed
              const detectedUrl = isUrl(newValue);
              if (detectedUrl && detectedUrl !== hasLink) {
                setCellLinks(prev => ({ ...prev, [cellKey]: detectedUrl }));
                setHasChanges(true);
              }
            }
          } else {
            // Check if a new URL was entered
            const detectedUrl = isUrl(newValue);
            if (detectedUrl) {
              setCellLinks(prev => ({ ...prev, [cellKey]: detectedUrl }));
              setHasChanges(true);
            }
          }
        }
      }
    },
    [cellLinks, setCellLinks, setHasChanges]
  );

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


  const { applyCellStyle, removeCellStyle } = useMemo(() => 
    createCellStyleHandlers({
      hotTableRef,
      setCellStyles,
      setHasChanges,
      lastSelectionRef
    }), [setCellStyles, setHasChanges]
  );

  const { handleAlignLeft, handleAlignCenter, handleAlignRight } = useMemo(() => 
    createAlignmentHandlers({
      hotTableRef,
      cellFormats,
      setCellFormats,
      setHasChanges
    }), [cellFormats, setCellFormats, setHasChanges]
  );

  const { applyBordersOption } = useMemo(() => 
    createBorderHandlers({
      hotTableRef,
      cellStyles,
      setCellStyles,
      setHasChanges,
      lastSelectionRef,
      borderStyle,
      setCustomBordersDefs,
      onContentChange
    }), [cellStyles, setCellStyles, setHasChanges, borderStyle, setCustomBordersDefs, onContentChange]
  );

  const { handleCurrencyFormat, handleDateFormat, handlePercentageFormat, handleNumberFormat, handleTextFormat, handleDropdownFormat } = useMemo(() => 
    createFormatHandlers({
      hotTableRef,
      cellTypeMeta,
      setCellTypeMeta,
      setHasChanges,
      onContentChange
    }), [cellTypeMeta, setCellTypeMeta, setHasChanges, onContentChange]
  );

  const { handleFontSize, handleFontSizeChange, handleFontSizeIncrement, handleFontSizeDecrement } = useMemo(() => 
    createFontHandlers({
      fontSize,
      setFontSize,
      applyCellStyle
    }), [fontSize, setFontSize, applyCellStyle]
  );

  const { handleCopy, handlePaste, handleCut, handleSelectAll } = useMemo(() => 
    createCopyPasteHandlers({
      hotTableRef,
      setHasChanges
    }), [setHasChanges]
  );

  const { handleAddRow, handleAddColumn, handleClear } = useMemo(() => 
    createTableOperationsHandlers({
      hotTableRef,
      setHasChanges
    }), [setHasChanges]
  );

  
const searchFieldKeyupCallback = useCallback(
  (event: React.KeyboardEvent<HTMLInputElement>) => {

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setIsSearchOpen(false)
      return
    }
    const hot = hotTableRef.current?.hotInstance
    const search = hot?.getPlugin('search')
    const queryResult = search?.query(event.currentTarget.value)
    setSearchResultCount(queryResult.length)
    hot?.render()
  },
  [hotTableRef.current]
)

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
        try {
          const current = hotInstance.getData && hotInstance.getData();
          if (current) onContentChange?.(current);
        } catch {}
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

  // Helper function to detect if a value is a URL
  const isUrl = (value: any): string | null => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // More accurate URL detection patterns
    // Pattern 1: Starts with http:// or https://
    if (/^https?:\/\/.+/.test(trimmed)) {
      return trimmed;
    }
    
    // Pattern 2: Starts with www.
    if (/^www\..+\.[a-z]{2,}/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    
    // Pattern 3: Domain pattern (e.g., example.com, subdomain.example.com)
    // Must have at least one dot and a valid TLD (2+ chars)
    const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(\/.*)?$/i;
    if (domainPattern.test(trimmed) && trimmed.includes('.')) {
      // Check it's not just a number or single word
      const parts = trimmed.split('/')[0].split('.');
      if (parts.length >= 2 && parts[parts.length - 1].length >= 2) {
        return `https://${trimmed}`;
      }
    }
    
    // Pattern 4: mailto: links
    if (/^mailto:.+@.+\..+/.test(trimmed)) {
      return trimmed;
    }
    
    return null;
  };

  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(true);

  // Load CSV/XLSX content (only when src changes)
  useEffect(() => {
    if (!src && !srcBlob) {
      setLoading(false);
      return;
    }

    const loadCSVContent = createCSVLoadHandler({
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
      onSheetsLoaded: (sheets, initialActiveIndex) => {
        console.log('Loaded sheets:', sheets.map(s => s.name));
        setAllSheets(sheets);
        setActiveSheetIndex(initialActiveIndex);
      }
    });

    loadCSVContent();
  }, []);

  // Listen for conditional formatting loaded from XLSX metadata sheet
  useEffect(() => {
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ rules: ConditionalFormattingRule[] }>
      if (Array.isArray(evt.detail?.rules)) setConditionalRules(evt.detail.rules)
    }
    window.addEventListener('spreadsheet-conditional-formatting-loaded', handler as EventListener)
    return () => window.removeEventListener('spreadsheet-conditional-formatting-loaded', handler as EventListener)
  }, [])

  // Listen for charts loaded from XLSX metadata sheet
  useEffect(() => {
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ charts: ChartDefinition[] }>
      if (Array.isArray(evt.detail?.charts)) setCharts(evt.detail.charts)
    }
    window.addEventListener('spreadsheet-charts-loaded', handler as EventListener)
    return () => window.removeEventListener('spreadsheet-charts-loaded', handler as EventListener)
  }, [])

  // Sheet management functions
  const saveCurrentSheetState = useCallback(() => {
    if (allSheets.length === 0) return;
    
    const updatedSheets = [...allSheets];
    updatedSheets[activeSheetIndex] = {
      ...updatedSheets[activeSheetIndex],
      data,
      cellFormats,
      cellStyles,
      cellMeta: pendingCellMetaRef.current || {},
      conditionalRules,
      columnWidths,
      charts
    };
    setAllSheets(updatedSheets);
  }, [allSheets, activeSheetIndex, data, cellFormats, cellStyles, conditionalRules, columnWidths, charts]);

  const handleSheetChange = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= allSheets.length || newIndex === activeSheetIndex) return;
    
    // Save current sheet state
    saveCurrentSheetState();
    
    // Load new sheet
    const sheet = allSheets[newIndex];
    setData(sheet.data);
    setCellFormats(sheet.cellFormats);
    setCellStyles(sheet.cellStyles);
    pendingCellMetaRef.current = sheet.cellMeta || {};
    setConditionalRules(sheet.conditionalRules || []);
    setColumnWidths(sheet.columnWidths || {});
    setCharts(sheet.charts || []);
    setActiveSheetIndex(newIndex);
    
    // Apply cell metadata to Handsontable
    setTimeout(() => {
      if (hotTableRef.current) {
        const hot = hotTableRef.current.hotInstance;
        if (hot && sheet.cellMeta) {
          Object.entries(sheet.cellMeta).forEach(([key, meta]: [string, any]) => {
            const [row, col] = key.split('-').map(Number);
            if (!isNaN(row) && !isNaN(col)) {
              hot.setCellMeta(row, col, 'type', meta.type);
              if (meta.source) hot.setCellMeta(row, col, 'source', meta.source);
            }
          });
          hot.render();
        }
      }
    }, 100);
  }, [allSheets, activeSheetIndex, saveCurrentSheetState]);

  const handleAddSheet = useCallback(() => {
    const newSheetName = `Sheet${allSheets.length + 1}`;
    const newSheet: SheetData = {
      name: newSheetName,
      data: [['']],
      cellFormats: {},
      cellStyles: {},
      cellMeta: {}
    };
    
    // Save current sheet state
    saveCurrentSheetState();
    
    const updatedSheets = [...allSheets, newSheet];
    setAllSheets(updatedSheets);
    setActiveSheetIndex(updatedSheets.length - 1);
    
    // Load the new sheet
    setData(newSheet.data);
    setCellFormats({});
    setCellStyles({});
    pendingCellMetaRef.current = {};
    setConditionalRules([]);
    setColumnWidths({});
    setCharts([]);
  }, [allSheets, saveCurrentSheetState]);

  const handleDeleteSheet = useCallback((index: number) => {
    if (allSheets.length <= 1) return; // Don't delete the last sheet
    
    const updatedSheets = allSheets.filter((_, i) => i !== index);
    setAllSheets(updatedSheets);
    
    // If we deleted the active sheet, switch to the previous one
    if (index === activeSheetIndex) {
      const newActiveIndex = Math.max(0, index - 1);
      setActiveSheetIndex(newActiveIndex);
      const sheet = updatedSheets[newActiveIndex];
      setData(sheet.data);
      setCellFormats(sheet.cellFormats);
      setCellStyles(sheet.cellStyles);
      pendingCellMetaRef.current = sheet.cellMeta || {};
      setConditionalRules(sheet.conditionalRules || []);
      setColumnWidths(sheet.columnWidths || {});
      setCharts(sheet.charts || []);
    } else if (index < activeSheetIndex) {
      // Adjust active index if we deleted a sheet before it
      setActiveSheetIndex(activeSheetIndex - 1);
    }
  }, [allSheets, activeSheetIndex]);

  const handleRenameSheet = useCallback((index: number, newName: string) => {
    const updatedSheets = [...allSheets];
    updatedSheets[index] = {
      ...updatedSheets[index],
      name: newName
    };
    setAllSheets(updatedSheets);
  }, [allSheets]);

  const handleDuplicateSheet = useCallback((index: number) => {
    if (index < 0 || index >= allSheets.length) return;
    
    // Save current sheet state
    saveCurrentSheetState();
    
    const sheetToDuplicate = allSheets[index];
    const newSheetName = `${sheetToDuplicate.name} (Copy)`;
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
    };
    
    const updatedSheets = [...allSheets];
    updatedSheets.splice(index + 1, 0, duplicatedSheet);
    setAllSheets(updatedSheets);
    
    // Switch to the duplicated sheet
    setActiveSheetIndex(index + 1);
    setData(duplicatedSheet.data);
    setCellFormats(duplicatedSheet.cellFormats);
    setCellStyles(duplicatedSheet.cellStyles);
    pendingCellMetaRef.current = duplicatedSheet.cellMeta || {};
    setConditionalRules(duplicatedSheet.conditionalRules || []);
    setColumnWidths(duplicatedSheet.columnWidths || {});
    setCharts(duplicatedSheet.charts || []);
  }, [allSheets, saveCurrentSheetState]);

  // Auto-save current sheet state when data changes
  useEffect(() => {
    if (allSheets.length > 0 && data.length > 0) {
      saveCurrentSheetState();
    }
  }, [data, cellFormats, cellStyles, conditionalRules, columnWidths, charts]);

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



  // Display helper: format dates as MM/DD/YYYY by default when cell type is 'date'
  const formatDateDisplay = (value: any): string => {
    if (value == null || value === '') return '';
    try {
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US');
      }
      if (typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date.toLocaleDateString('en-US');
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString('en-US');
      }
    } catch {}
    return String(value);
  };


  // Handsontable context menu configuration with custom items
  const contextMenuConfig = useMemo(() => ({
    items: {
      row_above: {},
      row_below: {},
      col_left: {},
      col_right: {},
      remove_row: {},
      remove_col: {},
      undo: {},
      redo: {},
      clear_column: {},
    }
  }), []);







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
      .handsontable td.ht-dropdown-indicator {
        position: relative;
        padding-right: 18px !important;
      }
      .handsontable td.ht-dropdown-indicator::after {
        content: '▾';
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        color: #374151; /* higher contrast indicator */
        pointer-events: none;
        font-size: 12px;
        line-height: 1;
      }
      .handsontable .htSearchResult {
        background-color: #bbf7d0 !important; /* green-200 */
        color: #064e3b !important; /* dark green text for contrast */
      }
      /* Search overlay a11y helpers */
      .csv-search-overlay input#csv-editor-search-input::placeholder { color: #4b5563; opacity: 1; }
      .csv-search-overlay input#csv-editor-search-input:focus { outline: 2px solid #2563eb; outline-offset: 0; }
      .csv-search-overlay button:focus { outline: 2px solid #2563eb; outline-offset: 0; }
      
      /* AI Diff Preview Styles - matching document diff colors */
      .handsontable td.diff-cell-insertion {
        background-color: #bbf7d0 !important; /* green-200 - matches document insertion */
        position: relative;
      }
      .handsontable td.diff-cell-insertion::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        pointer-events: none;
      }
      .handsontable td.diff-cell-deletion {
        background-color: #fecaca !important; /* red-200 - matches document deletion */
        position: relative;
        text-decoration: line-through;
      }
      .handsontable td.diff-cell-deletion::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        border: 2px solid #ef4444; /* red-500 border for emphasis */
        pointer-events: none;
      }
      /* Link styling in cells */
      .handsontable td a {
        color: #2563eb !important;
        text-decoration: underline !important;
        cursor: pointer !important;
      }
      .handsontable td a:hover {
        color: #1d4ed8 !important;
        text-decoration: underline !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);


  // Listen for workspace outside clicks to deselect cells and lose focus
  useEffect(() => {
    const handleWorkspaceOutsideClick = () => {
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance && hotInstance.deselectCell) {
        hotInstance.deselectCell();
      }
      // Disable editor focus when clicking outside
      setIsEditorFocused(false);
      // Close link popover
      setLinkPopover(null);
    };

    window.addEventListener('workspace-outside-click', handleWorkspaceOutsideClick);
    
    return () => {
      window.removeEventListener('workspace-outside-click', handleWorkspaceOutsideClick);
    };
  }, []);

  // Close link popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (linkPopover) {
        const target = e.target as HTMLElement;
        const popoverElement = target.closest('[data-link-popover]');
        const linkElement = target.closest('a');
        // Don't close if clicking inside popover or on a link element
        if (!popoverElement && !linkElement) {
          setLinkPopover(null);
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (linkPopover && e.key === 'Escape') {
        setLinkPopover(null);
      }
    };

    if (linkPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [linkPopover]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const keyboardHandler = createKeyboardHandler({
      isEditorFocused,
      isSearchOpen,
      hotTableRef,
      handleBold,
      handleItalic,
      handleUnderline,
      handleRedo,
      handleUndo,
      handleCopy,
      handleCut,
      handleSelectAll,
      handleSearch: () => {
        try {
          setIsSearchOpen(true)
          requestAnimationFrame(() => {
            try {
              const el = document.getElementById('search_field') as HTMLInputElement | null
              if (el) { el.focus(); el.select() }
            } catch {}
          })
        } catch {}
      },
      handleToggleFilters,
      handleAddRow,
      handleAddColumn,
      handleClear,
      setHelpDialogOpen
    });

    document.addEventListener('keydown', keyboardHandler);
    
    return () => {
      document.removeEventListener('keydown', keyboardHandler);
    };
  }, [
    isEditorFocused,
    isSearchOpen,
    hotTableRef,
    handleBold,
    handleItalic,
    handleUnderline,
    handleRedo,
    handleUndo,
    handleCopy,
    handleCut,
    handleSelectAll,
    isSearchOpen,
    handleToggleFilters,
    handleAddRow,
    handleAddColumn,
    handleClear,
    setHelpDialogOpen
  ]);

  // Simple Conditional Formatting Dialog state
  const [cfPanelOpen, setCfPanelOpen] = useState(false)
  const [cfOperator, setCfOperator] = useState<'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between'>('gt')
  const [cfValue, setCfValue] = useState<string>('')
  const [cfValue2, setCfValue2] = useState<string>('')
  const [cfStopIfTrue, setCfStopIfTrue] = useState<boolean>(false)
  const [cfTextOperator, setCfTextOperator] = useState<'contains' | 'startsWith' | 'endsWith' | 'eq' | 'neq' | 'isEmpty' | 'isNotEmpty' | 'duplicate' | 'unique'>('contains')
  const [cfDateOperator, setCfDateOperator] = useState<'today' | 'yesterday' | 'tomorrow' | 'inLastNDays' | 'inNextNDays' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'before' | 'after' | 'on' | 'notOn'>('today')
  const [cfMode, setCfMode] = useState<'numeric' | 'text' | 'date' | 'colorScale' | 'topN' | 'bottomN'>('numeric')
  const [cfA1Range, setCfA1Range] = useState<string>('')
  const [cfMinColor, setCfMinColor] = useState<string>('#FDE68A')
  const [cfMaxColor, setCfMaxColor] = useState<string>('#F59E0B')
  const [cfTextColor, setCfTextColor] = useState<string>('')
  const [cfFillColor, setCfFillColor] = useState<string>('#FACC15')
  const [cfBold, setCfBold] = useState<boolean>(false)
  const [cfItalic, setCfItalic] = useState<boolean>(false)
  const [cfUnderline, setCfUnderline] = useState<boolean>(false)

  const openCFPanel = () => setCfPanelOpen(true)
  const closeCFPanel = () => setCfPanelOpen(false)

  const addRuleFromPanel = useMemo(() => {
    const handler = createAddCFRuleHandler({
      hotTableRef,
      getCFState: () => ({
        cfMode,
        cfOperator,
        cfTextOperator,
        cfDateOperator,
        cfA1Range,
        cfValue,
        cfValue2,
        cfStopIfTrue,
        cfMinColor,
        cfMaxColor,
        cfTextColor,
        cfFillColor,
        cfBold,
        cfItalic,
        cfUnderline,
      }),
      addConditionalRule,
      getDataSize: () => ({ rows: data.length, cols: data.reduce((m, r) => Math.max(m, r.length), 0) })
    })
    return () => handler()
  }, [hotTableRef, data, cfMode, cfOperator, cfTextOperator, cfDateOperator, cfA1Range, cfValue, cfValue2, cfStopIfTrue, cfMinColor, cfMaxColor, cfTextColor, cfFillColor, cfBold, cfItalic, cfUnderline, addConditionalRule])

  // Rules Manager state
  const [cfManagerOpen, setCfManagerOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editOperator, setEditOperator] = useState<'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between'>('gt')
  const [editValue, setEditValue] = useState<string>('')
  const [editValue2, setEditValue2] = useState<string>('')
  const [editStopIfTrue, setEditStopIfTrue] = useState<boolean>(false)

  const openManager = () => setCfManagerOpen(true)
  const closeManager = () => { setCfManagerOpen(false); setEditingRuleId(null) }

  const startEditRule = (rule: ConditionalFormattingRule) => {
    setEditingRuleId(rule.id)
    if (rule.condition.kind === 'numeric') {
      setEditOperator(rule.condition.operator as any)
      setEditValue(typeof rule.condition.value === 'number' ? String(rule.condition.value) : '')
      setEditValue2(typeof rule.condition.value2 === 'number' ? String(rule.condition.value2) : '')
    } else {
      setEditOperator('gt')
      setEditValue('')
      setEditValue2('')
    }
    setEditStopIfTrue(Boolean(rule.stopIfTrue))
  }

  const saveEditedRule = () => {
    if (!editingRuleId) return
    const v1 = editValue.trim() === '' ? undefined : Number(editValue)
    const v2 = editValue2.trim() === '' ? undefined : Number(editValue2)
    updateConditionalRule(editingRuleId, {
      condition: { kind: 'numeric', operator: editOperator, value: typeof v1 === 'number' && !Number.isNaN(v1) ? v1 : undefined, value2: typeof v2 === 'number' && !Number.isNaN(v2) ? v2 : undefined } as any,
      stopIfTrue: editStopIfTrue
    })
    setEditingRuleId(null)
  }

  const deleteRule = (id: string) => removeConditionalRule(id)

  const applySelectionToRule = (id: string) => {
    const hot = hotTableRef.current?.hotInstance
    if (!hot) return
    const sel = hot.getSelectedLast?.()
    if (!sel) return
    const [r1, c1, r2, c2] = sel
    updateConditionalRule(id, { range: { startRow: Math.min(r1, r2), endRow: Math.max(r1, r2), startCol: Math.min(c1, c2), endCol: Math.max(c1, c2) } as any })
  }

  const moveRule = (id: string, direction: 'up' | 'down') => {
    setConditionalRules((prev) => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority)
      const index = sorted.findIndex((r) => r.id === id)
      if (index === -1) return prev
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= sorted.length) return prev
      const a = sorted[index]
      const b = sorted[swapIndex]
      const ap = a.priority
      a.priority = b.priority
      b.priority = ap
      return [...sorted]
    })
  }

  // Notify parent component when formatting changes (with debounce and deep comparison to prevent infinite loops)
  const prevFormattingRef = useRef<{
    cellFormats: {[key: string]: {className?: string}};
    cellStyles: {[key: string]: React.CSSProperties};
    cellTypeMeta: {[key: string]: any};
    columnWidths: {[key: string]: number};
    conditionalFormatting: ConditionalFormattingRule[];
    cellLinks: {[key: string]: string};
  } | null>(null);
  const formattingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentFormatting = {
      cellFormats,
      cellStyles,
      cellTypeMeta,
      columnWidths,
      conditionalFormatting: conditionalRules,
      cellLinks
    };

    // Only call onFormattingChange if the formatting has actually changed
    const hasChanged = !prevFormattingRef.current || 
      JSON.stringify(prevFormattingRef.current.cellFormats) !== JSON.stringify(cellFormats) ||
      JSON.stringify(prevFormattingRef.current.cellStyles) !== JSON.stringify(cellStyles) ||
      JSON.stringify(prevFormattingRef.current.cellTypeMeta) !== JSON.stringify(cellTypeMeta) ||
      JSON.stringify(prevFormattingRef.current.columnWidths) !== JSON.stringify(columnWidths) ||
      JSON.stringify(prevFormattingRef.current.conditionalFormatting) !== JSON.stringify(conditionalRules) ||
      JSON.stringify(prevFormattingRef.current.cellLinks) !== JSON.stringify(cellLinks);

    if (hasChanged && onFormattingChangeRef.current) {
      // Clear any existing timeout
      if (formattingTimeoutRef.current) {
        clearTimeout(formattingTimeoutRef.current);
      }
      
      // Debounce the callback to prevent excessive calls
      formattingTimeoutRef.current = setTimeout(() => {
        const cb = onFormattingChangeRef.current
        if (cb) cb(currentFormatting)
        prevFormattingRef.current = currentFormatting;
      }, 100); // 100ms debounce
    }
  }, [cellFormats, cellStyles, cellTypeMeta, columnWidths, conditionalRules, cellLinks]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (formattingTimeoutRef.current) {
        clearTimeout(formattingTimeoutRef.current);
      }
    };
  }, []);



  if (loading) {
    return (
      <div style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <span style={{ marginLeft: 8, color: 'var(--accent)' }}>Loading spreadsheet...</span>
      </div>
    );
  }

  return (
    <div 
      className="csv-editor-container"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        // Check if click is outside the table area but not on toolbar
        const target = e.target as HTMLElement;
        const isTableClick = target.closest('.handsontable-container-full') || target.closest('.ht_master');
        const isToolbarClick = target.closest('[data-role="csv-toolbar"]');
        const isMenuClick = target.closest('[role="menu"]') || target.closest('[role="dialog"]');
        
        // If click is outside table and menus, deselect cells
        if (!isTableClick && !isMenuClick && !isToolbarClick) {
          const hotInstance = hotTableRef.current?.hotInstance;
          if (hotInstance && hotInstance.deselectCell) {
            hotInstance.deselectCell();
          }
        }
        
        // Re-enable focus when clicking within the CSV editor
        if (!isEditorFocused) {
          setIsEditorFocused(true);
        }
      }}
    >

      {error && (
        <div style={{ margin: 8, padding: '8px 10px', border: '1px solid #f59e0b', backgroundColor: '#fffbeb', color: '#78350f', borderRadius: 6 }}>
          {error}
        </div>
      )}

      <CSVEditorToolbar
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        handleCurrencyFormat={handleCurrencyFormat}
        handleDateFormat={handleDateFormat}
        handlePercentageFormat={handlePercentageFormat}
        handleNumberFormat={handleNumberFormat}
        handleTextFormat={handleTextFormat}
        handleDropdownFormat={handleDropdownFormat}
        handleBold={handleBold}
        handleItalic={handleItalic}
        handleUnderline={handleUnderline}
        handleAlignLeft={handleAlignLeft}
        handleAlignCenter={handleAlignCenter}
        handleAlignRight={handleAlignRight}
        handleMergeCells={handleMergeCells}
        handleToggleFilters={handleToggleFilters}
        onOpenConditionalPanel={openCFPanel}
        onOpenChartEditor={() => {
          setEditingChart(undefined)
          setIsChartEditorOpen(true)
        }}
        fontSize={fontSize}
        handleFontSizeChange={handleFontSizeChange}
        handleFontSizeIncrement={handleFontSizeIncrement}
        handleFontSizeDecrement={handleFontSizeDecrement}
        applyCellStyle={applyCellStyle}
        removeCellStyle={removeCellStyle}
        applyBordersOption={applyBordersOption}
        borderStyle={borderStyle}
        setBorderStyle={setBorderStyle}
        onSaveDocument={onSaveDocument}
        onDownloadDocument={onDownloadDocument}
        saving={saving}
        canSave={canSave}
        setHelpDialogOpen={setHelpDialogOpen}
      />

      {/* Removed separate conditional formatting control bar; functionality moved into toolbar popover */}


      {/* Spreadsheet component stretching to full height */}
      <div 
        ref={containerRef as any}
        style={{ 
          flex: 1,
          position: 'relative',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          minHeight: 0, // Allow flex item to shrink below content size
          marginBottom: 0, // Remove any margin that might hide tabs
          paddingBottom: '36px', // Add padding to prevent overlap with SheetTabs
        }}
      >
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            marginRight: cfPanelOpen ? 360 : 0
          }}
          className="handsontable-container-full"
        >
          <HotTable
            ref={hotTableRef}
            data={data}
            formulas={formulaEngine ? { engine: formulaEngine, sheetName: 'Sheet1' } as any : undefined}
            colHeaders={true}
            rowHeaders={true}
            dropdownMenu={true}
            contextMenu={contextMenuConfig as any}
            height={containerHeight}
            width="100%"
            filters={true}
            manualColumnMove={true}
            manualRowMove={true}
            licenseKey="non-commercial-and-evaluation"
            manualRowResize={true}
            manualColumnResize={true}
            outsideClickDeselects={false}
            selectionMode="multiple"
            search={true}
            afterChange={handleDataChange}
            afterSelectionEnd={(r: number, c: number, r2: number, c2: number) => { lastSelectionRef.current = [r,c,r2,c2]; }}
            afterColumnResize={(currentColumn: number, newSize: number) => {
              setColumnWidths(prev => ({
                ...prev,
                [currentColumn]: newSize
              }));
              setHasChanges(true);
            }}
            stretchH="all"
            customBorders={customBordersDefs.length ? customBordersDefs : undefined}
            minRows={Math.max(1000, data.length)}
            rowHeights={26}
            autoWrapRow={false}
            viewportRowRenderingOffset={50}
            viewportColumnRenderingOffset={50}
            cells={(row: number, col: number) => {
              const cellKey = `${row}-${col}`;
              const persisted = cellTypeMeta[cellKey];
              
              // Configure cell properties based on persisted metadata
              const cellConfig: any = {
                renderer: (instance: any, td: HTMLTableCellElement, r: number, c: number, prop: any, value: any, cellProperties: any) => {
                  const cellKey = `${r}-${c}`;
                  
                  // Delegate to appropriate base renderer based on meta.type
                  try {
                    const meta = instance.getCellMeta(r, c) || {};
                    // Re-apply persisted type meta if Handsontable meta was lost (similar to class/style persistence)
                    const persisted = cellTypeMeta[cellKey];
                    if (persisted && (!meta || meta.type !== persisted.type)) {
                      try {
                        instance.setCellMeta(r, c, 'type', persisted.type);
                        if (persisted.type === 'dropdown' && Array.isArray(persisted.source)) {
                          instance.setCellMeta(r, c, 'source', persisted.source);
                          instance.setCellMeta(r, c, 'strict', false); // Allow typing custom values
                        }
                        if (persisted.type === 'numeric' && persisted.numericFormat) {
                          instance.setCellMeta(r, c, 'numericFormat', persisted.numericFormat);
                        }
                        if (persisted.type === 'date' && persisted.dateFormat) {
                          instance.setCellMeta(r, c, 'dateFormat', persisted.dateFormat);
                        }
                      } catch {}
                    }
                    const effectiveType = (persisted && persisted.type) ? persisted.type : meta.type;
                    
                    if (effectiveType === 'checkbox') {
                      checkboxRenderer(instance, td, r, c, prop, value, cellProperties);
                    } else {
                      textRenderer(instance, td, r, c, prop, value, cellProperties);
                      // If this is a date cell, display only the date portion
                      if (effectiveType === 'date') {
                        try {
                          const display = formatDateDisplay(value);
                          td.textContent = display;
                        } catch {}
                      }
                    }
                    
                    // Auto-detect URL from cell value (only for non-checkbox cells)
                    if (effectiveType !== 'checkbox') {
                      const detectedUrl = isUrl(value);
                      if (detectedUrl && !cellLinks[cellKey]) {
                        setCellLinks(prev => ({ ...prev, [cellKey]: detectedUrl }));
                      }
                    }
                  } catch {
                    textRenderer(instance, td, r, c, prop, value, cellProperties);
                    // Also check for URLs in catch block
                    const detectedUrl = isUrl(value);
                    if (detectedUrl && !cellLinks[cellKey]) {
                      setCellLinks(prev => ({ ...prev, [cellKey]: detectedUrl }));
                    }
                  }
                  
                  const fmt = cellFormats[cellKey];
                  const sty = cellStyles[cellKey];
                  const cfClass = conditionalClassOverlay[cellKey];
                  const cfStyle = conditionalStyleOverlay[cellKey];
                  
                  // Get link URL (from stored links or auto-detected)
                  const storedLink = cellLinks[cellKey];
                  const detectedUrl = isUrl(value);
                  const linkUrl = storedLink || detectedUrl;
                  
                  const existingClasses = td.className ? td.className.split(' ').filter(Boolean) : [];
                  let mergedClasses = [...existingClasses];
                  if (fmt?.className) {
                    const classes = fmt.className.split(' ').filter(cls => cls.trim());
                    mergedClasses = classes;
                  }
                  if (cfClass) {
                    const add = cfClass.split(' ').filter(Boolean)
                    mergedClasses = [...mergedClasses, ...add]
                  }
                  try {
                    const metaForSearch = (instance as any).getCellMeta(r, c) || {};
                    if (metaForSearch.isSearchResult) {
                      if (!mergedClasses.includes('htSearchResult')) mergedClasses.push('htSearchResult');
                    }
                  } catch {}
                  td.className = mergedClasses.join(' ');
                  
                  td.style.whiteSpace = 'nowrap';
                  td.style.overflow = 'visible';
                  td.style.textOverflow = 'clip';
                  td.style.wordBreak = 'normal';
                  td.style.setProperty('overflow-wrap', 'normal');

                  if (sty && Object.keys(sty).length > 0) {
                    const styleEntries = Object.entries(sty);
                    for (const [prop, val] of styleEntries) {
                      if (val != null) {
                        try {
                          // Convert camelCase to kebab-case for CSS property names
                          const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                          td.style.setProperty(cssProperty, String(val));
                        } catch {}
                      }
                    }
                  }
                  if (cfStyle && Object.keys(cfStyle).length > 0) {
                    const entries = Object.entries(cfStyle)
                    for (const [prop, val] of entries) {
                      if (val != null) {
                        try { 
                          // Convert camelCase to kebab-case for CSS property names
                          const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                          td.style.setProperty(cssProperty, String(val)) 
                        } catch {}
                      }
                    }
                  }
                  
                  // Handle link rendering AFTER all styling is applied
                  // Check if this is a checkbox cell by checking the meta
                  const isCheckboxCell = (() => {
                    try {
                      const meta = instance.getCellMeta(r, c) || {};
                      const persisted = cellTypeMeta[cellKey];
                      const cellType = (persisted && persisted.type) ? persisted.type : meta.type;
                      return cellType === 'checkbox';
                    } catch {
                      return false;
                    }
                  })();
                  
                  // Check if cell is currently being edited - don't render link during editing
                  const isEditing = (() => {
                    try {
                      const activeEditor = instance.getActiveEditor();
                      const selected = instance.getSelected();
                      if (selected && selected.length > 0) {
                        const [selRow, selCol] = selected[0];
                        return activeEditor && selRow === r && selCol === c;
                      }
                      return false;
                    } catch {
                      return false;
                    }
                  })();
                  
                  // Only render link if not editing and not checkbox
                  if (linkUrl && !isCheckboxCell && !isEditing) {
                    // Store the original text content
                    const cellText = value ? String(value) : linkUrl;
                    // Clear and create link element
                    td.innerHTML = '';
                    const linkElement = document.createElement('a');
                    linkElement.href = linkUrl;
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                    linkElement.textContent = cellText;
                    // Use important styles to ensure link is visible
                    linkElement.style.setProperty('text-decoration', 'underline', 'important');
                    linkElement.style.setProperty('color', '#2563eb', 'important');
                    linkElement.style.setProperty('cursor', 'pointer', 'important');
                    linkElement.style.setProperty('display', 'inline-block', 'important');
                    linkElement.style.setProperty('width', '100%', 'important');
                    linkElement.style.setProperty('height', '100%', 'important');
                    // Preserve any text color from cell styles, but ensure it's still visible as a link
                    if (sty?.color) {
                      linkElement.style.setProperty('color', String(sty.color), 'important');
                    }
                    linkElement.onclick = (e) => {
                      e.preventDefault();
                      // Get cell position for popover
                      const rect = td.getBoundingClientRect();
                      const hotInstance = hotTableRef.current?.hotInstance;
                      if (hotInstance) {
                        // Select the cell first
                        hotInstance.selectCell(r, c);
                        
                        // Find the scrollable container (handsontable-container-full)
                        const scrollableContainer = td.closest('.handsontable-container-full') as HTMLElement;
                        const container = containerRef.current;
                        
                        if (container && scrollableContainer) {
                          const containerRect = container.getBoundingClientRect();
                          
                          // Calculate position relative to the container, positioned below the cell
                          const relativeTop = rect.bottom - containerRect.top + 4;
                          const relativeLeft = rect.left - containerRect.left;
                          
                          // Show popover after a brief delay to allow selection
                          setTimeout(() => {
                            setLinkPopover({
                              row: r,
                              col: c,
                              url: linkUrl,
                              position: {
                                top: relativeTop,
                                left: relativeLeft
                              }
                            });
                          }, 10);
                        }
                      }
                    };
                    td.appendChild(linkElement);
                  }
                  // Add dropdown indicator class for dropdown cells (append after formatting classes)
                  try {
                    const metaForIndicator = instance.getCellMeta(r, c) || {};
                    const persistedForIndicator = cellTypeMeta[cellKey];
                    const typeForIndicator = (persistedForIndicator && persistedForIndicator.type) ? persistedForIndicator.type : metaForIndicator.type;
                    if (typeForIndicator === 'dropdown') {
                      const currentClasses = td.className ? td.className.split(' ').filter(Boolean) : [];
                      if (!currentClasses.includes('ht-dropdown-indicator')) {
                        currentClasses.push('ht-dropdown-indicator');
                        td.className = currentClasses.join(' ');
                      }
                      
                      // Apply value-based styling for dropdown cells
                      const cellValue = value ? String(value).trim() : '';
                      if (cellValue === 'Rejected') {
                        td.style.backgroundColor = '#fee2e2';  // light red/pink
                        td.style.color = '#991b1b';  // dark red text
                      } else if (cellValue === 'Applied') {
                        td.style.backgroundColor = '#fef3c7';  // light yellow/tan
                        td.style.color = '#92400e';  // dark yellow/brown text
                      }
                    }
                  } catch {}
                  
                  return td;
                }
              };
              
              // Set cell type and properties if we have persisted metadata
              if (persisted) {
                cellConfig.type = persisted.type;
                if (persisted.type === 'dropdown' && persisted.source) {
                  cellConfig.source = persisted.source;
                  cellConfig.strict = false;
                }
                if (persisted.type === 'numeric' && persisted.numericFormat) {
                  cellConfig.numericFormat = persisted.numericFormat;
                }
                if (persisted.type === 'date' && persisted.dateFormat) {
                  cellConfig.dateFormat = persisted.dateFormat;
                }
              }
              
              return cellConfig;
            }}
            key="hot-table"
          />

          {/* Search overlay */}
          {isSearchOpen && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#ffffff',
                border: '1px solid #1f2937',
                borderRadius: 6,
                boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 1000
              }}
              className="csv-search-overlay"
              role="dialog"
              aria-label="Search table"
            >
              <span style={{ fontSize: 12, color: '#111827', minWidth: 64, textAlign: 'center' }}>{(searchResultCount > 0) ? `${searchResultCount} results` : 'No results'}</span>
              <input
            id="search_field"
            type="search"
            style={{ color: '#111827' }}
            placeholder="Search"
            onKeyUp={(event) => searchFieldKeyupCallback(event)}
          />
        </div>
          )}

          {/* Chart overlays */}
          {charts.map((chart) => {
            const chartData = extractChartData(data, chart)
            return (
              <SpreadsheetChart
                key={chart.id}
                chart={chart}
                data={chartData}
                onEdit={(chartToEdit) => {
                  setEditingChart(chartToEdit)
                  setIsChartEditorOpen(true)
                }}
                onDelete={deleteChart}
                onMove={moveChart}
                onResize={resizeChart}
              />
            )
          })}

          {/* Link Popover */}
          {linkPopover && (
            <div
              data-link-popover
              style={{
                position: 'absolute',
                top: `${linkPopover.position.top}px`,
                left: `${linkPopover.position.left}px`,
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 10002,
                minWidth: 200,
                maxWidth: 400,
                pointerEvents: 'auto'
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              <span
                style={{
                  flex: 1,
                  color: '#2563eb',
                  textDecoration: 'underline',
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  window.open(linkPopover.url, '_blank', 'noopener,noreferrer');
                  setLinkPopover(null);
                }}
                title={linkPopover.url}
              >
                {linkPopover.url.length > 30 ? `${linkPopover.url.substring(0, 30)}...` : linkPopover.url}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linkPopover.url);
                    setLinkPopover(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 4
                  }}
                  title="Copy link"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <CopyIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                </button>
                <button
                  onClick={() => {
                    const newUrl = window.prompt('Edit URL:', linkPopover.url);
                    if (newUrl !== null && newUrl.trim()) {
                      const cellKey = `${linkPopover.row}-${linkPopover.col}`;
                      let normalizedUrl = newUrl.trim();
                      if (!normalizedUrl.match(/^https?:\/\//i)) {
                        normalizedUrl = `https://${normalizedUrl}`;
                      }
                      setCellLinks(prev => ({ ...prev, [cellKey]: normalizedUrl }));
                      const hotInstance = hotTableRef.current?.hotInstance;
                      if (hotInstance) {
                        hotInstance.render();
                      }
                    }
                    setLinkPopover(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 4
                  }}
                  title="Edit link"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                </button>
                <button
                  onClick={() => {
                    const cellKey = `${linkPopover.row}-${linkPopover.col}`;
                    setCellLinks(prev => {
                      const next = { ...prev };
                      delete next[cellKey];
                      return next;
                    });
                    const hotInstance = hotTableRef.current?.hotInstance;
                    if (hotInstance) {
                      hotInstance.render();
                    }
                    setLinkPopover(null);
                    setHasChanges(true);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 4
                  }}
                  title="Remove link"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <UnlinkIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right-side Conditional Formatting Panel (scoped to middle panel) */}
      {cfPanelOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: 360,
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e5e7eb',
            boxShadow: '-6px 0 16px rgba(0,0,0,0.08)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Conditional formatting</h3>
            <Button size="sm" style={{ color: '#ffffff', backgroundColor: '#111827' , border: '1px solid #111827' }} onClick={closeCFPanel}>Close</Button>
          </div>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-range" style={{ color: '#111827' }}>Apply to range</Label>
                <Input id="cf-range" value={cfA1Range} onChange={(e) => setCfA1Range(e.target.value)} placeholder="e.g. A1:D10" style={{ color: '#111827' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-mode" style={{ color: '#111827' }}>Rule type</Label>
                <select id="cf-mode" value={cfMode} onChange={(e) => setCfMode(e.target.value as any)} className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
                  <option value="numeric">Numeric</option>
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="topN">Top N</option>
                  <option value="bottomN">Bottom N</option>
                  <option value="colorScale">Color scale</option>
                </select>
              </div>
            </div>
            {cfMode === 'numeric' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-op" style={{ color: '#111827' }}>Condition</Label>
                <select id="cf-op" value={cfOperator} onChange={(e) => setCfOperator(e.target.value as any)}
                  className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
                  <option value="gt">Greater than</option>
                  <option value="gte">Greater than or equal</option>
                  <option value="lt">Less than</option>
                  <option value="lte">Less than or equal</option>
                  <option value="eq">Equal to</option>
                  <option value="neq">Not equal to</option>
                  <option value="between">Between</option>
                </select>
              </div>
            )}
            {cfMode === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-text-op" style={{ color: '#111827' }}>Text condition</Label>
                <select id="cf-text-op" value={cfTextOperator} onChange={(e) => setCfTextOperator(e.target.value as any)} className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
                  <option value="contains">Contains</option>
                  <option value="startsWith">Starts with</option>
                  <option value="endsWith">Ends with</option>
                  <option value="eq">Equals</option>
                  <option value="neq">Not equal</option>
                  <option value="isEmpty">Is empty</option>
                  <option value="isNotEmpty">Is not empty</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="unique">Unique</option>
                </select>
              </div>
            )}
            {cfMode === 'date' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-date-op" style={{ color: '#111827' }}>Date condition</Label>
                <select id="cf-date-op" value={cfDateOperator} onChange={(e) => setCfDateOperator(e.target.value as any)} className="border rounded-md h-9 px-2 bg-white text-black" style={{ color: '#111827' }}>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="inLastNDays">In last N days</option>
                  <option value="inNextNDays">In next N days</option>
                  <option value="thisWeek">This week</option>
                  <option value="lastWeek">Last week</option>
                  <option value="nextWeek">Next week</option>
                  <option value="thisMonth">This month</option>
                  <option value="lastMonth">Last month</option>
                  <option value="nextMonth">Next month</option>
                  <option value="before">Before</option>
                  <option value="after">After</option>
                  <option value="on">On</option>
                  <option value="notOn">Not on</option>
                </select>
              </div>
            )}
            {cfMode === 'colorScale' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Label htmlFor="cf-min-color" style={{ color: '#111827' }}>Min color</Label>
                  <input id="cf-min-color" type="color" value={cfMinColor} onChange={(e) => setCfMinColor(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Label htmlFor="cf-max-color" style={{ color: '#111827' }}>Max color</Label>
                  <input id="cf-max-color" type="color" value={cfMaxColor} onChange={(e) => setCfMaxColor(e.target.value)} />
                </div>
              </div>
            )}
            <div style={{ display: cfMode === 'colorScale' ? 'none' : 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Label htmlFor="cf-val1" style={{ color: '#111827' }}>Value</Label>
                <Input id="cf-val1" style={{ color: '#111827' }} value={cfValue} onChange={(e) => setCfValue(e.target.value)} />
              </div>
              {cfOperator === 'between' && (
                <div style={{ flex: 1 }}>
                  <Label htmlFor="cf-val2" style={{ color: '#111827' }}>and</Label>
                  <Input id="cf-val2" value={cfValue2} onChange={(e) => setCfValue2(e.target.value)} />
                </div>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={cfStopIfTrue} onChange={(e) => setCfStopIfTrue(e.target.checked)} />
              <span style={{ color: '#111827' }}>Stop if true</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-fill" style={{ color: '#111827' }}>Fill</Label>
                <input id="cf-fill" type="color" value={cfFillColor} onChange={(e) => setCfFillColor(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Label htmlFor="cf-text" style={{ color: '#111827' }}>Text</Label>
                <input id="cf-text" type="color" value={cfTextColor} onChange={(e) => setCfTextColor(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={cfBold} onChange={(e) => setCfBold(e.target.checked)} />
                <span style={{ color: '#111827' }}>Bold</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={cfItalic} onChange={(e) => setCfItalic(e.target.checked)} />
                <span style={{ color: '#111827' }}>Italic</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={cfUnderline} onChange={(e) => setCfUnderline(e.target.checked)} />
                <span style={{ color: '#111827' }}>Underline</span>
              </label>
            </div>
            <Button style={{ backgroundColor: '#111827', color: '#ffffff' }} onClick={addRuleFromPanel}>Add rule</Button>

            <Separator className="my-2" style={{ borderColor: '#e5e7eb' }} />
            <p style={{ color: '#111827', fontSize: 12, fontWeight: 600 }}>Rules</p>
            <div style={{ overflowY: 'auto' }}>
              {[...conditionalRules].sort((a, b) => a.priority - b.priority).map((rule) => (
                <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>
                    {rule.label || `${rule.condition.kind === 'numeric' ? rule.condition.operator : 'rule'} R${rule.range.startRow + 1}:C${rule.range.startCol + 1}–R${rule.range.endRow + 1}:C${rule.range.endCol + 1}`}
                    {rule.stopIfTrue ? <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>(Stop if true)</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => moveRule(rule.id, 'up')} title="Move up"><ArrowUpward sx={{ fontSize: 16, color: '#111827' }} /></Button>
                    <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => moveRule(rule.id, 'down')} title="Move down"><ArrowDownward sx={{ fontSize: 16, color: '#111827' }} /></Button>
                    <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => applySelectionToRule(rule.id)} title="Use selection"><BorderAllIcon sx={{ fontSize: 16, color: '#111827' }} /></Button>
                    <Button size="icon" style={{ color: '#111827', backgroundColor: '#ffffff', border: '1px solid #111827' }} onClick={() => removeConditionalRule(rule.id)} title="Delete"><DeleteIcon sx={{ fontSize: 16, color: '#111827' }} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      
      {/* Chart Editor Modal */}
      {isChartEditorOpen && (
        <ChartEditor
          chart={editingChart}
          onSave={(chart) => {
            if (editingChart) {
              updateChart(chart.id, chart)
            } else {
              addChart(chart)
            }
            setIsChartEditorOpen(false)
            setEditingChart(undefined)
          }}
          onCancel={() => {
            setIsChartEditorOpen(false)
            setEditingChart(undefined)
          }}
          maxRows={data.length}
          maxCols={data.reduce((max, row) => Math.max(max, row.length), 0)}
        />
      )}

      {/* Sheet tabs navigation - always visible */}
      <SheetTabs
        sheets={allSheets.length > 0 ? allSheets.map((sheet, index) => ({
          name: sheet.name,
          index
        })) : [{ name: 'Sheet1', index: 0 }]}
        activeIndex={activeSheetIndex}
        onTabChange={handleSheetChange}
        onAddSheet={handleAddSheet}
        onDeleteSheet={handleDeleteSheet}
        onRenameSheet={handleRenameSheet}
        onDuplicateSheet={handleDuplicateSheet}
      />
    </div>
  );
};

export default CSVEditor;

