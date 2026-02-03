import type { VimMode } from '../handlers/handle-vim-mode'

interface VimModeIndicatorProps {
  isVimMode: boolean
  vimDisplayMode: VimMode
}

export function VimModeIndicator({ isVimMode, vimDisplayMode }: VimModeIndicatorProps) {
  if (!isVimMode) return null

  const backgroundColor = vimDisplayMode === 'insert'
    ? '#3b82f6'
    : vimDisplayMode.startsWith('visual')
    ? '#a855f7'
    : '#10b981'

  return (
    <div style={{
      position: 'absolute',
      bottom: 48,
      right: 8,
      padding: '4px 12px',
      backgroundColor,
      color: '#ffffff',
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      zIndex: 1000,
      pointerEvents: 'none',
      textTransform: 'uppercase'
    }}>
      {vimDisplayMode.replace('-', ' ')}
    </div>
  )
}
