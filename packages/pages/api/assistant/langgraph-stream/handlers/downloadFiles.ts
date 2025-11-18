import type { AssistantUiMessage } from "../types"

interface DownloadFilesParams {
  messages: AssistantUiMessage[]
  authToken?: string
}

const API_URL = 'https://www.api.dev.banbury.io'

export async function downloadFiles({ 
  messages, 
  authToken 
}: DownloadFilesParams): Promise<AssistantUiMessage[]> {
  if (!Array.isArray(messages)) return messages
  
  const out: AssistantUiMessage[] = []
  
  for (const m of messages) {
    const parts = Array.isArray(m?.content) ? [...m.content] : []
    
    for (let i = 0; i < parts.length; i++) {
      const p: any = parts[i]
      
      if (p?.type === 'file-attachment' && p?.fileId) {
        // Skip if file already downloaded
        if (p?.fileData) continue
        
        // Skip if no auth token
        if (!authToken) continue
        
        try {
          const downloadUrl = `${API_URL}/files/download_s3_file/${encodeURIComponent(p.fileId)}/`
          
          const resp = await fetch(downloadUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${authToken}` },
          })
          
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer()
            const contentType = resp.headers.get('content-type') || 'application/octet-stream'
            const base64Data = Buffer.from(arrayBuffer).toString('base64')
            parts[i] = { ...p, fileData: base64Data, mimeType: contentType } as any
          }
        } catch (error) {
          // Remove failed attachments
          parts.splice(i, 1)
          i--
        }
      }
    }
    
    out.push({ ...m, content: parts } as AssistantUiMessage)
  }
  
  return out
}

