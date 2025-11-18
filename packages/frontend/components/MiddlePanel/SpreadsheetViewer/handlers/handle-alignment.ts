interface AlignmentHandlerParams {
  hotTableRef: React.RefObject<any>;
  cellFormats: { [key: string]: any };
  setCellFormats: (formats: { [key: string]: any }) => void;
  setHasChanges: (hasChanges: boolean) => void;
}

function createAlignmentHandlers({
  hotTableRef,
  cellFormats,
  setCellFormats,
  setHasChanges
}: AlignmentHandlerParams) {
  
  // Helper function to set cell alignment (optimized with batch operations)
  const setCellAlignment = (alignmentClass: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        // Use batch operation to prevent multiple renders during alignment changes
        hotInstance.batch(() => {
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
          setHasChanges(true);
          // No need for manual render() call - batch handles this
          // Don't call onContentChange for format updates to prevent unnecessary re-renders
        });
      }
    }
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

  return {
    setCellAlignment,
    handleAlignLeft,
    handleAlignCenter,
    handleAlignRight
  };
}

export { createAlignmentHandlers };
export type { AlignmentHandlerParams };
