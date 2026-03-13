import { FileSystemItem } from '../../../../utils/fileTreeUtils'

interface StageFileResponse {
  relativePath: string
  cwd: string
  error?: string
}

interface RunActiveFileInput {
  file: FileSystemItem
  content: string
}

interface RunActiveFileResult {
  command: string
  cwd: string
}

function quoteForShell(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`
}

function getRuntimeFilePath(file: FileSystemItem): string {
  if (file.path?.trim()) return file.path
  return file.name
}

function buildRunCommand(runtimeRelativePath: string): string {
  const quotedPath = quoteForShell(runtimeRelativePath)
  const isPython = runtimeRelativePath.toLowerCase().endsWith('.py')

  if (isPython)
    return `python3 ${quotedPath} || python ${quotedPath}`

  return `chmod +x ${quotedPath} && ${quotedPath}`
}

async function stageFileForExecution(filePath: string, content: string): Promise<StageFileResponse> {
  const token = window.localStorage.getItem('authToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch('/api/terminal/stage-file', {
    method: 'POST',
    headers,
    body: JSON.stringify({ filePath, content }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to stage runtime file' }))
    throw new Error(payload.error || 'Failed to stage runtime file')
  }

  return response.json() as Promise<StageFileResponse>
}

export async function runActiveFile({ file, content }: RunActiveFileInput): Promise<RunActiveFileResult> {
  const runtimeFilePath = getRuntimeFilePath(file)
  const staged = await stageFileForExecution(runtimeFilePath, content)

  if (!staged.relativePath || !staged.cwd) {
    throw new Error(staged.error || 'Invalid runtime staging response')
  }

  return {
    command: buildRunCommand(staged.relativePath),
    cwd: staged.cwd,
  }
}
