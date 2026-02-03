/**
 * URL Detection Utilities
 *
 * Detect if a value is a URL and normalize it
 */

/**
 * Helper function to detect if a value is a URL
 * @param value - The value to check
 * @returns The normalized URL string if detected, null otherwise
 */
export function isUrl(value: any): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  
  // More accurate URL detection patterns
  // Pattern 1: Starts with http:// or https://
  if (/^https?:\/\/.+/.test(trimmed)) {
    return trimmed
  }
  
  // Pattern 2: Starts with www.
  if (/^www\..+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`
  }
  
  // Pattern 3: Domain pattern (e.g., example.com, subdomain.example.com)
  // Must have at least one dot and a valid TLD (2+ chars)
  const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(\/.*)?$/i
  if (domainPattern.test(trimmed) && trimmed.includes('.')) {
    // Check it's not just a number or single word
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
