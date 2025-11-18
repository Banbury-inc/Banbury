import { diffWords } from 'diff'

interface ElementWithContent {
  tag: string
  innerHTML: string
  textContent: string
  attributes: Record<string, string>
}

/**
 * Custom HTML diff implementation without relying on paid Tiptap features
 * Creates a diff between two HTML strings and returns HTML with track changes markup
 * @param oldHtml The original HTML content
 * @param newHtml The new HTML content
 * @returns HTML string with <span class="diff-insertion"> for additions and <span class="diff-deletion"> for deletions
 */
export function createHtmlDiff(oldHtml: string, newHtml: string): string {
  const oldText = stripHtmlTags(oldHtml)
  const newText = stripHtmlTags(newHtml)
  
  const diff = diffWords(oldText, newText, { ignoreCase: false })
  
  let result = ''
  
  for (const part of diff) {
    const content = escapeHtml(part.value)
    
    if (part.added) {
      result += `<span class="diff-insertion" data-diff="insertion">${content}</span>`
    } else if (part.removed) {
      result += `<span class="diff-deletion" data-diff="deletion">${content}</span>`
    } else {
      result += content
    }
  }
  
  return wrapInParagraphs(result)
}

/**
 * Creates a more sophisticated diff that preserves HTML structure and formatting
 * Custom implementation without paid Tiptap features
 * @param oldHtml The original HTML content
 * @param newHtml The new HTML content  
 * @returns HTML string with track changes using custom classes while preserving formatting
 */
export function createStructuredHtmlDiff(oldHtml: string, newHtml: string): string {
  const oldCleaned = cleanHtml(oldHtml)
  const newCleaned = cleanHtml(newHtml)
  
  // Extract elements with their HTML structure preserved
  const oldElements = extractElements(oldCleaned)
  const newElements = extractElements(newCleaned)
  
  // If similar structure, do element-by-element diff
  if (Math.abs(newElements.length - oldElements.length) <= 3) {
    return createElementLevelDiff(oldElements, newElements)
  }
  
  // Otherwise, do simple inline diff but preserve structure
  return createInlineStructuredDiff(oldCleaned, newCleaned)
}

function extractElements(html: string): ElementWithContent[] {
  const div = document.createElement('div')
  div.innerHTML = html
  const elements: ElementWithContent[] = []
  
  // Extract p, h1-h6, li, ul, ol elements with their structure
  const nodeElements = div.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, ul, ol, blockquote, pre')
  nodeElements.forEach(el => {
    const text = el.textContent?.trim() || ''
    if (text || el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol') {
      const attrs: Record<string, string> = {}
      Array.from(el.attributes).forEach(attr => {
        attrs[attr.name] = attr.value
      })
      
      elements.push({
        tag: el.tagName.toLowerCase(),
        innerHTML: el.innerHTML,
        textContent: text,
        attributes: attrs
      })
    }
  })
  
  // If no structured elements found, treat entire content as one element
  if (elements.length === 0) {
    elements.push({
      tag: 'p',
      innerHTML: html,
      textContent: stripHtmlTags(html),
      attributes: {}
    })
  }
  
  return elements
}

function createElementLevelDiff(oldElements: ElementWithContent[], newElements: ElementWithContent[]): string {
  const maxLength = Math.max(oldElements.length, newElements.length)
  let result = ''
  
  for (let i = 0; i < maxLength; i++) {
    const oldEl = oldElements[i]
    const newEl = newElements[i]
    
    if (!oldEl && newEl) {
      // New element added - wrap entire element in insertion mark
      const diffedContent = wrapInDiffMark(newEl.innerHTML, 'insertion')
      result += `<${newEl.tag}${formatAttributes(newEl.attributes)}>${diffedContent}</${newEl.tag}>`
    } else if (oldEl && !newEl) {
      // Element deleted - wrap entire element in deletion mark
      const diffedContent = wrapInDiffMark(oldEl.innerHTML, 'deletion')
      result += `<${oldEl.tag}${formatAttributes(oldEl.attributes)}>${diffedContent}</${oldEl.tag}>`
    } else if (oldEl.tag !== newEl.tag) {
      // Tag changed - show deletion of old and insertion of new
      const oldDiffed = wrapInDiffMark(oldEl.innerHTML, 'deletion')
      const newDiffed = wrapInDiffMark(newEl.innerHTML, 'insertion')
      result += `<${oldEl.tag}${formatAttributes(oldEl.attributes)}>${oldDiffed}</${oldEl.tag}>`
      result += `<${newEl.tag}${formatAttributes(newEl.attributes)}>${newDiffed}</${newEl.tag}>`
    } else if (oldEl.innerHTML !== newEl.innerHTML) {
      // Content changed - do word-level diff within the element, preserving inline formatting
      const diffedContent = createInlineFormattedDiff(oldEl.innerHTML, newEl.innerHTML)
      result += `<${newEl.tag}${formatAttributes(newEl.attributes)}>${diffedContent}</${newEl.tag}>`
    } else {
      // Element unchanged
      result += `<${newEl.tag}${formatAttributes(newEl.attributes)}>${newEl.innerHTML}</${newEl.tag}>`
    }
  }
  
  return result || '<p></p>'
}

/**
 * Creates a word-level diff while preserving inline formatting (bold, italic, etc.)
 * Uses a simpler approach: compare plain text and show changes while keeping the new formatting
 */
function createInlineFormattedDiff(oldHtml: string, newHtml: string): string {
  // Get plain text for comparison
  const oldText = stripHtmlTags(oldHtml)
  const newText = stripHtmlTags(newHtml)
  
  // If text is identical, return new HTML as-is (formatting might have changed)
  if (oldText === newText) {
    return newHtml
  }
  
  // Check if the HTML structures are similar enough to do an inline diff
  const oldFormatting = extractFormattingTags(oldHtml)
  const newFormatting = extractFormattingTags(newHtml)
  const hasComplexFormatting = oldFormatting.length > 0 || newFormatting.length > 0
  
  // If there's complex formatting and it's similar, try to preserve it
  if (hasComplexFormatting && areFormattingsSimilar(oldFormatting, newFormatting)) {
    return createFormattingPreservingDiff(oldHtml, newHtml, oldText, newText)
  }
  
  // Otherwise, show old as deleted and new as inserted (side by side or sequential)
  const hasSignificantChanges = calculateSimilarity(oldText, newText) < 0.5
  
  if (hasSignificantChanges) {
    // Major rewrite: show old and new separately
    let result = ''
    if (oldHtml.trim()) {
      result += wrapInDiffMark(oldHtml, 'deletion')
    }
    if (newHtml.trim()) {
      result += wrapInDiffMark(newHtml, 'insertion')
    }
    return result
  }
  
  // Minor changes: try word-level diff with new formatting
  return createSimpleWordDiff(oldText, newText, newHtml)
}

/**
 * Wraps content in a diff mark span while preserving any nested HTML
 */
function wrapInDiffMark(content: string, markType: 'insertion' | 'deletion'): string {
  const className = markType === 'insertion' ? 'diff-insertion' : 'diff-deletion'
  return `<span class="${className}" data-diff="${markType}">${content}</span>`
}

/**
 * Formats HTML attributes for reconstruction
 */
function formatAttributes(attributes: Record<string, string>): string {
  const entries = Object.entries(attributes)
  if (entries.length === 0) return ''
  
  return ' ' + entries
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ')
}

/**
 * Extracts formatting tags from HTML (bold, italic, etc.)
 */
function extractFormattingTags(html: string): string[] {
  const div = document.createElement('div')
  div.innerHTML = html
  const tags: string[] = []
  
  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()
      if (['strong', 'b', 'em', 'i', 'u', 'strike', 's', 'code', 'mark', 'sub', 'sup'].includes(tag)) {
        tags.push(tag)
      }
      Array.from(el.childNodes).forEach(walk)
    }
  }
  
  walk(div)
  return tags
}

/**
 * Checks if two sets of formatting tags are similar
 */
function areFormattingsSimilar(tags1: string[], tags2: string[]): boolean {
  // Count unique tags in each array
  const unique1 = tags1.filter((val, idx, arr) => arr.indexOf(val) === idx)
  const unique2 = tags2.filter((val, idx, arr) => arr.indexOf(val) === idx)
  
  // Calculate intersection: tags in both arrays
  const intersection = unique1.filter(tag => unique2.includes(tag))
  
  // Calculate union: all unique tags
  const union = unique1.concat(unique2.filter(tag => !unique1.includes(tag)))
  
  // Consider similar if >50% overlap
  return union.length === 0 || (intersection.length / union.length) > 0.5
}

/**
 * Calculates text similarity (0-1) using simple word overlap
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  
  if (words1.length === 0 && words2.length === 0) return 1
  if (words1.length === 0 || words2.length === 0) return 0
  
  // Get unique words from each text
  const unique1 = words1.filter((val, idx, arr) => arr.indexOf(val) === idx)
  const unique2 = words2.filter((val, idx, arr) => arr.indexOf(val) === idx)
  
  // Calculate intersection: words in both
  const intersection = unique1.filter(word => unique2.includes(word))
  
  // Calculate union: all unique words
  const union = unique1.concat(unique2.filter(word => !unique1.includes(word)))
  
  return intersection.length / union.length
}

/**
 * Creates a diff that preserves formatting by showing changes inline
 */
function createFormattingPreservingDiff(oldHtml: string, newHtml: string, oldText: string, newText: string): string {
  // Do a simple word-level diff and apply marks to the new HTML
  // This will show the new formatting with diff highlights
  const diff = diffWords(oldText, newText)
  
  let result = ''
  let textIndex = 0
      
      for (const part of diff) {
        if (part.added) {
      // Extract the corresponding HTML segment from newHtml
      const segment = extractTextFromHtml(newHtml, textIndex, part.value.length)
      result += wrapInDiffMark(segment, 'insertion')
      textIndex += part.value.length
        } else if (part.removed) {
      // Show removed text (without trying to match it in newHtml)
      result += wrapInDiffMark(escapeHtml(part.value), 'deletion')
        } else {
      // Unchanged - use segment from newHtml
      const segment = extractTextFromHtml(newHtml, textIndex, part.value.length)
      result += segment
      textIndex += part.value.length
    }
  }
  
  return result || newHtml
}

/**
 * Extracts a text segment from HTML, preserving formatting
 * Simpler version that works character by character
 */
function extractTextFromHtml(html: string, startPos: number, length: number): string {
  const div = document.createElement('div')
  div.innerHTML = html
  
  let charCount = 0
  let result = ''
  let startFound = false
  let collecting = false
  
  function walk(node: Node, parentFormatting: string[] = []): boolean {
    if (charCount >= startPos + length) return true // Done
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      
      for (let i = 0; i < text.length; i++) {
        if (charCount >= startPos + length) return true
        
        if (charCount >= startPos) {
          if (!startFound) {
            // Start collecting - add opening tags
            parentFormatting.forEach(tag => {
              result += `<${tag}>`
            })
            startFound = true
            collecting = true
          }
          result += escapeHtml(text[i])
        }
        
        charCount++
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()
      const isFormatting = ['strong', 'b', 'em', 'i', 'u', 'strike', 's', 'code', 'mark', 'sub', 'sup', 'a'].includes(tag)
      
      const newFormatting = isFormatting ? [...parentFormatting, tag] : parentFormatting
      
      let childResult = ''
      let hitEnd = false
      
      for (const child of Array.from(el.childNodes)) {
        if (walk(child, newFormatting)) {
          hitEnd = true
          break
        }
      }
      
      return hitEnd
    }
    
    return false
  }
  
  walk(div)
  
  // Close any open tags (in reverse order)
  if (collecting && startFound) {
    // This is a simplified version - in practice we'd track which tags are still open
  }
  
  // Fallback to plain text if extraction failed
  if (!result) {
    const plainText = stripHtmlTags(html)
    result = escapeHtml(plainText.substring(startPos, startPos + length))
  }
  
  return result
}

/**
 * Creates a simple word-level diff, applying marks to plain text
 */
function createSimpleWordDiff(oldText: string, newText: string, templateHtml: string): string {
  const diff = diffWords(oldText, newText)
  
  // Build result with diff marks
  let result = ''
  
  for (const part of diff) {
    const content = escapeHtml(part.value)
    if (part.added) {
      result += wrapInDiffMark(content, 'insertion')
    } else if (part.removed) {
      result += wrapInDiffMark(content, 'deletion')
    } else {
      result += content
    }
  }
  
  return result || templateHtml
}

/**
 * Fallback diff that preserves some structure when elements differ significantly
 */
function createInlineStructuredDiff(oldHtml: string, newHtml: string): string {
  const oldElements = extractElements(oldHtml)
  const newElements = extractElements(newHtml)
  
  let result = ''
  
  // Show all old elements as deleted
  oldElements.forEach(el => {
    const diffedContent = wrapInDiffMark(el.innerHTML, 'deletion')
    result += `<${el.tag}${formatAttributes(el.attributes)}>${diffedContent}</${el.tag}>`
  })
  
  // Show all new elements as inserted
  newElements.forEach(el => {
    const diffedContent = wrapInDiffMark(el.innerHTML, 'insertion')
    result += `<${el.tag}${formatAttributes(el.attributes)}>${diffedContent}</${el.tag}>`
  })
  
  return result || '<p></p>'
}

function createInlineDiff(oldHtml: string, newHtml: string): string {
  const oldText = stripHtmlTags(oldHtml)
  const newText = stripHtmlTags(newHtml)
  
  const diff = diffWords(oldText, newText)
  
  let result = '<p>'
  
  for (const part of diff) {
    const content = escapeHtml(part.value)
    
    if (part.added) {
      result += `<span class="diff-insertion" data-diff="insertion">${content}</span>`
    } else if (part.removed) {
      result += `<span class="diff-deletion" data-diff="deletion">${content}</span>`
    } else {
      result += content
    }
  }
  
  result += '</p>'
  return result
}

function stripHtmlTags(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function cleanHtml(html: string): string {
  // Remove empty paragraphs and extra whitespace
  return html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .trim()
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function wrapInParagraphs(content: string): string {
  // Split by line breaks and wrap in paragraphs
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  if (lines.length === 0) return '<p></p>'
  if (lines.length === 1) return `<p>${lines[0]}</p>`
  return lines.map(line => `<p>${line}</p>`).join('')
}

