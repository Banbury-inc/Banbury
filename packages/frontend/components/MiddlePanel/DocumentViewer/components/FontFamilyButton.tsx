import { Editor, useEditorState } from '@tiptap/react'
import { ChevronDown } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../common/ui/dropdown-menu'
import { changeSelectionFontFamily } from '../../../handlers/editorFont'
import {
  FONT_FAMILY_OPTIONS,
  getFontFamilyLabel,
  getSelectionFontFamily,
  isFontFamilyOptionActive,
} from './handlers/fontFamilyButtonHandlers'

interface FontFamilyButtonProps {
  editor: Editor
}

export function FontFamilyButton({ editor }: FontFamilyButtonProps) {
  const selectedFont = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => getSelectionFontFamily(currentEditor),
  })

  const handleFontChange = (fontFamily: string | null) => {
    changeSelectionFontFamily({ editor, fontFamily })
  }

  return (
    <div className="flex items-center" data-toolbar="font-family">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="xs"
            title={getFontFamilyLabel(selectedFont)}
            className="w-[100px] justify-between gap-1 px-2"
          >
            <span className="min-w-0 flex-1 truncate text-left text-xs">{getFontFamilyLabel(selectedFont)}</span>
            <ChevronDown size={12} className="shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {FONT_FAMILY_OPTIONS.map((option, index) => {
            const showSeparator = option.value === 'sans-serif'

            return (
              <div key={option.label}>
                {showSeparator && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => handleFontChange(option.value)}
                  className={isFontFamilyOptionActive(selectedFont, option.value) ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
                {index === 0 && <DropdownMenuSeparator />}
              </div>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
