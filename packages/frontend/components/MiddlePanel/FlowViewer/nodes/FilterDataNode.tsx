import { type NodeProps, type Node } from '@xyflow/react'
import { Filter } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type FilterCondition = {
  field: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains'
  value: string
}

export type FilterDataNodeData = {
  label?: string
  conditions?: FilterCondition[]
}

type FilterDataNodeType = Node<FilterDataNodeData, 'filter-data'>

export function FilterDataNode({ data, selected }: NodeProps<FilterDataNodeType>) {
  const count = data.conditions?.length ?? 0

  return (
    <BaseNode
      category="utility"
      icon={Filter}
      title="Filter Data"
      selected={selected}
    >
      {count > 0 ? (
        <p className="text-xs text-muted-foreground">
          {count} condition{count !== 1 ? 's' : ''}
        </p>
      ) : (
        <span className="text-xs text-muted-foreground italic">No conditions set</span>
      )}
    </BaseNode>
  )
}
