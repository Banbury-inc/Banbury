import fs from 'fs/promises'
import path from 'path'
import {
  getRuntimeS3RootAbsolutePath,
  getRuntimeS3RootRelativePath,
  normalizeRuntimeRelativeFilePath,
} from './stageRuntimeFile'

const DEFAULT_BACKEND_URL = 'https://www.api.dev.banbury.io'
const SYNC_MANIFEST_FILE_NAME = '.sync-manifest.json'

interface S3FileRecord {
  file_id: string
  file_path: string
  date_modified?: string
}

interface S3FilesApiResponse {
  result?: string
  files?: S3FileRecord[]
  error?: string
}

interface SyncManifestRecord {
  filePath: string
  dateModified: string
}

interface SyncManifest {
  version: 1
  files: Record<string, SyncManifestRecord>
}

export interface SyncS3RuntimeTreeResult {
  cwd: string
  totalFiles: number
  downloadedFiles: number
  skippedFiles: number
  failedFiles: number
  removedFiles: number
}

function getManifestPath() {
  return path.resolve(getRuntimeS3RootAbsolutePath(), SYNC_MANIFEST_FILE_NAME)
}

async function readManifest(): Promise<SyncManifest> {
  try {
    const rawManifest = await fs.readFile(getManifestPath(), 'utf8')
    const parsed = JSON.parse(rawManifest) as SyncManifest
    if (parsed.version !== 1 || !parsed.files) throw new Error('Invalid manifest version')
    return parsed
  } catch {
    return { version: 1, files: {} }
  }
}

async function writeManifest(manifest: SyncManifest) {
  await fs.writeFile(getManifestPath(), JSON.stringify(manifest, null, 2), 'utf8')
}

async function fetchS3FilesList(authToken: string): Promise<S3FileRecord[]> {
  const backendUrl = process.env.CLOUD_BACKEND_URL || DEFAULT_BACKEND_URL
  const response = await fetch(`${backendUrl}/files/get_s3_files/`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  })

  if (!response.ok) throw new Error('Failed to fetch S3 file list')
  const payload = (await response.json()) as S3FilesApiResponse
  if (payload.error) throw new Error(payload.error)

  if (Array.isArray(payload.files)) return payload.files
  throw new Error('Invalid S3 files response')
}

async function downloadS3FileContent(authToken: string, fileId: string): Promise<Buffer> {
  const backendUrl = process.env.CLOUD_BACKEND_URL || DEFAULT_BACKEND_URL
  const response = await fetch(`${backendUrl}/files/download_s3_file/${encodeURIComponent(fileId)}/`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  })

  if (!response.ok) throw new Error(`Failed to download file ${fileId}`)
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const jsonPayload = (await response.json()) as {
      url?: string
      download_url?: string
      presigned_url?: string
      error?: string
      result?: string
    }
    const presignedUrl = jsonPayload.url || jsonPayload.download_url || jsonPayload.presigned_url
    if (!presignedUrl) {
      const backendError = jsonPayload.error || 'Missing presigned URL'
      throw new Error(`${backendError} for file ${fileId}`)
    }

    const presignedResponse = await fetch(presignedUrl, { method: 'GET' })
    if (!presignedResponse.ok) throw new Error(`Failed presigned download for file ${fileId}`)
    const buffer = Buffer.from(await presignedResponse.arrayBuffer())
    return buffer
  }

  return Buffer.from(await response.arrayBuffer())
}

async function removeFileIfPresent(absolutePath: string) {
  try {
    await fs.unlink(absolutePath)
  } catch {}
}

export async function syncS3RuntimeTree(authToken: string): Promise<SyncS3RuntimeTreeResult> {
  if (!authToken) throw new Error('Missing authorization token')

  const runtimeRoot = getRuntimeS3RootAbsolutePath()
  await fs.mkdir(runtimeRoot, { recursive: true })

  const previousManifest = await readManifest()
  const nextManifest: SyncManifest = { version: 1, files: {} }
  const s3Files = await fetchS3FilesList(authToken)

  let downloadedFiles = 0
  let skippedFiles = 0
  let failedFiles = 0

  for (const s3File of s3Files) {
    if (!s3File.file_id) continue

    const runtimePath = normalizeRuntimeRelativeFilePath(s3File.file_path || s3File.file_id)
    const dateModified = s3File.date_modified || ''
    const previousRecord = previousManifest.files[s3File.file_id]
    const absoluteFilePath = path.resolve(runtimeRoot, runtimePath)
    const absoluteDirectory = path.dirname(absoluteFilePath)

    const shouldSkip = !!previousRecord
      && previousRecord.filePath === runtimePath
      && previousRecord.dateModified === dateModified

    if (shouldSkip) {
      try {
        await fs.access(absoluteFilePath)
        nextManifest.files[s3File.file_id] = {
          filePath: runtimePath,
          dateModified,
        }
        skippedFiles += 1
        continue
      } catch {}
    }

    try {
      const fileBuffer = await downloadS3FileContent(authToken, s3File.file_id)
      await fs.mkdir(absoluteDirectory, { recursive: true })
      await fs.writeFile(absoluteFilePath, fileBuffer)
      nextManifest.files[s3File.file_id] = {
        filePath: runtimePath,
        dateModified,
      }
      downloadedFiles += 1
    } catch {
      failedFiles += 1
      if (previousRecord) {
        nextManifest.files[s3File.file_id] = previousRecord
      }
    }
  }

  let removedFiles = 0
  for (const [previousFileId, previousRecord] of Object.entries(previousManifest.files)) {
    if (nextManifest.files[previousFileId]) continue
    const staleFilePath = path.resolve(runtimeRoot, previousRecord.filePath)
    await removeFileIfPresent(staleFilePath)
    removedFiles += 1
  }

  await writeManifest(nextManifest)

  return {
    cwd: getRuntimeS3RootRelativePath(),
    totalFiles: s3Files.length,
    downloadedFiles,
    skippedFiles,
    failedFiles,
    removedFiles,
  }
}
