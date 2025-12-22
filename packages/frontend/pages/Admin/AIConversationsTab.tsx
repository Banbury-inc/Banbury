import { useState, Fragment } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { ApiService } from '../../../backend/api/apiService'

interface ConversationData {
  _id: string
  username: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
  last_message_at?: string
  messages: any[]
  metadata?: any
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
  const [conversationDetails, setConversationDetails] = useState<any>(null)
  const [conversationDetailsLoading, setConversationDetailsLoading] = useState(false)

  const loadConversationDetails = async (conversationId: string) => {
    setConversationDetailsLoading(true)
    try {
      const response = await ApiService.getConversationAdmin(conversationId) as any
      if (response.success) {
        setConversationDetails(response.conversation)
        setExpandedConversation(conversationId)
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error)
      setConversationDetails(null)
    } finally {
      setConversationDetailsLoading(false)
    }
  }

  const handleConversationRowClick = (conversationId: string) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null)
      setConversationDetails(null)
    } else {
      loadConversationDetails(conversationId)
    }
  }

  return (
    <div className="space-y-6">
      {/* User Filter */}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="border-zinc-300 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter Conversations
              {conversationUserFilter && (
                <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
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
                  className="w-full bg-card text-foreground border border-zinc-300 dark:border-white/[0.06] rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
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
                  className="flex-1 border-zinc-300 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
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
                    className="flex-1 border-zinc-300 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="bg-card border-zinc-300 dark:border-white/[0.06]">
        <CardHeader>
          <div className="flex items-center justify-between">
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
              className="border-zinc-300 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
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
            <div className="overflow-x-auto border border-zinc-300 dark:border-white/[0.06] rounded-lg">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-zinc-300 dark:border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Conversation Title</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Messages</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {conversationsAnalytics.conversations.slice(0, 20).map((conversation) => (
                    <Fragment key={conversation._id}>
                      <tr 
                        onClick={() => handleConversationRowClick(conversation._id)}
                        className="border-b border-zinc-200 dark:border-white/[0.04] hover:bg-accent/50 dark:hover:bg-accent/50 transition-colors cursor-pointer"
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
                          {convertToEasternTime(conversation.created_at)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {conversation.last_message_at ? convertToEasternTime(conversation.last_message_at) : convertToEasternTime(conversation.updated_at)}
                        </td>
                      </tr>
                      {expandedConversation === conversation._id && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <div className="bg-accent/30 border-l-4 border-blue-500">
                              {conversationDetailsLoading ? (
                                <div className="p-6 text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
                                  <div className="text-muted-foreground">Loading conversation details...</div>
                                </div>
                              ) : conversationDetails ? (
                                <div className="p-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <h3 className="text-foreground font-semibold text-lg mb-2">
                                        {conversationDetails.title || 'Untitled Conversation'}
                                      </h3>
                                      <div className="text-muted-foreground text-sm">
                                        <span className="mr-4">User: {conversationDetails.username}</span>
                                        <span className="mr-4">Messages: {conversationDetails.messages?.length || 0}</span>
                                        <span>Created: {convertToEasternTime(conversationDetails.created_at)}</span>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setExpandedConversation(null)
                                        setConversationDetails(null)
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="border-zinc-300 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent"
                                    >
                                      Close
                                    </Button>
                                  </div>
                                  <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {conversationDetails.messages?.map((message: any, index: number) => (
                                      <div key={index} className="bg-muted/50 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                            {message.role === 'user' ? 'User' : 'AI Assistant'}
                                          </span>
                                          <span className="text-muted-foreground text-xs">
                                            {message.timestamp ? convertToEasternTime(message.timestamp) : 'Unknown time'}
                                          </span>
                                        </div>
                                        <div className="text-foreground text-sm whitespace-pre-wrap">
                                          {(() => {
                                            const content = message.content || message.text || 'No content'
                                            if (typeof content === 'string') {
                                              return content
                                            } else if (typeof content === 'object' && content !== null) {
                                              if (content.text) {
                                                return content.text
                                              } else if (content.type && content.text) {
                                                return content.text
                                              } else {
                                                return JSON.stringify(content)
                                              }
                                            } else {
                                              return String(content)
                                            }
                                          })()}
                                        </div>
                                      </div>
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

