import { type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import { BaseNode } from './BaseNode'

export function StartNode({ selected }: NodeProps) {
  return (
    <BaseNode
      category="trigger"
      icon={Play}
      title="Start"
      selected={selected}
      hasInput={false}
      hasOutput={true}
    />
  )
}
