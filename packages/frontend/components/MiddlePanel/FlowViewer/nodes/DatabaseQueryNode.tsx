import { type NodeProps, type Node } from '@xyflow/react'
import { Database } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type DatabaseQueryNodeData = {
  label?: string
  connectionId?: string
  connectionName?: string
  table?: string
  filters?: Array<{ field: string; operator: string; value: string }>
  columns?: string[]
}

type DatabaseQueryNodeType = Node<DatabaseQueryNodeData, 'database-query'>

export function DatabaseQueryNode({ data, selected }: NodeProps<DatabaseQueryNodeType>) {
  return (
    <BaseNode
      category="database"
      icon={Database}
      title="Database Query"
      selected={selected}
    >
      {data.connectionName || data.table ? (
        <div className="space-y-0.5">
          {data.connectionName && (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Connection:</span> {data.connectionName}
            </p>
          )}
          {data.table && (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Table:</span> {data.table}
            </p>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Not configured</span>
      )}
    </BaseNode>
  )
}
