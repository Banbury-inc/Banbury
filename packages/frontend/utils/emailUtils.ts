export interface EmailContent {
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  quotedHtml?: string
  quotedText?: string
}

export interface EmailAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  data?: string
}

/**
 * Separate current email content from quoted/forwarded content
 */
function separateEmailContent(content: string, type: 'html' | 'text'): { current: string, quoted: string } {
  if (!content) return { current: '', quoted: '' }

  if (type === 'html') {
    return separateHtmlContent(content)
  } else {
    return separateTextContent(content)
  }
}

/**
 * Separate HTML content into current and quoted parts
 */
function separateHtmlContent(html: string): { current: string, quoted: string } {
  // Look for common quote indicators in HTML
  const quotePatterns = [
    /<blockquote[^>]*>/i,
    /<div[^>]*class="?gmail_quote"?[^>]*>/i,
    /<div[^>]*class="?yahoo_quoted"?[^>]*>/i,
    /<div[^>]*class="?outlook_quoted"?[^>]*>/i,
    /<div[^>]*style="[^"]*border-left[^"]*"[^>]*>/i,
    /<div[^>]*style="[^"]*border-left-color[^"]*"[^>]*>/i,
    /<div[^>]*style="[^"]*margin-left[^"]*"[^>]*>/i,
    /<div[^>]*style="[^"]*padding-left[^"]*"[^>]*>/i
  ]

  for (const pattern of quotePatterns) {
    const match = html.match(pattern)
    if (match) {
      const index = match.index!
      const current = html.substring(0, index).trim()
      const quoted = html.substring(index).trim()
      return { current, quoted }
    }
  }

  // Look for common email reply indicators
  const replyPatterns = [
    /<p[^>]*>On .* wrote:<\/p>/i,
    /<p[^>]*>From: .*<\/p>/i,
    /<p[^>]*>Sent: .*<\/p>/i,
    /<p[^>]*>To: .*<\/p>/i,
    /<p[^>]*>Subject: .*<\/p>/i,
    /<p[^>]*>Date: .*<\/p>/i
  ]

  for (const pattern of replyPatterns) {
    const match = html.match(pattern)
    if (match) {
      const index = match.index!
      const current = html.substring(0, index).trim()
      const quoted = html.substring(index).trim()
      return { current, quoted }
    }
  }

  // Look for patterns that indicate the start of quoted content
  // This handles cases like "Hi [Name]," which often indicates the start of quoted content
  const quotedStartPatterns = [
    /<p[^>]*>Hi [^<]+[,!]?<\/p>/i,
    /<p[^>]*>Hello [^<]+[,!]?<\/p>/i,
    /<p[^>]*>Dear [^<]+[,!]?<\/p>/i,
    /<p[^>]*>Hey [^<]+[,!]?<\/p>/i
  ]

  for (const pattern of quotedStartPatterns) {
    const match = html.match(pattern)
    if (match) {
      console.log('Found quoted start pattern:', match[0])
      const index = match.index!
      const current = html.substring(0, index).trim()
      const quoted = html.substring(index).trim()
      return { current, quoted }
    }
  }

  // Look for empty paragraph tags that often separate current from quoted content
  // Pattern: <p></p> or <p><br></p> followed by content
  const emptyParagraphPattern = /<p[^>]*><\/p>\s*<p[^>]*>.*?<\/p>/i
  const match = html.match(emptyParagraphPattern)
  if (match) {
    console.log('Found empty paragraph pattern:', match[0])
    // Find the position of the first empty paragraph
    const emptyPIndex = html.indexOf('<p></p>')
    if (emptyPIndex !== -1) {
      const current = html.substring(0, emptyPIndex).trim()
      const quoted = html.substring(emptyPIndex).trim()
      return { current, quoted }
    }
  }

  // Look for the specific pattern in your example: <p><br>content</p><p></p><p>Hi Name</p>
  const specificPattern = /<p[^>]*><br>[^<]*<\/p>\s*<p[^>]*><\/p>\s*<p[^>]*>Hi [^<]+/i
  const specificMatch = html.match(specificPattern)
  if (specificMatch) {
    console.log('Found specific pattern:', specificMatch[0])
    // Find the position of the empty paragraph that separates current from quoted
    const emptyPIndex = html.indexOf('<p></p>')
    if (emptyPIndex !== -1) {
      const current = html.substring(0, emptyPIndex).trim()
      const quoted = html.substring(emptyPIndex).trim()
      return { current, quoted }
    }
  }

  // If still no match, return the whole content as current
  return { current: html, quoted: '' }
}

/**
 * Separate text content into current and quoted parts
 */
function separateTextContent(text: string): { current: string, quoted: string } {
  // Look for common quote indicators in plain text
  const quotePatterns = [
    /^>.*$/m,  // Lines starting with >
    /^On .* wrote:$/m,
    /^From: .*$/m,
    /^Sent: .*$/m,
    /^To: .*$/m,
    /^Subject: .*$/m,
    /^Date: .*$/m,
    /^-{3,}.*Original Message.*-{3,}$/m,
    /^_{3,}.*Original Message.*_{3,}$/m
  ]

  for (const pattern of quotePatterns) {
    const match = text.match(pattern)
    if (match) {
      const index = match.index!
      const current = text.substring(0, index).trim()
      const quoted = text.substring(index).trim()
      return { current, quoted }
    }
  }

  // If no patterns found, return the whole content as current
  return { current: text, quoted: '' }
}

/**
 * Extract full email content from Gmail message payload
 */
export function extractEmailContent(payload: any): EmailContent {
  const content: EmailContent = {
    html: undefined,
    text: undefined,
    attachments: [],
    quotedHtml: undefined,
    quotedText: undefined
  }

  if (!payload) return content

  // Iterate through all parts non-recursively (stack-based traversal)
  const stack: any[] = []
  
  // Check if root payload has data directly (without parts)
  const rootMimeType = payload.mimeType
  const rootBody = payload.body
  
  if (rootMimeType === 'text/plain' && rootBody?.data) {
    try {
      const decodedText = decodeBase64Url(rootBody.data)
      const { current, quoted } = separateEmailContent(decodedText, 'text')
      content.text = current
      content.quotedText = quoted
      console.log('content.text', content.text)
      console.log('content.quotedText', content.quotedText)
    } catch (e) {
      console.error('Failed to decode text content:', e)
    }
  }

  if (rootMimeType === 'text/html' && rootBody?.data) {
    try {
      const decodedHtml = decodeBase64Url(rootBody.data)
      console.log('Original HTML:', decodedHtml)
      const { current, quoted } = separateEmailContent(decodedHtml, 'html')
      content.html = current
      content.quotedHtml = quoted
      console.log('content.html', content.html)
      console.log('content.quotedHtml', content.quotedHtml)
    } catch (e) {
      console.error('Failed to decode HTML content:', e)
    }
  }

  // Add parts to stack if they exist
  if (Array.isArray(payload.parts)) {
    for (let i = 0; i < payload.parts.length; i++) {
      stack.push(payload.parts[i])
    }
  }

  console.log('stack', stack)

  while (stack.length > 0) {
    const part = stack.pop()
    if (!part) continue

    // Collect attachments if present on this part
    if (part.filename && part.body?.attachmentId) {
      content.attachments?.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0
      })
    }

    const mimeType = part.mimeType
    const body = part.body

    console.log('body', body)

    if (mimeType === 'text/plain' && body?.data) {
      try {
        const decodedText = decodeBase64Url(body.data)
        const { current, quoted } = separateEmailContent(decodedText, 'text')
        // Only set if we don't already have content
        if (!content.text) content.text = current
        if (!content.quotedText) content.quotedText = quoted
      } catch (e) {
        console.error('Failed to decode text content:', e)
      }
    }

    if (mimeType === 'text/html' && body?.data) {
      try {
        const decodedHtml = decodeBase64Url(body.data)
        const { current, quoted } = separateEmailContent(decodedHtml, 'html')
        // Only set if we don't already have content
        if (!content.html) content.html = current
        if (!content.quotedHtml) content.quotedHtml = quoted
      } catch (e) {
        console.error('Failed to decode HTML content:', e)
      }
    }

    if (Array.isArray(part.parts)) {
      for (let i = 0; i < part.parts.length; i++) {
        stack.push(part.parts[i])
      }
    }
  }

  return content
}

/**
 * Decode base64url encoded data with proper character encoding
 */
function decodeBase64Url(data: string): string {
  try {
    // Replace URL-safe characters and add padding if needed
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    
    // Decode base64 to binary string
    const binaryString = atob(padded)
    
    // Convert binary string to UTF-8 encoded string
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Decode as UTF-8
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(bytes)
  } catch (e) {
    console.error('Failed to decode base64url:', e)
    return ''
  }
}

/**
 * Get the best available content (HTML preferred, fallback to text)
 */
export function getBestContent(content: EmailContent): string {
  if (content.html) {
    return content.html
  }
  if (content.text) {
    return content.text
  }
  return 'No content available'
}

/**
 * Get the current email content (excluding quoted/forwarded content)
 */
export function getCurrentContent(content: EmailContent): string {
  if (content.html) {
    return content.html
  }
  if (content.text) {
    return content.text
  }
  return 'No content available'
}

/**
 * Get the quoted/forwarded email content
 */
export function getQuotedContent(content: EmailContent): string {
  if (content.quotedHtml) {
    return content.quotedHtml
  }
  if (content.quotedText) {
    return content.quotedText
  }
  return ''
}

/**
 * Clean up HTML content to fix common encoding issues
 */
export function cleanHtmlContent(html: string): string {
  if (!html) return html
  
  return html
    // Fix common HTML entity issues
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Fix common encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"|â€"/g, '–')
    .replace(/â€¦/g, '…')
}

/**
 * Check if email has attachments
 */
export function hasAttachments(content: EmailContent): boolean {
  return Array.isArray(content.attachments) && content.attachments.length > 0
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
