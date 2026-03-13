export const TERMINAL_S3_CWD = '.banbury-runtime/s3'

interface SyncTerminalS3FilesResponse {
  cwd: string
  totalFiles: number
  downloadedFiles: number
  skippedFiles: number
  failedFiles: number
  removedFiles: number
  error?: string
}

export async function syncTerminalS3Files(): Promise<SyncTerminalS3FilesResponse> {
  const token = window.localStorage.getItem('authToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch('/api/terminal/sync-s3-files', {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to sync terminal files' }))
    throw new Error(payload.error || 'Failed to sync terminal files')
  }

  const payload = await response.json() as SyncTerminalS3FilesResponse
  return payload
}
