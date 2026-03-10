import { type NodeProps, type Node } from '@xyflow/react'
import { Mail } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type GmailSendNodeData = {
  label?: string
  to?: string
  subject?: string
  body?: string
  cc?: string
  bcc?: string
}

type GmailSendNodeType = Node<GmailSendNodeData, 'gmail-send'>

export function GmailSendNode({ data, selected }: NodeProps<GmailSendNodeType>) {
  return (
    <BaseNode
      category="communication"
      icon={Mail}
      title="Gmail: Send Email"
      selected={selected}
    >
      {data.to || data.subject ? (
        <div className="space-y-0.5">
          {data.to && (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">To:</span> {data.to}
            </p>
          )}
          {data.subject && (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Subject:</span> {data.subject}
            </p>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Not configured</span>
      )}
    </BaseNode>
  )
}
