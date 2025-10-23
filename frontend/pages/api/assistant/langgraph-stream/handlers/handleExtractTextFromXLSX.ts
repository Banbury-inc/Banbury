// Best-effort XLSX/XLS extraction to CSV-like text for LLM consumption
export function extractTextFromXlsx(buffer: Buffer, fileName: string): string {
  try {
    // Lazy require to avoid hard dependency if module is missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames: string[] = workbook.SheetNames || [];
    if (!sheetNames.length) {
      return `Spreadsheet: ${fileName}\n\n(No sheets found)`;
    }

    const maxSheets = 5; // limit number of sheets to include
    const maxChars = 150_000; // cap total characters to keep payload manageable
    let total = '';
    for (const sheetName of sheetNames.slice(0, maxSheets)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      // Convert sheet to CSV
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',', RS: '\n' });
      if (csv && csv.trim()) {
        const section = `Sheet: ${sheetName}\n${csv}\n\n`;
        if ((total.length + section.length) > maxChars) {
          total += section.slice(0, Math.max(0, maxChars - total.length));
          break;
        }
        total += section;
      }
      if (total.length >= maxChars) break;
    }

    if (!total.trim()) {
      return `Spreadsheet: ${fileName}\n\n(Parsed but no tabular content found)`;
    }
    return `Spreadsheet: ${fileName}\n\n${total}`;
  } catch (error) {
    return `Spreadsheet: ${fileName}\n\nThis spreadsheet could not be parsed. Please provide key details or export a CSV.`;
  }
}

