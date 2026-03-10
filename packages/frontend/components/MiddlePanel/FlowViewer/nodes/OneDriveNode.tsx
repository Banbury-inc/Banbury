import { type NodeProps, type Node } from '@xyflow/react'
import { Cloud } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type OneDriveNodeData = {
  label?: string
  operation?: 'list' | 'search' | 'get'
  query?: string
  folderId?: string
  fileId?: string
}

type OneDriveNodeType = Node<OneDriveNodeData, 'onedrive'>

const OPERATION_LABELS: Record<string, string> = {
  list: 'List Files',
  search: 'Search Files',
  get: 'Get File',
}

export function OneDriveNode({ data, selected }: NodeProps<OneDriveNodeType>) {
  const op = data.operation ?? 'list'

  return (
    <BaseNode
      category="storage"
      icon={Cloud}
      title="OneDrive"
      selected={selected}
    >
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Op:</span> {OPERATION_LABELS[op] ?? op}
        </p>
        {data.query && (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium">Query:</span> {data.query}
          </p>
        )}
      </div>
    </BaseNode>
  )
}
