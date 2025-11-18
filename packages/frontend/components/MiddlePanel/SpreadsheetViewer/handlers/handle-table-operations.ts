interface TableOperationsHandlerParams {
  hotTableRef: React.RefObject<any>
  setHasChanges: (hasChanges: boolean) => void
}

export function createTableOperationsHandlers({
  hotTableRef,
  setHasChanges
}: TableOperationsHandlerParams) {
  const handleSearch = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance?.getPlugin) {
      const search = hotInstance.getPlugin('search')
      if (search && search.isEnabled()) {
        // Focus on search input if available
        const searchInput = document.querySelector('.handsontable .htSearchInput')
        if (searchInput instanceof HTMLInputElement) {
          searchInput.focus()
        }
      }
    }
  }

  const handleAddRow = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const selected = hotInstance.getSelected()
      if (selected && selected.length > 0) {
        const [startRow] = selected[0]
        hotInstance.alter('insert_row', startRow + 1, 1)
        setHasChanges(true)
      }
    }
  }

  const handleAddColumn = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const selected = hotInstance.getSelected()
      if (selected && selected.length > 0) {
        const [, startCol] = selected[0]
        hotInstance.alter('insert_col', startCol + 1, 1)
        setHasChanges(true)
      }
    }
  }

  const handleClear = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const selected = hotInstance.getSelected()
      if (selected && selected.length > 0) {
        const [startRow, startCol, endRow, endCol] = selected[0]
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            hotInstance.setDataAtCell(row, col, '')
          }
        }
        setHasChanges(true)
      }
    }
  }

  return {
    handleSearch,
    handleAddRow,
    handleAddColumn,
    handleClear
  }
}
