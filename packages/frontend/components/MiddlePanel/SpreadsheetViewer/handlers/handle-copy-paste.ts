interface CopyPasteHandlerParams {
  hotTableRef: React.RefObject<any>
  setHasChanges: (hasChanges: boolean) => void
}

export function createCopyPasteHandlers({
  hotTableRef,
  setHasChanges
}: CopyPasteHandlerParams) {
  const handleCopy = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance?.getPlugin) {
      const copyPaste = hotInstance.getPlugin('copyPaste')
      if (copyPaste) {
        copyPaste.copy()
      }
    }
  }

  const handlePaste = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance?.getPlugin) {
      const copyPaste = hotInstance.getPlugin('copyPaste')
      if (copyPaste) {
        copyPaste.paste()
        setHasChanges(true)
      }
    }
  }

  const handleCut = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance?.getPlugin) {
      const copyPaste = hotInstance.getPlugin('copyPaste')
      if (copyPaste) {
        copyPaste.cut()
        setHasChanges(true)
      }
    }
  }

  const handleSelectAll = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      hotInstance.selectAll()
    }
  }

  return {
    handleCopy,
    handlePaste,
    handleCut,
    handleSelectAll
  }
}
