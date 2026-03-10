'use client'

import { X } from 'lucide-react'
import { type Node } from '@xyflow/react'
import { Button } from '../../common/ui/button'
import { NODE_REGISTRY_MAP, CATEGORY_COLORS } from './nodes/nodeRegistry'
import { DatabaseQueryConfig } from './config/DatabaseQueryConfig'
import { SlackSendMessageConfig } from './config/SlackSendMessageConfig'
import { GmailSendConfig } from './config/GmailSendConfig'
import { FormatTextConfig } from './config/FormatTextConfig'
import { FilterDataConfig } from './config/FilterDataConfig'
import { HttpRequestConfig } from './config/HttpRequestConfig'
import { GoogleCalendarConfig } from './config/GoogleCalendarConfig'
import { MicrosoftCalendarConfig } from './config/MicrosoftCalendarConfig'
import { GitHubConfig } from './config/GitHubConfig'
import { XApiConfig } from './config/XApiConfig'
import { GoogleDriveConfig } from './config/GoogleDriveConfig'
import { OneDriveConfig } from './config/OneDriveConfig'

interface Props {
  node: Node | null
  onClose: () => void
  onDataChange: (nodeId: string, data: Record<string, unknown>) => void
}

function ConfigBody({
  node,
  onChange,
}: {
  node: Node
  onChange: (patch: Record<string, unknown>) => void
}) {
  const type = node.type ?? ''
  const data = node.data as Record<string, unknown>

  switch (type) {
    case 'database-query':
      return <DatabaseQueryConfig data={data} onChange={onChange} />
    case 'slack-send-message':
      return <SlackSendMessageConfig data={data} onChange={onChange} />
    case 'gmail-send':
      return <GmailSendConfig data={data} onChange={onChange} />
    case 'format-text':
      return <FormatTextConfig data={data} onChange={onChange} />
    case 'filter-data':
      return <FilterDataConfig data={data} onChange={onChange} />
    case 'http-request':
      return <HttpRequestConfig data={data} onChange={onChange} />
    case 'google-calendar':
      return <GoogleCalendarConfig data={data} onChange={onChange} />
    case 'microsoft-calendar':
      return <MicrosoftCalendarConfig data={data} onChange={onChange} />
    case 'github':
      return <GitHubConfig data={data} onChange={onChange} />
    case 'x-api':
      return <XApiConfig data={data} onChange={onChange} />
    case 'google-drive':
      return <GoogleDriveConfig data={data} onChange={onChange} />
    case 'onedrive':
      return <OneDriveConfig data={data} onChange={onChange} />
    case 'start':
      return <p className="text-xs text-muted-foreground italic">The Start node has no configuration — it triggers the flow.</p>
    case 'output':
      return <p className="text-xs text-muted-foreground italic">The Output node displays the result from connected nodes.</p>
    default:
      return <p className="text-xs text-muted-foreground italic">No configuration available for this node type.</p>
  }
}

export function NodeConfigPanel({ node, onClose, onDataChange }: Props) {
  if (!node) return null

  const def = NODE_REGISTRY_MAP[node.type ?? '']
  const colors = def ? CATEGORY_COLORS[def.category] : CATEGORY_COLORS['utility']

  function handleChange(patch: Record<string, unknown>) {
    onDataChange(node.id, { ...(node.data as Record<string, unknown>), ...patch })
  }

  return (
    <div className="w-72 flex-shrink-0 h-full bg-card border-l border-border shadow-xl flex flex-col animate-in fade-in slide-in-from-right-2 duration-200">
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0 ${colors.header}`}>
        <span className={`text-sm font-semibold flex-1 truncate ${colors.icon}`}>
          {def?.label ?? node.type ?? 'Configure Node'}
        </span>
        <Button size="xs" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      {def?.description && (
        <p className="px-3 pt-2 pb-0 text-xs text-muted-foreground">{def.description}</p>
      )}
      <div className="flex-1 overflow-y-auto p-3">
        <ConfigBody node={node} onChange={handleChange} />
      </div>
    </div>
  )
}
