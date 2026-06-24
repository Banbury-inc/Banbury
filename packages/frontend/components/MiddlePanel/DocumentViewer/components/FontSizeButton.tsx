import { Editor, useEditorState } from '@tiptap/react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import {
  getSelectionFontSize,
  handleFontSizeChange,
  handleFontSizeDecrement,
  handleFontSizeIncrement,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
} from './handlers/fontSizeButtonHandlers'

interface FontSizeButtonProps {
  editor: Editor
}

export function FontSizeButton({ editor }: FontSizeButtonProps) {
  const fontSize = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => getSelectionFontSize(currentEditor),
  })

  return (
    <div className="flex items-center" title="Font size">
      <Button
        variant="ghost"
        size="icon-xs"
        className="rounded-r-none border-r-0"
        onClick={() => handleFontSizeDecrement({ editor, currentSize: fontSize })}
        title="Decrease font size"
      >
        <Minus size={12} />
      </Button>
      <input
        type="number"
        className="w-12 h-7 text-center text-xs border border-border bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={fontSize}
        onChange={(event) => handleFontSizeChange({ editor, value: event.target.value })}
        min={MIN_FONT_SIZE}
        max={MAX_FONT_SIZE}
        title="Font size"
      />
      <Button
        variant="ghost"
        size="icon-xs"
        className="rounded-l-none border-l-0"
        onClick={() => handleFontSizeIncrement({ editor, currentSize: fontSize })}
        title="Increase font size"
      >
        <Plus size={12} />
      </Button>
    </div>
  )
}
