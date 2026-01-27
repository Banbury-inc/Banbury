import { getStoredKeybinds, KeybindsState } from '@/components/modals/settings-tabs/handlers/keybindHandlers'

interface HandleKeybindsUpdateParams {
  setKeybinds: React.Dispatch<React.SetStateAction<KeybindsState>>
}

export function createKeybindsUpdateHandler({
  setKeybinds
}: HandleKeybindsUpdateParams): () => void {
  return () => {
    setKeybinds(getStoredKeybinds())
  }
}

export const KEYBINDS_UPDATED_EVENT = 'keybinds-updated'
