import { ApiService } from "../../../../backend/api/apiService"
import { FileSystemItem } from "../../../utils/fileTreeUtils"

export interface DeleteResultSummary {
  deleted: number
  failed: number
  failedItems: FileSystemItem[]
}

export async function deleteSelectedFiles(items: FileSystemItem[]): Promise<DeleteResultSummary> {
  if (!items.length) return { deleted: 0, failed: 0, failedItems: [] }

  const fileItems = items.filter(it => it.type === 'file' && it.file_id)
  if (!fileItems.length) return { deleted: 0, failed: 0, failedItems: [] }

  const results = await Promise.allSettled(
    fileItems.map(async it => ApiService.Files.deleteS3File(it.file_id as string).then(() => it))
  )

  let deleted = 0
  const failedItems: FileSystemItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') deleted += 1
    else failedItems.push((r as any).reason?.item ?? (r as any).value ?? (r as any))
  }

  return { deleted, failed: fileItems.length - deleted, failedItems }
}


