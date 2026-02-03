/**
 * Date Display Formatting Utilities
 *
 * Format dates as MM/DD/YYYY by default when cell type is 'date'
 */

/**
 * Display helper: format dates as MM/DD/YYYY by default when cell type is 'date'
 * @param value - The value to format (Date, number, string, or other)
 * @returns Formatted date string or string representation of the value
 */
export function formatDateDisplay(value: any): string {
  if (value == null || value === '') return ''
  try {
    if (value instanceof Date) {
      return value.toLocaleDateString('en-US')
    }
    if (typeof value === 'number') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return date.toLocaleDateString('en-US')
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed
      const parsed = new Date(trimmed)
      if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString('en-US')
    }
  } catch {}
  return String(value)
}
