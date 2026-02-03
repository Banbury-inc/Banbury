interface CellFormatHandlerParams {
  hotTableRef: React.RefObject<any>;
  cellFormats: { [key: string]: { className?: string } };
  setCellFormats: (formats: React.SetStateAction<{ [key: string]: { className?: string } }>) => void;
  setHasChanges: (hasChanges: boolean) => void;
  onContentChange?: (data: any[][]) => void;
}

function createToggleCellFormatHandler({
  hotTableRef,
  cellFormats,
  setCellFormats,
  setHasChanges,
  onContentChange
}: CellFormatHandlerParams) {
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

  return {
    toggleCellFormat
  };
}

export { createToggleCellFormatHandler };
export type { CellFormatHandlerParams };
