export function getDirectoryPath(filePath: string): string | undefined {
  const normalized = (filePath || '').replaceAll('\\', '/').trim()
  if (!normalized) return undefined

  const pathParts = normalized.split('/').filter(Boolean)
  if (pathParts.length <= 1) return '.'
  return pathParts.slice(0, -1).join('/')
}
