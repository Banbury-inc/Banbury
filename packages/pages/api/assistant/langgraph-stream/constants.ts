import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PROMPTS_DIR = join(process.cwd(), 'pages/api/assistant/langgraph-stream/prompts')

function readPromptFile(fileName: string): string {
  return readFileSync(join(PROMPTS_DIR, fileName), 'utf-8').trimEnd()
}

export const SYSTEM_PROMPT = readPromptFile('system-prompt.md').trim()

/**
 * Specialized system prompt for document creation and editing requests.
 * This prompt is used when detectDocumentRequest() returns true.
 *
 * Designed to mirror Anthropic's "skill agent" pattern but uses local tools:
 * - create_file: Creates new documents using docx, exceljs, etc.
 * - pptx_ai: Creates and edits PowerPoint presentations using pptxgenjs
 * - sheet_ai: Edits open spreadsheets in the spreadsheet viewer
 * - tiptap_ai: Edits open documents in the document editor
 *
 * @see prompts/document-system-prompt.md
 */
export const DOCUMENT_SYSTEM_PROMPT = readPromptFile('document-system-prompt.md')

/**
 * System prompt for Ask mode - read-only exploration and research.
 * In this mode, the agent can only search and read, never modify files.
 * Only search-related tools are available.
 *
 * @see prompts/ask-mode-system-prompt.md
 */
export const ASK_MODE_SYSTEM_PROMPT = readPromptFile('ask-mode-system-prompt.md')

export const API_CONFIG = {
  api: {
    bodyParser: { sizeLimit: '2mb' },
    responseLimit: false,
    externalResolver: true,
  },
}
