import { useState, useEffect, useCallback } from 'react'
import { 
  Mail, 
  Send, 
  Star, 
  StarOff, 
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Paperclip
} from 'lucide-react'
import { EmailService, GmailMessage, GmailMessageListResponse } from '../services/emailService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { EmailViewer } from './EmailViewer'

interface EmailTabProps {
  onOpenEmailApp?: () => void
  onMessageSelect?: (message: GmailMessage) => void
  onComposeEmail?: () => void
}

interface ParsedEmail {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  isRead: boolean
  hasAttachments: boolean
  labels: string[]
  isDraft: boolean
}

type GmailHeader = { name: string; value: string }

export function EmailTab({ onOpenEmailApp, onMessageSelect, onComposeEmail }: EmailTabProps) {
  const [messages, setMessages] = useState<GmailMessageListResponse>({})
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null)
  const [parsedMessages, setParsedMessages] = useState<ParsedEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'drafts'>('inbox')
  
  // Compose form state
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    body: ''
  })

  // Format date for display
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }, [])

  // Extract message body content
  const extractMessageBody = useCallback((payload: any): string => {
    if (!payload) return ''
    
    // If payload has body data, decode it
    if (payload.body?.data) {
      try {
        return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      } catch (e) {
        return ''
      }
    }
    
    // If payload has parts, look for text content
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          try {
            return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
          } catch (e) {
            continue
          }
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          try {
            const html = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
            // Strip HTML tags for plain text display
            return html.replace(/<[^>]*>/g, '')
          } catch (e) {
            continue
          }
        }
      }
    }
    
    return ''
  }, [])

  // Parse Gmail message into readable format
  const parseGmailMessage = useCallback((message: GmailMessage): ParsedEmail => {
    const headers = (message.payload?.headers as GmailHeader[]) || []
    const getHeader = (name: string) => headers.find((h: GmailHeader) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    
    // For sent emails, show "To" field as the primary contact
    const isSentEmail = activeTab === 'sent'
    const isDraft = activeTab === 'drafts'
    
    // Check for attachments in nested parts
    const hasAttachments = (payload: any): boolean => {
      if (!payload) return false
      if (payload.filename) return true
      if (payload.parts) {
        return payload.parts.some((part: any) => hasAttachments(part))
      }
      return false
    }
    
    // Handle date parsing more robustly
    let dateString = 'Unknown'
    if (message.internalDate) {
      try {
        const date = new Date(parseInt(message.internalDate))
        if (!isNaN(date.getTime())) {
          dateString = date.toLocaleString()
        }
      } catch (e) {
        console.error('Failed to parse date:', message.internalDate)
      }
    }
    
    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('subject') || '(No Subject)',
      from: isSentEmail ? 'You' : getHeader('from') || 'Unknown',
      to: isSentEmail ? getHeader('to') || '' : getHeader('to') || '',
      date: dateString,
      snippet: message.snippet || '',
      isRead: !message.labelIds?.includes('UNREAD'),
      hasAttachments: hasAttachments(message.payload),
      labels: message.labelIds || [],
      isDraft
    }
  }, [activeTab])

  // Load messages
  const loadMessages = useCallback(async (pageToken?: string, query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const labelIds = activeTab === 'inbox' ? ['INBOX'] : activeTab === 'sent' ? ['SENT'] : ['DRAFT']
      const response = await EmailService.listMessages({
        maxResults: 20,
        labelIds,
        pageToken,
        q: query
      })
      
      setHasNextPage(!!response.nextPageToken)
      
      // Load full message details in batch
      if (response.messages && response.messages.length > 0) {
        const messageIds = response.messages.map(msg => msg.id)
        try {
          const batchResponse = await EmailService.getMessagesBatch(messageIds)
          const fullMessages: GmailMessage[] = []
          
          // Process batch response
          for (const msg of response.messages) {
            const fullMessage = batchResponse.messages[msg.id]
            if (fullMessage && !fullMessage.error) {
              fullMessages.push(fullMessage)
            } else {
              console.error(`Failed to load message ${msg.id}:`, fullMessage?.error)
              // Add a placeholder message with basic info
              fullMessages.push({
                id: msg.id,
                threadId: msg.threadId,
                snippet: 'Failed to load message',
                labelIds: []
              })
            }
          }
          
          // Update messages with full details
          if (pageToken) {
            setMessages(prev => ({
              ...response,
              messages: [...(prev.messages || []), ...fullMessages]
            }))
          } else {
            setMessages({
              ...response,
              messages: fullMessages
            })
          }
        } catch (batchError) {
          console.error('Failed to load messages in batch:', batchError)
          // Fallback to individual requests if batch fails
          const fullMessages: GmailMessage[] = []
          for (const msg of response.messages) {
            try {
              const fullMessage = await EmailService.getMessage(msg.id)
              fullMessages.push(fullMessage)
            } catch (error) {
              console.error(`Failed to load message ${msg.id}:`, error)
              fullMessages.push({
                id: msg.id,
                threadId: msg.threadId,
                snippet: 'Failed to load message',
                labelIds: []
              })
            }
          }
          
          if (pageToken) {
            setMessages(prev => ({
              ...response,
              messages: [...(prev.messages || []), ...fullMessages]
            }))
          } else {
            setMessages({
              ...response,
              messages: fullMessages
            })
          }
        }
      } else {
        // No messages to load
        if (pageToken) {
          setMessages(prev => ({
            ...response,
            messages: [...(prev.messages || []), ...(response.messages || [])]
          }))
        } else {
          setMessages(response)
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      setError('Failed to load emails. Please check your Gmail connection.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  // Load full message details
  const loadMessageDetails = useCallback(async (messageId: string) => {
    try {
      const message = await EmailService.getMessage(messageId)
      
      // Mark as read if unread
      if (message.labelIds?.includes('UNREAD')) {
        await EmailService.modifyMessage(messageId, {
          removeLabelIds: ['UNREAD']
        })
      }
      
      // If onMessageSelect is provided, use it to open in main panel
      if (onMessageSelect) {
        onMessageSelect(message)
      } else {
        // Otherwise, show in the tab (fallback behavior)
        setSelectedMessage(message)
      }
    } catch (error) {
      console.error('Failed to load message details:', error)
    }
  }, [onMessageSelect])

  // Send email
  const sendEmail = useCallback(async () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) return
    
    try {
      await EmailService.sendMessage({
        to: composeForm.to,
        subject: composeForm.subject,
        body: composeForm.body
      })
      
      setComposeOpen(false)
      setComposeForm({ to: '', subject: '', body: '' })
      
      // Refresh messages
      loadMessages()
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }, [composeForm, loadMessages])

  // Handle message actions
  const handleMessageAction = useCallback(async (messageId: string, action: string) => {
    try {
      switch (action) {
        case 'archive':
          await EmailService.modifyMessage(messageId, {
            removeLabelIds: ['INBOX']
          })
          break
        case 'delete':
          await EmailService.modifyMessage(messageId, {
            addLabelIds: ['TRASH']
          })
          break
        case 'star':
          await EmailService.modifyMessage(messageId, {
            addLabelIds: ['STARRED']
          })
          break
        case 'unstar':
          await EmailService.modifyMessage(messageId, {
            removeLabelIds: ['STARRED']
          })
          break
        case 'edit':
          // TODO: Implement draft editing - open in composer
          console.log('Edit draft:', messageId)
          break
        case 'send':
          // TODO: Implement draft sending
          console.log('Send draft:', messageId)
          break
      }
      
      // Refresh messages
      loadMessages()
    } catch (error) {
      console.error('Failed to perform message action:', error)
    }
  }, [loadMessages])

  // Parse messages when messages state changes
  useEffect(() => {
    if (messages.messages) {
      const parsed = messages.messages.map(msg => parseGmailMessage(msg))
      setParsedMessages(parsed)
    }
  }, [messages, parseGmailMessage])

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [loadMessages, activeTab])

  // Global refresh listener so other components can force a refresh
  useEffect(() => {
    const handler = () => {
      loadMessages(undefined, searchQuery)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('email-refresh', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('email-refresh', handler)
      }
    }
  }, [loadMessages, searchQuery])

  // Handle tab change
  const handleTabChange = useCallback((tab: 'inbox' | 'sent' | 'drafts') => {
    setActiveTab(tab)
    setSelectedMessage(null)
    setMessages({})
    setParsedMessages([])
    setCurrentPage(0)
    setHasNextPage(false)
  }, [])

  // Handle search
  const handleSearch = useCallback(() => {
    loadMessages(undefined, searchQuery)
  }, [searchQuery, loadMessages])

  // Load next page
  const loadNextPage = useCallback(() => {
    if (messages.nextPageToken) {
      loadMessages(messages.nextPageToken)
    }
  }, [messages.nextPageToken, loadMessages])

  return (
    <div className="h-full flex flex-col">
      {/* Email Tab Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/30">
        <div className="flex items-center gap-4">
          {/* Tab Navigation */}
          <div className="flex gap-1">
            <button
              onClick={() => handleTabChange('inbox')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-700/50'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => handleTabChange('sent')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-700/50'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => handleTabChange('drafts')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'drafts'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-700/50'
              }`}
            >
              Drafts
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-zinc-700/50"
            onClick={() => loadMessages()}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-zinc-700">
        <div className="flex gap-2">
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-zinc-800 border-zinc-600 text-white text-sm"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Compose Button */}
      <div className="px-4 py-2 border-b border-zinc-700">
        <Button
          onClick={() => onComposeEmail ? onComposeEmail() : setComposeOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          <Send className="h-3 w-3 mr-2" />
          Compose
        </Button>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-hidden">
        {composeOpen ? (
          /* Compose Form */
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-medium">New Message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComposeOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <label className="text-gray-300 text-xs mb-1 block">To</label>
                <Input
                  value={composeForm.to}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-zinc-800 border-zinc-600 text-white text-sm"
                  placeholder="recipient@example.com"
                />
              </div>
              
              <div>
                <label className="text-gray-300 text-xs mb-1 block">Subject</label>
                <Input
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-zinc-800 border-zinc-600 text-white text-sm"
                  placeholder="Subject"
                />
              </div>
              
              <div className="flex-1">
                <label className="text-gray-300 text-xs mb-1 block">Message</label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full h-full bg-zinc-800 border border-zinc-600 text-white text-sm rounded p-2 resize-none"
                  placeholder="Write your message here..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={sendEmail}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!composeForm.to || !composeForm.subject || !composeForm.body}
              >
                <Send className="h-3 w-3 mr-2" />
                Send
              </Button>
              <Button
                variant="outline"
                onClick={() => setComposeOpen(false)}
                className="border-zinc-600 text-gray-300 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : selectedMessage ? (
          <EmailViewer
            email={selectedMessage}
            onBack={() => setSelectedMessage(null)}
            onReply={() => setComposeOpen(true)}
            onForward={() => setComposeOpen(true)}
            onArchive={() => { setSelectedMessage(null); loadMessages(undefined, searchQuery) }}
            onDelete={() => { setSelectedMessage(null); loadMessages(undefined, searchQuery) }}
            onStarToggled={() => { loadMessages(undefined, searchQuery) }}
            onRefresh={() => { loadMessages(undefined, searchQuery) }}
          />
        ) : (
          /* Message List */
                     <div className="h-full flex flex-col">
             {error && (
               <div className="p-4 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded m-2">
                 {error}
               </div>
             )}
             {loading && !parsedMessages.length ? (
               <div className="flex items-center justify-center h-full text-gray-400">
                 <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                 Loading emails...
               </div>
             ) : (
                             <>
                 <div className="flex-1 overflow-y-auto">
                   {parsedMessages.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                       <Mail className="h-12 w-12 mb-4 opacity-50" />
                       <p className="text-sm mb-2">
                         {activeTab === 'inbox' ? 'No emails found' : 
                          activeTab === 'sent' ? 'No sent emails found' : 
                          'No drafts found'}
                       </p>
                       <p className="text-xs text-gray-500">
                         {activeTab === 'inbox' ? 'Your inbox is empty or try refreshing' :
                          activeTab === 'sent' ? 'You haven\'t sent any emails yet' :
                          'You don\'t have any saved drafts'}
                       </p>
                     </div>
                   ) : (
                     parsedMessages.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => loadMessageDetails(email.id)}
                      className={`p-3 border-b border-zinc-700 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                        !email.isRead ? 'bg-zinc-800/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!email.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <span className={`text-sm font-medium truncate ${
                              !email.isRead ? 'text-white' : 'text-gray-300'
                            }`}>
                              {email.isDraft ? 'Draft' : email.from}
                            </span>
                            {email.hasAttachments && (
                              <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className={`text-sm truncate mb-1 ${
                            !email.isRead ? 'text-white' : 'text-gray-300'
                          }`}>
                            {email.subject}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {email.snippet}
                          </div>
                        </div>
                                                 <div className="flex items-center gap-1 ml-2">
                           <span className="text-xs text-gray-500">
                             {formatDate(email.date)}
                           </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMessageAction(email.id, email.labels.includes('STARRED') ? 'unstar' : 'star')
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400"
                          >
                            {email.labels.includes('STARRED') ? (
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                                             </div>
                     </div>
                   ))
                   )}
                 </div>
                
                {/* Pagination */}
                {hasNextPage && (
                  <div className="p-3 border-t border-zinc-700">
                    <Button
                      onClick={loadNextPage}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mr-2" />
                      )}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
