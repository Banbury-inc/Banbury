import type { RefObject, Dispatch, SetStateAction } from "react"

interface CheckForTextParams {
  inputRef: RefObject<HTMLTextAreaElement | null>
  containerRef: RefObject<HTMLDivElement>
  setHasText: Dispatch<SetStateAction<boolean>>
  setDraftText: Dispatch<SetStateAction<string>>
  assistantTabId?: string
}

export function checkForText({
  inputRef,
  containerRef,
  setHasText,
  setDraftText,
  assistantTabId,
}: CheckForTextParams) {
  // Use the ref to get the specific input for this tab instance
  const input = inputRef.current
  if (!input) return
  
  let text = ''
  
  // Always check the ProseMirror editor directly as the source of truth
  // Find the ProseMirror editor that belongs to this composer instance
  // Strategy 1: Find ProseMirror near the input (they're in the same composer)
  let proseMirror: Element | null = null
  
  // Try multiple strategies to find the ProseMirror element
  // Strategy 1: Look for ProseMirror in the same parent container as the input
  const inputParent = input.parentElement
  if (inputParent) {
    // The input is inside ComposerPrimitive.Root, ProseMirror is in a sibling div
    const composerRoot = inputParent.closest('[class*="flex-col"]')
    if (composerRoot) {
      proseMirror = composerRoot.querySelector('.ProseMirror')
    }
  }
  
  // Strategy 2: If not found, search from containerRef
  if (!proseMirror && containerRef.current) {
    const container = containerRef.current
    // Go up to find the composer root, then find ProseMirror
    const composerRoot = container.closest('[class*="flex-col"]') || container.parentElement
    if (composerRoot) {
      proseMirror = composerRoot.querySelector('.ProseMirror')
    }
  }
  
  // Strategy 3: Find ProseMirror that's closest to this input (by checking all and finding the one in the same tab)
  if (!proseMirror) {
    const allProseMirrors = document.querySelectorAll('.ProseMirror')
    for (const pm of Array.from(allProseMirrors)) {
      // Check if this ProseMirror is in the same tab as our input
      const pmTab = pm.closest('[class*="absolute"]')
      const inputTab = input.closest('[class*="absolute"]')
      if (pmTab === inputTab || (pm.closest('.min-h-16') && input.closest('.min-h-16'))) {
        proseMirror = pm
        break
      }
    }
  }
  
  if (proseMirror) {
    // Get text from ProseMirror element (this is the actual editor content)
    const paragraphs = Array.from(proseMirror.querySelectorAll('p'))
    if (paragraphs.length > 0) {
      text = paragraphs.map((p) => (p.textContent || '').trimEnd()).join('\n\n')
    } else {
      text = proseMirror.textContent || ''
    }
    
    // Sync textarea if it's out of sync
    if (input.value !== text) {
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  } else {
    // Fallback to textarea value if we can't find ProseMirror
    text = input.value
  }
  
  const trimmedText = text.trim()
  const newHasText = trimmedText.length > 0
  
  // Always update state to ensure button state refreshes, especially when tab becomes active
  setHasText(newHasText)
  setDraftText(text)
}
