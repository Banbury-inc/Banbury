import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../src/config/config"
import { getServerContextValue } from "../../../../../../src/assistant/langraph/serverContext"

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'text/plain': '.txt',
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'application/json': '.json',
    'application/xml': '.xml',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
  }
  
  return mimeToExt[mimeType] || ''
}

export const downloadFromUrlTool = tool(
  async (input: { url: string; fileName?: string; filePath?: string; fileParent?: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    console.log(`Downloading file from URL: ${input.url}`)
    
    // Download the file from the URL
    const response = await fetch(input.url)
    if (!response.ok) {
      throw new Error(`Failed to download file: HTTP ${response.status} ${response.statusText}`)
    }
    
    // Get file information
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')
    const fileSize = contentLength ? parseInt(contentLength) : 0
    
    // Determine file name
    let finalFileName = input.fileName
    if (!finalFileName) {
      // Try to extract filename from URL
      const urlObj = new URL(input.url)
      const pathname = urlObj.pathname
      if (pathname && pathname.includes('/')) {
        finalFileName = pathname.split('/').pop() || ''
        if (!finalFileName || !finalFileName.includes('.')) {
          // If no filename in URL, try to determine from content-type
          const extension = getExtensionFromMimeType(contentType)
          finalFileName = `downloaded_file${extension}`
        }
      } else {
        // Fallback filename
        const extension = getExtensionFromMimeType(contentType)
        finalFileName = `downloaded_file${extension}`
      }
    }
    
    // Convert response to blob
    const blob = await response.blob()
    
    // Upload the blob to S3
    const formData = new FormData()
    formData.append('file', blob, finalFileName)
    formData.append('device_name', 'web-editor')
    formData.append('file_path', input.filePath || 'uploads')
    formData.append('file_parent', input.fileParent || 'uploads')

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
      throw new Error(`Failed to upload downloaded file: ${message}`)
    }

    const data = await resp.json()
    return JSON.stringify({
      result: data?.result || 'success',
      file_url: data?.file_url,
      file_info: {
        ...data?.file_info,
        source_url: input.url,
        file_size: fileSize
      },
      message: `File downloaded from URL and uploaded successfully`,
    })
  },
  {
    name: 'download_from_url',
    description: 'Download a file from a URL and upload it to the user\'s cloud workspace. Provide the URL and optionally a custom file name and path.',
    schema: z.object({
      url: z.string().describe("The URL of the file to download"),
      fileName: z.string().optional().describe("Optional custom file name (if not provided, will extract from URL)"),
      filePath: z.string().optional().describe("Optional file path where to store the file (default: 'uploads')"),
      fileParent: z.string().optional().describe("Optional parent directory (default: 'uploads')"),
    }),
  }
)

