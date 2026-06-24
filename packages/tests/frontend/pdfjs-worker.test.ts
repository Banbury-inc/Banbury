import fs from 'node:fs'
import path from 'node:path'

import { getPdfjsWorkerSrc } from '../../frontend/components/MiddlePanel/PDFViewer/pdfjs-worker'
import { ensureUrlParse } from '../../frontend/components/MiddlePanel/PDFViewer/url-parse-polyfill'

interface UrlConstructorWithParse extends URLConstructor {
  parse?: (url: string | URL, base?: string | URL) => URL | null
}

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

describe('ensureUrlParse', () => {
  const urlConstructor = URL as UrlConstructorWithParse
  const originalDescriptor = Object.getOwnPropertyDescriptor(URL, 'parse')

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(URL, 'parse', originalDescriptor)
      return
    }

    delete urlConstructor.parse
  })

  it('adds URL.parse when the runtime does not provide it', () => {
    delete urlConstructor.parse

    ensureUrlParse()

    expect(urlConstructor.parse?.('/file.pdf', 'https://example.com')?.href).toBe(
      'https://example.com/file.pdf'
    )
    expect(urlConstructor.parse?.('not a url')).toBeNull()
  })
})
