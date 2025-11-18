import { FileSystemItem } from "../../../utils/fileTreeUtils"

export interface ToggleSelectionArgs {
  selectedIds: Set<string>
  itemId: string
  isShiftKey: boolean
}

export function toggleFileSelection({ selectedIds, itemId, isShiftKey }: ToggleSelectionArgs): Set<string> {
  if (!isShiftKey) return new Set([itemId])
  const next = new Set(selectedIds)
  if (next.has(itemId)) next.delete(itemId)
  else next.add(itemId)
  return next
}

export function collectSelectedFileItems(fileSystem: FileSystemItem[], selectedIds: Set<string>): FileSystemItem[] {
  const results: FileSystemItem[] = []

  const walk = (items: FileSystemItem[]) => {
    for (const it of items) {
      if (it.type === 'file' && selectedIds.has(it.id)) results.push(it)
      if (it.children && it.children.length > 0) walk(it.children)
    }
  }

  walk(fileSystem)
  return results
}


