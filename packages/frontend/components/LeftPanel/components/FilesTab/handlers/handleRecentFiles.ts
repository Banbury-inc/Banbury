const MAX_RECENT_FILES = 20
const STORAGE_KEY_PREFIX = 'local-files:recent:'

function getStorageKey(username: string): string {
  return `${STORAGE_KEY_PREFIX}${username}`
}

export function getRecentFileIds(username: string): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(getStorageKey(username))
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addRecentFileId(username: string, fileId: string): string[] {
  if (typeof window === 'undefined' || !fileId) return []
  
  const current = getRecentFileIds(username)
  // Remove if already exists (to move to front)
  const filtered = current.filter((id) => id !== fileId)
  // Add to front
  const updated = [fileId, ...filtered].slice(0, MAX_RECENT_FILES)
  
  try {
    localStorage.setItem(getStorageKey(username), JSON.stringify(updated))
  } catch {
    // localStorage might be full or blocked
  }
  
  return updated
}

export function clearRecentFiles(username: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(getStorageKey(username))
  } catch {
    // ignore
  }
}

