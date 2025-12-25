import { useState, useEffect, useCallback } from 'react'
import { Keyboard, RotateCcw } from 'lucide-react'
import { Button } from '../../ui/button'
import { Typography } from 'frontend/components/ui/typography'
import { Separator } from 'frontend/components/ui/separator'
import { Kbd, KbdGroup } from '../../ui/kbd'
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
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      <div className="flex-1">
        <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">
          {keybind.label}
        </Typography>
        <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mt-0.5">
          {keybind.description}
        </Typography>
      </div>
      
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30 min-w-[120px] text-center">
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
                <Typography variant="small" className="text-zinc-500 dark:text-zinc-400 italic">
                  Press a key...
                </Typography>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
              className="text-zinc-600 dark:text-zinc-400"
            >
              Cancel
            </Button>
            {pendingKey && (
              <Button
                size="sm"
                onClick={() => onSaveEdit(pendingKey)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save
              </Button>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={onStartEdit}
              className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-zinc-900"
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
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1 h-auto"
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
        <Typography variant="h3" className="flex items-center text-zinc-900 dark:text-white">
          <Keyboard className="h-5 w-5 mr-2" />
          Keyboard Shortcuts
        </Typography>
        {hasCustomizations && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            className="text-zinc-600 dark:text-zinc-400"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        )}
      </div>
      <Separator />
      
      <div className="space-y-2">
        <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mb-4">
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
      
      <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">
          <strong>Tip:</strong> Press a letter or number key (with optional Shift) while editing to set a new shortcut. Press Escape to cancel or Enter to confirm.
        </Typography>
      </div>
    </div>
  )
}
