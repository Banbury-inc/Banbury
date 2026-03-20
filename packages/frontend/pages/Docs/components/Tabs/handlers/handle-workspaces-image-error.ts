import type { SyntheticEvent } from 'react'

export function handleWorkspacesImageError(
  e: SyntheticEvent<HTMLImageElement>
) {
  console.error('Failed to load Workspaces image:', e)
  e.currentTarget.style.display = 'none'
}
