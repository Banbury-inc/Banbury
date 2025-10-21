# SpreadsheetViewer Storybook Fix

## Issue

The SpreadsheetViewer stories were showing "Failed to load spreadsheet in editor" error because the mock was creating CSV content with an XLSX MIME type instead of actual XLSX files.

## Root Cause

The `createXlsxBlob()` function was creating a simple CSV string and wrapping it in a Blob with the XLSX MIME type:

```typescript
// ❌ Old approach (incorrect)
export function createXlsxBlob(data: string[][]): Blob {
  const csv = data.map(row => row.join(',')).join('\n')
  return new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
```

The CSVEditor component uses **ExcelJS** to parse XLSX files. When it received CSV data with an XLSX MIME type, ExcelJS couldn't parse it and threw an error.

## Solution

Updated the mock to create proper XLSX files using ExcelJS, the same library the actual component uses:

```typescript
// ✅ New approach (correct)
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
  
  // Auto-size columns
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
```

## Key Changes

### 1. Function Signature
Changed from synchronous to asynchronous:
- **Before**: `export function createXlsxBlob(data: string[][]): Blob`
- **After**: `export async function createXlsxBlob(data: string[][]): Promise<Blob>`

### 2. Uses Real ExcelJS Library
- Creates actual XLSX workbook structure
- Properly formats cells
- Handles formulas (cells starting with `=`)
- Auto-sizes columns for better appearance

### 3. Updated Callers
Updated all functions that call `createXlsxBlob()`:

**api-service-mock.ts:**
```typescript
const blob = await createXlsxBlob(data) // Now async
```

**drive-service-mock.ts:**
```typescript
return await createXlsxBlob(data) // Now awaiting the async function
```

## Benefits

✅ **Realistic mock data**: Creates actual XLSX files identical to production
✅ **ExcelJS compatibility**: Uses the same library as the real component
✅ **Formula support**: Properly handles Excel formulas
✅ **Better formatting**: Auto-sized columns improve readability
✅ **No errors**: CSVEditor can successfully parse the files

## Testing

Run Storybook and navigate to **MiddlePanel > SpreadsheetViewer**:

```bash
npm run storybook
```

All stories should now load successfully:
- 📊 Empty Spreadsheet
- 📈 Spreadsheet With Data (No Changes)
- ✨ Spreadsheet With Pending AI Changes (Preview)
- ✅ Spreadsheet With Accepted Changes
- 🔢 Formula Changes (Preview)
- 🔄 Multiple Operations
- 📋 Range Update Operation
- 📄 Complete CSV Replacement
- ☁️ Google Spreadsheet
- ➕ Insert/Delete Column Operations

## Files Modified

1. **`/stories/mocks/file-fixtures.ts`**
   - Updated `createXlsxBlob()` to use ExcelJS
   - Made function async
   - Added formula handling
   - Added column auto-sizing

2. **`/stories/mocks/api-service-mock.ts`**
   - Updated to await `createXlsxBlob()`

3. **`/stories/mocks/drive-service-mock.ts`**
   - Updated to await `createXlsxBlob()`

## Related Files

- `/src/components/MiddlePanel/SpreadsheetViewer/handlers/handle-csv-load.ts` - Shows how ExcelJS is used to parse XLSX files
- `/src/components/MiddlePanel/SpreadsheetViewer/CSVEditor.tsx` - Main spreadsheet component
- `package.json` - ExcelJS should be listed as a dependency

## Technical Notes

### Why ExcelJS?

ExcelJS is a comprehensive library that:
- Reads and writes XLSX files
- Handles formulas, formatting, and metadata
- Works in both Node.js and browser environments
- Is already used by the production code

### Dynamic Import

We use dynamic import to avoid bundling ExcelJS in stories that don't need it:
```typescript
const ExcelJSImport = await import('exceljs')
const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport
```

This keeps the Storybook bundle size smaller.

### Formula Detection

The mock automatically detects formulas (strings starting with `=`) and formats them correctly:
```typescript
if (typeof cell === 'string' && cell.startsWith('=')) {
  cellRef.value = { formula: cell.substring(1) }
}
```

This allows stories like "Formula Changes" to work correctly.

## Conclusion

The SpreadsheetViewer stories now use proper XLSX files created with ExcelJS, matching the production behavior and ensuring all stories load successfully without errors.

