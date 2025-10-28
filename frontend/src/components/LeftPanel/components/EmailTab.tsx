import { 
  Mail, 
  Send, 
  Star, 
  StarOff, 
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Trash2,
  AlertCircle,
  Settings
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

import { EmailViewer } from '../../MiddlePanel/EmailViewer/EmailViewer'
import { Button } from '../../ui/button'
import { Input } from '../../ui/old-input'
import { Typography } from '../../ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { EmailService, GmailMessage, GmailMessageListResponse } from '../../../services/emailService'
import { ScopeService } from '../../../services/scopeService'

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
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'drafts' | 'starred'>('inbox')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [gmailAvailable, setGmailAvailable] = useState<boolean | null>(null)
  const [checkingGmailAccess, setCheckingGmailAccess] = useState(false)
  
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
    if (pageToken) {
      setIsLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const labelIds = activeTab === 'inbox' ? ['INBOX'] : activeTab === 'sent' ? ['SENT'] : activeTab === 'drafts' ? ['DRAFT'] : ['STARRED']
      const response = await EmailService.listMessages({
        maxResults: 20,
        labelIds,
        pageToken,
        q: query
      })
      
      // Load full message details in batch
      if (response.messages && response.messages.length > 0) {
        const messageIds = response.messages.map((msg: { id: string }) => msg.id)
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
      if (pageToken) {
        setIsLoadingMore(false)
      } else {
        setLoading(false)
      }
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

  // Check Gmail access
  const checkGmailAccess = useCallback(async () => {
    try {
      setCheckingGmailAccess(true)
      const isAvailable = await ScopeService.isFeatureAvailable('gmail')
      setGmailAvailable(isAvailable)
    } catch (error) {
      console.error('Error checking Gmail access:', error)
      setGmailAvailable(false)
    } finally {
      setCheckingGmailAccess(false)
    }
  }, [])

  // Request Gmail access
  const requestGmailAccess = useCallback(async () => {
    try {
      await ScopeService.requestFeatureAccess(['gmail'])
    } catch (error) {
      console.error('Error requesting Gmail access:', error)
    }
  }, [])

  // Parse messages when messages state changes
  useEffect(() => {
    if (messages.messages) {
      const parsed = messages.messages.map(msg => parseGmailMessage(msg))
      setParsedMessages(parsed)
    }
  }, [messages, parseGmailMessage])

  // Check Gmail access on component mount
  useEffect(() => {
    checkGmailAccess()
  }, [checkGmailAccess])

  // Load initial messages
  useEffect(() => {
    if (gmailAvailable) {
      loadMessages()
    }
  }, [loadMessages, activeTab, gmailAvailable])

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
  const handleTabChange = useCallback((tab: 'inbox' | 'sent' | 'drafts' | 'starred') => {
    setActiveTab(tab)
    setSelectedMessage(null)
    setMessages({})
    setParsedMessages([])
  }, [])

  // Handle search
  const handleSearch = useCallback(() => {
    loadMessages(undefined, searchQuery)
  }, [searchQuery, loadMessages])

  // Load more messages for infinite scroll
  const loadMoreMessages = useCallback(() => {
    if (messages.nextPageToken && !isLoadingMore) {
      loadMessages(messages.nextPageToken)
    }
  }, [messages.nextPageToken, isLoadingMore, loadMessages])

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100) { // Load when 100px from bottom
      loadMoreMessages()
    }
  }, [loadMoreMessages])

  return (
    <div className="h-full flex flex-col">
      {/* Email Tab Header */}
      <div className="flex flex-col bg-background flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <Select value={activeTab} onValueChange={(value) => handleTabChange(value as 'inbox' | 'sent' | 'drafts' | 'starred')}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">Inbox</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="drafts">Drafts</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadMessages()}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} strokeWidth={1} />
            </Button>
            <Button
              variant="default"
              size="icon"
              title="Compose"
              onClick={() => onComposeEmail ? onComposeEmail() : setComposeOpen(true)}
            >
              <Send />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar and Compose Button */}
      {/* <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700"> */}
        {/* <div className="flex gap-2"> */}
          {/* <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-zinc-900 border-zinc-700 text-white text-sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearch}
          >
            <Search className="h-3 w-3" />
          </Button> */}
        {/* </div> */}
      {/* </div> */}

      {/* Email Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {checkingGmailAccess ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin mr-2 text-gray-400 dark:text-gray-400" strokeWidth={1} />
            <Typography variant="muted">Checking Gmail access...</Typography>
          </div>
        ) : gmailAvailable === false ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Mail className="h-12 w-12 mb-4 opacity-50 text-gray-400 dark:text-gray-400" strokeWidth={1} />
            <Typography variant="h3" className="mb-2">Gmail Access Required</Typography>
            <Typography variant="small" className="text-center mb-4 max-w-md text-gray-500 dark:text-gray-400">
              To use the email features, you need to grant Gmail access to your Google account.
            </Typography>
            <Button
              onClick={requestGmailAccess}
              variant="default"
            >
              <Settings className="h-4 w-4 mr-2" strokeWidth={1} />
              Activate Gmail Access
            </Button>
          </div>
        ) : composeOpen ? (
          /* Compose Form */
          <div className="h-full flex flex-col p-4 overflow-y-auto min-w-0">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="small" className="font-medium">New Message</Typography>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComposeOpen(false)}
                className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1} />
              </Button>
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <Typography variant="small" className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">To</Typography>
                <Input
                  value={composeForm.to}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                  variant="primary"
                  placeholder="recipient@example.com"
                />
              </div>
              
              <div>
                <Typography variant="small" className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">Subject</Typography>
                <Input
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  variant="primary"
                  placeholder="Subject"
                />
              </div>
              
              <div className="flex-1">
                <Typography variant="small" className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">Message</Typography>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full h-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-gray-900 dark:text-white text-sm rounded p-2 resize-none"
                  placeholder="Write your message here..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={sendEmail}
                variant="default"
                disabled={!composeForm.to || !composeForm.subject || !composeForm.body}
              >
                <Send className="h-4 w-4 mr-2" strokeWidth={1} />
                Send
              </Button>
              <Button
                variant="outline"
                onClick={() => setComposeOpen(false)}
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
          <div className="h-full overflow-y-auto overflow-x-hidden" onScroll={handleScroll}>
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded m-2 flex-shrink-0">
                <Typography variant="small" className="text-red-700 dark:text-red-400">{error}</Typography>
              </div>
            )}
            {loading && !parsedMessages.length ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-4 w-4 animate-spin mr-2 text-gray-400 dark:text-gray-400" strokeWidth={1} />
                <Typography variant="muted">Loading emails...</Typography>
              </div>
            ) : (
              <>
                  {parsedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <Mail className="h-12 w-12 mb-4 opacity-50 text-gray-400 dark:text-gray-400" strokeWidth={1} />
                      <Typography variant="small" className="mb-2 text-gray-500 dark:text-gray-400">
                        {activeTab === 'inbox' ? 'No emails found' : 
                         activeTab === 'sent' ? 'No sent emails found' : 
                         activeTab === 'drafts' ? 'No drafts found' :
                         'No starred emails found'}
                      </Typography>
                      <Typography variant="muted" className="text-xs text-gray-400 dark:text-gray-500">
                        {activeTab === 'inbox' ? 'Your inbox is empty or try refreshing' :
                         activeTab === 'sent' ? 'You haven\'t sent any emails yet' :
                         activeTab === 'drafts' ? 'You don\'t have any saved drafts' :
                         'You haven\'t starred any emails yet'}
                      </Typography>
                    </div>
                  ) : (
                    <>
                      {parsedMessages.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => loadMessageDetails(email.id)}
                          className={`group p-3 border-b border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors min-w-0 ${
                            !email.isRead ? 'bg-zinc-50 dark:bg-zinc-800/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 min-w-0">
                                {!email.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                                <Typography variant="small" className={`font-medium truncate min-w-0 ${
                                  !email.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                  {email.isDraft ? 'Draft' : email.from}
                                </Typography>
                                {email.hasAttachments && (
                                  <Paperclip className="h-4 w-4 text-gray-400 dark:text-gray-400 flex-shrink-0" strokeWidth={1} />
                                )}
                              </div>
                              <Typography variant="small" className={`truncate mb-1 block ${
                                !email.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                              }`}>
                                {email.subject}
                              </Typography>
                              <Typography variant="muted" className="text-xs">
                                {email.snippet}
                              </Typography>
                            </div>
                            <div className="relative ml-2">
                              <Typography variant="muted" className="text-xs text-gray-400 dark:text-gray-500 group-hover:opacity-0 transition-opacity">
                                {formatDate(email.date)}
                              </Typography>
                               <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                 <Button
                                   variant="primary"
                                   size="sm"
                                   onClick={(e: React.MouseEvent) => {
                                     e.stopPropagation()
                                     handleMessageAction(email.id, email.labels.includes('STARRED') ? 'unstar' : 'star')
                                   }}
                                   className="h-6 w-6 p-0 text-gray-400 dark:text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-400"
                                 >
                                   {email.labels.includes('STARRED') ? (
                                     <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" strokeWidth={1} />
                                   ) : (
                                     <StarOff className="h-4 w-4" strokeWidth={1} />
                                   )}
                                 </Button>
                                 <Button
                                   variant="primary"
                                   size="sm"
                                   onClick={(e: React.MouseEvent) => {
                                     e.stopPropagation()
                                     handleMessageAction(email.id, 'delete')
                                   }}
                                   className="h-6 w-6 p-0 text-gray-400 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-400"
                                 >
                                   <Trash2 className="h-4 w-4" strokeWidth={1} />
                                 </Button>
                               </div>
                             </div>
                           </div>
                         </div>
                      ))}
                      
                      {/* Loading indicator for infinite scroll */}
                      {isLoadingMore && (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2 text-gray-400 dark:text-gray-400" strokeWidth={1} />
                          <Typography variant="muted">Loading more emails...</Typography>
                        </div>
                      )}
                    </>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
