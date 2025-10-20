import { useState, Fragment } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { ApiService } from '../../services/apiService'

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
      <Card className="bg-zinc-900 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Filter Conversations</CardTitle>
          <CardDescription className="text-zinc-400">Filter conversations by username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="user-filter" className="text-white text-sm mb-2 block">
                Select User
              </Label>
              <select
                id="user-filter"
                value={conversationUserFilter}
                onChange={(e) => setConversationUserFilter(e.target.value)}
                className="w-full bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
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
            <Button 
              onClick={() => loadConversationsAnalytics(30, conversationUserFilter)}
              variant="outline"
              className="text-white border-zinc-600 hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
            {conversationUserFilter && (
              <Button 
                onClick={() => {
                  setConversationUserFilter('')
                  loadConversationsAnalytics(30, '')
                }}
                variant="outline"
                className="text-white border-zinc-600 hover:bg-zinc-800"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">AI Conversations</CardTitle>
              <CardDescription className="text-zinc-400">
                Recent AI conversations with users
                {conversationUserFilter && ` (filtered by: ${conversationUserFilter})`}
              </CardDescription>
            </div>
            <Button 
              onClick={() => loadConversationsAnalytics(30, conversationUserFilter)} 
              variant="outline" 
              size="sm"
              className="text-white border-zinc-600 hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : conversationsAnalytics?.conversations && conversationsAnalytics.conversations.length > 0 ? (
            <div className="overflow-x-auto border border-zinc-700 rounded-lg">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 px-4 text-zinc-300 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-zinc-300 font-medium">Conversation Title</th>
                    <th className="text-center py-3 px-4 text-zinc-300 font-medium">Messages</th>
                    <th className="text-left py-3 px-4 text-zinc-300 font-medium">Created</th>
                    <th className="text-left py-3 px-4 text-zinc-300 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {conversationsAnalytics.conversations.slice(0, 20).map((conversation) => (
                    <Fragment key={conversation._id}>
                      <tr 
                        onClick={() => handleConversationRowClick(conversation._id)}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">{conversation.username}</span>
                        </td>
                        <td className="py-3 px-4 max-w-[300px]">
                          <span className="text-zinc-300 text-sm truncate inline-block max-w-full" title={conversation.title}>
                            {conversation.title || 'Untitled Conversation'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-white font-medium">{conversation.message_count}</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-sm">
                          {convertToEasternTime(conversation.created_at)}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-sm">
                          {conversation.last_message_at ? convertToEasternTime(conversation.last_message_at) : convertToEasternTime(conversation.updated_at)}
                        </td>
                      </tr>
                      {expandedConversation === conversation._id && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <div className="bg-zinc-800/30 border-l-4 border-blue-500">
                              {conversationDetailsLoading ? (
                                <div className="p-6 text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                                  <div className="text-zinc-400">Loading conversation details...</div>
                                </div>
                              ) : conversationDetails ? (
                                <div className="p-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <h3 className="text-white font-semibold text-lg mb-2">
                                        {conversationDetails.title || 'Untitled Conversation'}
                                      </h3>
                                      <div className="text-zinc-400 text-sm">
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
                                      className="text-white border-zinc-600 hover:bg-zinc-800"
                                    >
                                      Close
                                    </Button>
                                  </div>
                                  <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {conversationDetails.messages?.map((message: any, index: number) => (
                                      <div key={index} className="bg-zinc-900/50 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-blue-400 font-medium text-sm">
                                            {message.role === 'user' ? 'User' : 'AI Assistant'}
                                          </span>
                                          <span className="text-zinc-500 text-xs">
                                            {message.timestamp ? convertToEasternTime(message.timestamp) : 'Unknown time'}
                                          </span>
                                        </div>
                                        <div className="text-zinc-200 text-sm whitespace-pre-wrap">
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
                                <div className="p-6 text-center text-zinc-400">
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
                <div className="p-3 text-center text-zinc-400 text-sm bg-zinc-800">
                  Showing 20 of {conversationsAnalytics.conversations.length} conversations
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              No conversation data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

