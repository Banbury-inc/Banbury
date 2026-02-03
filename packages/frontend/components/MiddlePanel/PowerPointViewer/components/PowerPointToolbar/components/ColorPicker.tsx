import { Button } from '../../../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../common/ui/dropdown-menu'
import { Paintbrush, PaintBucket } from 'lucide-react'

const colorPalette = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5',
  '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33',
  '#FDD835', '#FB8C00', '#F4511E', '#6D4C41', '#78909C', '#455A64',
]

interface ColorPickerProps {
  colorType: 'text' | 'fill' | 'stroke' | 'background' | 'tableBorder' | 'textBackground' | 'textBorder' | 'highlight'
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  currentColor: string
  onColorChange: (color: string) => void
}

export function ColorPicker({
  colorType,
  isOpen,
  setIsOpen,
  currentColor,
  onColorChange,
}: ColorPickerProps) {
  const title =
    colorType === 'text' ? 'Text Color' : 
    colorType === 'fill' ? 'Fill Color' : 
    colorType === 'stroke' ? 'Stroke Color' : 
    colorType === 'textBackground' ? 'Text Background' :
    colorType === 'textBorder' ? 'Text Border' :
    colorType === 'highlight' ? 'Highlight' :
    'Background Color'

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-xs"
          title={title}
        >
          <div className="relative">
            {colorType === 'text' || colorType === 'stroke' || colorType === 'textBorder' ? <Paintbrush size={16} /> : <PaintBucket size={16} />}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full" 
              style={{ backgroundColor: currentColor }}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-2">
        <div className="grid grid-cols-6 gap-1">
          {colorPalette.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
        <DropdownMenuSeparator className="my-2" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Custom:</span>
          <input
            type="color"
            className="w-8 h-6 cursor-pointer border rounded"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { colorPalette }
