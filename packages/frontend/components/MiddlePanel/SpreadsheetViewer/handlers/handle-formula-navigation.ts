import React from 'react'
import { cellToA1, rangeToA1 } from '../utils/cell-reference'

interface FormulaNavigationState {
  isActive: boolean // Whether formula navigation is currently active
  startCell: { row: number; col: number } | null // Cell where formula editing started
  currentNavCell: { row: number; col: number } | null // Cell currently navigated to
  rangeStartCell: { row: number; col: number } | null // Start of range selection (if shift held)
  isSelectingRange: boolean // Whether currently selecting a range with shift+arrows
  lastInsertedReference: string | null // Track last inserted reference for range updates
  lastInsertPosition: number | null // Position where last reference was inserted
  highlightedCells: Map<string, { element: HTMLElement; color: string }> // All highlighted cells with their colors
  textOverlay: HTMLDivElement | null // Overlay to show colored text
  navigationCursor: { element: HTMLElement; originalStyles: { outline: string; outlineOffset: string; zIndex: string } } | null // Current navigation cursor
}

interface CellReference {
  range: string // The A1 notation (e.g., "A1" or "A1:B5")
  row1: number
  col1: number
  row2?: number
  col2?: number
}

interface CreateFormulaNavigationHandlerParams {
  hotTableRef: React.RefObject<any>
}

export function createFormulaNavigationHandler(params: CreateFormulaNavigationHandlerParams) {
  const { hotTableRef } = params

  // Color palette for cell references (Google Sheets style)
  const COLOR_PALETTE = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ]

  // State management using mutable object (similar to vim mode pattern)
  const state: FormulaNavigationState = {
    isActive: false,
    startCell: null,
    currentNavCell: null,
    rangeStartCell: null,
    isSelectingRange: false,
    lastInsertedReference: null,
    lastInsertPosition: null,
    highlightedCells: new Map(),
    textOverlay: null,
    navigationCursor: null,
  }

  function getHot() {
    return hotTableRef.current?.hotInstance
  }

  function getEditorTextarea(): HTMLTextAreaElement | null {
    const textarea = document.querySelector('.handsontableInput') as HTMLTextAreaElement
    return textarea && textarea.offsetParent !== null ? textarea : null
  }

  function getCurrentPosition() {
    const hot = getHot()
    if (!hot) return null
    const selected = hot.getSelectedLast()
    if (!selected) return null
    return { row: selected[0], col: selected[1] }
  }

  function getCellElement(row: number, col: number): HTMLElement | null {
    const hot = getHot()
    if (!hot) return null

    try {
      const cell = hot.getCell(row, col)
      return cell
    } catch {
      return null
    }
  }

  function a1ToCoords(a1: string): { row: number; col: number } | null {
    // Convert A1 notation to row/col coordinates
    const match = a1.match(/^([A-Z]+)(\d+)$/)
    if (!match) return null

    const colStr = match[1]
    const rowStr = match[2]

    // Convert column letters to number
    let col = 0
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 65 + 1)
    }
    col -= 1 // Zero-indexed

    const row = parseInt(rowStr, 10) - 1 // Zero-indexed

    return { row, col }
  }

  function parseCellReferences(formula: string): CellReference[] {
    // Match cell references like A1, B2, A1:B5, etc.
    // This regex matches standard A1 notation including ranges
    const regex = /\b([A-Z]+\d+)(?::([A-Z]+\d+))?\b/g
    const references: CellReference[] = []
    let match

    while ((match = regex.exec(formula)) !== null) {
      const start = match[1]
      const end = match[2]
      const startCoords = a1ToCoords(start)

      if (!startCoords) continue

      if (end) {
        // Range reference
        const endCoords = a1ToCoords(end)
        if (endCoords) {
          references.push({
            range: `${start}:${end}`,
            row1: startCoords.row,
            col1: startCoords.col,
            row2: endCoords.row,
            col2: endCoords.col,
          })
        }
      } else {
        // Single cell reference
        references.push({
          range: start,
          row1: startCoords.row,
          col1: startCoords.col,
        })
      }
    }

    return references
  }

  function highlightReferencedCells(formula: string): void {
    // Store current navigation cursor position
    const navCursorPos = state.currentNavCell

    // Clear previous highlights (but not navigation cursor)
    clearAllHighlights()

    // Parse cell references from formula
    const references = parseCellReferences(formula)

    // Highlight each reference with a different color
    references.forEach((ref, index) => {
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length]

      if (ref.row2 !== undefined && ref.col2 !== undefined) {
        // Range - highlight all cells in range
        const startRow = Math.min(ref.row1, ref.row2)
        const endRow = Math.max(ref.row1, ref.row2)
        const startCol = Math.min(ref.col1, ref.col2)
        const endCol = Math.max(ref.col1, ref.col2)

        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            highlightCell(row, col, color)
          }
        }
      } else {
        // Single cell
        highlightCell(ref.row1, ref.col1, color)
      }
    })

    // Restore navigation cursor if it exists
    if (navCursorPos) {
      showNavigationCursor(navCursorPos.row, navCursorPos.col)
    }

    // Update text overlay to show colored references
    updateTextOverlay(formula)
  }

  function highlightCell(row: number, col: number, color: string): void {
    const cell = getCellElement(row, col)
    if (!cell) return

    const key = `${row}-${col}`

    // Apply highlight
    cell.style.outline = `2px solid ${color}`
    cell.style.outlineOffset = '-2px'
    cell.style.zIndex = '10'

    // Track highlighted cell
    state.highlightedCells.set(key, { element: cell, color })
  }

  function clearAllHighlights(): void {
    state.highlightedCells.forEach(({ element }) => {
      element.style.outline = ''
      element.style.outlineOffset = ''
      element.style.zIndex = ''
    })
    state.highlightedCells.clear()
  }

  function showNavigationCursor(row: number, col: number): void {
    // Clear previous cursor
    clearNavigationCursor()

    const cell = getCellElement(row, col)
    if (!cell) return

    // Store original styles
    const originalStyles = {
      outline: cell.style.outline,
      outlineOffset: cell.style.outlineOffset,
      zIndex: cell.style.zIndex,
    }

    // Apply navigation cursor style (thicker blue outline)
    cell.style.outline = '3px solid #3b82f6'
    cell.style.outlineOffset = '-3px'
    cell.style.zIndex = '100'

    // Store cursor reference
    state.navigationCursor = { element: cell, originalStyles }

    // Scroll into view
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  function clearNavigationCursor(): void {
    if (state.navigationCursor) {
      const { element, originalStyles } = state.navigationCursor
      element.style.outline = originalStyles.outline
      element.style.outlineOffset = originalStyles.outlineOffset
      element.style.zIndex = originalStyles.zIndex
      state.navigationCursor = null
    }
  }

  function createTextOverlay(textarea: HTMLTextAreaElement): HTMLDivElement {
    // Remove existing overlay if any
    if (state.textOverlay) {
      state.textOverlay.remove()
    }

    // Create overlay div
    const overlay = document.createElement('div')
    overlay.style.position = 'absolute'
    overlay.style.pointerEvents = 'none' // Allow clicks to pass through to textarea
    overlay.style.whiteSpace = 'pre-wrap'
    overlay.style.wordWrap = 'break-word'
    overlay.style.overflow = 'hidden'
    overlay.style.zIndex = '1000'
    overlay.style.color = '#000000' // Default text color for non-references

    // Copy textarea styles
    const textareaStyles = window.getComputedStyle(textarea)
    overlay.style.fontFamily = textareaStyles.fontFamily
    overlay.style.fontSize = textareaStyles.fontSize
    overlay.style.fontWeight = textareaStyles.fontWeight
    overlay.style.lineHeight = textareaStyles.lineHeight
    overlay.style.padding = textareaStyles.padding
    overlay.style.backgroundColor = textareaStyles.backgroundColor
    overlay.style.border = 'none' // No border on overlay - let textarea border show

    // Position overlay inside textarea border area
    const rect = textarea.getBoundingClientRect()
    const borderWidth = parseFloat(textareaStyles.borderWidth) || 0

    overlay.style.left = `${rect.left + window.scrollX + borderWidth}px`
    overlay.style.top = `${rect.top + window.scrollY + borderWidth}px`
    overlay.style.width = `${rect.width - borderWidth * 2}px`
    overlay.style.height = `${rect.height - borderWidth * 2}px`

    document.body.appendChild(overlay)
    state.textOverlay = overlay

    return overlay
  }

  function updateTextOverlay(formula: string): void {
    const textarea = getEditorTextarea()
    if (!textarea) return

    // Create or get existing overlay
    const overlay = state.textOverlay || createTextOverlay(textarea)

    // Update position in case textarea moved (account for border)
    const rect = textarea.getBoundingClientRect()
    const textareaStyles = window.getComputedStyle(textarea)
    const borderWidth = parseFloat(textareaStyles.borderWidth) || 0

    overlay.style.left = `${rect.left + window.scrollX + borderWidth}px`
    overlay.style.top = `${rect.top + window.scrollY + borderWidth}px`
    overlay.style.width = `${rect.width - borderWidth * 2}px`
    overlay.style.height = `${rect.height - borderWidth * 2}px`

    // Parse references and get color mapping
    const references = parseCellReferences(formula)
    const colorMap = new Map<string, string>()
    references.forEach((ref, index) => {
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length]
      colorMap.set(ref.range, color)
    })

    // Create colored HTML
    let html = ''
    let lastIndex = 0
    const regex = /\b([A-Z]+\d+(?::[A-Z]+\d+)?)\b/g
    let match

    while ((match = regex.exec(formula)) !== null) {
      const reference = match[1]
      const color = colorMap.get(reference)

      // Add text before the match
      html += escapeHtml(formula.substring(lastIndex, match.index))

      // Add colored reference
      if (color) {
        html += `<span style="color: ${color}; font-weight: 600;">${escapeHtml(reference)}</span>`
      } else {
        html += escapeHtml(reference)
      }

      lastIndex = match.index + reference.length
    }

    // Add remaining text
    html += escapeHtml(formula.substring(lastIndex))

    overlay.innerHTML = html

    // Make textarea text transparent so overlay shows through
    textarea.style.color = 'transparent'
    textarea.style.caretColor = 'black' // Keep caret visible
  }

  function removeTextOverlay(): void {
    if (state.textOverlay) {
      state.textOverlay.remove()
      state.textOverlay = null
    }

    // Restore textarea text color
    const textarea = getEditorTextarea()
    if (textarea) {
      textarea.style.color = ''
      textarea.style.caretColor = ''
    }
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  function insertAtCursor(textarea: HTMLTextAreaElement, text: string): void {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = textarea.value.substring(0, start)
    const after = textarea.value.substring(end)

    textarea.value = before + text + after
    const newPos = start + text.length
    textarea.selectionStart = newPos
    textarea.selectionEnd = newPos

    // Trigger input event to update Handsontable
    textarea.dispatchEvent(new Event('input', { bubbles: true }))

    // Update cell highlights
    highlightReferencedCells(textarea.value)
  }

  function replaceLastReference(textarea: HTMLTextAreaElement, newReference: string): void {
    if (state.lastInsertPosition === null || state.lastInsertedReference === null) {
      // No last reference to replace, just insert
      insertAtCursor(textarea, newReference)
      state.lastInsertedReference = newReference
      state.lastInsertPosition = textarea.selectionStart - newReference.length
      return
    }

    // Replace the last inserted reference with the new one
    const start = state.lastInsertPosition
    const end = start + state.lastInsertedReference.length
    const before = textarea.value.substring(0, start)
    const after = textarea.value.substring(end)

    textarea.value = before + newReference + after
    const newPos = start + newReference.length
    textarea.selectionStart = newPos
    textarea.selectionEnd = newPos

    // Update tracked reference
    state.lastInsertedReference = newReference
    state.lastInsertPosition = start

    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }))

    // Update cell highlights
    highlightReferencedCells(textarea.value)
  }

  function enterFormulaMode(): void {
    const hot = getHot()
    if (!hot) return

    const currentPos = getCurrentPosition()
    if (!currentPos) return

    state.isActive = true
    state.startCell = currentPos
    state.currentNavCell = currentPos
    state.rangeStartCell = null
    state.isSelectingRange = false
    state.lastInsertedReference = null
    state.lastInsertPosition = null

    // Don't show navigation cursor on starting cell - let Handsontable's border show
    // Navigation cursor will appear when user navigates to a different cell

    // Highlight any existing references in the formula
    const textarea = getEditorTextarea()
    if (textarea && textarea.value) {
      highlightReferencedCells(textarea.value)
    }
  }

  function exitFormulaMode(): void {
    clearAllHighlights()
    clearNavigationCursor()
    removeTextOverlay()
    state.isActive = false
    state.startCell = null
    state.currentNavCell = null
    state.rangeStartCell = null
    state.isSelectingRange = false
    state.lastInsertedReference = null
    state.lastInsertPosition = null
  }

  function shouldReplaceLastReference(textarea: HTMLTextAreaElement): boolean {
    // Check if cursor is right after the last inserted reference
    if (state.lastInsertPosition === null || state.lastInsertedReference === null) {
      return false
    }

    const expectedEndPosition = state.lastInsertPosition + state.lastInsertedReference.length
    return textarea.selectionStart === expectedEndPosition
  }

  function handleArrowKey(key: string, shiftPressed: boolean): boolean {
    const hot = getHot()
    if (!hot) return false

    const textarea = getEditorTextarea()
    if (!textarea) return false

    const currentPos = state.currentNavCell || state.startCell
    if (!currentPos) return false

    // Calculate new position based on arrow key
    let newRow = currentPos.row
    let newCol = currentPos.col
    const rowCount = hot.countRows()
    const colCount = hot.countCols()

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, newRow - 1)
        break
      case 'ArrowDown':
        newRow = Math.min(rowCount - 1, newRow + 1)
        break
      case 'ArrowLeft':
        newCol = Math.max(0, newCol - 1)
        break
      case 'ArrowRight':
        newCol = Math.min(colCount - 1, newCol + 1)
        break
      default:
        return false
    }

    // Update navigation cell
    state.currentNavCell = { row: newRow, col: newCol }

    // Show navigation cursor ONLY if we moved away from the starting cell
    // This preserves the editing cell's native Handsontable border
    if (state.startCell && (newRow !== state.startCell.row || newCol !== state.startCell.col)) {
      showNavigationCursor(newRow, newCol)
    }

    // Handle range selection with Shift
    if (shiftPressed) {
      if (!state.isSelectingRange) {
        // Start range selection from the previous position
        state.rangeStartCell = currentPos
        state.isSelectingRange = true
      }

      // Create range reference
      const rangeRef = rangeToA1(
        state.rangeStartCell!.row,
        state.rangeStartCell!.col,
        newRow,
        newCol
      )

      // Replace the last reference with the updated range
      replaceLastReference(textarea, rangeRef)
    } else {
      // Not holding shift
      state.isSelectingRange = false
      state.rangeStartCell = null

      const cellRef = cellToA1(newRow, newCol)

      // Check if we should replace the last reference or insert a new one
      if (shouldReplaceLastReference(textarea)) {
        // Replace the previous reference
        replaceLastReference(textarea, cellRef)
      } else {
        // Insert new reference at cursor
        insertAtCursor(textarea, cellRef)
        state.lastInsertedReference = cellRef
        state.lastInsertPosition = textarea.selectionStart - cellRef.length
      }
    }

    return true
  }

  function handleKeyDown(event: KeyboardEvent): boolean {
    if (!state.isActive) return false

    const key = event.key

    // Check for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const handled = handleArrowKey(key, event.shiftKey)
      return handled
    }

    // Check for Escape or Enter to exit formula mode
    if (key === 'Escape' || key === 'Enter') {
      exitFormulaMode()
      return false // Let the normal handler process these
    }

    return false
  }

  function handleKeyUp(event: KeyboardEvent): void {
    const textarea = getEditorTextarea()
    if (!textarea) {
      // Editor closed, exit formula mode
      if (state.isActive) {
        exitFormulaMode()
      }
      return
    }

    const value = textarea.value

    // Check if we should enter formula mode
    if (!state.isActive && value.startsWith('=')) {
      enterFormulaMode()
      return
    }

    // Check if we should exit formula mode (user deleted the "=")
    if (state.isActive && !value.startsWith('=')) {
      exitFormulaMode()
      return
    }

    // If Shift was released, stop range selection
    if (!event.shiftKey && state.isSelectingRange) {
      state.isSelectingRange = false
      state.rangeStartCell = null
    }

    // If user typed something (not an arrow key), reset reference tracking
    // This allows the next arrow key to insert a new reference
    const key = event.key
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
    const isModifierKey = ['Shift', 'Control', 'Alt', 'Meta'].includes(key)

    if (state.isActive && !isArrowKey && !isModifierKey) {
      // Check if cursor moved away from the last reference
      if (!shouldReplaceLastReference(textarea)) {
        // Reset tracking - next arrow should insert new reference
        state.lastInsertedReference = null
        state.lastInsertPosition = null
      }

      // Update highlights when user manually edits the formula
      highlightReferencedCells(value)
    }
  }

  function isFormulaNavigationActive(): boolean {
    return state.isActive
  }

  // Event listener references for cleanup
  let keydownListener: ((event: KeyboardEvent) => void) | null = null
  let keyupListener: ((event: KeyboardEvent) => void) | null = null

  function onDocumentKeyDown(event: KeyboardEvent): void {
    if (!state.isActive) return

    const textarea = getEditorTextarea()
    if (!textarea) return

    // Only handle if the textarea is focused
    if (document.activeElement !== textarea) return

    const handled = handleKeyDown(event)
    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function onDocumentKeyUp(event: KeyboardEvent): void {
    handleKeyUp(event)
  }

  function attach(): void {
    // Document-level keydown listener (capture phase for early interception)
    keydownListener = onDocumentKeyDown
    document.addEventListener('keydown', keydownListener, true)

    // Document-level keyup listener to monitor for formula mode entry/exit
    keyupListener = onDocumentKeyUp
    document.addEventListener('keyup', keyupListener, true)
  }

  function detach(): void {
    if (keydownListener) {
      document.removeEventListener('keydown', keydownListener, true)
      keydownListener = null
    }

    if (keyupListener) {
      document.removeEventListener('keyup', keyupListener, true)
      keyupListener = null
    }

    exitFormulaMode()
    removeTextOverlay() // Extra safety to ensure overlay is removed
  }

  return {
    handleKeyDown,
    handleKeyUp,
    isFormulaNavigationActive,
    attach,
    detach,
  }
}
