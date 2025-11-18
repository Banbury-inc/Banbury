import {
  BASIC_DOCUMENT_HTML,
  EMPTY_DOCUMENT_HTML,
  BASIC_SPREADSHEET_DATA,
  EMPTY_SPREADSHEET_DATA,
  createDocxBlob,
  createXlsxBlob
} from './file-fixtures'

/**
 * Mock implementation of DriveService.exportDocAsDocx
 */
export async function mockExportDocAsDocx(fileId: string): Promise<Blob> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const html = fileId === 'gdoc-empty' ? EMPTY_DOCUMENT_HTML : BASIC_DOCUMENT_HTML
  return createDocxBlob(html)
}

/**
 * Mock implementation of DriveService.exportSheetAsXlsx
 */
export async function mockExportSheetAsXlsx(fileId: string): Promise<Blob> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const data = fileId === 'gsheet-empty' ? EMPTY_SPREADSHEET_DATA : BASIC_SPREADSHEET_DATA
  return await createXlsxBlob(data) // Now awaiting the async function
}

/**
 * Mock implementation of DriveService.updateFile
 */
export async function mockUpdateFile(
  fileId: string,
  file: File,
  fileName: string
): Promise<any> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  console.log('Mock: Updated Drive file', fileId, fileName)
  return { success: true }
}

/**
 * Create a mock DriveService object that can be used to override the real service
 */
export function createMockDriveService() {
  return {
    exportDocAsDocx: mockExportDocAsDocx,
    exportSheetAsXlsx: mockExportSheetAsXlsx,
    updateFile: mockUpdateFile,
    // Add other methods as no-ops if needed
    listFiles: async () => ({ files: [] }),
    getFile: async () => ({ id: '', name: '', mimeType: '' }),
    downloadFile: async () => new Blob()
  }
}

