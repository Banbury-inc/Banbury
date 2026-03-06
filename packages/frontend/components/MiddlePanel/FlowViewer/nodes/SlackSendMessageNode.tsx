import { type NodeProps, type Node } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type SlackSendMessageNodeData = {
  label?: string
  channel?: string
  messageTemplate?: string
}

type SlackSendMessageNodeType = Node<SlackSendMessageNodeData, 'slack-send-message'>

export function SlackSendMessageNode({ data, selected }: NodeProps<SlackSendMessageNodeType>) {
  return (
    <BaseNode
      category="communication"
      icon={MessageSquare}
      title="Slack: Send Message"
      selected={selected}
    >
      {data.channel || data.messageTemplate ? (
        <div className="space-y-0.5">
          {data.channel && (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Channel:</span> {data.channel}
            </p>
          )}
          {data.messageTemplate && (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">Message:</span> {data.messageTemplate}
            </p>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Not configured</span>
      )}
    </BaseNode>
  )
}
