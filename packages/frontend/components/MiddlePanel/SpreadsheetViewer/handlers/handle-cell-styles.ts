interface CellStyleHandlerParams {
  hotTableRef: React.RefObject<any>;
  setCellStyles: (styles: React.SetStateAction<{ [key: string]: React.CSSProperties }>) => void;
  setHasChanges: (hasChanges: boolean) => void;
  lastSelectionRef: React.RefObject<[number, number, number, number] | null>;
}

function createCellStyleHandlers({
  hotTableRef,
  setCellStyles,
  setHasChanges,
  lastSelectionRef
}: CellStyleHandlerParams) {
  
  // Helper function to get selection
  const getSelection = (hotInstance: any) => {
    let sel = hotInstance.getSelected();
    if (!sel || sel.length === 0) {
      if (lastSelectionRef.current) {
        const [r, c, r2, c2] = lastSelectionRef.current;
        sel = [[r, c, r2, c2]] as any;
      } else {
        return null;
      }
    }
    return sel[0] as [number, number, number, number];
  };

  // Helper function to apply styles via React state (optimized with batch operations)
  const applyCellStyle = (styleProperty: string, styleValue: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const selection = getSelection(hotInstance);
    if (!selection) return;
    
    const [startRow, startCol, endRow, endCol] = selection;
    
    // Use batch operation to prevent multiple renders during style application
    hotInstance.batch(() => {
      // Batch style updates for better performance
      setCellStyles(prevStyles => {
        const nextStyles = { ...prevStyles };
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const key = `${row}-${col}`;
            const current = nextStyles[key] || {};
            nextStyles[key] = { ...current, [styleProperty]: styleValue };
          }
        }
        return nextStyles;
      });
      
      setHasChanges(true);
      
      // No need for requestAnimationFrame or manual render() call - batch handles this
    });
  };

  const removeCellStyle = (styleProperty: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const selection = getSelection(hotInstance);
    if (!selection) return;
    
    const [startRow, startCol, endRow, endCol] = selection;
    
    // Use batch operation to prevent multiple renders during style removal
    hotInstance.batch(() => {
      // Batch style updates for better performance
      setCellStyles(prevStyles => {
        const nextStyles = { ...prevStyles };
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
        return nextStyles;
      });
      
      setHasChanges(true);
      
      // No need for requestAnimationFrame or manual render() call - batch handles this
    });
  };

  return {
    applyCellStyle,
    removeCellStyle
  };
}

export { createCellStyleHandlers };
export type { CellStyleHandlerParams };
