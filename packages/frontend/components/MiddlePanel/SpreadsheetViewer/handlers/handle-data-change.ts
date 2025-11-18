interface DataChangeHandlerParams {
  hotTableRef: React.RefObject<any>;
  setData: (data: any[][]) => void;
  onContentChange?: (data: any[][]) => void;
  setHasChanges: (hasChanges: boolean) => void;
  cellTypeMeta: { [key: string]: any };
  setCellTypeMeta: (meta: { [key: string]: any }) => void;
}

function createDataChangeHandler({
  hotTableRef,
  setData,
  onContentChange,
  setHasChanges,
  cellTypeMeta,
  setCellTypeMeta
}: DataChangeHandlerParams) {
  return (changes: any, source: string) => {
    if (source === 'loadData' || source === 'updateData' || !changes) return;
    
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;

    // Use batch operation to prevent multiple renders
    hotInstance.batch(() => {
      if (source === 'edit' && changes) {
        const next: {[key:string]: any} = { ...cellTypeMeta };
        let hasDropdownUpdates = false;

        for (const [row, col, oldValue, newValue] of changes) {
          const cellMeta = hotInstance.getCellMeta(row, col);
          
          // Handle dropdown cells
          if (cellMeta && cellMeta.type === 'dropdown' && Array.isArray(cellMeta.source)) {
            const currentSource = [...cellMeta.source];
            const trimmedNewValue = String(newValue || '').trim();
            
            // If the new value is not in the current source and it's not empty, add it
            if (trimmedNewValue && !currentSource.includes(trimmedNewValue)) {
              // Add the new option
              currentSource.push(trimmedNewValue);
              currentSource.sort(); // Keep sorted
              
              // Update all dropdown cells in the same column with the new source
              const currentData = hotInstance.getData();
              const numRows = currentData.length;
              
              for (let r = 0; r < numRows; r++) {
                const meta = hotInstance.getCellMeta(r, col);
                if (meta && meta.type === 'dropdown') {
                  hotInstance.setCellMeta(r, col, 'source', currentSource);
                  hotInstance.setCellMeta(r, col, 'strict', false); // Allow typing custom values
                  next[`${r}-${col}`] = { type: 'dropdown', source: currentSource, strict: false };
                }
              }
              
              hasDropdownUpdates = true;
            }
          }
        }

        // Only update state if there were actual dropdown changes
        if (hasDropdownUpdates) {
          setCellTypeMeta(next);
        }
      }

      // Set changes flag and update data - all within the batch to avoid multiple renders
      setHasChanges(true);
      
      if (source === 'edit' || source === 'paste' || source === 'autofill' || source === 'cut') {
        // Use source data to preserve formulas (strings beginning with '=')
        const currentData = hotInstance.getSourceData ? hotInstance.getSourceData() : hotInstance.getData();
        // Use requestAnimationFrame to defer state updates until after batch completes
        requestAnimationFrame(() => {
          setData(currentData);
          onContentChange?.(currentData);
        });
      }
    });
  };
}

export { createDataChangeHandler };
export type { DataChangeHandlerParams };
