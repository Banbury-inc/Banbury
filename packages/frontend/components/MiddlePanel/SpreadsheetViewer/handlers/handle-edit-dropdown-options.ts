
 export const handleEditDropdownOptions = (hotTableRef: React.RefObject<any>, setHasChanges: (hasChanges: boolean) => void, onContentChange: (content: any) => void) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    const selected = hotInstance.getSelected();
    if (!selected || selected.length === 0) return;
    const [startRow, startCol, endRow, endCol] = selected[0];
    let prefill: string | undefined;
    try {
      const meta = hotInstance.getCellMeta(startRow, startCol) || {};
      if (meta.type === 'dropdown' && Array.isArray(meta.source) && meta.source.length > 0) {
        prefill = meta.source.join(', ');
      }
    } catch {}
    const input = prompt('Enter dropdown options (comma-separated):', prefill || '');
    if (input == null) return;
    const source = input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hotInstance.setCellMeta(row, col, 'type', 'dropdown');
        hotInstance.setCellMeta(row, col, 'source', source);
        hotInstance.removeCellMeta(row, col, 'numericFormat');
        hotInstance.removeCellMeta(row, col, 'dateFormat');
      }
    }
    hotInstance.render();
    setHasChanges(true);
    try {
      const current = hotInstance.getData && hotInstance.getData();
      if (current) onContentChange?.(current);
    } catch {}
  };