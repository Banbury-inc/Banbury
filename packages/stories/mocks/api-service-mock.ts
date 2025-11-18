import {
  MOCK_DOCUMENT_FILE,
  MOCK_EMPTY_DOCUMENT_FILE,
  MOCK_SPREADSHEET_FILE,
  MOCK_EMPTY_SPREADSHEET_FILE,
  BASIC_DOCUMENT_HTML,
  EMPTY_DOCUMENT_HTML,
  DOCUMENT_WITH_AI_CHANGES_HTML,
  DOCUMENT_WITH_ACCEPTED_CHANGES_HTML,
  BASIC_SPREADSHEET_DATA,
  EMPTY_SPREADSHEET_DATA,
  SPREADSHEET_WITH_FORMULAS_DATA,
  createDocxBlob,
  createXlsxBlob
} from './file-fixtures'

interface DownloadResult {
  success: boolean
  blob: Blob
  url: string
  fileName: string
}

// Store for different document states
const documentStates: Record<string, string> = {
  'doc-1': BASIC_DOCUMENT_HTML,
  'doc-empty': EMPTY_DOCUMENT_HTML,
  'doc-with-changes': DOCUMENT_WITH_AI_CHANGES_HTML,
  'doc-accepted': DOCUMENT_WITH_ACCEPTED_CHANGES_HTML
}

const spreadsheetStates: Record<string, string[][]> = {
  'sheet-1': BASIC_SPREADSHEET_DATA,
  'sheet-empty': EMPTY_SPREADSHEET_DATA,
  'sheet-formulas': SPREADSHEET_WITH_FORMULAS_DATA
}

/**
 * Mock implementation of ApiService.downloadS3File
 */
export async function mockDownloadS3File(
  fileId: string,
  fileName: string
): Promise<DownloadResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Determine if it's a document or spreadsheet based on file extension
  const isSpreadsheet = fileName.toLowerCase().match(/\.(xlsx|xls|csv)$/)
  
  if (isSpreadsheet) {
    const data = spreadsheetStates[fileId] || BASIC_SPREADSHEET_DATA
    const blob = await createXlsxBlob(data) // Now async
    const url = URL.createObjectURL(blob)
    
    return {
      success: true,
      blob,
      url,
      fileName
    }
  } else {
    const html = documentStates[fileId] || BASIC_DOCUMENT_HTML
    const blob = createDocxBlob(html)
    const url = URL.createObjectURL(blob)
    
    return {
      success: true,
      blob,
      url,
      fileName
    }
  }
}

/**
 * Mock implementation of ApiService.downloadFromS3 (alias)
 */
export const mockDownloadFromS3 = mockDownloadS3File

/**
 * Mock implementation of ApiService.updateS3File
 */
export async function mockUpdateS3File(
  fileId: string,
  file: File,
  fileName: string
): Promise<{ success: boolean }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  console.log('Mock: Saved file', fileId, fileName)
  return { success: true }
}

/**
 * Create a mock ApiService object that can be used to override the real service
 */
export function createMockApiService() {
  return {
    downloadS3File: mockDownloadS3File,
    downloadFromS3: mockDownloadFromS3,
    updateS3File: mockUpdateS3File,
    // Add other methods as no-ops if needed
    setAuthToken: () => {},
    clearAuthToken: () => {},
    loadAuthToken: () => {}
  }
}

