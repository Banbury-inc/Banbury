import { 
  Mail, 
  Send, 
  Star, 
  StarOff, 
  RefreshCw,
  Paperclip,
  Trash2,
  Settings,
  Inbox,
  FileText,
  AlertTriangle,
  Tag,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Checkbox } from '../../ui/checkbox'
import { Button } from '../../ui/button'
import { Input } from '../../ui/old-input'
import { Typography } from '../../ui/typography'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../../ui/select'
import { GmailIcon, OutlookIcon } from '../../icons'
import { ApiService } from '../../../../backend/api/apiService'
import { GmailMessage, GmailMessageListResponse, GmailLabel, OutlookMessage, OutlookFolder } from '../../../../backend/api/emails/emails'
import { loadLabels as fetchLabels } from '../../LeftPanel/components/EmailTab/handlers/loadLabels'
import { checkOutlookConnectionStatus } from '../../handlers/outlook-connection'
import { PanelGroup } from '../../../pages/Workspaces/types'
import { loadNextBatch } from './handlers/loadNextBatch'
import { loadPreviousBatch } from './handlers/loadPreviousBatch'

type EmailProvider = 'gmail' | 'outlook'

interface EmailInboxViewerProps {
  provider?: 'gmail' | 'outlook'
  onEmailSelect?: (email: any) => void
  activePanelId: string
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>
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
  provider: EmailProvider
  isStarred?: boolean
}

type GmailHeader = { name: string; value: string }

// Helper to get label display name
function getLabelDisplayName(label: GmailLabel): string {
  const systemNameMap: Record<string, string> = {
    'INBOX': 'Inbox',
    'SENT': 'Sent',
    'DRAFT': 'Drafts',
    'STARRED': 'Starred',
    'SPAM': 'Spam',
    'TRASH': 'Trash',
    'IMPORTANT': 'Important',
    'UNREAD': 'Unread',
    'CATEGORY_PERSONAL': 'Personal',
    'CATEGORY_SOCIAL': 'Social',
    'CATEGORY_PROMOTIONS': 'Promotions',
    'CATEGORY_UPDATES': 'Updates',
    'CATEGORY_FORUMS': 'Forums',
  }
  return systemNameMap[label.id] || label.name
}

// Helper to get icon for system labels
function getLabelIcon(labelId: string) {
  switch (labelId) {
    case 'INBOX': return Inbox
    case 'SENT': return Send
    case 'DRAFT': return FileText
    case 'STARRED': return Star
    case 'SPAM': return AlertTriangle
    case 'TRASH': return Trash2
    case 'IMPORTANT': return Star
    default: return Tag
  }
}

export function EmailInboxViewer({ 
  provider: initialProvider,
  onEmailSelect,
  activePanelId,
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setSelectedEmail
}: EmailInboxViewerProps) {
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>(initialProvider || 'gmail')
  const [messages, setMessages] = useState<GmailMessageListResponse>({})
  const [parsedMessages, setParsedMessages] = useState<ParsedEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLabelId, setSelectedLabelId] = useState<string>('INBOX')
  const [labels, setLabels] = useState<GmailLabel[]>([])
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [gmailAvailable, setGmailAvailable] = useState<boolean | null>(null)
  const [checkingGmailAccess, setCheckingGmailAccess] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  
  // Outlook state
  const [outlookMessages, setOutlookMessages] = useState<OutlookMessage[]>([])
  const [outlookFolders, setOutlookFolders] = useState<OutlookFolder[]>([])
  const [outlookAvailable, setOutlookAvailable] = useState<boolean | null>(null)
  const [checkingOutlookAccess, setCheckingOutlookAccess] = useState(false)
  const [outlookNextPageToken, setOutlookNextPageToken] = useState<string | undefined>(undefined)
  
  // Batch navigation state
  const [batchHistory, setBatchHistory] = useState<Array<{
    messages: (GmailMessage | OutlookMessage)[]
    nextPageToken?: string
  }>>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined)

  // Separate labels into system and user labels
  const { systemLabels, userLabels } = useMemo(() => {
    const system: GmailLabel[] = []
    const user: GmailLabel[] = []
    const priorityOrder = ['INBOX', 'STARRED', 'SENT', 'DRAFT', 'IMPORTANT', 'SPAM', 'TRASH', 'UNREAD']
    
    for (const label of labels) {
      if (label.type === 'system') {
        if (label.id === 'CHAT' || label.id === 'CATEGORY_PERSONAL' && labels.some(l => l.id === 'INBOX')) continue
        system.push(label)
      } else {
        user.push(label)
      }
    }
    
    system.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.id)
      const bIdx = priorityOrder.indexOf(b.id)
      if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name)
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })
    
    user.sort((a, b) => a.name.localeCompare(b.name))
    
    return { systemLabels: system, userLabels: user }
  }, [labels])

  const selectedLabel = useMemo(() => {
    return labels.find(l => l.id === selectedLabelId) || { id: selectedLabelId, name: selectedLabelId, type: 'system' as const }
  }, [labels, selectedLabelId])

  // Format date for display - matches Gmail/Outlook style
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    // Today: show time like "1:29 PM"
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
    // This week: show day like "Mon"
    if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    // This year: show "Jan 28"
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    // Older: show "1/28/25"
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
  }, [])

  // Parse Gmail message
  const parseGmailMessage = useCallback((message: GmailMessage): ParsedEmail => {
    const headers = (message.payload?.headers as GmailHeader[]) || []
    const getHeader = (name: string) => headers.find((h: GmailHeader) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    
    const isSentEmail = selectedLabelId === 'SENT'
    const isDraft = selectedLabelId === 'DRAFT' || (message.labelIds?.includes('DRAFT') ?? false)
    
    const hasAttachments = (payload: any): boolean => {
      if (!payload) return false
      if (payload.filename) return true
      if (payload.parts) {
        return payload.parts.some((part: any) => hasAttachments(part))
      }
      return false
    }
    
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
      isDraft,
      provider: 'gmail',
      isStarred: message.labelIds?.includes('STARRED') ?? false
    }
  }, [selectedLabelId])

  // Parse Outlook message
  const parseOutlookMessage = useCallback((message: OutlookMessage): ParsedEmail => {
    const isSentEmail = selectedLabelId.toLowerCase() === 'sentitems'
    const isDraft = selectedLabelId.toLowerCase() === 'drafts'
    
    let fromStr = 'Unknown'
    if (message.from?.emailAddress) {
      fromStr = message.from.emailAddress.name || message.from.emailAddress.address
    }
    
    let toStr = ''
    if (message.toRecipients?.length) {
      toStr = message.toRecipients.map(r => r.emailAddress?.name || r.emailAddress?.address || '').join(', ')
    }
    
    let dateString = 'Unknown'
    const dateSource = message.receivedDateTime || message.sentDateTime
    if (dateSource) {
      try {
        const date = new Date(dateSource)
        if (!isNaN(date.getTime())) {
          dateString = date.toLocaleString()
        }
      } catch (e) {
        console.error('Failed to parse date:', dateSource)
      }
    }
    
    const isStarred = message.flag?.flagStatus === 'flagged'
    
    return {
      id: message.id,
      threadId: message.conversationId || message.id,
      subject: message.subject || '(No Subject)',
      from: isSentEmail ? 'You' : fromStr,
      to: toStr,
      date: dateString,
      snippet: message.bodyPreview || '',
      isRead: message.isRead ?? true,
      hasAttachments: message.hasAttachments ?? false,
      labels: [],
      isDraft,
      provider: 'outlook',
      isStarred
    }
  }, [selectedLabelId])

  // Thread count calculation
  const threadCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const email of parsedMessages) {
      if (email.threadId) {
        counts.set(email.threadId, (counts.get(email.threadId) || 0) + 1)
      }
    }
    return counts
  }, [parsedMessages])

  // Load messages
  const loadMessages = useCallback(async () => {
    if (selectedProvider === 'gmail') {
      setLoading(true)
      setError(null)
      try {
        const response = await ApiService.Emails.listMessages({ 
          labelIds: [selectedLabelId], 
          maxResults: 50 
        })
        
        // Load full message details in batch
        if (response.messages && response.messages.length > 0) {
          const messageIds = response.messages.map((msg: { id: string }) => msg.id)
          try {
            const batchResponse = await ApiService.Emails.getMessagesBatch(messageIds)
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
            
            setMessages({
              ...response,
              messages: fullMessages
            })
            const parsed = fullMessages.map(parseGmailMessage)
            setParsedMessages(parsed)
            
            // Reset batch history and save first batch
            setBatchHistory([{
              messages: fullMessages,
              nextPageToken: response.nextPageToken
            }])
            setCurrentBatchIndex(0)
            setNextPageToken(response.nextPageToken)
          } catch (batchError) {
            console.error('Failed to load messages in batch:', batchError)
            // Fallback to individual requests if batch fails
            const fullMessages: GmailMessage[] = []
            for (const msg of response.messages) {
              try {
                const fullMessage = await ApiService.Emails.getMessage(msg.id)
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
            
            setMessages({
              ...response,
              messages: fullMessages
            })
            const parsed = fullMessages.map(parseGmailMessage)
            setParsedMessages(parsed)
            
            // Reset batch history and save first batch
            setBatchHistory([{
              messages: fullMessages,
              nextPageToken: response.nextPageToken
            }])
            setCurrentBatchIndex(0)
            setNextPageToken(response.nextPageToken)
          }
        } else {
          setMessages(response)
          setParsedMessages([])
          setBatchHistory([])
          setCurrentBatchIndex(0)
          setNextPageToken(undefined)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load messages')
        setParsedMessages([])
        setBatchHistory([])
        setCurrentBatchIndex(0)
        setNextPageToken(undefined)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      setError(null)
      try {
        const response = await ApiService.Emails.listOutlookMessages({ 
          folderId: selectedLabelId, 
          maxResults: 50 
        })
        
        if (response.messages && response.messages.length > 0) {
          // Get full message details in batch
          const messageIds = response.messages.map((msg: OutlookMessage) => msg.id)
          try {
            const batchResponse = await ApiService.Emails.getOutlookMessagesBatch(messageIds)
            const fullMessages: OutlookMessage[] = []
            
            for (const msg of response.messages) {
              const fullMessage = batchResponse.messages[msg.id]
              if (fullMessage && !('error' in fullMessage)) {
                fullMessages.push(fullMessage)
              } else {
                // Add partial message if batch fails
                fullMessages.push(msg)
              }
            }
            
            setOutlookMessages(fullMessages)
            setOutlookNextPageToken(response.nextPageToken)
            const parsed = fullMessages.map(parseOutlookMessage)
            setParsedMessages(parsed)
            
            // Reset batch history and save first batch
            setBatchHistory([{
              messages: fullMessages,
              nextPageToken: response.nextPageToken
            }])
            setCurrentBatchIndex(0)
            setNextPageToken(response.nextPageToken)
          } catch (batchError) {
            console.error('Failed to load Outlook messages in batch:', batchError)
            // Use the list response directly
            setOutlookMessages(response.messages)
            setOutlookNextPageToken(response.nextPageToken)
            const parsed = response.messages.map(parseOutlookMessage)
            setParsedMessages(parsed)
            
            // Reset batch history and save first batch
            setBatchHistory([{
              messages: response.messages,
              nextPageToken: response.nextPageToken
            }])
            setCurrentBatchIndex(0)
            setNextPageToken(response.nextPageToken)
          }
        } else {
          setOutlookMessages([])
          setOutlookNextPageToken(undefined)
          setParsedMessages([])
          setBatchHistory([])
          setCurrentBatchIndex(0)
          setNextPageToken(undefined)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load messages')
        setParsedMessages([])
        setBatchHistory([])
        setCurrentBatchIndex(0)
        setNextPageToken(undefined)
      } finally {
        setLoading(false)
      }
    }
  }, [selectedProvider, selectedLabelId, parseGmailMessage, parseOutlookMessage])

  // Load labels
  useEffect(() => {
    if (selectedProvider === 'gmail') {
      fetchLabels({ setLabels, setLabelsLoading, setError })
    } else {
      setLabelsLoading(true)
      ApiService.Emails.getOutlookFolders()
        .then(response => {
          setOutlookFolders(response.folders || [])
          if (response.folders && response.folders.length > 0) {
            setSelectedLabelId(response.folders[0].id)
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLabelsLoading(false))
    }
  }, [selectedProvider])

  // Load messages when label changes
  useEffect(() => {
    if (selectedLabelId) {
      loadMessages()
    }
  }, [selectedLabelId, loadMessages])

  // Check availability
  useEffect(() => {
    if (selectedProvider === 'gmail') {
      setCheckingGmailAccess(true)
      ApiService.Emails.checkGmailConnection()
        .then(() => setGmailAvailable(true))
        .catch(() => setGmailAvailable(false))
        .finally(() => setCheckingGmailAccess(false))
    } else {
      setCheckingOutlookAccess(true)
      checkOutlookConnectionStatus()
        .then(connected => setOutlookAvailable(connected))
        .catch(() => setOutlookAvailable(false))
        .finally(() => setCheckingOutlookAccess(false))
    }
  }, [selectedProvider])

  const loadMessageDetails = useCallback(async (messageId: string, provider: EmailProvider) => {
    if (onEmailSelect) {
      const email = parsedMessages.find(e => e.id === messageId)
      if (email) {
        let fullEmail: any
        if (provider === 'gmail') {
          fullEmail = await ApiService.Emails.getMessage(messageId)
        } else {
          fullEmail = await ApiService.Emails.getOutlookMessage(messageId)
        }
        onEmailSelect(fullEmail)
      }
    }
  }, [parsedMessages, onEmailSelect])

  const handleMessageAction = useCallback(async (messageId: string, action: 'star' | 'unstar' | 'delete', provider: EmailProvider) => {
    try {
      if (provider === 'gmail') {
        if (action === 'star') {
          await ApiService.Emails.addLabels(messageId, ['STARRED'])
        } else if (action === 'unstar') {
          await ApiService.Emails.removeLabels(messageId, ['STARRED'])
        } else if (action === 'delete') {
          await ApiService.Emails.deleteMessage(messageId)
        }
      } else {
        if (action === 'star') {
          await ApiService.Emails.flagOutlookMessage(messageId, true)
        } else if (action === 'unstar') {
          await ApiService.Emails.flagOutlookMessage(messageId, false)
        } else if (action === 'delete') {
          await ApiService.Emails.deleteOutlookMessage(messageId)
        }
      }
      loadMessages()
    } catch (err: any) {
      setError(err.message || 'Failed to perform action')
    }
  }, [loadMessages])

  const isAvailable = selectedProvider === 'gmail' ? gmailAvailable : outlookAvailable
  const isChecking = selectedProvider === 'gmail' ? checkingGmailAccess : checkingOutlookAccess

  // Handle email selection
  const toggleEmailSelection = useCallback((emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedEmails.size === parsedMessages.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(parsedMessages.map(e => e.id)))
    }
  }, [parsedMessages, selectedEmails.size])

  const allSelected = parsedMessages.length > 0 && selectedEmails.size === parsedMessages.length

  // Handle next batch
  const handleNextBatch = useCallback(async () => {
    if (!nextPageToken || isLoadingMore || loading) return

    await loadNextBatch({
      selectedProvider,
      selectedLabelId,
      nextPageToken,
      setIsLoadingMore,
      setError,
      onSuccess: (data) => {
        const newMessages = data.messages
        
        // Parse messages based on provider
        let parsed: ParsedEmail[]
        if (selectedProvider === 'gmail') {
          parsed = (newMessages as GmailMessage[]).map(parseGmailMessage)
          setMessages({ messages: newMessages as GmailMessage[] })
        } else {
          parsed = (newMessages as OutlookMessage[]).map(parseOutlookMessage)
          setOutlookMessages(newMessages as OutlookMessage[])
          setOutlookNextPageToken(data.nextPageToken)
        }
        
        setParsedMessages(parsed)
        setNextPageToken(data.nextPageToken)
        
        // Add to batch history if moving forward from current position
        if (currentBatchIndex === batchHistory.length - 1) {
          setBatchHistory(prev => [...prev, {
            messages: newMessages,
            nextPageToken: data.nextPageToken
          }])
          setCurrentBatchIndex(prev => prev + 1)
        } else {
          // Moving forward through existing history
          setCurrentBatchIndex(prev => prev + 1)
        }
      }
    })
  }, [
    nextPageToken,
    isLoadingMore,
    loading,
    selectedProvider,
    selectedLabelId,
    parseGmailMessage,
    parseOutlookMessage,
    currentBatchIndex,
    batchHistory.length
  ])

  // Handle previous batch
  const handlePreviousBatch = useCallback(() => {
    if (currentBatchIndex <= 0 || loading || isLoadingMore) return

    loadPreviousBatch({
      batchHistory,
      currentBatchIndex,
      setCurrentBatchIndex,
      onSuccess: (data) => {
        const prevMessages = data.messages
        
        // Parse messages based on provider
        let parsed: ParsedEmail[]
        if (selectedProvider === 'gmail') {
          parsed = (prevMessages as GmailMessage[]).map(parseGmailMessage)
          setMessages({ messages: prevMessages as GmailMessage[] })
        } else {
          parsed = (prevMessages as OutlookMessage[]).map(parseOutlookMessage)
          setOutlookMessages(prevMessages as OutlookMessage[])
          setOutlookNextPageToken(data.nextPageToken)
        }
        
        setParsedMessages(parsed)
        setNextPageToken(data.nextPageToken)
      }
    })
  }, [
    currentBatchIndex,
    loading,
    isLoadingMore,
    batchHistory,
    selectedProvider,
    parseGmailMessage,
    parseOutlookMessage
  ])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Only handle if not typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNextBatch()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePreviousBatch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextBatch, handlePreviousBatch])

  return (
    <div className="h-full w-full flex flex-col bg-card">
      {/* Provider and Label Selectors */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-muted/30">
        <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as EmailProvider)}>
          <SelectTrigger className="w-[180px] text-xs text-muted-foreground" size="xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Email Provider</SelectLabel>
              <SelectItem value="gmail">
                <div className="flex items-center gap-2">
                  <GmailIcon className="h-4 w-4" />
                  Gmail
                </div>
              </SelectItem>
              <SelectItem value="outlook">
                <div className="flex items-center gap-2">
                  <OutlookIcon className="h-4 w-4" />
                  Outlook
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="xs"
          onClick={loadMessages}
          disabled={loading || !isAvailable}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
        </Button>

        <div className="flex-1" />

        {/* Batch Navigation */}
        {parsedMessages.length > 0 && (
          <div className="flex items-center gap-2">
            <Typography variant="muted" className="text-xs">
              {currentBatchIndex + 1}/{batchHistory.length}
            </Typography>
            <Button
              variant="ghost"
              size="xs"
              onClick={handlePreviousBatch}
              disabled={currentBatchIndex <= 0 || loading || isLoadingMore}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleNextBatch}
              disabled={!nextPageToken || loading || isLoadingMore}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {selectedProvider === 'gmail' && systemLabels.length > 0 && (
          <Select value={selectedLabelId} onValueChange={setSelectedLabelId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Folders</SelectLabel>
                {systemLabels.map(label => {
                  const Icon = getLabelIcon(label.id)
                  return (
                    <SelectItem key={label.id} value={label.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {getLabelDisplayName(label)}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectGroup>
              {userLabels.length > 0 && (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Labels</SelectLabel>
                    {userLabels.map(label => (
                      <SelectItem key={label.id} value={label.id}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {label.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>
        )}

        {selectedProvider === 'outlook' && outlookFolders.length > 0 && (
          <Select value={selectedLabelId} onValueChange={setSelectedLabelId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Folders</SelectLabel>
                {outlookFolders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      {folder.displayName}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {isChecking ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <Typography variant="muted">Checking connection...</Typography>
          </div>
        ) : !isAvailable ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Mail className="h-12 w-12 mb-4 opacity-50" />
            <Typography variant="small" className="mb-2">
              {selectedProvider === 'gmail' ? 'Gmail' : 'Outlook'} not connected
            </Typography>
            <Typography variant="muted" className="text-xs">
              Please connect your account in settings
            </Typography>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <Typography variant="muted">Loading emails...</Typography>
          </div>
        ) : parsedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Mail className="h-12 w-12 mb-4 opacity-50" />
            <Typography variant="small" className="mb-2">
              No emails in {getLabelDisplayName(selectedLabel)}
            </Typography>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {parsedMessages.map((email) => {
              const isStarred = email.provider === 'gmail' ? email.labels.includes('STARRED') : email.isStarred
              const isSelected = selectedEmails.has(email.id)
              
              return (
                <div
                  key={email.id}
                  className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !email.isRead ? 'bg-muted/20' : ''
                  } ${isSelected ? 'bg-muted/40' : ''}`}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleEmailSelection(email.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0"
                  />
                  
                  {/* Star Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMessageAction(email.id, isStarred ? 'unstar' : 'star', email.provider)
                    }}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isStarred ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" strokeWidth={1.5} />
                    ) : (
                      <Star className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                  
                  {/* Email Content */}
                  <div 
                    className="flex-1 min-w-0 flex items-center gap-4"
                    onClick={() => loadMessageDetails(email.id, email.provider)}
                  >
                    {/* Sender & Flag Icon */}
                    <div className="w-48 flex-shrink-0 flex items-center gap-2">
                      {email.provider === 'gmail' && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                      )}
                      {email.provider === 'outlook' && (
                        <ChevronRight className="h-3 w-3 text-blue-500 flex-shrink-0" strokeWidth={1.5} />
                      )}
                      <Typography 
                        variant="small" 
                        className={`truncate ${!email.isRead ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}`}
                      >
                        {email.isDraft ? 'Draft' : email.from}
                      </Typography>
                    </div>
                    
                    {/* Subject & Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <Typography 
                          variant="small" 
                          className={`truncate ${!email.isRead ? 'font-semibold text-foreground' : 'font-normal text-foreground'}`}
                        >
                          {email.subject}
                        </Typography>
                        <Typography 
                          variant="muted" 
                          className="text-xs truncate flex-shrink"
                        >
                          - {email.snippet}
                        </Typography>
                      </div>
                    </div>
                    
                    {/* Metadata (Attachments, Date) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {email.hasAttachments && (
                        <Paperclip className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      )}
                      <Typography variant="muted" className="text-xs w-16 text-right">
                        {formatDate(email.date)}
                      </Typography>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <Typography variant="muted">Loading more emails...</Typography>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
