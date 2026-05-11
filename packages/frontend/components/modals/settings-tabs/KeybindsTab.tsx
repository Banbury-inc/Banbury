import { useState, useEffect, useCallback } from 'react'
import { Keyboard, RotateCcw } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Switch } from '../../common/ui/switch'
import { Label } from '@/components/common/ui/label'
import { Typography } from '@/components/common/ui/typography'
import { Separator } from '@/components/common/ui/separator'
import { Kbd, KbdGroup } from '../../common/ui/kbd'
import {
  KeybindsState,
  KeybindConfig,
  getStoredKeybinds,
  updateKeybind,
  resetKeybind,
  resetAllKeybinds,
  getActiveKey,
  keyEventToString,
} from './handlers/keybindHandlers'

interface KeybindRowProps {
  keybind: KeybindConfig
  keybindId: keyof KeybindsState
  isMac: boolean
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (newKey: string) => void
  onReset: () => void
}

function KeybindRow({
  keybind,
  isMac,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onReset,
}: KeybindRowProps) {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEditing) return
    
    event.preventDefault()
    event.stopPropagation()
    
    // Escape cancels editing
    if (event.key === 'Escape') {
      onCancelEdit()
      return
    }
    
    // Enter confirms the pending key
    if (event.key === 'Enter' && pendingKey) {
      onSaveEdit(pendingKey)
      return
    }
    
    const keyString = keyEventToString(event)
    if (keyString) {
      setPendingKey(keyString)
    }
  }, [isEditing, pendingKey, onCancelEdit, onSaveEdit])
  
  useEffect(() => {
    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isEditing, handleKeyDown])
  
  useEffect(() => {
    if (!isEditing) {
      setPendingKey(null)
    }
  }, [isEditing])
  
  const activeKey = getActiveKey(keybind)
  const isCustomized = keybind.customKey !== null
  const displayKey = pendingKey ?? activeKey
  
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <Typography variant="p" className="font-medium text-foreground">
          {keybind.label}
        </Typography>
        <Typography variant="small" className="mt-0.5 text-muted-foreground">
          {keybind.description}
        </Typography>
      </div>
      
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[120px] rounded border-2 border-ring bg-primary/10 px-3 py-1.5 text-center">
              {pendingKey ? (
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  {pendingKey.includes('shift') && (
                    <>
                      <span className="text-muted-foreground">+</span>
                      <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
                    </>
                  )}
                  <span className="text-muted-foreground">+</span>
                  <Kbd>{pendingKey.replace('shift+', '').toUpperCase()}</Kbd>
                </KbdGroup>
              ) : (
                <Typography variant="small" className="italic text-muted-foreground">
                  Press a key...
                </Typography>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            {pendingKey && (
              <Button
                size="sm"
                onClick={() => onSaveEdit(pendingKey)}
              >
                Save
              </Button>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onStartEdit}
              className="cursor-pointer rounded border border-border bg-background px-3 py-1.5 transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Edit ${keybind.label} shortcut`}
            >
              <KbdGroup>
                <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                {displayKey.includes('shift') && (
                  <>
                    <span className="text-muted-foreground">+</span>
                    <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
                  </>
                )}
                <span className="text-muted-foreground">+</span>
                <Kbd>{displayKey.replace('shift+', '').toUpperCase()}</Kbd>
              </KbdGroup>
            </button>
            {isCustomized && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onReset}
                title="Reset to default"
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function KeybindsTab() {
  const [keybinds, setKeybinds] = useState<KeybindsState>(getStoredKeybinds)
  const [editingId, setEditingId] = useState<keyof KeybindsState | null>(null)
  const [isMac, setIsMac] = useState(false)
  const [isVimMode, setIsVimMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('vimMode') === 'true'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    }
  }, [])
  
  // Listen for external keybind updates
  useEffect(() => {
    function handleKeybindsUpdate() {
      setKeybinds(getStoredKeybinds())
    }
    
    window.addEventListener('keybinds-updated', handleKeybindsUpdate)
    return () => window.removeEventListener('keybinds-updated', handleKeybindsUpdate)
  }, [])
  
  function handleStartEdit(keybindId: keyof KeybindsState) {
    setEditingId(keybindId)
  }
  
  function handleCancelEdit() {
    setEditingId(null)
  }
  
  function handleSaveEdit(keybindId: keyof KeybindsState, newKey: string) {
    const updatedKeybinds = updateKeybind(keybindId, newKey)
    setKeybinds(updatedKeybinds)
    setEditingId(null)
  }
  
  function handleResetKeybind(keybindId: keyof KeybindsState) {
    const updatedKeybinds = resetKeybind(keybindId)
    setKeybinds(updatedKeybinds)
  }
  
  function handleResetAll() {
    const defaultKeybinds = resetAllKeybinds()
    setKeybinds(defaultKeybinds)
  }

  function handleVimModeToggle(checked: boolean) {
    setIsVimMode(checked)
    localStorage.setItem('vimMode', checked ? 'true' : 'false')
    window.dispatchEvent(new Event('storage'))
  }

  const keybindEntries: Array<{ id: keyof KeybindsState; config: KeybindConfig }> = [
    { id: 'newAgent', config: keybinds.newAgent },
    { id: 'searchFiles', config: keybinds.searchFiles },
    { id: 'toggleFileSidebar', config: keybinds.toggleFileSidebar },
    { id: 'toggleFileSidebarAlt', config: keybinds.toggleFileSidebarAlt },
  ]
  
  const hasCustomizations = keybindEntries.some(({ config }) => config.customKey !== null)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h3" className="flex items-center text-foreground">
          <Keyboard className="h-5 w-5 mr-2" />
          Keyboard Shortcuts
        </Typography>
        {hasCustomizations && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        )}
      </div>
      <Separator />
      
      <div className="space-y-2">
        <Typography variant="small" className="mb-4 text-muted-foreground">
          Click on a shortcut to customize it. All shortcuts use {isMac ? '⌘ (Command)' : 'Ctrl'} as the modifier key.
        </Typography>
        
        <div className="space-y-2">
          {keybindEntries.map(({ id, config }) => (
            <KeybindRow
              key={id}
              keybind={config}
              keybindId={id}
              isMac={isMac}
              isEditing={editingId === id}
              onStartEdit={() => handleStartEdit(id)}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={(newKey) => handleSaveEdit(id, newKey)}
              onReset={() => handleResetKeybind(id)}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
        <Typography variant="small" className="text-muted-foreground">
          <strong>Tip:</strong> Press a letter or number key (with optional Shift) while editing to set a new shortcut. Press Escape to cancel or Enter to confirm.
        </Typography>
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <Typography variant="h4" className="text-foreground">
          Editor Settings
        </Typography>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex-1">
            <Label htmlFor="vim-mode-switch">
              <Typography variant="p" className="font-medium text-foreground">
                Vim Keybindings (Spreadsheet)
              </Typography>
            </Label>
            <Typography variant="small" className="mt-1 text-muted-foreground">
              Enable Vim modal editing in the spreadsheet editor with Normal, Insert, and Visual modes.
            </Typography>
          </div>
          <Switch
            id="vim-mode-switch"
            checked={isVimMode}
            onCheckedChange={handleVimModeToggle}
          />
        </div>
      </div>
    </div>
  )
}
