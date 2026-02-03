import { Palette, Sun, Moon } from 'lucide-react'
import { Switch } from '../../common/ui/switch'
import { Typography } from '@/components/common/ui/typography'
import { Label } from '@/components/common/ui/label'
import { Separator } from '@/components/common/ui/separator'
import { useState, useEffect } from 'react'
import { getColoredFileIcons, setColoredFileIcons } from './handlers/appearanceHandlers'

interface AppearanceTabProps {
  isDarkMode: boolean
  onThemeToggle: (checked: boolean) => void
}

export function AppearanceTab({ isDarkMode, onThemeToggle }: AppearanceTabProps) {
  const [coloredFileIcons, setColoredFileIconsState] = useState(() => getColoredFileIcons())

  useEffect(() => {
    const handleStorageChange = () => {
      setColoredFileIconsState(getColoredFileIcons())
    }
    
    window.addEventListener('colored-file-icons-updated', handleStorageChange)
    return () => window.removeEventListener('colored-file-icons-updated', handleStorageChange)
  }, [])

  function handleColoredFileIconsToggle(checked: boolean) {
    setColoredFileIcons(checked)
    setColoredFileIconsState(checked)
  }

  return (
      <div className="space-y-6">
        <Typography variant="h3" className="mb-4 flex items-center text-zinc-900 dark:text-white">
          <Palette className="h-5 w-5 mr-2" />
          Theme Settings
        </Typography>
        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-switch">
              <Typography variant="p" className="text-zinc-900 dark:text-white">Dark Mode</Typography>
            </Label>
            <Switch
              id="dark-mode-switch"
              checked={isDarkMode}
              onCheckedChange={onThemeToggle}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="colored-file-icons-switch">
              <div className="flex flex-col">
                <Typography variant="p" className="text-zinc-900 dark:text-white">Colored Icons</Typography>
                <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mt-1">
                  Show different colors for different file types. When off, all icons use the same color as navigation bar icons.
                </Typography>
              </div>
            </Label>
            <Switch
              id="colored-file-icons-switch"
              checked={coloredFileIcons}
              onCheckedChange={handleColoredFileIconsToggle}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
    </div>
  )
}

