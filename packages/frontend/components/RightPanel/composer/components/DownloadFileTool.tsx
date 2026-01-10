import { Download } from 'lucide-react'
import React, { useMemo } from 'react'
import { AIToolCard } from './AIToolCard'

import type { AIToolCardConfig } from './AIToolCard'

interface DownloadFileToolProps {
  args?: {
    url?: string
    fileName?: string
    filePath?: string
  }
  argsText?: string
  result?: any
  url?: string
  fileName?: string
  filePath?: string
}

export const DownloadFileTool: React.FC<DownloadFileToolProps> = (props) => {
  // Parse args from argsText if args object not provided (direct by_name usage)
  const parsedArgs = useMemo(() => {
    if (props.args) return props.args
    if (props.argsText) {
      try {
        return JSON.parse(props.argsText)
      } catch {
        return {}
      }
    }
    return props
  }, [props.args, props.argsText])

  const { url, fileName, filePath } = parsedArgs

  // Parse result to get file_id if available
  const fileInfo = useMemo(() => {
    if (!props.result) return null
    try {
      const parsed = typeof props.result === 'string' ? JSON.parse(props.result) : props.result
      return parsed?.file_info || null
    } catch {
      return null
    }
  }, [props.result])

  const hasContent = Boolean(url || fileName || filePath)

  const config: AIToolCardConfig = useMemo(() => ({
    icon: Download,
    displayName: fileName || 'Downloaded File',
    changeType: 'file-download',
    autoApply: true
  }), [fileName])

  const payload = useMemo(() => ({
    url,
    fileName,
    filePath,
    fileId: fileInfo?.file_id || fileInfo?.id
  }), [url, fileName, filePath, fileInfo])

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasContent}
    />
  )
}

export default DownloadFileTool
