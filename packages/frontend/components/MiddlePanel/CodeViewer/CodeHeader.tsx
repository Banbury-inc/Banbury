import React from 'react'

interface CodeHeaderProps {
  fileName: string
  language: string
  mode: 'view' | 'edit'
  fileSize?: number
  actions?: React.ReactNode
}

export function CodeHeader({ fileName, language, mode, fileSize, actions }: CodeHeaderProps) {
  const modeLabel = mode === 'view' ? 'View' : 'Edit'

  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-sm text-foreground truncate">
          <span className="font-medium">{modeLabel} · {fileName}</span>
          <span className="text-muted-foreground ml-2">({language})</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {fileSize != null && (
          <span className="text-xs text-muted-foreground">
            {(fileSize / 1024).toFixed(1)} KB
          </span>
        )}
        {actions}
      </div>
    </div>
  )
}
