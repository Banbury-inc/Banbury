/**
 * Worker script must match the pdfjs API version bundled with react-pdf.
 * Use pdfjs.version from `react-pdf` when calling this.
 */
export function getPdfjsWorkerSrc(pdfjsVersion: string): string {
  return `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`
}
