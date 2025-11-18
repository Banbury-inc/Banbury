interface KeyboardHandlerParams {
  isEditorFocused: boolean
  isSearchOpen: boolean
  hotTableRef: React.RefObject<any>
  handleBold: () => void
  handleItalic: () => void
  handleUnderline: () => void
  handleRedo: () => void
  handleUndo: () => void
  handleCopy: () => void
  handleCut: () => void
  handleSelectAll: () => void
  handleSearch: () => void
  handleToggleFilters: () => void
  handleAddRow: () => void
  handleAddColumn: () => void
  handleClear: () => void
  setHelpDialogOpen: (open: boolean) => void
}

export function createKeyboardHandler({
  isEditorFocused,
  isSearchOpen,
  hotTableRef,
  handleBold,
  handleItalic,
  handleUnderline,
  handleRedo,
  handleUndo,
  handleCopy,
  handleCut,
  handleSelectAll,
  handleSearch,
  handleToggleFilters,
  handleAddRow,
  handleAddColumn,
  handleClear,
  setHelpDialogOpen
}: KeyboardHandlerParams) {
  return function handleKeyDown(event: KeyboardEvent) {
    // Only handle shortcuts when the editor is focused and not in an input field
    if (!isEditorFocused) {
      return
    }
    
    const activeElement = document.activeElement
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return
    }

    const isCtrl = event.ctrlKey || event.metaKey // Support both Ctrl and Cmd (Mac)
    const isShift = event.shiftKey
    const key = event.key.toLowerCase()

    // Prevent default behavior for our shortcuts
    if (isCtrl) {
      switch (key) {
        case 'b':
          event.preventDefault()
          handleBold()
          break
        case 'i':
          event.preventDefault()
          handleItalic()
          break
        case 'u':
          event.preventDefault()
          handleUnderline()
          break
        case 'z':
          event.preventDefault()
          if (isShift) {
            handleRedo()
          } else {
            handleUndo()
          }
          break
        case 'y':
          event.preventDefault()
          handleRedo()
          break
        case 'c':
          event.preventDefault()
          handleCopy()
          break
        case 'v':
          // Let the browser/Handsontable handle native paste
          break
        case 'x':
          event.preventDefault()
          handleCut()
          break
        case 'a':
          event.preventDefault()
          handleSelectAll()
          break
        case 'f':
          event.preventDefault()
          event.stopPropagation()
          hotTableRef.current.hotInstance?.deselectCell()
          handleSearch()
          break
        case 'k':
          event.preventDefault()
          handleToggleFilters()
          break
        case 'enter':
          if (isShift) {
            event.preventDefault()
            handleAddRow()
          }
          break
        case '=':
          if (isShift) {
            event.preventDefault()
            handleAddColumn()
          }
          break
      }
    }

    // Handle other shortcuts
    switch (key) {
      case 'delete':
      case 'backspace':
        if (isSearchOpen) {
          event.preventDefault()
          event.stopPropagation()
          hotTableRef.current.hotInstance?.deselectCell()
          hotTableRef.current.hotInstance?.render()
          return
        }
        if (!isCtrl) {
          event.preventDefault()
          handleClear()
        }
        break
      case 'f2':
        event.preventDefault()
        // F2 to edit cell (this is handled by Handsontable by default)
        break
      case 'escape':
        if (isSearchOpen) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        // Otherwise let Handsontable handle cancel editing
        break
      case 'enter':
        if (!isCtrl) {
          if (isSearchOpen) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
          // Otherwise let HOT handle moving/editing
          break
        }
        break
      case 'tab':
        if (!isCtrl) {
          // Tab to move to next cell (this is handled by Handsontable by default)
          break
        }
        break
      case 'insert':
        event.preventDefault()
        handleAddRow()
        break
      case 'f1':
        event.preventDefault()
        setHelpDialogOpen(true)
        break
    }
  }
}
