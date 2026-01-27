import { Badge } from '../../../ui/badge'
import { formatMessageContent, type ConversationMessage } from './format-message-content'

interface ConversationMessageBubbleProps {
  message: ConversationMessage
  convertToEasternTime: (timestamp: string) => string
}

export function ConversationMessageBubble({ 
  message, 
  convertToEasternTime 
}: ConversationMessageBubbleProps) {
  const isUser = message.role === 'user'
  const formatted = formatMessageContent(message)
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted border border-border'
        }`}
      >
        <div className={`flex items-center gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <Badge 
            variant={isUser ? 'secondary' : 'outline'} 
            className="text-xs"
          >
            {isUser ? 'User' : 'AI Assistant'}
          </Badge>
          <span className={`text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {message.timestamp ? convertToEasternTime(message.timestamp) : 'Unknown time'}
          </span>
        </div>
        
        {formatted.kind === 'json' ? (
          <pre className="overflow-x-auto font-mono text-xs bg-background border border-border rounded-md p-3 text-foreground whitespace-pre-wrap break-words">
            {formatted.text}
          </pre>
        ) : (
          <div className={`text-sm whitespace-pre-wrap break-words ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {formatted.text}
          </div>
        )}
      </div>
    </div>
  )
}
