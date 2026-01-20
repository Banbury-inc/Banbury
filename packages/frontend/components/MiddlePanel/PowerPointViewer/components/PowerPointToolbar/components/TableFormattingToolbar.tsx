import { useState, useCallback } from 'react'
import { SlideElement } from '../../../PowerPointViewer'
import {
  addTableRow,
  removeTableRow,
  addTableColumn,
  removeTableColumn,
} from '../handlers/powerpoint-toolbar-handlers'
import { Button } from '../../../../../ui/button'
import { ColorPicker } from './ColorPicker'
import {
  Plus,
  Minus,
  Columns,
  Rows,
} from 'lucide-react'

interface TableFormattingToolbarProps {
  selectedElement: SlideElement
  onUpdateElement: (updates: Partial<SlideElement>) => void
}

export function TableFormattingToolbar({
  selectedElement,
  onUpdateElement,
}: TableFormattingToolbarProps) {
  const [tableBorderColorOpen, setTableBorderColorOpen] = useState(false)

  // Table formatting handlers
  const handleAddTableRow = useCallback(() => {
    if (selectedElement.type === 'table') {
      const updated = addTableRow(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleRemoveTableRow = useCallback(() => {
    if (selectedElement.type === 'table' && selectedElement.rows && selectedElement.rows > 1) {
      const updated = removeTableRow(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleAddTableColumn = useCallback(() => {
    if (selectedElement.type === 'table') {
      const updated = addTableColumn(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleRemoveTableColumn = useCallback(() => {
    if (selectedElement.type === 'table' && selectedElement.columns && selectedElement.columns > 1) {
      const updated = removeTableColumn(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleTableBorderColorChange = useCallback((color: string) => {
    if (selectedElement.type === 'table') {
      onUpdateElement({ borderColor: color })
    }
    setTableBorderColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleToggleHeaderRow = useCallback(() => {
    if (selectedElement.type === 'table') {
      onUpdateElement({ headerRow: !selectedElement.headerRow })
    }
  }, [selectedElement, onUpdateElement])

  if (selectedElement.type !== 'table') {
    return null
  }

  return (
    <>
      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="primary"
        size="icon-xs"
        onClick={handleAddTableRow}
        title="Add Row"
      >
        <Plus size={16} />
      </Button>
      <Button
        variant="primary"
        size="icon-xs"
        onClick={handleRemoveTableRow}
        disabled={!selectedElement.rows || selectedElement.rows <= 1}
        title="Remove Row"
      >
        <Minus size={16} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="primary"
        size="icon-xs"
        onClick={handleAddTableColumn}
        title="Add Column"
      >
        <Columns size={16} />
      </Button>
      <Button
        variant="primary"
        size="icon-xs"
        onClick={handleRemoveTableColumn}
        disabled={!selectedElement.columns || selectedElement.columns <= 1}
        title="Remove Column"
      >
        <Minus size={16} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <ColorPicker
        colorType="tableBorder"
        isOpen={tableBorderColorOpen}
        setIsOpen={setTableBorderColorOpen}
        currentColor={selectedElement.borderColor || '#cccccc'}
        onColorChange={handleTableBorderColorChange}
      />

      <Button
        variant="primary"
        size="icon-xs"
        className={selectedElement.headerRow ? 'bg-accent' : ''}
        onClick={handleToggleHeaderRow}
        title="Toggle Header Row"
      >
        <Rows size={16} />
      </Button>
    </>
  )
}
