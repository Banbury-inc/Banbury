// Helper functions for AI tab title management

/**
 * Checks if a tab label matches the default "Chat N" pattern.
 * Returns true for labels like "Chat 1", "Chat 2", "Chat 123", etc.
 */
export function isDefaultAiTabLabel(label: string): boolean {
  return /^Chat\s+\d+$/.test(label)
}

/**
 * Derives a tab title from raw user message text.
 * - Trims whitespace
 * - Collapses multiple whitespace/newlines into single spaces
 * - Truncates to 50 characters with "..." suffix if needed
 * - Returns null if the text is empty or whitespace-only
 */
export function deriveAiTabTitleFromText(text: string): string | null {
  if (!text) return null

  // Collapse whitespace and newlines into single spaces, then trim
  const normalized = text.replace(/\s+/g, ' ').trim()

  if (normalized.length === 0) return null

  if (normalized.length <= 50) return normalized

  return normalized.substring(0, 50) + '...'
}

