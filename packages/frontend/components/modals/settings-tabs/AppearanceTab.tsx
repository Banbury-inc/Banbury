import { Palette, Sun, Moon } from 'lucide-react'
import { Switch } from '../../ui/switch'
import { Typography } from 'frontend/components/ui/typography'
import { Label } from 'frontend/components/ui/label'
import { Separator } from 'frontend/components/ui/separator'

interface AppearanceTabProps {
  isDarkMode: boolean
  onThemeToggle: (checked: boolean) => void
}

export function AppearanceTab({ isDarkMode, onThemeToggle }: AppearanceTabProps) {
  return (
    <div className="space-y-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
          <Palette className="h-5 w-5 mr-2" />
          Theme Settings
        </h2>
        <Separator />
        
        <div className="flex items-center gap-2">
          <Label htmlFor="dark-mode-switch">
            <Typography variant="p" className="text-zinc-900 dark:text-white">Dark Mode</Typography>
          </Label>
            <Switch
              checked={isDarkMode}
              onCheckedChange={onThemeToggle}
              className="data-[state=checked]:bg-blue-600"
            />
        </div>
    </div>
  )
}

