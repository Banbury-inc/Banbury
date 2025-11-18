interface FormatHandlerParams {
  hotTableRef: React.RefObject<any>;
  cellTypeMeta: { [key: string]: any };
  setCellTypeMeta: (meta: { [key: string]: any }) => void;
  setHasChanges: (hasChanges: boolean) => void;
  onContentChange?: (data: any[][]) => void;
}

function createFormatHandlers({
  hotTableRef,
  cellTypeMeta,
  setCellTypeMeta,
  setHasChanges,
  onContentChange,
}: FormatHandlerParams) {

  const handleCurrencyFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        // Use batch operation to prevent multiple renders during currency format changes
        hotInstance.batch(() => {
          const [startRow, startCol, endRow, endCol] = selected[0];
          const next: {[key:string]: any} = { ...cellTypeMeta };
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              hotInstance.setCellMeta(row, col, 'type', 'numeric');
              hotInstance.setCellMeta(row, col, 'numericFormat', {
                pattern: '$0,0.00',
                culture: 'en-US'
              });
              next[`${row}-${col}`] = { type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } };
            }
          }
          setCellTypeMeta(next);
          setHasChanges(true);
          // No need for manual render() call - batch handles this
          // Don't call onContentChange for format updates to prevent unnecessary re-renders
        });
      }
    }
  };

  const handleDateFormat = (customFormat?: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        // Use batch operation to prevent multiple renders during date format changes
        hotInstance.batch(() => {
          const [startRow, startCol, endRow, endCol] = selected[0];
          const next: {[key:string]: any} = { ...cellTypeMeta };
          const dateFormat = customFormat || 'MM/DD/YYYY'; // Default to MM/DD/YYYY if no custom format provided
          
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              hotInstance.setCellMeta(row, col, 'type', 'date');
              hotInstance.setCellMeta(row, col, 'dateFormat', dateFormat);
              // Clean numeric format if switching from numeric to date
              hotInstance.removeCellMeta(row, col, 'numericFormat');
              next[`${row}-${col}`] = { type: 'date', dateFormat };
            }
          }
          setCellTypeMeta(next);
          setHasChanges(true);
          // No need for manual render() call - batch handles this
          // Don't call onContentChange for format updates to prevent unnecessary re-renders
        });
      }
    }
  };

  const handlePercentageFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        const next: {[key:string]: any} = { ...cellTypeMeta };
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'numeric');
            hotInstance.setCellMeta(row, col, 'numericFormat', {
              pattern: '0.00%'
            });
            next[`${row}-${col}`] = { type: 'numeric', numericFormat: { pattern: '0.00%' } };
          }
        }
        hotInstance.render();
        setCellTypeMeta(next);
        setHasChanges(true);
        // Don't call onContentChange for format updates to prevent unnecessary re-renders
      }
    }
  };

  const handleNumberFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        const next: {[key:string]: any} = { ...cellTypeMeta };
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'numeric');
            hotInstance.setCellMeta(row, col, 'numericFormat', {
              pattern: '0,0.00'
            });
            next[`${row}-${col}`] = { type: 'numeric', numericFormat: { pattern: '0,0.00' } };
          }
        }
        hotInstance.render();
        setCellTypeMeta(next);
        setHasChanges(true);
        // Don't call onContentChange for format updates to prevent unnecessary re-renders
      }
    }
  };

  const handleTextFormat = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (hotInstance) {
      const selected = hotInstance.getSelected();
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0];
        const next: {[key:string]: any} = { ...cellTypeMeta };
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setCellMeta(row, col, 'type', 'text');
            next[`${row}-${col}`] = { type: 'text' };
          }
        }
        hotInstance.render();
        setCellTypeMeta(next);
        setHasChanges(true);
        // Don't call onContentChange for format updates to prevent unnecessary re-renders
      }
    }
  };

  const handleDropdownFormat = () => {
    console.log('Dropdown format handler called');
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) {
      console.log('No hotInstance available');
      return;
    }
    const selected = hotInstance.getSelected();
    if (!selected || selected.length === 0) {
      console.log('No cells selected - please select cells first');
      alert('Please select cells first before applying dropdown format.');
      return;
    }
    
    console.log('Selection:', selected[0]);
    const [startRow, startCol, endRow, endCol] = selected[0];
    
    // Collect all unique values from the selected column(s)
    const uniqueValues = new Set<string>();
    const data = hotInstance.getData();
    console.log('Table data length:', data.length);
    
    // For each column in selection, collect all values from that entire column
    for (let col = startCol; col <= endCol; col++) {
      console.log(`Processing column ${col}`);
      for (let row = 0; row < data.length; row++) {
        const cellValue = data[row]?.[col];
        if (cellValue != null && cellValue !== '') {
          const stringValue = String(cellValue).trim();
          if (stringValue.length > 0) {
            uniqueValues.add(stringValue);
          }
        }
      }
    }
    
    // Convert to sorted array for consistent ordering
    const source = Array.from(uniqueValues).sort();
    console.log('Generated dropdown source:', source);
    
    // Use batch operation for consistent behavior with other format handlers
    hotInstance.batch(() => {
      const finalSource = source.length > 0 ? source : ['Option 1', 'Option 2', 'Option 3'];
      console.log('Using dropdown source:', finalSource);
      
      const next: {[key:string]: any} = { ...cellTypeMeta };
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          console.log(`Setting dropdown for cell ${row}-${col}`);
          
          // Clear any existing meta that might conflict
          hotInstance.removeCellMeta(row, col, 'type');
          hotInstance.removeCellMeta(row, col, 'numericFormat');
          hotInstance.removeCellMeta(row, col, 'dateFormat');
          hotInstance.removeCellMeta(row, col, 'source');
          hotInstance.removeCellMeta(row, col, 'strict');
          
          // Set dropdown metadata
          hotInstance.setCellMeta(row, col, 'type', 'dropdown');
          hotInstance.setCellMeta(row, col, 'source', finalSource);
          hotInstance.setCellMeta(row, col, 'strict', false); // Allow typing custom values
          
          // Store in our local state
          next[`${row}-${col}`] = { type: 'dropdown', source: finalSource, strict: false };
        }
      }
      
      setCellTypeMeta(next);
      setHasChanges(true);
      console.log('Dropdown format applied successfully with batch operation');
    });
  };

  return {
    handleCurrencyFormat,
    handleDateFormat,
    handlePercentageFormat,
    handleNumberFormat,
    handleTextFormat,
    handleDropdownFormat
  };
}

export { createFormatHandlers };
export type { FormatHandlerParams };
