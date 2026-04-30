/**
 * Normalize workspace file paths so proposal paths and IDE registration paths
 * compare reliably (slashes, trimming). Does not resolve symlinks.
 */
export function normalizeCodeWorkspacePath(filePath: string): string {
  if (!filePath) return ""
  let s = filePath.trim().replace(/\\/g, "/")
  while (s.startsWith("./")) s = s.slice(2)
  s = s.replace(/\/+/g, "/")
  return s.replace(/\/+$/, "") || s
}
