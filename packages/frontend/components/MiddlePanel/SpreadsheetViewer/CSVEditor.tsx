import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { registerRenderer } from 'handsontable/renderers';
import 'handsontable/dist/handsontable.full.css';
import { createAiResponseHandler, createRejectHandler } from './handlers/handle-ai-response';
import { createDataChangeHandler } from './handlers/handle-data-change';
import { createCellStyleHandlers } from './handlers/handle-cell-styles';
import { createAlignmentHandlers } from './handlers/handle-alignment';
import { createBorderHandlers } from './handlers/handle-borders';
import { createFormatHandlers } from './handlers/handle-formats';
import { createFontHandlers } from './handlers/handle-font';
import { createKeyboardHandler } from './handlers/handle-keyboard';
import { createVimModeHandler } from './handlers/handle-vim-mode';
import type { VimMode } from './handlers/handle-vim-mode';
import { createCSVLoadHandler } from './handlers/handle-csv-load';
import { createFormulaEngine } from './handlers/handle-formulas';
import { createCopyPasteHandlers } from './handlers/handle-copy-paste';
import { createTableOperationsHandlers } from './handlers/handle-table-operations';
import { isUrl } from './utils/is-url';
import { createFormulaSuggestionHandlers } from './handlers/handle-formula-suggestions';
import { createFormulaNavigationHandler } from './handlers/handle-formula-navigation';
import CSVEditorToolbar from './components/CSVEditorToolbar/CSVEditorToolbar';
import { SheetTabs } from './components/SheetTabs';
import { SearchOverlay } from './components/SearchOverlay';
import { ConditionalFormattingPanel } from './components/ConditionalFormattingPanel';
import { LinkPopover } from './components/LinkPopover';
import { VimModeIndicator } from './components/VimModeIndicator';
import { createConditionalFormattingHandlers, computeConditionalFormats } from './handlers/handle-conditional-formatting';
import type { ConditionalFormattingRule } from './handlers/handle-conditional-formatting';
import type { SheetData } from './handlers/handle-csv-load';
import { SpreadsheetChart } from './components/SpreadsheetChart';
import { ChartEditor } from './components/ChartEditor';
import { createChartHandlers, extractChartData } from './handlers/handle-charts';
import type { ChartDefinition } from './types/chart-types';
import { createFullscreenHandler } from './handlers/handle-fullscreen';
import { createOpenCellUrlHandler } from './handlers/handle-open-cell-url';
import { createToggleCellFormatHandler } from './handlers/handle-cell-format';
import { parseCSVWithMeta } from './handlers/handle-csv-meta';
import { createToggleFiltersHandler } from './handlers/handle-toggle-filters';
import { createMergeCellsHandler } from './handlers/handle-merge-cells';
import { createSheetChangeHandler } from './handlers/handle-sheet-change';
import { createDeleteSheetHandler } from './handlers/handle-delete-sheet';
import { createDuplicateSheetHandler } from './handlers/handle-duplicate-sheet';
import { createCellRenderer } from './handlers/handle-cell-renderer';
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
  onContentChange,
  onFormattingChange,
  onSaveDocument,
  onDownloadDocument,
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
  const [cellLinks, setCellLinks] = useState<{[key: string]: string}>({});
  const [linkPopover, setLinkPopover] = useState<{row: number; col: number; url: string; position: {top: number; left: number}} | null>(null);
  const [charts, setCharts] = useState<ChartDefinition[]>([]);
  const [isChartEditorOpen, setIsChartEditorOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartDefinition | undefined>(undefined);
  const [allSheets, setAllSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [isVimMode, setIsVimMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('vimMode') === 'true'
  })
  const [vimDisplayMode, setVimDisplayMode] = useState<VimMode>('normal')
  const vimStateRef = useRef<{ mode: 'normal' | 'insert' | 'visual' | 'visual-line' | 'visual-column', commandBuffer: string, pendingOperator: string | null, yankRegister: any[][] | null, yankType: 'cells' | 'rows' | 'columns' | null, visualStartCell: { row: number, col: number } | null } | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(true);

  const pendingCellMetaRef = useRef<Record<string, { 
    type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; 
    source?: string[]; 
    numericFormat?: { pattern?: string; culture?: string };
    dateFormat?: string;
  }> | null>(null);



  const parseCSVWithMetaHandler = useCallback((content: string) => {
    return parseCSVWithMeta(content, {
      setCellLinks,
      setColumnWidths,
      pendingCellMetaRef,
      setCellFormats,
      setCellStyles,
      setCellTypeMeta,
      setConditionalRules,
      setCharts
    })
  }, [setCellLinks, setColumnWidths, setCellFormats, setCellStyles, setCellTypeMeta, setConditionalRules, setCharts])



  useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const toolbarHeight = 40;
      const padding = 20;
      const calculatedHeight = Math.max(600, viewportHeight - toolbarHeight - padding);
      setContainerHeight(calculatedHeight);
    };

    calculateHeight();

    const handleResize = () => {
      calculateHeight();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    function handleStorageChange() {
      setIsVimMode(localStorage.getItem('vimMode') === 'true')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
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
        if (meta.type === 'dropdown' || meta.type === 'checkbox') {
          hotInstance.removeCellMeta(r, c, 'numericFormat');
          hotInstance.removeCellMeta(r, c, 'dateFormat');
        }
      }
      hotInstance.render();
      const mirrored: {[key:string]: any} = {};
      Object.entries(pending).forEach(([k, m]) => { mirrored[k] = m as any; });
      setCellTypeMeta((prev) => ({ ...prev, ...mirrored }));
    } catch {}
    pendingCellMetaRef.current = null;
  }, [data]);

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

  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;
  const onFormattingChangeRef = useRef(onFormattingChange);
  onFormattingChangeRef.current = onFormattingChange;

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

  // Create formula navigation handler
  const formulaNavigationHandler = useMemo(() => {
    return createFormulaNavigationHandler({
      hotTableRef,
    });
  }, []);

  // Attach formula suggestions to the in-cell editor lifecycle
  useEffect(() => {
    const { attach, detach } = createFormulaSuggestionHandlers({ hotTableRef })
    attach()
    return () => detach()
  }, [])

  // Attach formula navigation handlers
  useEffect(() => {
    const { attach, detach } = formulaNavigationHandler
    attach()
    return () => detach()
  }, [formulaNavigationHandler])

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
      if ((source === 'edit' || source === 'paste' || source === 'autofill') && changes) {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;

        // Batch all link changes to avoid multiple state updates
        const linkUpdates: { [key: string]: string | undefined } = {};
        let hasLinkChanges = false;

        for (const [row, col, oldValue, newValue] of changes) {
          const cellKey = `${row}-${col}`;
          const hasLink = cellLinks[cellKey];

          if (hasLink) {
            // Check if the new value is still a URL
            const isStillUrl = isUrl(newValue);

            if (!isStillUrl) {
              // Remove the link if the new value is not a URL
              linkUpdates[cellKey] = undefined;
              hasLinkChanges = true;
            } else {
              // Update the link URL if it changed
              const detectedUrl = isUrl(newValue);
              if (detectedUrl && detectedUrl !== hasLink) {
                linkUpdates[cellKey] = detectedUrl;
                hasLinkChanges = true;
              }
            }
          } else {
            // Check if a new URL was entered
            const detectedUrl = isUrl(newValue);
            if (detectedUrl) {
              linkUpdates[cellKey] = detectedUrl;
              hasLinkChanges = true;
            }
          }
        }

        // Apply all link changes in a single batched state update
        if (hasLinkChanges) {
          requestAnimationFrame(() => {
            setCellLinks(prev => {
              const next = { ...prev };
              for (const [key, value] of Object.entries(linkUpdates)) {
                if (value === undefined) {
                  delete next[key];
                } else {
                  next[key] = value;
                }
              }
              return next;
            });
            setHasChanges(true);
          });
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

  const { handleToggleFilters } = useMemo(() => 
    createToggleFiltersHandler({
      hotTableRef
    }), []
  );

  const { handleMergeCells } = useMemo(() => 
    createMergeCellsHandler({
      hotTableRef,
      setHasChanges
    }), [setHasChanges]
  );


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

  // Fullscreen and URL handlers for vim mode
  const { toggleFullscreen } = useMemo(() => 
    createFullscreenHandler({ containerRef }), [containerRef]
  );

  const { openUrlInCurrentCell } = useMemo(() => 
    createOpenCellUrlHandler({ hotTableRef }), []
  );

  // Wrap option handler for vim mode
  const applyWrapOption = useCallback((option: 'wrap' | 'overflow' | 'clip') => {
    const wrapStyleProperties: Array<'whiteSpace' | 'overflow' | 'textOverflow' | 'wordBreak' | 'overflowWrap'> = [
      'whiteSpace', 'overflow', 'textOverflow', 'wordBreak', 'overflowWrap'
    ];
    wrapStyleProperties.forEach(property => {
      try { removeCellStyle(property); } catch {}
    });

    if (option === 'overflow') {
      applyCellStyle('whiteSpace', 'nowrap');
      applyCellStyle('overflow', 'visible');
      applyCellStyle('textOverflow', 'clip');
      applyCellStyle('wordBreak', 'normal');
      applyCellStyle('overflowWrap', 'normal');
    } else if (option === 'wrap') {
      applyCellStyle('whiteSpace', 'normal');
      applyCellStyle('wordBreak', 'break-word');
      applyCellStyle('overflow', 'hidden');
      applyCellStyle('textOverflow', 'clip');
      applyCellStyle('overflowWrap', 'anywhere');
    } else {
      // clip
      applyCellStyle('whiteSpace', 'nowrap');
      applyCellStyle('overflow', 'hidden');
      applyCellStyle('textOverflow', 'clip');
    }
  }, [applyCellStyle, removeCellStyle]);

  // Create vim mode handler with all callbacks
  const vimModeHandler = useMemo(() => {
    return createVimModeHandler({
      hotTableRef,
      setHasChanges,
      handleUndo,
      handleRedo,
      handleCopy,
      handlePaste,
      handleAlignLeft,
      handleAlignCenter,
      handleAlignRight,
      applyWrapOption,
      toggleFullscreen,
      openUrlInCurrentCell,
      stateRef: vimStateRef,
    });
  }, [
      setHasChanges,
      handleUndo,
      handleRedo,
      handleCopy,
      handlePaste,
      handleAlignLeft,
      handleAlignCenter,
      handleAlignRight,
      applyWrapOption,
      toggleFullscreen,
      openUrlInCurrentCell,
    ]
  );

  // Poll for vim mode changes (for display updates)
  useEffect(() => {
    if (!isVimMode) return
    const interval = setInterval(() => {
      setVimDisplayMode(vimModeHandler.getMode())
    }, 100)
    return () => clearInterval(interval)
  }, [isVimMode, vimModeHandler])

  
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

  const { toggleCellFormat } = useMemo(() => 
    createToggleCellFormatHandler({
      hotTableRef,
      cellFormats,
      setCellFormats,
      setHasChanges,
      onContentChange
    }), [cellFormats, setCellFormats, setHasChanges, onContentChange]
  );

  const handleBold = () => {
    toggleCellFormat('ht-bold');
  };

  const handleItalic = () => {
    toggleCellFormat('ht-italic');
  };

  const handleUnderline = () => {
    toggleCellFormat('ht-underline');
  };

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
      parseCSVWithMeta: parseCSVWithMetaHandler,
      onSheetsLoaded: (sheets, initialActiveIndex) => {
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

  const handleSheetChange = useCallback(
    createSheetChangeHandler({
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
    }),
    [allSheets, activeSheetIndex, saveCurrentSheetState, setData, setCellFormats, setCellStyles, setConditionalRules, setColumnWidths, setCharts, setActiveSheetIndex, hotTableRef]
  );

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

  const handleDeleteSheet = useCallback(
    createDeleteSheetHandler({
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
    }),
    [allSheets, activeSheetIndex, setAllSheets, setActiveSheetIndex, setData, setCellFormats, setCellStyles, setConditionalRules, setColumnWidths, setCharts]
  );

  const handleRenameSheet = useCallback((index: number, newName: string) => {
    const updatedSheets = [...allSheets];
    updatedSheets[index] = {
      ...updatedSheets[index],
      name: newName
    };
    setAllSheets(updatedSheets);
  }, [allSheets]);

  const handleDuplicateSheet = useCallback(
    createDuplicateSheetHandler({
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
    }),
    [allSheets, saveCurrentSheetState, setAllSheets, setActiveSheetIndex, setData, setCellFormats, setCellStyles, setConditionalRules, setColumnWidths, setCharts]
  );

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
      isVimMode,
      vimModeHandler,
      formulaNavigationHandler
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
    isVimMode,
    vimModeHandler,
    formulaNavigationHandler
  ]);

  // Conditional Formatting Panel state
  const [cfPanelOpen, setCfPanelOpen] = useState(false)

  const openCFPanel = () => setCfPanelOpen(true)
  const closeCFPanel = () => setCfPanelOpen(false)

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
              
              // Create cell renderer function
              const cellRenderer = createCellRenderer({
                cellTypeMeta,
                cellLinks,
                setCellLinks,
                cellFormats,
                cellStyles,
                conditionalClassOverlay,
                conditionalStyleOverlay,
                hotTableRef,
                containerRef,
                setLinkPopover
              });
              
              // Configure cell properties based on persisted metadata
              const cellConfig: any = {
                renderer: cellRenderer
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
          <SearchOverlay
            isOpen={isSearchOpen}
            searchResultCount={searchResultCount}
            onSearchKeyUp={searchFieldKeyupCallback}
          />

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
          <LinkPopover
            linkPopover={linkPopover}
            onClose={() => setLinkPopover(null)}
            onEdit={(row, col, newUrl) => {
              const cellKey = `${row}-${col}`;
              setCellLinks(prev => ({ ...prev, [cellKey]: newUrl }));
              const hotInstance = hotTableRef.current?.hotInstance;
              if (hotInstance) {
                hotInstance.render();
              }
            }}
            onRemove={(row, col) => {
              const cellKey = `${row}-${col}`;
              setCellLinks(prev => {
                const next = { ...prev };
                delete next[cellKey];
                return next;
              });
              const hotInstance = hotTableRef.current?.hotInstance;
              if (hotInstance) {
                hotInstance.render();
              }
              setHasChanges(true);
            }}
          />

        </div>
      </div>

      {/* Right-side Conditional Formatting Panel */}
      <ConditionalFormattingPanel
        isOpen={cfPanelOpen}
        onClose={closeCFPanel}
        conditionalRules={conditionalRules}
        onAddRule={addConditionalRule}
        onUpdateRule={updateConditionalRule}
        onRemoveRule={removeConditionalRule}
        hotTableRef={hotTableRef}
        data={data}
        onMoveRule={moveRule}
      />

      
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

      {/* Vim mode indicator */}
      <VimModeIndicator isVimMode={isVimMode} vimDisplayMode={vimDisplayMode} />

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

