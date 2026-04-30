/**
 * Detect if the user's request is about creating/editing documents
 * that should use Skills instead of legacy tools
 */
export function detectDocumentRequest(messages: any[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) {
    return false
  }

  // Get the last user message
  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role !== 'user') {
    return false
  }

  // Extract text content from message
  let text = ''
  if (typeof lastMessage.content === 'string') {
    text = lastMessage.content.toLowerCase()
  } else if (Array.isArray(lastMessage.content)) {
    text = lastMessage.content
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text || '')
      .join(' ')
      .toLowerCase()
  }

  // If the user is clearly asking about source code / the IDE, do not route to the document agent
  // unless they also name an Office file type (avoids "edit documentation" → Word, etc.).
  const officeExplicit =
    /\b(\.docx|\.xlsx|\.pptx|ms word|microsoft word|word document|excel spreadsheet|powerpoint)\b/.test(
      text
    )
  const codeOrIdeSignals =
    /\.(tsx?|jsx?|vue|svelte|py|rs|go|java|kt|swift|cs|php|rb)\b/.test(text) ||
    /\b(code file|source file|in the (ide|editor)|typescript|javascript|refactor|implement|lint|eslint|npm|git diff)\b/.test(
      text
    )
  if (codeOrIdeSignals && !officeExplicit) return false

  // Keywords that indicate document generation/editing requests
  const documentKeywords = [
    // PowerPoint - Creation
    'create presentation',
    'create a presentation',
    'make presentation',
    'make a presentation',
    'generate presentation',
    'build presentation',
    'create slides',

    // PowerPoint - Editing
    'edit presentation',
    'edit the presentation',
    'update presentation',
    'update the presentation',
    'modify presentation',
    'modify the presentation',
    'change presentation',
    'add to presentation',
    'edit slides',
    'update slides',
    'modify slides',
    'change slides',
    'add slides',

    // PowerPoint - General
    'pptx',
    'powerpoint',
    'slides',

    // Word - Creation
    'create document',
    'create a document',
    'make document',
    'make a document',
    'generate document',
    'write document',

    // Word - Editing
    'edit document',
    'edit the document',
    'update document',
    'update the document',
    'modify document',
    'modify the document',

    // Word - General
    'docx',
    'word document',

    // Excel - Creation
    'create spreadsheet',
    'create a spreadsheet',
    'make spreadsheet',
    'make a spreadsheet',
    'generate spreadsheet',
    'build spreadsheet',
    'create workbook',

    // Excel - Editing
    'edit spreadsheet',
    'edit the spreadsheet',
    'update spreadsheet',
    'update the spreadsheet',
    'modify spreadsheet',
    'modify the spreadsheet',

    // Excel - General
    'xlsx',
    'excel',

    // PDF
    'create pdf',
    'generate pdf',
    'make pdf',
    'edit pdf',
    'update pdf'
  ]

  return documentKeywords.some(keyword => text.includes(keyword))
}
