interface MergeCellsHandlerParams {
  hotTableRef: React.RefObject<any>
  setHasChanges: (hasChanges: boolean) => void
}

export function createMergeCellsHandler({
  hotTableRef,
  setHasChanges
}: MergeCellsHandlerParams) {
  const handleMergeCells = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance?.getPlugin) {
      const mergeCells = hotInstance.getPlugin('mergeCells')
      if (mergeCells && mergeCells.isEnabled()) {
        const selected = hotInstance.getSelected()
        if (selected && selected.length > 0) {
          const [startRow, startCol, endRow, endCol] = selected[0]
          if (startRow !== endRow || startCol !== endCol) {
            mergeCells.merge(startRow, startCol, endRow, endCol)
            setHasChanges(true)
          }
        }
      }
    }
  }

  return {
    handleMergeCells
  }
}
