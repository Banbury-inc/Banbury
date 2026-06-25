import { Palette, Monitor, Type } from 'lucide-react'
import { Switch } from '../../common/ui/switch'
import { Typography } from '@/components/common/ui/typography'
import { Label } from '@/components/common/ui/label'
import { Separator } from '@/components/common/ui/separator'
import { useState, useEffect } from 'react'
import {
  DOCUMENT_EDITOR_DARK_MODE_UPDATED_EVENT,
  createDocumentEditorDarkModeUpdateHandler,
  getColoredFileIcons,
  getDocumentEditorDarkMode,
  handleDocumentEditorDarkModeToggle,
  setColoredFileIcons,
} from './handlers/appearanceHandlers'
import { getIDESettings, setIDESettings } from './handlers/ideSettingsHandlers'
import { IDE_THEME_OPTIONS, type IDEThemeId } from '../../MiddlePanel/CodeViewer/ideThemes'

interface AppearanceTabProps {
  isDarkMode: boolean
  onThemeToggle: (checked: boolean) => void
}

export function AppearanceTab({ isDarkMode, onThemeToggle }: AppearanceTabProps) {
  const [coloredFileIcons, setColoredFileIconsState] = useState(() => getColoredFileIcons())
  const [isDocumentEditorDarkMode, setDocumentEditorDarkModeState] = useState(() => getDocumentEditorDarkMode())
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

  useEffect(() => {
    const handleDocumentEditorDarkModeUpdate = createDocumentEditorDarkModeUpdateHandler(setDocumentEditorDarkModeState)
    window.addEventListener(DOCUMENT_EDITOR_DARK_MODE_UPDATED_EVENT, handleDocumentEditorDarkModeUpdate)
    return () => window.removeEventListener(DOCUMENT_EDITOR_DARK_MODE_UPDATED_EVENT, handleDocumentEditorDarkModeUpdate)
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
      <Typography variant="h3" className="mb-4 flex items-center text-foreground">
        <Palette className="h-5 w-5 mr-2" />
        Theme Settings
      </Typography>
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode-switch">
            <Typography variant="p" className="text-foreground">Dark Mode</Typography>
          </Label>
          <Switch
            id="dark-mode-switch"
            checked={isDarkMode}
            onCheckedChange={onThemeToggle}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="colored-file-icons-switch">
            <div className="flex flex-col">
              <Typography variant="p" className="text-foreground">Colored Icons</Typography>
              <Typography variant="small" className="mt-1 text-muted-foreground">
                Show distinct colors for different file types. When off, icons match the navigation color.
              </Typography>
            </div>
          </Label>
          <Switch
            id="colored-file-icons-switch"
            checked={coloredFileIcons}
            onCheckedChange={handleColoredFileIconsToggle}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="document-editor-dark-mode-switch">
            <div className="flex flex-col">
              <Typography variant="p" className="text-foreground">Document Editor Dark Mode</Typography>
              <Typography variant="small" className="mt-1 text-muted-foreground">
                Invert the document editor background and text colors.
              </Typography>
            </div>
          </Label>
          <Switch
            id="document-editor-dark-mode-switch"
            checked={isDocumentEditorDarkMode}
            onCheckedChange={(checked) => handleDocumentEditorDarkModeToggle(checked, setDocumentEditorDarkModeState)}
          />
        </div>
      </div>

      <Typography variant="h3" className="mb-4 mt-8 flex items-center text-foreground">
        <Monitor className="h-5 w-5 mr-2" />
        Code Editor
      </Typography>
      <Separator />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="ide-theme-select">
            <Typography variant="p" className="text-foreground">Theme</Typography>
          </Label>
          <select
            id="ide-theme-select"
            value={ideSettings.theme}
            onChange={(e) => updateIDESetting('theme', e.target.value as IDEThemeId)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              <Typography variant="p" className="flex items-center gap-2 text-foreground">
                <Type size={16} />
                Font Size
              </Typography>
              <Typography variant="small" className="mt-1 text-muted-foreground">
                Editor font size in pixels.
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
            <Typography variant="small" className="w-8 text-right text-muted-foreground">
              {ideSettings.fontSize}px
            </Typography>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-word-wrap-switch">
            <Typography variant="p" className="text-foreground">Word Wrap</Typography>
          </Label>
          <Switch
            id="ide-word-wrap-switch"
            checked={ideSettings.wordWrap === 'on'}
            onCheckedChange={(checked) => updateIDESetting('wordWrap', checked ? 'on' : 'off')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-line-numbers-switch">
            <Typography variant="p" className="text-foreground">Line Numbers</Typography>
          </Label>
          <Switch
            id="ide-line-numbers-switch"
            checked={ideSettings.showLineNumbers}
            onCheckedChange={(checked) => updateIDESetting('showLineNumbers', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ide-minimap-switch">
            <Typography variant="p" className="text-foreground">Minimap</Typography>
          </Label>
          <Switch
            id="ide-minimap-switch"
            checked={ideSettings.showMinimap}
            onCheckedChange={(checked) => updateIDESetting('showMinimap', checked)}
          />
        </div>
      </div>
    </div>
  )
}

