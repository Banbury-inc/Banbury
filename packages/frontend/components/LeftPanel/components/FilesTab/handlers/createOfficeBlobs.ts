/**
 * Shared Office file blob generators for creating new files in cloud providers
 */

export type OfficeFileType = 'document' | 'spreadsheet' | 'presentation'

/**
 * Create a new Word document (.docx) blob
 */
export async function createDocxBlob(title: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Welcome to your new document!',
            }),
          ],
        }),
      ],
    }],
  })

  return await Packer.toBlob(doc)
}

/**
 * Create a new Excel spreadsheet (.xlsx) blob
 */
export async function createXlsxBlob(): Promise<Blob> {
  const ExcelJSImport = await import('exceljs')
  const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport
  
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')
  
  // Add empty cells
  const data = [
    ['', '', '', ''],
    ['', '', '', ''],
  ]
  
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1)
      excelCell.value = cell
    })
  })
  
  // Set default column widths
  worksheet.columns.forEach((column: any) => {
    column.width = 12
  })

  const buffer = await workbook.xlsx.writeBuffer()
  
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
}

/**
 * Create a new PowerPoint presentation (.pptx) blob
 */
export async function createPptxBlob(title: string, author?: string): Promise<Blob> {
  const PptxGenJS = (await import('pptxgenjs')).default
  
  const pptx = new PptxGenJS()
  
  pptx.author = author || 'Banbury'
  pptx.title = title
  pptx.subject = 'Created with Banbury'
  
  // Create title slide
  const titleSlide = pptx.addSlide()
  
  titleSlide.addText(title, {
    x: 0.5,
    y: 2.5,
    w: '90%',
    h: 1.5,
    fontSize: 44,
    fontFace: 'Arial',
    color: '363636',
    bold: true,
    align: 'center',
    valign: 'middle'
  })
  
  titleSlide.addText('Click to add subtitle', {
    x: 0.5,
    y: 4,
    w: '90%',
    h: 0.75,
    fontSize: 24,
    fontFace: 'Arial',
    color: '666666',
    align: 'center',
    valign: 'middle'
  })

  return await pptx.write({ outputType: 'blob' }) as Blob
}

/**
 * Create an Office file blob based on type
 */
export async function createOfficeBlob(
  fileType: OfficeFileType,
  title: string,
  author?: string
): Promise<Blob> {
  switch (fileType) {
    case 'document':
      return createDocxBlob(title)
    case 'spreadsheet':
      return createXlsxBlob()
    case 'presentation':
      return createPptxBlob(title, author)
  }
}

/**
 * Get file extension for office file type
 */
export function getOfficeFileExtension(fileType: OfficeFileType): string {
  switch (fileType) {
    case 'document':
      return '.docx'
    case 'spreadsheet':
      return '.xlsx'
    case 'presentation':
      return '.pptx'
  }
}

/**
 * Ensure filename has the correct extension
 */
export function ensureOfficeExtension(filename: string, fileType: OfficeFileType): string {
  const extension = getOfficeFileExtension(fileType)
  if (filename.toLowerCase().endsWith(extension)) {
    return filename
  }
  // Remove any existing wrong extension and add correct one
  const nameWithoutExt = filename.replace(/\.(docx|xlsx|pptx)$/i, '')
  return `${nameWithoutExt}${extension}`
}
