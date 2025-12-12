import { SlideElement, Slide, TableCell } from '../PowerPointViewer'
import { ShapeType, getShapeDefinition } from '../shape-catalog'

// History management for undo/redo
interface HistoryState {
  slides: Slide[]
  currentSlideIndex: number
}

let historyStack: HistoryState[] = []
let historyIndex = -1
const MAX_HISTORY = 50

export function pushToHistory(slides: Slide[], currentSlideIndex: number): void {
  // Remove any redo states
  historyStack = historyStack.slice(0, historyIndex + 1)
  
  // Add new state
  historyStack.push({
    slides: JSON.parse(JSON.stringify(slides)),
    currentSlideIndex
  })
  
  // Limit history size
  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift()
  } else {
    historyIndex++
  }
}

export function canUndo(): boolean {
  return historyIndex > 0
}

export function canRedo(): boolean {
  return historyIndex < historyStack.length - 1
}

export function undo(): HistoryState | null {
  if (!canUndo()) return null
  historyIndex--
  return JSON.parse(JSON.stringify(historyStack[historyIndex]))
}

export function redo(): HistoryState | null {
  if (!canRedo()) return null
  historyIndex++
  return JSON.parse(JSON.stringify(historyStack[historyIndex]))
}

export function clearHistory(): void {
  historyStack = []
  historyIndex = -1
}

// Element creation handlers
export function createTextElement(): SlideElement {
  return {
    id: `text-${Date.now()}`,
    type: 'text',
    x: 10,
    y: 10,
    width: 80,
    height: 10,
    content: 'Click to edit text',
    fontSize: 24,
    fontFace: 'Arial',
    color: '363636',
    align: 'left',
    valign: 'middle',
  }
}

export function createShapeElement(shapeType: ShapeType): SlideElement {
  const def = getShapeDefinition(shapeType)
  return {
    id: `shape-${Date.now()}`,
    type: 'shape',
    x: 20,
    y: 20,
    width: 20,
    height: 20,
    shapeType,
    fill: '#4a90d9',
    stroke: '#2d5a8c',
    strokeWidth: 2,
    rotation: 0,
    content: def?.defaultText,
  }
}

export function createImageElement(imageUrl: string): SlideElement {
  return {
    id: `image-${Date.now()}`,
    type: 'image',
    x: 10,
    y: 10,
    width: 40,
    height: 30,
    imageUrl,
  }
}

// Element update handlers
export function updateElementProperty<K extends keyof SlideElement>(
  elements: SlideElement[],
  elementId: string,
  property: K,
  value: SlideElement[K]
): SlideElement[] {
  return elements.map(el =>
    el.id === elementId ? { ...el, [property]: value } : el
  )
}

export function updateElementMultipleProperties(
  elements: SlideElement[],
  elementId: string,
  updates: Partial<SlideElement>
): SlideElement[] {
  return elements.map(el =>
    el.id === elementId ? { ...el, ...updates } : el
  )
}

export function deleteElement(
  elements: SlideElement[],
  elementId: string
): SlideElement[] {
  return elements.filter(el => el.id !== elementId)
}

// Font size handlers
export function incrementFontSize(currentSize: number): number {
  const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96]
  const currentIndex = sizes.findIndex(s => s >= currentSize)
  if (currentIndex === -1) return sizes[sizes.length - 1]
  if (currentIndex === sizes.length - 1) return sizes[sizes.length - 1]
  return sizes[currentIndex + 1]
}

export function decrementFontSize(currentSize: number): number {
  const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96]
  const currentIndex = sizes.findIndex(s => s >= currentSize)
  if (currentIndex <= 0) return sizes[0]
  return sizes[currentIndex - 1]
}

// Image file handler
export function handleImageUpload(callback: (imageUrl: string) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        callback(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// Slide handlers
export function createNewSlide(slides: Slide[]): Slide {
  return {
    id: `slide-${Date.now()}`,
    index: slides.length,
    elements: [{
      id: `text-${Date.now()}`,
      type: 'text',
      x: 10,
      y: 40,
      width: 80,
      height: 20,
      content: 'Click to edit',
      fontSize: 44,
      fontFace: 'Arial',
      color: '363636',
      bold: true,
      align: 'center',
      valign: 'middle',
    }],
    layout: 'title',
  }
}

export function reorderSlides(
  slides: Slide[],
  fromIndex: number,
  toIndex: number
): Slide[] {
  const newSlides = [...slides]
  const [moved] = newSlides.splice(fromIndex, 1)
  newSlides.splice(toIndex, 0, moved)
  return newSlides.map((s, i) => ({ ...s, index: i }))
}

export function deleteSlide(
  slides: Slide[],
  slideIndex: number
): Slide[] {
  if (slides.length <= 1) return slides
  const newSlides = slides.filter((_, i) => i !== slideIndex)
  return newSlides.map((s, i) => ({ ...s, index: i }))
}

// Color utility
export function normalizeColor(color: string): string {
  if (!color) return '363636'
  return color.replace('#', '')
}

export function toHexColor(color: string): string {
  if (!color) return '#363636'
  if (color.startsWith('#')) return color
  return `#${color}`
}

// Table element creation and manipulation
export function createTableElement(): SlideElement {
  const rows = 4
  const columns = 4
  const cells: TableCell[][] = []
  
  for (let i = 0; i < rows; i++) {
    cells[i] = []
    for (let j = 0; j < columns; j++) {
      cells[i][j] = {
        content: '',
        fontSize: 14,
        fontFace: 'Arial',
        color: '363636',
        align: 'left',
      }
    }
  }
  
  return {
    id: `table-${Date.now()}`,
    type: 'table',
    x: 10,
    y: 10,
    width: 80,
    height: 40,
    rows,
    columns,
    cells,
    borderColor: '#cccccc',
    borderWidth: 1,
    headerRow: false,
  }
}

export function addTableRow(element: SlideElement): SlideElement | null {
  if (element.type !== 'table' || !element.cells || !element.columns) return null
  
  const newRow: TableCell[] = []
  for (let j = 0; j < element.columns; j++) {
    newRow[j] = {
      content: '',
      fontSize: element.cells[0]?.[0]?.fontSize || 14,
      fontFace: element.cells[0]?.[0]?.fontFace || 'Arial',
      color: element.cells[0]?.[0]?.color || '363636',
      align: element.cells[0]?.[0]?.align || 'left',
    }
  }
  
  return {
    ...element,
    rows: (element.rows || 0) + 1,
    cells: [...element.cells, newRow],
  }
}

export function removeTableRow(element: SlideElement): SlideElement | null {
  if (element.type !== 'table' || !element.cells || element.cells.length <= 1) return null
  
  return {
    ...element,
    rows: (element.rows || 0) - 1,
    cells: element.cells.slice(0, -1),
  }
}

export function addTableColumn(element: SlideElement): SlideElement | null {
  if (element.type !== 'table' || !element.cells) return null
  
  const newCells = element.cells.map(row => {
    const newCell: TableCell = {
      content: '',
      fontSize: row[0]?.fontSize || 14,
      fontFace: row[0]?.fontFace || 'Arial',
      color: row[0]?.color || '363636',
      align: row[0]?.align || 'left',
    }
    return [...row, newCell]
  })
  
  return {
    ...element,
    columns: (element.columns || 0) + 1,
    cells: newCells,
  }
}

export function removeTableColumn(element: SlideElement): SlideElement | null {
  if (element.type !== 'table' || !element.cells || !element.columns || element.columns <= 1) return null
  
  const newCells = element.cells.map(row => row.slice(0, -1))
  
  return {
    ...element,
    columns: element.columns - 1,
    cells: newCells,
  }
}

export function updateTableCell(
  element: SlideElement,
  rowIndex: number,
  colIndex: number,
  updates: Partial<TableCell>
): SlideElement | null {
  if (element.type !== 'table' || !element.cells) return null
  if (rowIndex < 0 || rowIndex >= element.cells.length) return null
  if (colIndex < 0 || colIndex >= element.cells[rowIndex].length) return null
  
  const newCells = element.cells.map((row, rIdx) =>
    rIdx === rowIndex
      ? row.map((cell, cIdx) =>
          cIdx === colIndex ? { ...cell, ...updates } : cell
        )
      : row
  )
  
  return {
    ...element,
    cells: newCells,
  }
}

