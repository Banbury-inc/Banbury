import fs from 'node:fs'
import path from 'node:path'

import { getPdfjsWorkerSrc } from '../../frontend/components/MiddlePanel/PDFViewer/pdfjs-worker'

function getPdfjsVersionResolvedForReactPdf(): string {
  const reactPdfDir = path.dirname(require.resolve('react-pdf/package.json'))
  const pdfjsPkgPath = require.resolve('pdfjs-dist/package.json', { paths: [reactPdfDir] })
  return JSON.parse(fs.readFileSync(pdfjsPkgPath, 'utf8')).version as string
}

describe('getPdfjsWorkerSrc', () => {
  it('embeds the version in the unpkg worker URL', () => {
    expect(getPdfjsWorkerSrc('9.8.7')).toBe(
      'https://unpkg.com/pdfjs-dist@9.8.7/build/pdf.worker.min.mjs'
    )
  })

  it('targets the pdfjs-dist version that react-pdf resolves (same as pdfjs.version at runtime)', () => {
    const v = getPdfjsVersionResolvedForReactPdf()
    expect(v.length).toBeGreaterThan(0)
    expect(getPdfjsWorkerSrc(v)).toBe(`https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.mjs`)
  })
})
