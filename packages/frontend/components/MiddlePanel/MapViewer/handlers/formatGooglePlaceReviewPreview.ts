const DEFAULT_MAX_LEN = 220

export function formatGooglePlaceReviewPreview(text: string, maxLen = DEFAULT_MAX_LEN): {
  preview: string
  isTruncated: boolean
} {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) return { preview: trimmed, isTruncated: false }

  const slice = trimmed.slice(0, maxLen)
  const lastSpace = slice.lastIndexOf(' ')
  const preview = (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trimEnd()

  return { preview: `${preview}…`, isTruncated: true }
}
