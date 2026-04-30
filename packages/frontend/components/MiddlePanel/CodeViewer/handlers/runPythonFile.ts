import { FileSystemItem } from '../../../../utils/fileTreeUtils'

export interface RunPythonFileResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  truncated: boolean
  interpreter: string
}

interface RunPythonFileInput {
  file: FileSystemItem
  content: string
}

export async function runPythonFile({ file, content }: RunPythonFileInput): Promise<RunPythonFileResult> {
  const token = window.localStorage.getItem('authToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch('/api/code/run-python', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filePath: file.path || file.name,
      content,
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to run python file' }))
    throw new Error(payload.error || 'Failed to run python file')
  }

  const payload = await response.json() as RunPythonFileResult
  return payload
}
