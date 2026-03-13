import fs from 'fs/promises'
import path from 'path'

const RUNTIME_ROOT_DIR = '.banbury-runtime'
const RUNTIME_S3_SUBDIR = 's3'
const DEFAULT_RUNTIME_FILE = 'main.py'

export const RUNTIME_S3_ROOT_DIR = path.join(RUNTIME_ROOT_DIR, RUNTIME_S3_SUBDIR)

interface StageRuntimeFileInput {
  filePath: string
  content: string
}

interface StageRuntimeFileResult {
  relativePath: string
  cwd: string
}

function normalizeRelativeFilePath(filePath: string): string {
  const normalized = (filePath || '').replaceAll('\\', '/').trim()
  const pathParts = normalized
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')

  if (pathParts.length === 0) return DEFAULT_RUNTIME_FILE
  return pathParts.join('/')
}

export function getRuntimeS3RootAbsolutePath() {
  return path.resolve(process.cwd(), RUNTIME_S3_ROOT_DIR)
}

export function getRuntimeS3RootRelativePath() {
  return RUNTIME_S3_ROOT_DIR
}

export function normalizeRuntimeRelativeFilePath(filePath: string): string {
  return normalizeRelativeFilePath(filePath)
}

export async function stageRuntimeFile({
  filePath,
  content,
}: StageRuntimeFileInput): Promise<StageRuntimeFileResult> {
  const runtimeRoot = getRuntimeS3RootAbsolutePath()
  const relativeFilePath = normalizeRelativeFilePath(filePath)
  const relativePath = relativeFilePath
  const absoluteFilePath = path.resolve(runtimeRoot, relativeFilePath)
  const absoluteDirectory = path.dirname(absoluteFilePath)

  await fs.mkdir(absoluteDirectory, { recursive: true })
  await fs.writeFile(absoluteFilePath, content, 'utf8')

  return {
    relativePath,
    cwd: getRuntimeS3RootRelativePath(),
  }
}
