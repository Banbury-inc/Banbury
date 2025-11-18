import { parseCSV } from '../utils/csv-parser';

interface AiResponseHandlerParams {
  hotTableRef: React.RefObject<any>;
  setData: (data: any[][]) => void;
  onContentChange?: (data: any[][]) => void;
  setHasChanges: (hasChanges: boolean) => void;
}

interface AiOperation {
  type: 'setCell' | 'setRange' | 'insertRows' | 'deleteRows' | 'insertCols' | 'deleteCols';
  row?: number;
  col?: number;
  value?: string | number;
  range?: { startRow: number; startCol: number; endRow: number; endCol: number };
  values?: (string | number)[][];
  index?: number;
  count?: number;
}

interface AiResponseDetail {
  operations?: AiOperation[];
  csvContent?: string;
  preview?: boolean;
}

// Store original data for preview mode
let originalSpreadsheetData: any[][] | null = null;
let originalColumnWidths: Record<number, number> | null = null;
let previewChangedCells: Set<string> | null = null;

function createAiResponseHandler({
  hotTableRef,
  setData,
  onContentChange,
  setHasChanges
}: AiResponseHandlerParams) {
  return (event: any) => {
    const detail = event?.detail || {} as AiResponseDetail;
    const { operations, csvContent, preview } = detail;

    const hot = hotTableRef.current?.hotInstance;
    if (!hot) return;

    try {
      // Store original data if this is a preview
      if (preview) {
        originalSpreadsheetData = JSON.parse(JSON.stringify(hot.getData()));
        previewChangedCells = new Set();
      }

      const changedCells: Set<string> = preview ? previewChangedCells! : new Set();

      if (csvContent && csvContent.trim().length > 0) {
        // Replace entire data with provided CSV
        const parsed = parseCSV(csvContent);
        
        if (preview) {
          // Track all cells as changed for CSV replacement
          parsed.forEach((row, rowIndex) => {
            row.forEach((_, colIndex) => {
              changedCells.add(`${rowIndex},${colIndex}`);
            });
          });
        }
        
        hot.loadData(parsed);
        setData(parsed);
        
        if (preview) {
          // Apply highlights after a brief delay to ensure data is loaded
          setTimeout(() => {
            applyPreviewHighlights(hot, changedCells);
          }, 50);
        } else {
          onContentChange?.(parsed);
        }
        
        setHasChanges(true);
        return;
      }

      if (operations && operations.length > 0) {
        // Get current data and apply operations to it
        let currentData = JSON.parse(JSON.stringify(hot.getData()));
        
        // Apply operations to the data array directly
        operations.forEach((op) => {
          switch (op.type) {
            case 'setCell': {
              const { row, col, value } = op;
              if (row !== undefined && col !== undefined && row >= 0 && col >= 0) {
                // Ensure the data array is large enough
                while (currentData.length <= row) {
                  currentData.push([]);
                }
                while (currentData[row].length <= col) {
                  currentData[row].push('');
                }
                
                // Track if value actually changed (handle undefined/null/empty as equivalent)
                const oldValue = currentData[row][col];
                const normalizedOld = oldValue === null || oldValue === undefined ? '' : String(oldValue);
                const normalizedNew = value === null || value === undefined ? '' : String(value);
                
                currentData[row][col] = value;
                
                if (preview && normalizedOld !== normalizedNew) {
                  changedCells.add(`${row},${col}`);
                }
              }
              break;
            }
            case 'setRange': {
              const { range, values } = op;
              if (range && values) {
                const { startRow, startCol, endRow, endCol } = range;
                let r = 0;
                for (let i = startRow; i <= endRow; i++) {
                  let c = 0;
                  for (let j = startCol; j <= endCol; j++) {
                    const v = values?.[r]?.[c];
                    if (v !== undefined) {
                      // Ensure the data array is large enough
                      while (currentData.length <= i) {
                        currentData.push([]);
                      }
                      while (currentData[i].length <= j) {
                        currentData[i].push('');
                      }
                      
                      // Track if value actually changed (handle undefined/null/empty as equivalent)
                      const oldValue = currentData[i][j];
                      const normalizedOld = oldValue === null || oldValue === undefined ? '' : String(oldValue);
                      const normalizedNew = v === null || v === undefined ? '' : String(v);
                      
                      currentData[i][j] = v;
                      
                      if (preview && normalizedOld !== normalizedNew) {
                        changedCells.add(`${i},${j}`);
                      }
                    }
                    c++;
                  }
                  r++;
                }
              }
              break;
            }
            case 'insertRows': {
              const { index, count = 1 } = op;
              if (index !== undefined) {
                for (let i = 0; i < count; i++) {
                  currentData.splice(index, 0, []);
                  
                  if (preview) {
                    // Mark entire row as new
                    const maxCols = Math.max(...currentData.map(row => row.length));
                    for (let col = 0; col < maxCols; col++) {
                      changedCells.add(`${index + i},${col}`);
                    }
                  }
                }
              }
              break;
            }
            case 'deleteRows': {
              const { index, count = 1 } = op;
              if (index !== undefined) {
                currentData.splice(index, count);
              }
              break;
            }
            case 'insertCols': {
              const { index, count = 1 } = op;
              if (index !== undefined) {
                currentData.forEach((row, rowIndex) => {
                  for (let i = 0; i < count; i++) {
                    row.splice(index, 0, '');
                    
                    if (preview) {
                      changedCells.add(`${rowIndex},${index + i}`);
                    }
                  }
                });
              }
              break;
            }
            case 'deleteCols': {
              const { index, count = 1 } = op;
              if (index !== undefined) {
                currentData.forEach(row => {
                  row.splice(index, count);
                });
              }
              break;
            }
            default:
              break;
          }
        });

        // Use loadData to avoid triggering afterChange with 'edit' source
        hot.loadData(currentData);
        setData(currentData);
        
        if (preview) {
          // Apply highlights after a brief delay to ensure data is loaded
          setTimeout(() => {
            applyPreviewHighlights(hot, changedCells);
          }, 50);
        } else {
          // Clear any existing highlights when applying final changes
          clearPreviewHighlights(hot);
          originalSpreadsheetData = null;
          previewChangedCells = null;
        }
        
        if (!preview) {
          onContentChange?.(currentData);
        }
        
        setHasChanges(true);
      }
    } catch {
      // Fail silently to avoid breaking user session
    }
  };
}

function applyPreviewHighlights(hot: any, changedCells: Set<string>) {
  if (!hot || !changedCells || changedCells.size === 0) return;
  
  // Use batch to avoid multiple renders
  hot.batch(() => {
    changedCells.forEach(cellKey => {
      const [row, col] = cellKey.split(',').map(Number);
      hot.setCellMeta(row, col, 'className', 'diff-cell-insertion');
    });
  });
  
  // Force a render after setting all metadata
  hot.render();
}

function clearPreviewHighlights(hot: any) {
  if (!hot || !previewChangedCells) return;
  
  // Only clear the cells that were highlighted
  hot.batch(() => {
    previewChangedCells?.forEach(cellKey => {
      const [row, col] = cellKey.split(',').map(Number);
      hot.removeCellMeta(row, col, 'className');
    });
  });
  
  hot.render();
}

// Create reject handler function
function createRejectHandler(params: AiResponseHandlerParams) {
  return () => {
    const hot = params.hotTableRef.current?.hotInstance;
    if (hot && originalSpreadsheetData) {
      // Clear highlights first
      clearPreviewHighlights(hot);
      
      // Restore original data
      hot.loadData(originalSpreadsheetData);
      params.setData(originalSpreadsheetData);
      
      // Clear stored data
      originalSpreadsheetData = null;
      originalColumnWidths = null;
      previewChangedCells = null;
    }
  };
}

export { createAiResponseHandler, createRejectHandler };
export type { AiResponseHandlerParams, AiOperation, AiResponseDetail };
