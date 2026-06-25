import { Switch } from '../../common/ui/switch'
import { Typography } from '@/components/common/ui/typography'
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
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabLayout,
  SettingsTabRow,
  SettingsTabSection,
} from './settings-tab-layout'

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
    <SettingsTabLayout>
      <SettingsTabSection title="Theme">
        <SettingsTabCard>
          <SettingsTabCardBody>
            <SettingsTabRow label="Dark Mode" htmlFor="dark-mode-switch">
              <Switch
                id="dark-mode-switch"
                checked={isDarkMode}
                onCheckedChange={onThemeToggle}
              />
            </SettingsTabRow>

            <SettingsTabRow
              label="Colored Icons"
              description="Show distinct colors for different file types. When off, icons match the navigation color."
              htmlFor="colored-file-icons-switch"
              align="start"
            >
              <Switch
                id="colored-file-icons-switch"
                checked={coloredFileIcons}
                onCheckedChange={handleColoredFileIconsToggle}
              />
            </SettingsTabRow>

            <SettingsTabRow
              label="Document Editor Dark Mode"
              description="Invert the document editor background and text colors."
              htmlFor="document-editor-dark-mode-switch"
              align="start"
            >
              <Switch
                id="document-editor-dark-mode-switch"
                checked={isDocumentEditorDarkMode}
                onCheckedChange={(checked) => handleDocumentEditorDarkModeToggle(checked, setDocumentEditorDarkModeState)}
              />
            </SettingsTabRow>
          </SettingsTabCardBody>
        </SettingsTabCard>
      </SettingsTabSection>

      <SettingsTabSection title="Code Editor">
        <SettingsTabCard>
          <SettingsTabCardBody>
            <SettingsTabRow label="Theme" htmlFor="ide-theme-select">
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
            </SettingsTabRow>

            <SettingsTabRow
              label="Font Size"
              description="Editor font size in pixels."
              htmlFor="ide-font-size"
            >
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
            </SettingsTabRow>

            <SettingsTabRow label="Word Wrap" htmlFor="ide-word-wrap-switch">
              <Switch
                id="ide-word-wrap-switch"
                checked={ideSettings.wordWrap === 'on'}
                onCheckedChange={(checked) => updateIDESetting('wordWrap', checked ? 'on' : 'off')}
              />
            </SettingsTabRow>

            <SettingsTabRow label="Line Numbers" htmlFor="ide-line-numbers-switch">
              <Switch
                id="ide-line-numbers-switch"
                checked={ideSettings.showLineNumbers}
                onCheckedChange={(checked) => updateIDESetting('showLineNumbers', checked)}
              />
            </SettingsTabRow>

            <SettingsTabRow label="Minimap" htmlFor="ide-minimap-switch">
              <Switch
                id="ide-minimap-switch"
                checked={ideSettings.showMinimap}
                onCheckedChange={(checked) => updateIDESetting('showMinimap', checked)}
              />
            </SettingsTabRow>
          </SettingsTabCardBody>
        </SettingsTabCard>
      </SettingsTabSection>
    </SettingsTabLayout>
  )
}
