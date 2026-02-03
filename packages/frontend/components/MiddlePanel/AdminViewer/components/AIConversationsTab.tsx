import { useState, Fragment, useMemo } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { Button } from '../../../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card'
import { Label } from '../../../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover'
import { ConversationMessageBubble } from '../conversations/ConversationMessageBubble'
import { createAIConversationsHandlers } from '../handlers/ai-conversations-handlers'
import { getModelDisplayName, getDefaultModelForProvider, type ModelProvider } from '../../../RightPanel/composer/handlers/getModelDisplayName'

interface ConversationData {
  _id: string
  username: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
  last_message_at?: string
  messages: unknown[]
  metadata?: unknown
  model_id?: string
  model_provider?: string
}

interface ConversationsAnalytics {
  success: boolean
  conversations: ConversationData[]
  summary: {
    total_conversations: number
    unique_users: number
    total_messages: number
    avg_messages_per_conversation: number
    period_days: number
  }
  error?: string
}

interface AIConversationsTabProps {
  conversationsAnalytics: ConversationsAnalytics | null
  conversationsLoading: boolean
  conversationUserFilter: string
  setConversationUserFilter: (filter: string) => void
  conversationUsers: string[]
  usersLoading: boolean
  loadConversationsAnalytics: (days: number, userFilter: string) => void
  convertToEasternTime: (timestamp: string) => string
}

export function AIConversationsTab({
  conversationsAnalytics,
  conversationsLoading,
  conversationUserFilter,
  setConversationUserFilter,
  conversationUsers,
  usersLoading,
  loadConversationsAnalytics,
  convertToEasternTime
}: AIConversationsTabProps) {
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
  const [conversationDetails, setConversationDetails] = useState<{
    title?: string
    username?: string
    messages?: Array<{ role: string; content?: unknown; text?: string; timestamp?: string }>
    created_at?: string
  } | null>(null)
  const [conversationDetailsLoading, setConversationDetailsLoading] = useState(false)

  const handlers = useMemo(() => createAIConversationsHandlers({
    setConversationDetailsLoading,
    setConversationDetails,
    setExpandedConversation
  }), [])

  return (
    <div className="space-y-6">
      {/* User Filter */}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="border-border hover:bg-accent"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter Conversations
              {conversationUserFilter && (
                <span className="ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm sm:w-80">
            <div className="space-y-4">
              <div>
                <h3 className="text-foreground font-semibold mb-1">Filter Conversations</h3>
                <p className="text-muted-foreground text-sm">Filter conversations by username</p>
              </div>
              <div>
                <Label htmlFor="user-filter" className="text-foreground text-sm mb-2 block">
                  Select User
                </Label>
                <select
                  id="user-filter"
                  value={conversationUserFilter}
                  onChange={(e) => setConversationUserFilter(e.target.value)}
                  className="w-full bg-card text-foreground border border-border rounded px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="">All Users</option>
                  {usersLoading ? (
                    <option disabled>Loading users...</option>
                  ) : (
                    conversationUsers.map((username) => (
                      <option key={username} value={username}>
                        {username}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => loadConversationsAnalytics(30, conversationUserFilter)}
                  variant="outline"
                  className="flex-1 border-border hover:bg-accent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply
                </Button>
                {conversationUserFilter && (
                  <Button 
                    onClick={() => {
                      setConversationUserFilter('')
                      loadConversationsAnalytics(30, '')
                    }}
                    variant="outline"
                    className="flex-1 border-border hover:bg-accent"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">AI Conversations</CardTitle>
              <CardDescription className="text-muted-foreground">
                Recent AI conversations with users
                {conversationUserFilter && ` (filtered by: ${conversationUserFilter})`}
              </CardDescription>
            </div>
            <Button 
              onClick={() => loadConversationsAnalytics(30, conversationUserFilter)} 
              variant="outline" 
              size="sm"
              className="border-border hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
          ) : conversationsAnalytics?.conversations && conversationsAnalytics.conversations.length > 0 ? (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Conversation Title</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Messages</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Model</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {conversationsAnalytics.conversations.slice(0, 20).map((conversation) => (
                    <Fragment key={conversation._id}>
                      <tr 
                        onClick={() => handlers.handleConversationRowClick(conversation._id, expandedConversation)}
                        className="border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="text-foreground font-medium">{conversation.username}</span>
                        </td>
                        <td className="py-3 px-4 max-w-[300px]">
                          <span className="text-muted-foreground text-sm truncate inline-block max-w-full" title={conversation.title}>
                            {conversation.title || 'Untitled Conversation'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-foreground font-medium">{conversation.message_count}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {conversation.model_id 
                            ? getModelDisplayName(conversation.model_id)
                            : conversation.model_provider && (conversation.model_provider === 'anthropic' || conversation.model_provider === 'openai')
                              ? getModelDisplayName(getDefaultModelForProvider(conversation.model_provider as ModelProvider))
                              : 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {convertToEasternTime(conversation.created_at)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {conversation.last_message_at ? convertToEasternTime(conversation.last_message_at) : convertToEasternTime(conversation.updated_at)}
                        </td>
                      </tr>
                      {expandedConversation === conversation._id && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <div className="bg-accent/30 border-l-4 border-primary">
                              {conversationDetailsLoading ? (
                                <div className="p-6 text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
                                  <div className="text-muted-foreground">Loading conversation details...</div>
                                </div>
                              ) : conversationDetails ? (
                                <div className="p-4 sm:p-6">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-4">
                                    <div>
                                      <h3 className="text-foreground font-semibold text-lg mb-2">
                                        {conversationDetails.title || 'Untitled Conversation'}
                                      </h3>
                                      <div className="text-muted-foreground text-sm flex flex-col gap-1 sm:flex-row sm:gap-4">
                                        <span>User: {conversationDetails.username}</span>
                                        <span>Messages: {conversationDetails.messages?.length || 0}</span>
                                        <span>Created: {conversationDetails.created_at ? convertToEasternTime(conversationDetails.created_at) : 'Unknown'}</span>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlers.closeExpandedPanel()
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="border-border hover:bg-accent"
                                    >
                                      Close
                                    </Button>
                                  </div>
                                  <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {conversationDetails.messages?.map((message, index) => (
                                      <ConversationMessageBubble
                                        key={index}
                                        message={message}
                                        convertToEasternTime={convertToEasternTime}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-6 text-center text-muted-foreground">
                                  Failed to load conversation details
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              {conversationsAnalytics.conversations.length > 20 && (
                <div className="p-3 text-center text-muted-foreground text-sm bg-muted">
                  Showing 20 of {conversationsAnalytics.conversations.length} conversations
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No conversation data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
