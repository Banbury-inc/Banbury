import { type NodeProps, type Node } from '@xyflow/react'
import { MonitorCheck } from 'lucide-react'
import { BaseNode } from './BaseNode'

type OutputNodeData = {
  label?: string
  output?: string
}

type OutputNodeType = Node<OutputNodeData, 'output'>

export function OutputNode({ data, selected }: NodeProps<OutputNodeType>) {
  const hasOutput = data.output != null && data.output !== ''

  return (
    <BaseNode
      category="output"
      icon={MonitorCheck}
      title={data.label ?? 'Output'}
      selected={selected}
      hasInput={true}
      hasOutput={false}
    >
      {hasOutput ? (
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {data.output}
        </pre>
      ) : (
        <span className="text-xs text-muted-foreground italic">No output yet</span>
      )}
    </BaseNode>
  )
}
