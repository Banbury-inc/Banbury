import { type NodeProps, type Node } from '@xyflow/react'
import { Code2 } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type PythonExecutionMode = 'inline' | 'file'

export interface PythonCodeNodeData {
  label?: string
  executionMode?: PythonExecutionMode
  script?: string
  filePath?: string
  input?: string
  timeoutSeconds?: number
}

type PythonCodeNodeType = Node<PythonCodeNodeData, 'python-code'>

export function PythonCodeNode({ data, selected }: NodeProps<PythonCodeNodeType>) {
  const executionMode = data.executionMode ?? 'inline'

  return (
    <BaseNode
      category="development"
      icon={Code2}
      title="Python Code"
      selected={selected}
    >
      {executionMode === 'inline' ? (
        <p className="text-xs text-muted-foreground line-clamp-2">
          <span className="font-medium">Inline:</span> {data.script ? data.script.trim().split('\n')[0] : 'No script set'}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground truncate">
          <span className="font-medium">File:</span> {data.filePath || 'No file path set'}
        </p>
      )}
    </BaseNode>
  )
}
