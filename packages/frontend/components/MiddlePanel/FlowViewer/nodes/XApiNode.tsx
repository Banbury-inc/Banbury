import { type NodeProps, type Node } from '@xyflow/react'
import { X as XIcon } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type XApiNodeData = {
  label?: string
  operation?: 'search' | 'post-tweet' | 'get-user' | 'get-tweets' | 'trending'
  text?: string
  query?: string
  username?: string
}

type XApiNodeType = Node<XApiNodeData, 'x-api'>

const OPERATION_LABELS: Record<string, string> = {
  search: 'Search Tweets',
  'post-tweet': 'Post Tweet',
  'get-user': 'Get User Info',
  'get-tweets': 'Get User Tweets',
  trending: 'Trending Topics',
}

export function XApiNode({ data, selected }: NodeProps<XApiNodeType>) {
  const op = data.operation ?? 'search'

  return (
    <BaseNode
      category="social"
      icon={XIcon}
      title="X (Twitter)"
      selected={selected}
    >
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Op:</span> {OPERATION_LABELS[op] ?? op}
        </p>
        {(data.query ?? data.text ?? data.username) && (
          <p className="text-xs text-muted-foreground truncate">
            {data.query ?? data.text ?? data.username}
          </p>
        )}
      </div>
    </BaseNode>
  )
}
