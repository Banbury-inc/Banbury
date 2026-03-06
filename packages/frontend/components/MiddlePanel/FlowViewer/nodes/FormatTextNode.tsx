import { type NodeProps, type Node } from '@xyflow/react'
import { FileText } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type FormatTextNodeData = {
  label?: string
  template?: string
}

type FormatTextNodeType = Node<FormatTextNodeData, 'format-text'>

export function FormatTextNode({ data, selected }: NodeProps<FormatTextNodeType>) {
  return (
    <BaseNode
      category="utility"
      icon={FileText}
      title="Format Text"
      selected={selected}
    >
      {data.template ? (
        <p className="text-xs text-muted-foreground truncate">
          <span className="font-medium">Template:</span> {data.template}
        </p>
      ) : (
        <span className="text-xs text-muted-foreground italic">No template set</span>
      )}
    </BaseNode>
  )
}
