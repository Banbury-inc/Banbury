interface OpenCellUrlHandlerParams {
  hotTableRef: React.RefObject<any>
}

// URL detection helper (matches the logic in CSVEditor.tsx)
function detectUrl(value: any): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Pattern 1: Starts with http:// or https://
  if (/^https?:\/\/.+/.test(trimmed)) {
    return trimmed
  }

  // Pattern 2: Starts with www.
  if (/^www\..+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`
  }

  // Pattern 3: Domain pattern (e.g., example.com, subdomain.example.com)
  const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(\/.*)?$/i
  if (domainPattern.test(trimmed) && trimmed.includes('.')) {
    const parts = trimmed.split('/')[0].split('.')
    if (parts.length >= 2 && parts[parts.length - 1].length >= 2) {
      return `https://${trimmed}`
    }
  }

  // Pattern 4: mailto: links
  if (/^mailto:.+@.+\..+/.test(trimmed)) {
    return trimmed
  }

  return null
}

export function createOpenCellUrlHandler({ hotTableRef }: OpenCellUrlHandlerParams) {
  function openUrlInCurrentCell() {
    const hot = hotTableRef.current?.hotInstance
    if (!hot) return

    const selected = hot.getSelectedLast()
    if (!selected) return

    const [row, col] = selected
    const cellValue = hot.getDataAtCell(row, col)

    const url = detectUrl(cellValue)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return {
    openUrlInCurrentCell,
  }
}
