import { FileSystemItem } from '../../frontend/utils/fileTreeUtils'

// Sample HTML content for documents
export const EMPTY_DOCUMENT_HTML = '<p></p>'

export const BASIC_DOCUMENT_HTML = `<h1>Project Proposal</h1>
<p>This document outlines the key objectives and milestones for the upcoming project.</p>
<h2>Overview</h2>
<p>The project aims to improve customer satisfaction and streamline operations.</p>
<h2>Objectives</h2>
<ul>
  <li>Increase efficiency by 25%</li>
  <li>Reduce costs by 15%</li>
  <li>Improve customer satisfaction scores</li>
</ul>
<h2>Timeline</h2>
<p>The project is scheduled to begin in Q1 2024 and complete by Q3 2024.</p>`

export const DOCUMENT_WITH_AI_CHANGES_HTML = `<h1>Project Proposal - DRAFT</h1>
<p>This document outlines the key objectives and milestones for the upcoming project.</p>
<h2>Overview</h2>
<p>The project aims to improve customer satisfaction and streamline operations.</p>
<h2>Objectives</h2>
<ul>
  <li>Increase efficiency by 25%</li>
  <li>Reduce costs by 15%</li>
  <li>Improve customer satisfaction scores</li>
</ul>
<h2>Timeline</h2>
<p>The project is scheduled to begin in Q1 2024 and complete by Q3 2024.</p>`

export const DOCUMENT_WITH_ACCEPTED_CHANGES_HTML = `<h1>Project Proposal - Final</h1>
<p>This comprehensive document outlines the key objectives, deliverables, and milestones for the upcoming strategic initiative.</p>
<h2>Executive Overview</h2>
<p>The project aims to significantly improve customer satisfaction and streamline operational processes across all departments.</p>
<h2>Key Objectives</h2>
<ul>
  <li>Increase operational efficiency by 30%</li>
  <li>Reduce operational costs by 20%</li>
  <li>Improve customer satisfaction scores by 15 points</li>
  <li>Implement new automation tools</li>
</ul>
<h2>Project Timeline</h2>
<p>The project is scheduled to begin in Q1 2024 and complete by Q3 2024, with regular milestone reviews.</p>
<h2>Budget</h2>
<p>Total budget: $500,000 allocated across all phases.</p>`

// Sample CSV data for spreadsheets
export const EMPTY_SPREADSHEET_DATA = [
  ['', '', '', ''],
  ['', '', '', ''],
  ['', '', '', '']
]

export const BASIC_SPREADSHEET_DATA = [
  ['Product', 'Q1 Sales', 'Q2 Sales', 'Q3 Sales', 'Q4 Sales'],
  ['Widget A', '1500', '1800', '2100', '2400'],
  ['Widget B', '2300', '2500', '2700', '2900'],
  ['Widget C', '1200', '1400', '1600', '1800'],
  ['Widget D', '800', '900', '1000', '1100'],
  ['Total', '5800', '6600', '7400', '8200']
]

export const SPREADSHEET_WITH_FORMULAS_DATA = [
  ['Product', 'Q1 Sales', 'Q2 Sales', 'Q3 Sales', 'Q4 Sales', 'Total'],
  ['Widget A', '1500', '1800', '2100', '2400', '=SUM(B2:E2)'],
  ['Widget B', '2300', '2500', '2700', '2900', '=SUM(B3:E3)'],
  ['Widget C', '1200', '1400', '1600', '1800', '=SUM(B4:E4)'],
  ['Widget D', '800', '900', '1000', '1100', '=SUM(B5:E5)'],
  ['Total', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)', '=SUM(F2:F5)']
]

// Mock file objects
export const MOCK_DOCUMENT_FILE: FileSystemItem = {
  id: 'doc-1',
  file_id: 'doc-1',
  name: 'Project_Proposal.docx',
  type: 'file',
  path: '/documents/Project_Proposal.docx',
  size: 45000,
  modified: new Date('2024-01-15')
}

export const MOCK_EMPTY_DOCUMENT_FILE: FileSystemItem = {
  id: 'doc-empty',
  file_id: 'doc-empty',
  name: 'Untitled_Document.docx',
  type: 'file',
  path: '/documents/Untitled_Document.docx',
  size: 5000,
  modified: new Date('2024-01-20')
}

export const MOCK_SPREADSHEET_FILE: FileSystemItem = {
  id: 'sheet-1',
  file_id: 'sheet-1',
  name: 'Sales_Report.xlsx',
  type: 'file',
  path: '/spreadsheets/Sales_Report.xlsx',
  size: 28000,
  modified: new Date('2024-01-18')
}

export const MOCK_EMPTY_SPREADSHEET_FILE: FileSystemItem = {
  id: 'sheet-empty',
  file_id: 'sheet-empty',
  name: 'Untitled_Spreadsheet.xlsx',
  type: 'file',
  path: '/spreadsheets/Untitled_Spreadsheet.xlsx',
  size: 8000,
  modified: new Date('2024-01-21')
}

export const MOCK_GOOGLE_DOC_FILE: FileSystemItem = {
  id: 'gdoc-1',
  file_id: 'gdoc-1',
  name: 'Google_Document',
  type: 'file',
  path: 'drive://documents/Google_Document',
  mimeType: 'application/vnd.google-apps.document',
  size: 0,
  modified: new Date('2024-01-19')
}

export const MOCK_GOOGLE_SHEET_FILE: FileSystemItem = {
  id: 'gsheet-1',
  file_id: 'gsheet-1',
  name: 'Google_Spreadsheet',
  type: 'file',
  path: 'drive://spreadsheets/Google_Spreadsheet',
  mimeType: 'application/vnd.google-apps.spreadsheet',
  size: 0,
  modified: new Date('2024-01-19')
}

// Helper to create HTML blob
export function createHtmlBlob(html: string): Blob {
  return new Blob([html], { type: 'text/html' })
}

// Helper to create DOCX blob (simplified - just wraps HTML)
export function createDocxBlob(html: string): Blob {
  const docxContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <meta name="original-format" content="docx">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`
  return new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

// Helper to create CSV blob
export function createCsvBlob(data: string[][]): Blob {
  const csv = data.map(row => row.join(',')).join('\n')
  return new Blob([csv], { type: 'text/csv' })
}

// Helper to create XLSX blob using ExcelJS
export async function createXlsxBlob(data: string[][]): Promise<Blob> {
  // Dynamically import ExcelJS
  const ExcelJSImport = await import('exceljs')
  const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport
  
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')
  
  // Add data to worksheet
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellRef = worksheet.getCell(rowIndex + 1, colIndex + 1)
      // Check if it's a formula
      if (typeof cell === 'string' && cell.startsWith('=')) {
        cellRef.value = { formula: cell.substring(1) }
      } else {
        cellRef.value = cell
      }
    })
  })
  
  // Auto-size columns (optional, but makes it look nicer)
  worksheet.columns.forEach((column, index) => {
    let maxLength = 0
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const cellLength = cell.value ? cell.value.toString().length : 10
      if (cellLength > maxLength) {
        maxLength = cellLength
      }
    })
    column.width = Math.min(Math.max(maxLength + 2, 10), 50)
  })
  
  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

