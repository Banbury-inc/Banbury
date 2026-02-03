import { Editor } from '@tiptap/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../common/ui/dropdown-menu'
import { changeSelectionFontFamily } from '../../../handlers/editorFont'

interface FontFamilyButtonProps {
  editor: Editor
}

export function FontFamilyButton({ editor }: FontFamilyButtonProps) {
  const [selectedFont, setSelectedFont] = useState<string | null>(null)

  const handleFontChange = (fontFamily: string | null) => {
    setSelectedFont(fontFamily)
    changeSelectionFontFamily({ editor, fontFamily })
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="xs" title="Font family" className="gap-1">
            <span className="flex items-center gap-1">
              {selectedFont || 'Default'}
              <ChevronDown size={12} />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem 
            onClick={() => handleFontChange(null)}
            className={!selectedFont ? 'bg-accent' : ''}
          >
            Default
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleFontChange('Inter')}
            className={selectedFont === 'Inter' ? 'bg-accent' : ''}
          >
            Inter
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Arial')}
            className={selectedFont === 'Arial' ? 'bg-accent' : ''}
          >
            Arial
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Georgia')}
            className={selectedFont === 'Georgia' ? 'bg-accent' : ''}
          >
            Georgia
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Times New Roman')}
            className={selectedFont === 'Times New Roman' ? 'bg-accent' : ''}
          >
            Times New Roman
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Courier New')}
            className={selectedFont === 'Courier New' ? 'bg-accent' : ''}
          >
            Courier New
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Roboto')}
            className={selectedFont === 'Roboto' ? 'bg-accent' : ''}
          >
            Roboto
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Open Sans')}
            className={selectedFont === 'Open Sans' ? 'bg-accent' : ''}
          >
            Open Sans
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('Merriweather')}
            className={selectedFont === 'Merriweather' ? 'bg-accent' : ''}
          >
            Merriweather
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleFontChange('sans-serif')}
            className={selectedFont === 'sans-serif' ? 'bg-accent' : ''}
          >
            Sans-serif
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('serif')}
            className={selectedFont === 'serif' ? 'bg-accent' : ''}
          >
            Serif
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFontChange('monospace')}
            className={selectedFont === 'monospace' ? 'bg-accent' : ''}
          >
            Monospace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
