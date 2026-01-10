import { FilePlus } from 'lucide-react'
import React, { useMemo } from 'react'
import { AIToolCard } from './AIToolCard'

import type { AIToolCardConfig } from './AIToolCard'

interface CreateFileToolProps {
  args?: {
    fileName?: string
    filePath?: string
    content?: string
    mimeType?: string
  }
  argsText?: string
  result?: any
  fileName?: string
  filePath?: string
  content?: string
  mimeType?: string
}

export const CreateFileTool: React.FC<CreateFileToolProps> = (props) => {
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

  const { fileName, filePath, content } = parsedArgs

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

  const hasContent = Boolean(fileName || filePath || content)

  const config: AIToolCardConfig = useMemo(() => ({
    icon: FilePlus,
    displayName: fileName || 'New File',
    changeType: 'file-create',
    autoApply: true
  }), [fileName])

  const payload = useMemo(() => ({
    fileName,
    filePath,
    content,
    fileId: fileInfo?.file_id || fileInfo?.id
  }), [fileName, filePath, content, fileInfo])

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasContent}
    />
  )
}

export default CreateFileTool
