import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Create file tool (inline) to avoid module resolution issues
export const createFileTool = tool(
  async (input: { fileName: string; filePath: string; content?: string; contentType?: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const lowerName = (input.fileName || input.filePath).toLowerCase()
    const ext = lowerName.includes('.') ? lowerName.split('.').pop() || '' : ''
    let resolvedType = input.contentType || 'text/plain'
    const contextContent = getServerContextValue<string>('documentContext') || ''
    const providedContent = typeof input.content === 'string' ? input.content : ''
    const initialContent = providedContent.trim().length > 0 ? providedContent : contextContent

    if (!initialContent || initialContent.trim().length === 0) {
      throw new Error('Missing required argument: content. The create_file tool requires a `content` parameter with the file contents. Please retry your tool call with all required arguments: fileName, filePath, and content.')
    }

    let bodyContent: any = initialContent

    // Local helpers to normalize and format plain text into HTML when appropriate
    const escapeHtml = (raw: string): string =>
      raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const isLikelyHtml = (raw: string): boolean => /<\s*([a-zA-Z]+)(\s|>|\/)/.test(raw) || /<html[\s>]/i.test(raw)

    const normalizeNewlines = (raw: string): string => raw.replace(/\r\n?/g, '\n')

    const plainTextToHtml = (raw: string): string => {
      const text = normalizeNewlines(raw).trim()
      if (!text) return ''
      const paragraphs = text.split(/\n{2,}/)
      const htmlParagraphs = paragraphs.map((para) => {
        const escaped = escapeHtml(para)
        const withBreaks = escaped.replace(/\n/g, '<br>')
        return `<p>${withBreaks}</p>`
      })
      return htmlParagraphs.join('\n')
    }

    // Basic Markdown support for common structures: headings, lists, links, inline code, bold/italics, blockquotes, code fences
    const applyInlineMarkdown = (text: string): string => {
      // code span
      let s = text.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`)
      // bold
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // italics (simple heuristic, avoids interfering with bold already handled)
      s = s.replace(/(^|\W)\*([^*]+)\*(?=$|\W)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
      // links [text](url)
      s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, p1, p2) => `<a href="${escapeHtml(p2)}">${escapeHtml(p1)}</a>`)
      return s
    }

    const looksLikeMarkdown = (raw: string): boolean => {
      const t = normalizeNewlines(raw)
      return /^(#{1,6})\s+/.test(t) || /\n[-*]\s+/.test(t) || /\n\d+\.\s+/.test(t) || /\*\*[^*]+\*\*/.test(t) || /^>\s+/.test(t) || /^---$/m.test(t) || /```[\s\S]*?```/.test(t)
    }

    const markdownToHtml = (raw: string): string => {
      const text = normalizeNewlines(raw)
      // Extract fenced code blocks first to avoid processing inside
      const codeBlocks: string[] = []
      let withoutFences = text.replace(/```([\s\S]*?)```/g, (_m, p1) => {
        const idx = codeBlocks.length
        codeBlocks.push(`<pre><code>${escapeHtml(p1.trim())}</code></pre>`)
        return `@@CODEBLOCK_${idx}@@`
      })

      const lines = withoutFences.split('\n')
      const htmlParts: string[] = []
      let inUl = false
      let inOl = false
      let inBlockquote = false
      let paraBuffer: string[] = []

      const flushPara = () => {
        if (paraBuffer.length) {
          const p = applyInlineMarkdown(escapeHtml(paraBuffer.join('\n'))).replace(/\n/g, '<br>')
          htmlParts.push(`<p>${p}</p>`)
          paraBuffer = []
        }
      }
      const closeLists = () => {
        if (inUl) { htmlParts.push('</ul>'); inUl = false }
        if (inOl) { htmlParts.push('</ol>'); inOl = false }
      }
      const closeBlockquote = () => {
        if (inBlockquote) { htmlParts.push('</blockquote>'); inBlockquote = false }
      }

      for (const rawLine of lines) {
        const line = rawLine.trimEnd()
        if (!line.trim()) {
          flushPara()
          closeLists()
          closeBlockquote()
          continue
        }

        // Horizontal rule
        if (/^-{3,}$/.test(line)) {
          flushPara()
          closeLists()
          closeBlockquote()
          htmlParts.push('<hr>')
          continue
        }

        // Headings
        const h = line.match(/^(#{1,6})\s+(.+)$/)
        if (h) {
          flushPara()
          closeLists()
          closeBlockquote()
          const level = Math.min(h[1].length, 6)
          const content = applyInlineMarkdown(escapeHtml(h[2].trim()))
          htmlParts.push(`<h${level}>${content}</h${level}>`)
          continue
        }

        // Blockquote
        const bq = line.match(/^>\s?(.*)$/)
        if (bq) {
          flushPara()
          closeLists()
          if (!inBlockquote) { htmlParts.push('<blockquote>'); inBlockquote = true }
          const content = applyInlineMarkdown(escapeHtml(bq[1]))
          htmlParts.push(`<p>${content}</p>`)
          continue
        }

        // Ordered list
        const ol = line.match(/^\d+\.\s+(.*)$/)
        if (ol) {
          flushPara()
          closeBlockquote()
          if (inUl) { htmlParts.push('</ul>'); inUl = false }
          if (!inOl) { htmlParts.push('<ol>'); inOl = true }
          const content = applyInlineMarkdown(escapeHtml(ol[1]))
          htmlParts.push(`<li>${content}</li>`)
          continue
        }

        // Unordered list
        const ul = line.match(/^[-*]\s+(.*)$/)
        if (ul) {
          flushPara()
          closeBlockquote()
          if (inOl) { htmlParts.push('</ol>'); inOl = false }
          if (!inUl) { htmlParts.push('<ul>'); inUl = true }
          const content = applyInlineMarkdown(escapeHtml(ul[1]))
          htmlParts.push(`<li>${content}</li>`)
          continue
        }

        // Default: accumulate paragraph lines
        paraBuffer.push(line)
      }

      flushPara()
      closeLists()
      closeBlockquote()

      let html = htmlParts.join('\n')
      // Restore code blocks
      html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (_m, p1) => codeBlocks[Number(p1)] || '')
      return html
    }

    const wrapHtml = (title: string, bodyHtml: string) => (
      `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>${title}</title>\n    <style>body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }</style>\n</head>\n<body>\n${bodyHtml}\n</body>\n</html>`
    )

    switch (ext) {
      case 'docx': {
        const title = input.fileName
        let prepared: string
        if (isLikelyHtml(bodyContent)) {
          prepared = bodyContent
        } else if (looksLikeMarkdown(bodyContent)) {
          prepared = markdownToHtml(bodyContent)
        } else {
          prepared = plainTextToHtml(bodyContent)
        }
        bodyContent = wrapHtml(title, prepared)
        resolvedType = 'application/vnd.banbury.docx-html'
        break
      }
      case 'html':
      case 'htm': {
        const hasHtmlTag = /<html[\s>]/i.test(bodyContent)
        if (hasHtmlTag) {
          bodyContent = bodyContent
        } else {
          let prepared: string
          if (isLikelyHtml(bodyContent)) {
            prepared = bodyContent
          } else if (looksLikeMarkdown(bodyContent)) {
            prepared = markdownToHtml(bodyContent)
          } else {
            prepared = plainTextToHtml(bodyContent)
          }
          bodyContent = wrapHtml(input.fileName, prepared)
        }
        resolvedType = 'text/html'
        break
      }
      case 'csv': {
        resolvedType = 'text/csv'
        break
      }
      case 'xlsx': {
        // For XLSX files, convert plain text content to proper XLSX format using ExcelJS
        const ExcelJSImport = await import('exceljs')
        const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport
        
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Sheet1')
        
        // Parse the content as CSV-like data or create simple data structure
        let data: any[][]
        try {
          // Try to parse as CSV first
          const lines = bodyContent.trim().split('\n')
          data = lines.map((line: string) => {
            // Simple CSV parsing - split by comma and handle quoted values
            const cells = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true
              } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false
              } else if (char === ',' && !inQuotes) {
                cells.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            cells.push(current.trim())
            return cells
          })
          
          // If it doesn't look like CSV data (less than 2 rows or very uneven columns), create a simple structure
          if (data.length < 2 || data.some(row => row.length === 1 && !data[0].includes(','))) {
            data = [
              ['Content'],
              [bodyContent]
            ]
          }
        } catch {
          // Fallback: create simple single-cell data
          data = [
            ['Content'],
            [bodyContent]
          ]
        }
        
        // Add the data to the worksheet
        data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1)
            excelCell.value = cell || ''
          })
        })
        
        // Auto-fit columns
        worksheet.columns.forEach((column: any) => {
          if (column && column.eachCell) {
            let maxLength = 0
            column.eachCell({ includeEmpty: false }, (cell: any) => {
              const columnLength = cell.value ? String(cell.value).length : 0
              if (columnLength > maxLength) {
                maxLength = columnLength
              }
            })
            column.width = Math.min(maxLength + 2, 50) // Set max width to 50
          }
        })

        // Generate XLSX buffer
        const buffer = await workbook.xlsx.writeBuffer()
        
        // Create blob directly here since we have binary data
        const xlsxBlob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        // We'll handle this case specially after the switch
        bodyContent = xlsxBlob
        resolvedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      }
      case 'pptx': {
        // For PPTX files, create a PowerPoint presentation using pptxgenjs
        const PptxGenJS = (await import('pptxgenjs')).default
        const pptx = new PptxGenJS()
        
        // Set metadata
        pptx.author = 'Banbury AI'
        pptx.title = input.fileName.replace(/\.pptx$/i, '')
        pptx.subject = 'Created with Banbury AI'
        
        // Parse content to create slides
        // Content can be structured as:
        // - Simple text (create single slide with text)
        // - Markdown-like format with --- separators for multiple slides
        // - JSON structure for complex presentations
        
        const contentStr = bodyContent.toString().trim()
        
        // Check if content is JSON
        let isJson = false
        let jsonSlides: any[] = []
        try {
          const parsed = JSON.parse(contentStr)
          if (Array.isArray(parsed)) {
            isJson = true
            jsonSlides = parsed
          }
        } catch {
          // Not JSON, proceed with text parsing
        }
        
        if (isJson && jsonSlides.length > 0) {
          // Create slides from JSON structure
          for (const slideData of jsonSlides) {
            const slide = pptx.addSlide()
            
            if (slideData.background) {
              slide.background = { color: slideData.background.replace('#', '') }
            }
            
            if (slideData.title) {
              slide.addText(slideData.title, {
                x: 0.5,
                y: 0.5,
                w: '90%',
                h: 1,
                fontSize: 36,
                bold: true,
                color: '363636'
              })
            }
            
            if (slideData.content) {
              slide.addText(slideData.content, {
                x: 0.5,
                y: 2,
                w: '90%',
                h: 4,
                fontSize: 18,
                color: '666666'
              })
            }
            
            if (slideData.bullets && Array.isArray(slideData.bullets)) {
              const bulletText = slideData.bullets.map((b: string) => ({ text: b, options: { bullet: true } }))
              slide.addText(bulletText, {
                x: 0.5,
                y: 2,
                w: '90%',
                h: 4,
                fontSize: 18,
                color: '363636'
              })
            }
          }
        } else {
          // Parse text content - split by '---' for multiple slides
          const slideContents = contentStr.split(/\n---\n/).map(s => s.trim()).filter(s => s)
          
          for (const slideContent of slideContents) {
            const slide = pptx.addSlide()
            
            // Check for title (first line if it looks like a heading)
            const lines = slideContent.split('\n')
            let title = ''
            let body = slideContent
            
            if (lines[0] && (lines[0].startsWith('#') || lines[0].length < 100)) {
              title = lines[0].replace(/^#+\s*/, '')
              body = lines.slice(1).join('\n').trim()
            }
            
            if (title) {
              slide.addText(title, {
                x: 0.5,
                y: 0.5,
                w: '90%',
                h: 1,
                fontSize: 36,
                bold: true,
                color: '363636',
                align: 'center'
              })
            }
            
            if (body) {
              // Check for bullet points
              const bulletLines = body.split('\n').filter(l => l.trim().match(/^[-*•]\s/))
              
              if (bulletLines.length > 0) {
                const bulletText = bulletLines.map(l => ({
                  text: l.replace(/^[-*•]\s*/, ''),
                  options: { bullet: true }
                }))
                slide.addText(bulletText, {
                  x: 0.5,
                  y: title ? 2 : 0.5,
                  w: '90%',
                  h: 4,
                  fontSize: 18,
                  color: '363636'
                })
              } else {
                slide.addText(body, {
                  x: 0.5,
                  y: title ? 2 : 0.5,
                  w: '90%',
                  h: 4,
                  fontSize: 18,
                  color: '666666'
                })
              }
            }
          }
          
          // If no slides were created, create a default one
          if (slideContents.length === 0) {
            const slide = pptx.addSlide()
            slide.addText(input.fileName.replace(/\.pptx$/i, ''), {
              x: 0.5,
              y: 2.5,
              w: '90%',
              h: 1.5,
              fontSize: 44,
              bold: true,
              color: '363636',
              align: 'center',
              valign: 'middle'
            })
          }
        }
        
        // Generate PPTX blob
        const pptxBuffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
        const pptxBlob = new Blob([pptxBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        })
        
        bodyContent = pptxBlob
        resolvedType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        break
      }
      case 'md': {
        resolvedType = 'text/markdown'
        break
      }
      case 'json': {
        resolvedType = 'application/json'
        break
      }
      case 'txt':
      default: {
        resolvedType = resolvedType || 'text/plain'
      }
    }

    // If bodyContent is already a Blob (e.g., for XLSX), use it directly
    const fileBlob = bodyContent instanceof Blob 
      ? bodyContent 
      : new Blob([bodyContent], { type: resolvedType })
    
    const formData = new FormData()
    formData.append('file', fileBlob, input.fileName)
    formData.append('device_name', 'web-editor')
    formData.append('file_path', input.filePath)
    formData.append('file_parent', input.filePath.split('/').slice(0, -1).join('/') || 'root')

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!resp.ok) {
      let message = `HTTP ${resp.status}`
      try {
        const data = await resp.json()
        if (data?.error) message += ` - ${data.error}`
      } catch {}
      throw new Error(`Failed to create file: ${message}`)
    }

    const data = await resp.json()
    return JSON.stringify({
      result: data?.result || 'success',
      file_url: data?.file_url,
      file_info: data?.file_info,
      message: data?.message || 'File created successfully',
    })
  },
  {
    name: 'create_file',
    description: 'Create a new file in the user\'s cloud workspace. Prefer Microsoft Word (.docx) for documents, Excel (.xlsx) for spreadsheets, and PowerPoint (.pptx) for presentations. For presentations, content can be plain text (use --- to separate slides), or JSON array of slide objects with title, content, and bullets fields.',
    schema: z.object({
      fileName: z.string().describe("The new file name. Use '.docx' for documents, '.xlsx' for spreadsheets, '.pptx' for presentations"),
      filePath: z.string().describe("Full path including the file name (e.g., 'presentations/quarterly-report.pptx')"),
      content: z.string().describe('The file contents as text. For PPTX: use --- to separate slides, or JSON array of {title, content, bullets} objects'),
      contentType: z.string().optional().describe("Optional MIME type, defaults by extension"),
    }),
  }
)
