import React from 'react'

export type VimMode = 'normal' | 'insert' | 'visual' | 'visual-line' | 'visual-column'

interface VimState {
  mode: VimMode
  commandBuffer: string
  pendingOperator: string | null
  yankRegister: any[][] | null
  yankType: 'cells' | 'rows' | 'columns' | null
  visualStartCell: { row: number; col: number } | null
}

interface VimModeHandlerParams {
  hotTableRef: React.RefObject<any>
  setHasChanges: (hasChanges: boolean) => void
  // Action callbacks
  handleUndo?: () => void
  handleRedo?: () => void
  handleCopy?: () => void
  handlePaste?: () => void
  handleAlignLeft?: () => void
  handleAlignCenter?: () => void
  handleAlignRight?: () => void
  applyWrapOption?: (option: 'wrap' | 'overflow' | 'clip') => void
  setHelpDialogOpen?: (open: boolean) => void
  toggleFullscreen?: () => void
  openUrlInCurrentCell?: () => void
  stateRef?: React.MutableRefObject<VimState | null>
}

export function createVimModeHandler(params: VimModeHandlerParams) {
  const {
    hotTableRef,
    setHasChanges,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleAlignLeft,
    handleAlignCenter,
    handleAlignRight,
    applyWrapOption,
    setHelpDialogOpen,
    toggleFullscreen,
    openUrlInCurrentCell,
    stateRef,
  } = params

  // Use persistent state from ref if available, otherwise create new state
  let state: VimState = stateRef?.current || {
    mode: 'normal',
    commandBuffer: '',
    pendingOperator: null,
    yankRegister: null,
    yankType: null,
    visualStartCell: null,
  }
  
  // Store state in ref for persistence across handler recreations
  if (stateRef) {
    stateRef.current = state
  }

  // Track when we're intentionally entering insert mode to prevent Handsontable from closing the editor
  let enteringInsertMode = false

  function getHot() {
    return hotTableRef.current?.hotInstance
  }

  function getCurrentPosition() {
    const hot = getHot()
    if (!hot) return null
    const selected = hot.getSelectedLast()
    if (!selected) return null
    
    // In visual modes, return the cursor position (end of selection)
    if (state.mode === 'visual' || state.mode === 'visual-line' || state.mode === 'visual-column') {
      return { row: selected[2], col: selected[3] }
    }
    
    return { row: selected[0], col: selected[1] }
  }

  // === Navigation Helpers ===

  function moveToCell(row: number, col: number) {
    const hot = getHot()
    if (!hot) return

    // Handle active editor before navigation to prevent value loss
    const currentPos = getCurrentPosition()
    if (currentPos && !enteringInsertMode) {
      const editor = hot.getActiveEditor()
      if (editor && editor.isOpened && editor.isOpened()) {
        const editorValue = editor.getValue ? editor.getValue() : null
        const cellValue = hot.getDataAtCell(currentPos.row, currentPos.col)
        
        if ((!editorValue || editorValue === '') && cellValue) {
          try {
            if (editor.setValue) editor.setValue(cellValue)
            if (editor.close) editor.close()
          } catch {
            if (editor.cancelEditing) editor.cancelEditing()
          }
        } else if (editorValue && editorValue !== cellValue) {
          editor.finishEditing()
        } else {
          if (editor.close) editor.close()
        }
      }
    }

    const maxRow = hot.countRows() - 1
    const maxCol = hot.countCols() - 1

    const safeRow = Math.max(0, Math.min(row, maxRow))
    const safeCol = Math.max(0, Math.min(col, maxCol))

    if (state.mode === 'visual' && state.visualStartCell) {
      // Extend cell selection
      hot.selectCell(
        state.visualStartCell.row,
        state.visualStartCell.col,
        safeRow,
        safeCol
      )
    } else if (state.mode === 'visual-line' && state.visualStartCell) {
      // Select full rows
      hot.selectCell(
        state.visualStartCell.row,
        0,
        safeRow,
        maxCol
      )
    } else if (state.mode === 'visual-column' && state.visualStartCell) {
      // Select full columns
      hot.selectCell(
        0,
        state.visualStartCell.col,
        maxRow,
        safeCol
      )
    } else {
      hot.selectCell(safeRow, safeCol)
    }
  }

  function moveByMotion(motion: string, count: number) {
    const pos = getCurrentPosition()
    if (!pos) return

    const hot = getHot()
    if (!hot) return

    switch (motion) {
      case 'h': // Left
        moveToCell(pos.row, pos.col - count)
        break
      case 'j': // Down
        moveToCell(pos.row + count, pos.col)
        break
      case 'k': // Up
        moveToCell(pos.row - count, pos.col)
        break
      case 'l': // Right
        moveToCell(pos.row, pos.col + count)
        break
      case 'w': // Next non-empty cell
        moveWordForward(count)
        break
      case 'b': // Previous non-empty cell
        moveWordBackward(count)
        break
      case 'e': // End of word
        moveWordForward(count)
        break
      case 'gg': // First row
        moveToCell(0, pos.col)
        break
      case 'G': // Last row
        moveToCell(hot.countRows() - 1, pos.col)
        break
      case '0': // First column
        moveToCell(pos.row, 0)
        break
      case '$': // Last column
        moveToCell(pos.row, hot.countCols() - 1)
        break
    }
  }

  function moveWordForward(count: number) {
    const pos = getCurrentPosition()
    if (!pos) return

    const hot = getHot()
    if (!hot) return

    let { row, col } = pos
    const maxCol = hot.countCols() - 1

    for (let i = 0; i < count; i++) {
      let found = false
      for (let c = col + 1; c <= maxCol; c++) {
        const value = hot.getDataAtCell(row, c)
        if (value !== null && value !== '' && value !== undefined) {
          col = c
          found = true
          break
        }
      }
      if (!found) {
        col = maxCol
        break
      }
    }

    moveToCell(row, col)
  }

  function moveWordBackward(count: number) {
    const pos = getCurrentPosition()
    if (!pos) return

    const hot = getHot()
    if (!hot) return

    let { row, col } = pos

    for (let i = 0; i < count; i++) {
      let found = false
      for (let c = col - 1; c >= 0; c--) {
        const value = hot.getDataAtCell(row, c)
        if (value !== null && value !== '' && value !== undefined) {
          col = c
          found = true
          break
        }
      }
      if (!found) {
        col = 0
        break
      }
    }

    moveToCell(row, col)
  }

  // === Viewport Scrolling ===

  function scrollHalfPage(direction: 'down' | 'up') {
    const hot = getHot()
    if (!hot) return

    const pos = getCurrentPosition()
    if (!pos) return

    // Try to get visible row count
    let visibleRows = 20 // fallback
    try {
      if (hot.countRenderedRows) {
        visibleRows = hot.countRenderedRows()
      } else if (hot.countVisibleRows) {
        visibleRows = hot.countVisibleRows()
      }
    } catch {}

    const halfPage = Math.max(1, Math.floor(visibleRows / 2))
    const maxRow = hot.countRows() - 1

    let targetRow: number
    if (direction === 'down') {
      targetRow = Math.min(pos.row + halfPage, maxRow)
    } else {
      targetRow = Math.max(pos.row - halfPage, 0)
    }

    // Move cursor and scroll viewport
    moveToCell(targetRow, pos.col)
    try {
      if (hot.scrollViewportTo) {
        hot.scrollViewportTo(targetRow, pos.col)
      }
    } catch {}
  }

  // === Row/Column Movement ===

  function moveRowsBy(delta: number) {
    const hot = getHot()
    if (!hot) return

    const selected = hot.getSelectedLast()
    if (!selected) return

    const [startRow, , endRow] = selected
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)
    const rowCount = maxRow - minRow + 1

    const targetIndex = delta > 0 ? maxRow + delta : minRow + delta
    if (targetIndex < 0 || targetIndex >= hot.countRows()) return

    try {
      const manualRowMove = hot.getPlugin('manualRowMove')
      if (manualRowMove && manualRowMove.moveRows) {
        const rows = []
        for (let r = minRow; r <= maxRow; r++) rows.push(r)
        manualRowMove.moveRows(rows, delta > 0 ? targetIndex + 1 - rowCount : targetIndex)
        hot.render()
        setHasChanges(true)
      }
    } catch {}
  }

  function moveColumnsBy(delta: number) {
    const hot = getHot()
    if (!hot) return

    const selected = hot.getSelectedLast()
    if (!selected) return

    const [, startCol, , endCol] = selected
    const minCol = Math.min(startCol, endCol)
    const maxCol = Math.max(startCol, endCol)
    const colCount = maxCol - minCol + 1

    const targetIndex = delta > 0 ? maxCol + delta : minCol + delta
    if (targetIndex < 0 || targetIndex >= hot.countCols()) return

    try {
      const manualColumnMove = hot.getPlugin('manualColumnMove')
      if (manualColumnMove && manualColumnMove.moveColumns) {
        const cols = []
        for (let c = minCol; c <= maxCol; c++) cols.push(c)
        manualColumnMove.moveColumns(cols, delta > 0 ? targetIndex + 1 - colCount : targetIndex)
        hot.render()
        setHasChanges(true)
      }
    } catch {}
  }

  // === Row/Column Insert/Delete ===

  function insertRow(position: 'above' | 'below', startEditing: boolean) {
    const hot = getHot()
    if (!hot) return

    const pos = getCurrentPosition()
    if (!pos) return

    const insertIndex = position === 'below' ? pos.row + 1 : pos.row
    hot.alter('insert_row_above', insertIndex, 1)
    setHasChanges(true)

    // Move to the new row
    moveToCell(insertIndex, pos.col)

    if (startEditing) {
      state.mode = 'insert'
      setTimeout(() => {
        const editor = hot.getActiveEditor()
        // Close editor first if it's already opened to avoid toggling behavior
        if (editor?.isOpened?.() && !editor?.isInFullEditMode?.()) {
          editor.close?.()
        }
        editor?.beginEditing()
      }, 0)
    }
  }

  function deleteRows(startRow: number, count: number) {
    const hot = getHot()
    if (!hot) return

    // Yank before deleting
    const yankData: any[][] = []
    for (let r = startRow; r < startRow + count; r++) {
      const rowData = []
      for (let c = 0; c < hot.countCols(); c++) {
        rowData.push(hot.getDataAtCell(r, c))
      }
      yankData.push(rowData)
    }
    state.yankRegister = yankData
    state.yankType = 'rows'

    hot.alter('remove_row', startRow, count)
    setHasChanges(true)

    // Adjust cursor position
    const newRow = Math.min(startRow, hot.countRows() - 1)
    const pos = getCurrentPosition()
    if (pos) moveToCell(Math.max(0, newRow), pos.col)
  }

  function deleteColumns(startCol: number, count: number) {
    const hot = getHot()
    if (!hot) return

    // Yank before deleting
    const yankData: any[][] = []
    for (let r = 0; r < hot.countRows(); r++) {
      const rowData = []
      for (let c = startCol; c < startCol + count; c++) {
        rowData.push(hot.getDataAtCell(r, c))
      }
      yankData.push(rowData)
    }
    state.yankRegister = yankData
    state.yankType = 'columns'

    hot.alter('remove_col', startCol, count)
    setHasChanges(true)

    // Adjust cursor position
    const newCol = Math.min(startCol, hot.countCols() - 1)
    const pos = getCurrentPosition()
    if (pos) moveToCell(pos.row, Math.max(0, newCol))
  }

  // === Operator Helpers ===

  function getCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number) {
    const cells: { row: number; col: number }[] = []
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)
    const minCol = Math.min(startCol, endCol)
    const maxCol = Math.max(startCol, endCol)

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ row: r, col: c })
      }
    }

    return cells
  }

  function yankCells(cells: { row: number; col: number }[]) {
    const hot = getHot()
    if (!hot) return

    state.yankRegister = cells.map(({ row, col }) => {
      return [hot.getDataAtCell(row, col)]
    })
    state.yankType = 'cells'
  }

  function clearCells(cells: { row: number; col: number }[]) {
    const hot = getHot()
    if (!hot) return

    cells.forEach(({ row, col }) => {
      hot.setDataAtCell(row, col, '')
    })

    setHasChanges(true)
  }

  function copyRowsToClipboard(startRow: number, endRow: number) {
    const hot = getHot()
    if (!hot) return

    // Select the rows and use clipboard copy
    hot.selectCell(startRow, 0, endRow, hot.countCols() - 1)
    if (handleCopy) handleCopy()

    // Also store in yank register
    const yankData: any[][] = []
    for (let r = startRow; r <= endRow; r++) {
      const rowData = []
      for (let c = 0; c < hot.countCols(); c++) {
        rowData.push(hot.getDataAtCell(r, c))
      }
      yankData.push(rowData)
    }
    state.yankRegister = yankData
    state.yankType = 'rows'
  }

  function copyColumnsToClipboard(startCol: number, endCol: number) {
    const hot = getHot()
    if (!hot) return

    // Select the columns and use clipboard copy
    hot.selectCell(0, startCol, hot.countRows() - 1, endCol)
    if (handleCopy) handleCopy()

    // Also store in yank register
    const yankData: any[][] = []
    for (let r = 0; r < hot.countRows(); r++) {
      const rowData = []
      for (let c = startCol; c <= endCol; c++) {
        rowData.push(hot.getDataAtCell(r, c))
      }
      yankData.push(rowData)
    }
    state.yankRegister = yankData
    state.yankType = 'columns'
  }

  function copyCellsToClipboard() {
    const hot = getHot()
    if (!hot) return

    if (handleCopy) handleCopy()

    // Also store selection in yank register
    const selected = hot.getSelectedLast()
    if (selected) {
      const [r1, c1, r2, c2] = selected
      const cells = getCellsInRange(r1, c1, r2, c2)
      yankCells(cells)
    }
  }

  function executeOperator(operator: string, motion: string, count: number) {
    const pos = getCurrentPosition()
    if (!pos) return

    const hot = getHot()
    if (!hot) return

    // Handle line-wise operators (dd, yy, cc)
    if (operator === motion) {
      if (operator === 'd') {
        // dd - delete current row structurally
        deleteRows(pos.row, 1)
        return
      }
      if (operator === 'y') {
        // yy - copy current row
        copyRowsToClipboard(pos.row, pos.row)
        return
      }
      if (operator === 'c') {
        // cc - delete row contents and enter insert mode
        const cells = getCellsInRange(pos.row, 0, pos.row, hot.countCols() - 1)
        yankCells(cells)
        clearCells(cells)
        state.mode = 'insert'
        const editor = hot.getActiveEditor()
        // Close editor first if it's already opened to avoid toggling behavior
        if (editor?.isOpened?.() && !editor?.isInFullEditMode?.()) {
          editor.close?.()
        }
        editor?.beginEditing()
        return
      }
    }

    // Handle yc - copy cells
    if (operator === 'y' && motion === 'c') {
      copyCellsToClipboard()
      return
    }

    // Handle motion-based operators
    const targetPos = { ...pos }

    switch (motion) {
      case 'j':
        targetPos.row += count
        break
      case 'k':
        targetPos.row -= count
        break
      case 'h':
        targetPos.col -= count
        break
      case 'l':
        targetPos.col += count
        break
      default:
        targetPos.row = pos.row
        targetPos.col = pos.col
        break
    }

    const cells = getCellsInRange(pos.row, pos.col, targetPos.row, targetPos.col)

    switch (operator) {
      case 'd':
        yankCells(cells)
        clearCells(cells)
        break
      case 'y':
        yankCells(cells)
        break
      case 'c':
        yankCells(cells)
        clearCells(cells)
        state.mode = 'insert'
        const ceditor = hot.getActiveEditor()
        // Close editor first if it's already opened to avoid toggling behavior
        if (ceditor?.isOpened?.() && !ceditor?.isInFullEditMode?.()) {
          ceditor.close?.()
        }
        ceditor?.beginEditing()
        break
    }
  }

  function executeVisualOperator(operator: string) {
    const hot = getHot()
    if (!hot || !state.visualStartCell) return

    const pos = getCurrentPosition()
    if (!pos) return

    if (state.mode === 'visual-line') {
      // Operating on full rows
      const minRow = Math.min(state.visualStartCell.row, pos.row)
      const maxRow = Math.max(state.visualStartCell.row, pos.row)
      const rowCount = maxRow - minRow + 1

      switch (operator) {
        case 'd':
        case 'x':
          deleteRows(minRow, rowCount)
          break
        case 'y':
          copyRowsToClipboard(minRow, maxRow)
          break
        case 'c':
          const cells = getCellsInRange(minRow, 0, maxRow, hot.countCols() - 1)
          yankCells(cells)
          clearCells(cells)
          state.mode = 'insert'
          const lineEditor = hot.getActiveEditor()
          // Close editor first if it's already opened to avoid toggling behavior
          if (lineEditor?.isOpened?.() && !lineEditor?.isInFullEditMode?.()) {
            lineEditor.close?.()
          }
          lineEditor?.beginEditing()
          return
      }
    } else if (state.mode === 'visual-column') {
      // Operating on full columns
      const minCol = Math.min(state.visualStartCell.col, pos.col)
      const maxCol = Math.max(state.visualStartCell.col, pos.col)
      const colCount = maxCol - minCol + 1

      switch (operator) {
        case 'd':
        case 'x':
          deleteColumns(minCol, colCount)
          break
        case 'y':
          copyColumnsToClipboard(minCol, maxCol)
          break
        case 'c':
          const cells = getCellsInRange(0, minCol, hot.countRows() - 1, maxCol)
          yankCells(cells)
          clearCells(cells)
          state.mode = 'insert'
          const colEditor = hot.getActiveEditor()
          // Close editor first if it's already opened to avoid toggling behavior
          if (colEditor?.isOpened?.() && !colEditor?.isInFullEditMode?.()) {
            colEditor.close?.()
          }
          colEditor?.beginEditing()
          return
      }
    } else {
      // Operating on cell selection
      const cells = getCellsInRange(
        state.visualStartCell.row,
        state.visualStartCell.col,
        pos.row,
        pos.col
      )

      switch (operator) {
        case 'd':
        case 'x':
          yankCells(cells)
          clearCells(cells)
          break
        case 'y':
          copyCellsToClipboard()
          break
        case 'c':
          yankCells(cells)
          clearCells(cells)
          state.mode = 'insert'
          state.visualStartCell = null
          const vEditor = hot.getActiveEditor()
          // Close editor first if it's already opened to avoid toggling behavior
          if (vEditor?.isOpened?.() && !vEditor?.isInFullEditMode?.()) {
            vEditor.close?.()
          }
          vEditor?.beginEditing()
          return
      }
    }

    state.mode = 'normal'
    state.visualStartCell = null
  }

  function paste(below: boolean = true) {
    const hot = getHot()
    if (!hot) return

    // Try clipboard paste first
    if (handlePaste) {
      handlePaste()
      return
    }

    // Fallback to internal yank register
    if (!state.yankRegister) return

    const pos = getCurrentPosition()
    if (!pos) return

    if (state.yankType === 'rows') {
      // Insert rows and paste data
      const insertIndex = below ? pos.row + 1 : pos.row
      const rowCount = state.yankRegister.length

      for (let i = 0; i < rowCount; i++) {
        hot.alter('insert_row_above', insertIndex + i, 1)
      }

      state.yankRegister.forEach((rowData, index) => {
        rowData.forEach((cellValue, colIndex) => {
          hot.setDataAtCell(insertIndex + index, colIndex, cellValue)
        })
      })
    } else if (state.yankType === 'columns') {
      // Insert columns and paste data
      const insertIndex = below ? pos.col + 1 : pos.col
      const colCount = state.yankRegister[0]?.length || 0

      for (let i = 0; i < colCount; i++) {
        hot.alter('insert_col_start', insertIndex + i, 1)
      }

      state.yankRegister.forEach((rowData, rowIndex) => {
        rowData.forEach((cellValue, colIndex) => {
          hot.setDataAtCell(rowIndex, insertIndex + colIndex, cellValue)
        })
      })
    } else {
      // Paste cells at current position
      const startRow = below ? pos.row + 1 : pos.row
      state.yankRegister.forEach((cellData, index) => {
        hot.setDataAtCell(startRow + index, pos.col, cellData[0])
      })
    }

    setHasChanges(true)
  }

  // === Leader Command Parsing ===

  function handleLeaderCommand(buffer: string): boolean {
    // ; commands
    if (buffer.startsWith(';')) {
      const cmd = buffer.slice(1)

      // ;al - align left
      if (cmd === 'al') {
        if (handleAlignLeft) handleAlignLeft()
        return true
      }
      // ;ac - align center
      if (cmd === 'ac') {
        if (handleAlignCenter) handleAlignCenter()
        return true
      }
      // ;ar - align right
      if (cmd === 'ar') {
        if (handleAlignRight) handleAlignRight()
        return true
      }
      // ;ww - wrap
      if (cmd === 'ww') {
        if (applyWrapOption) applyWrapOption('wrap')
        return true
      }
      // ;wo - overflow
      if (cmd === 'wo') {
        if (applyWrapOption) applyWrapOption('overflow')
        return true
      }
      // ;wc - clip
      if (cmd === 'wc') {
        if (applyWrapOption) applyWrapOption('clip')
        return true
      }
      // ;wf - fullscreen
      if (cmd === 'wf') {
        if (toggleFullscreen) toggleFullscreen()
        return true
      }
      // ;o - open URL
      if (cmd === 'o') {
        if (openUrlInCurrentCell) openUrlInCurrentCell()
        return true
      }
    }

    return false
  }

  function isPartialLeaderCommand(buffer: string): boolean {
    if (!buffer) return false

    const validPrefixes = [
      ';', ';a', ';w',
      'g',
      'd', 'y', 'c'
    ]

    return validPrefixes.includes(buffer)
  }

  // === Mode Handlers ===

  function handleNormalMode(event: KeyboardEvent): boolean {
    const key = event.key
    const isCtrl = event.ctrlKey || event.metaKey
    const isAlt = event.altKey

    // Handle Ctrl combinations first
    if (isCtrl) {
      switch (key.toLowerCase()) {
        case 'j':
          moveRowsBy(1)
          return true
        case 'k':
          moveRowsBy(-1)
          return true
        case 'h':
          moveColumnsBy(-1)
          return true
        case 'l':
          moveColumnsBy(1)
          return true
        case 'd':
          scrollHalfPage('down')
          return true
        case 'u':
          scrollHalfPage('up')
          return true
        case 'r':
          if (handleRedo) handleRedo()
          return true
      }
      return false // Let other Ctrl shortcuts pass through
    }

    // Handle Alt combinations
    if (isAlt) {
      if (key.toLowerCase() === 'v') {
        // Alt+v: visual column mode
        const pos = getCurrentPosition()
        if (pos) {
          const hot = getHot()
          if (hot) {
            state.visualStartCell = { row: 0, col: pos.col }
            state.mode = 'visual-column'
            // Select full column
            hot.selectCell(0, pos.col, hot.countRows() - 1, pos.col)
          }
        }
        return true
      }
      return false
    }

    // Check for completed leader commands
    const fullBuffer = state.commandBuffer + key
    if (handleLeaderCommand(fullBuffer)) {
      state.commandBuffer = ''
      state.pendingOperator = null
      return true
    }

    // Handle 'g' prefix for 'gg'
    if (state.commandBuffer === 'g') {
      if (key === 'g') {
        moveByMotion('gg', 1)
        state.commandBuffer = ''
        return true
      } else {
        state.commandBuffer = ''
      }
    }

    // Handle pending operators with motions
    if (state.pendingOperator) {
      // Check for operator doubling (dd, yy, cc)
      if (key === state.pendingOperator) {
        executeOperator(state.pendingOperator, key, 1)
        state.pendingOperator = null
        state.commandBuffer = ''
        return true
      }

      // Check for yc (copy cells)
      if (state.pendingOperator === 'y' && key === 'c') {
        executeOperator('y', 'c', 1)
        state.pendingOperator = null
        state.commandBuffer = ''
        return true
      }

      // Motion after operator
      if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '$', '0'].includes(key)) {
        const count = parseInt(state.commandBuffer) || 1
        executeOperator(state.pendingOperator, key, count)
        state.pendingOperator = null
        state.commandBuffer = ''
        return true
      }

      // Invalid sequence - reset
      state.pendingOperator = null
      state.commandBuffer = ''
    }

    // Handle number keys for count prefix
    if (/^[0-9]$/.test(key) && (state.commandBuffer !== '' || key !== '0')) {
      state.commandBuffer += key
      return true
    }

    // Get count from command buffer
    const count = parseInt(state.commandBuffer) || 1

    // Handle motions
    if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '$'].includes(key)) {
      moveByMotion(key, count)
      state.commandBuffer = ''
      return true
    }

    // Handle special keys
    switch (key) {
      case '0':
        if (state.commandBuffer === '') {
          moveByMotion('0', 1)
          return true
        }
        return false

      case 'g':
        state.commandBuffer = 'g'
        return true

      case 'G':
        moveByMotion('G', 1)
        state.commandBuffer = ''
        return true

      case ';':
        state.commandBuffer = ';'
        return true

      case '?':
        if (setHelpDialogOpen) setHelpDialogOpen(true)
        state.commandBuffer = ''
        return true

      // Operators
      case 'd':
      case 'y':
      case 'c':
        state.pendingOperator = key
        state.commandBuffer = ''
        return true

      case 'x': {
        // Delete single cell contents
        const pos = getCurrentPosition()
        if (pos) {
          const cells = [{ row: pos.row, col: pos.col }]
          yankCells(cells)
          clearCells(cells)
        }
        state.commandBuffer = ''
        return true
      }

      // Undo
      case 'u':
        if (handleUndo) handleUndo()
        state.commandBuffer = ''
        return true

      // Enter insert mode
      case 'i': {
        enteringInsertMode = true
        state.mode = 'insert'
        const hot = getHot()
        const editor = hot?.getActiveEditor()
        // If editor is partially open, enable full edit mode directly
        if (editor?.isOpened?.() && !editor?.isInFullEditMode?.()) {
          if (editor.enableFullEditMode) {
            editor.enableFullEditMode()
          }
          const textarea = editor.TEXTAREA
          if (textarea) {
            textarea.focus()
          }
          setTimeout(() => { enteringInsertMode = false }, 50)
        } else {
          editor?.beginEditing()
          setTimeout(() => { enteringInsertMode = false }, 50)
        }
        state.commandBuffer = ''
        return true
      }

      case 'a': {
        state.mode = 'insert'
        const hot = getHot()
        const editor = hot?.getActiveEditor()
        // Close editor first if it's already opened to avoid toggling behavior
        if (editor?.isOpened?.() && !editor?.isInFullEditMode?.()) {
          editor.close?.()
        }
        editor?.beginEditing()
        setTimeout(() => {
          const textarea = editor?.TEXTAREA
          if (textarea) {
            textarea.selectionStart = textarea.value.length
            textarea.selectionEnd = textarea.value.length
          }
        }, 0)
        state.commandBuffer = ''
        return true
      }

      case 'I': {
        const pos = getCurrentPosition()
        if (pos) moveToCell(pos.row, 0)
        state.mode = 'insert'
        const hot = getHot()
        const editor = hot?.getActiveEditor()
        // Close editor first if it's already opened to avoid toggling behavior
        if (editor?.isOpened?.() && !editor?.isInFullEditMode?.()) {
          editor.close?.()
        }
        editor?.beginEditing()
        state.commandBuffer = ''
        return true
      }

      case 'A': {
        const pos = getCurrentPosition()
        const hot = getHot()
        if (pos && hot) moveToCell(pos.row, hot.countCols() - 1)
        state.mode = 'insert'
        const editor = hot?.getActiveEditor()
        // Close editor first if it's already opened to avoid toggling behavior
        if (editor?.isOpened?.() && !editor?.isInFullEditMode?.()) {
          editor.close?.()
        }
        editor?.beginEditing()
        state.commandBuffer = ''
        return true
      }

      // Insert row and edit
      case 'o':
        insertRow('below', true)
        state.commandBuffer = ''
        return true

      case 'O':
        insertRow('above', true)
        state.commandBuffer = ''
        return true

      // Insert row without edit
      case 's':
        insertRow('below', false)
        state.commandBuffer = ''
        return true

      case 'S':
        insertRow('above', false)
        state.commandBuffer = ''
        return true

      // Visual mode
      case 'v': {
        const pos = getCurrentPosition()
        if (pos) {
          state.visualStartCell = { row: pos.row, col: pos.col }
          state.mode = 'visual'
        }
        state.commandBuffer = ''
        return true
      }

      case 'V': {
        const pos = getCurrentPosition()
        if (pos) {
          const hot = getHot()
          if (hot) {
            state.visualStartCell = { row: pos.row, col: 0 }
            state.mode = 'visual-line'
            // Select full row
            hot.selectCell(pos.row, 0, pos.row, hot.countCols() - 1)
          }
        }
        state.commandBuffer = ''
        return true
      }

      // Paste
      case 'p':
        paste(true)
        state.commandBuffer = ''
        return true

      case 'P':
        paste(false)
        state.commandBuffer = ''
        return true

      default:
        // Check if this could be start of a leader command
        if (isPartialLeaderCommand(key)) {
          state.commandBuffer = key
          return true
        }
        state.commandBuffer = ''
        return false
    }
  }

  function handleInsertMode(event: KeyboardEvent): boolean {
    const key = event.key

    if (key === 'Escape' || key === 'Enter') {
      enteringInsertMode = false
      state.mode = 'normal'
      const hot = getHot()
      hot?.getActiveEditor()?.finishEditing()
      return true
    }

    return false
  }

  function handleVisualMode(event: KeyboardEvent): boolean {
    const key = event.key
    const isCtrl = event.ctrlKey || event.metaKey

    // Handle Ctrl combinations in visual mode
    if (isCtrl) {
      switch (key.toLowerCase()) {
        case 'd':
          scrollHalfPage('down')
          return true
        case 'u':
          scrollHalfPage('up')
          return true
      }
      return false
    }

    // Handle motions to extend selection
    if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '$', '0', 'G'].includes(key)) {
      moveByMotion(key, 1)
      return true
    }

    // Handle 'gg' in visual mode
    if (key === 'g') {
      if (state.commandBuffer === 'g') {
        moveByMotion('gg', 1)
        state.commandBuffer = ''
        return true
      }
      state.commandBuffer = 'g'
      return true
    }

    // Handle operators in visual mode
    switch (key) {
      case 'd':
      case 'x':
      case 'y':
      case 'c':
        executeVisualOperator(key)
        return true

      case 'Escape':
        state.mode = 'normal'
        state.visualStartCell = null
        const hot = getHot()
        const pos = getCurrentPosition()
        if (pos && hot) {
          hot.selectCell(pos.row, pos.col)
        }
        return true

      default:
        return false
    }
  }

  // === Main Handler ===

  function handleKeyDown(event: KeyboardEvent): boolean {
    switch (state.mode) {
      case 'normal':
        return handleNormalMode(event)
      case 'insert':
        return handleInsertMode(event)
      case 'visual':
      case 'visual-line':
      case 'visual-column':
        return handleVisualMode(event)
      default:
        return false
    }
  }

  function getMode(): VimMode {
    return state.mode
  }

  function setMode(mode: VimMode): void {
    state.mode = mode
    state.commandBuffer = ''
    state.pendingOperator = null
    if (mode !== 'visual' && mode !== 'visual-line' && mode !== 'visual-column') {
      state.visualStartCell = null
    }
  }

  function reset(): void {
    state = {
      mode: 'normal',
      commandBuffer: '',
      pendingOperator: null,
      yankRegister: null,
      yankType: null,
      visualStartCell: null,
    }
    // Update ref if using persistent state
    if (stateRef) {
      stateRef.current = state
    }
  }

  return {
    handleKeyDown,
    getMode,
    setMode,
    reset,
  }
}
