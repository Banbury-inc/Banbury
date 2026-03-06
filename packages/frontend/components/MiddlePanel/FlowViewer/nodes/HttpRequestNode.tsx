import { type NodeProps, type Node } from '@xyflow/react'
import { Globe } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type HttpRequestNodeData = {
  label?: string
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: string
}

type HttpRequestNodeType = Node<HttpRequestNodeData, 'http-request'>

export function HttpRequestNode({ data, selected }: NodeProps<HttpRequestNodeType>) {
  return (
    <BaseNode
      category="utility"
      icon={Globe}
      title="HTTP Request"
      selected={selected}
    >
      {data.url ? (
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{data.method ?? 'GET'}</span>{' '}
            <span className="truncate">{data.url}</span>
          </p>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Not configured</span>
      )}
    </BaseNode>
  )
}
