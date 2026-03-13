import { Palette, Monitor, Type } from 'lucide-react'
import { Switch } from '../../common/ui/switch'
import { Typography } from '@/components/common/ui/typography'
import { Label } from '@/components/common/ui/label'
import { Separator } from '@/components/common/ui/separator'
import { useState, useEffect } from 'react'
import { getColoredFileIcons, setColoredFileIcons } from './handlers/appearanceHandlers'
import { getIDESettings, setIDESettings } from './handlers/ideSettingsHandlers'
import { IDE_THEME_OPTIONS, type IDEThemeId } from '../../MiddlePanel/CodeViewer/ideThemes'

interface AppearanceTabProps {
  isDarkMode: boolean
  onThemeToggle: (checked: boolean) => void
}

export function AppearanceTab({ isDarkMode, onThemeToggle }: AppearanceTabProps) {
  const [coloredFileIcons, setColoredFileIconsState] = useState(() => getColoredFileIcons())
  const [ideSettings, setIdeSettingsState] = useState(() => getIDESettings())

  useEffect(() => {
    const handleStorageChange = () => {
      setColoredFileIconsState(getColoredFileIcons())
    }

    window.addEventListener('colored-file-icons-updated', handleStorageChange)
    return () => window.removeEventListener('colored-file-icons-updated', handleStorageChange)
  }, [])

  useEffect(() => {
    const handleIdeSettingsChange = () => setIdeSettingsState(getIDESettings())
    window.addEventListener('ide-settings-updated', handleIdeSettingsChange)
    return () => window.removeEventListener('ide-settings-updated', handleIdeSettingsChange)
  }, [])

  function handleColoredFileIconsToggle(checked: boolean) {
    setColoredFileIcons(checked)
    setColoredFileIconsState(checked)
  }

  function updateIDESetting<K extends keyof typeof ideSettings>(key: K, value: (typeof ideSettings)[K]) {
    setIDESettings({ [key]: value })
    setIdeSettingsState((prev) => ({ ...prev, [key]: value }))
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

      <Typography variant="h3" className="mb-4 mt-8 flex items-center text-zinc-900 dark:text-white">
        <Monitor className="h-5 w-5 mr-2" />
        Code Editor
      </Typography>
      <Separator />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="ide-theme-select">
            <Typography variant="p" className="text-zinc-900 dark:text-white">Theme</Typography>
          </Label>
          <select
            id="ide-theme-select"
            value={ideSettings.theme}
            onChange={(e) => updateIDESetting('theme', e.target.value as IDEThemeId)}
            className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {IDE_THEME_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-font-size">
            <div className="flex flex-col">
              <Typography variant="p" className="text-zinc-900 dark:text-white flex items-center gap-2">
                <Type size={16} />
                Font Size
              </Typography>
              <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mt-1">
                Editor font size in pixels
              </Typography>
            </div>
          </Label>
          <div className="flex items-center gap-3">
            <input
              id="ide-font-size"
              type="range"
              min="10"
              max="24"
              value={ideSettings.fontSize}
              onChange={(e) => updateIDESetting('fontSize', Number(e.target.value))}
              className="w-28"
            />
            <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 w-8 text-right">
              {ideSettings.fontSize}px
            </Typography>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-word-wrap-switch">
            <Typography variant="p" className="text-zinc-900 dark:text-white">Word Wrap</Typography>
          </Label>
          <Switch
            id="ide-word-wrap-switch"
            checked={ideSettings.wordWrap === 'on'}
            onCheckedChange={(checked) => updateIDESetting('wordWrap', checked ? 'on' : 'off')}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-line-numbers-switch">
            <Typography variant="p" className="text-zinc-900 dark:text-white">Line Numbers</Typography>
          </Label>
          <Switch
            id="ide-line-numbers-switch"
            checked={ideSettings.showLineNumbers}
            onCheckedChange={(checked) => updateIDESetting('showLineNumbers', checked)}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-minimap-switch">
            <Typography variant="p" className="text-zinc-900 dark:text-white">Minimap</Typography>
          </Label>
          <Switch
            id="ide-minimap-switch"
            checked={ideSettings.showMinimap}
            onCheckedChange={(checked) => updateIDESetting('showMinimap', checked)}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </div>
    </div>
  )
}

