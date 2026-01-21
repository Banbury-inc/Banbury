import { 
  Mail, 
  Send, 
  Star, 
  StarOff, 
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Trash2,
  Settings,
  Inbox,
  FileText,
  AlertTriangle,
  Tag
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'

import { EmailViewer } from '../../MiddlePanel/EmailViewer/EmailViewer'
import { Button } from '../../ui/button'
import { Input } from '../../ui/old-input'
import { Typography } from '../../ui/typography'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../../ui/select'
import { GmailIcon, OutlookIcon } from '../../icons'
import { ApiService } from '../../../../backend/api/apiService'
import { GmailMessage, GmailMessageListResponse, GmailLabel, OutlookMessage, OutlookFolder } from '../../../../backend/api/emails/emails'
import { loadLabels as fetchLabels } from './handlers/loadLabels'
import { checkOutlookConnectionStatus } from '../../handlers/outlook-connection'

type EmailProvider = 'gmail' | 'outlook'

interface EmailTabProps {
  onOpenEmailApp?: () => void
  onMessageSelect?: (message: GmailMessage | OutlookMessage, provider: EmailProvider) => void
  onComposeEmail?: () => void
  demoMode?: boolean
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
  // For system labels, use friendlier names
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

export function EmailTab({ onMessageSelect, onComposeEmail, demoMode = false }: EmailTabProps) {
  // Provider state
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>('gmail')

  // Gmail state
  const [messages, setMessages] = useState<GmailMessageListResponse>({})
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | OutlookMessage | null>(null)
  const [parsedMessages, setParsedMessages] = useState<ParsedEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLabelId, setSelectedLabelId] = useState<string>('INBOX')
  const [labels, setLabels] = useState<GmailLabel[]>([])
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [gmailAvailable, setGmailAvailable] = useState<boolean | null>(demoMode ? true : null)
  const [checkingGmailAccess, setCheckingGmailAccess] = useState(false)
  
  // Outlook state
  const [outlookMessages, setOutlookMessages] = useState<OutlookMessage[]>([])
  const [outlookFolders, setOutlookFolders] = useState<OutlookFolder[]>([])
  const [outlookAvailable, setOutlookAvailable] = useState<boolean | null>(null)
  const [checkingOutlookAccess, setCheckingOutlookAccess] = useState(false)
  const [outlookNextPageToken, setOutlookNextPageToken] = useState<string | undefined>(undefined)
  
  // Compose form state
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    body: ''
  })

  // Separate labels into system and user labels
  const { systemLabels, userLabels } = useMemo(() => {
    const system: GmailLabel[] = []
    const user: GmailLabel[] = []
    // Priority order for system labels
    const priorityOrder = ['INBOX', 'STARRED', 'SENT', 'DRAFT', 'IMPORTANT', 'SPAM', 'TRASH', 'UNREAD']
    
    for (const label of labels) {
      if (label.type === 'system') {
        // Skip hidden/internal system labels
        if (label.id === 'CHAT' || label.id === 'CATEGORY_PERSONAL' && labels.some(l => l.id === 'INBOX')) continue
        system.push(label)
      } else {
        user.push(label)
      }
    }
    
    // Sort system labels by priority
    system.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.id)
      const bIdx = priorityOrder.indexOf(b.id)
      if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name)
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })
    
    // Sort user labels alphabetically
    user.sort((a, b) => a.name.localeCompare(b.name))
    
    return { systemLabels: system, userLabels: user }
  }, [labels])

  // Get the currently selected label object
  const selectedLabel = useMemo(() => {
    return labels.find(l => l.id === selectedLabelId) || { id: selectedLabelId, name: selectedLabelId, type: 'system' as const }
  }, [labels, selectedLabelId])

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
    const isSentEmail = selectedLabelId === 'SENT'
    const isDraft = selectedLabelId === 'DRAFT' || (message.labelIds?.includes('DRAFT') ?? false)
    
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
      isDraft,
      provider: 'gmail',
      isStarred: message.labelIds?.includes('STARRED') ?? false
    }
  }, [selectedLabelId])

  // Parse Outlook message into readable format
  const parseOutlookMessage = useCallback((message: OutlookMessage): ParsedEmail => {
    const isSentEmail = selectedLabelId.toLowerCase() === 'sentitems'
    const isDraft = selectedLabelId.toLowerCase() === 'drafts'
    
    // Format from address
    let fromStr = 'Unknown'
    if (message.from?.emailAddress) {
      fromStr = message.from.emailAddress.name || message.from.emailAddress.address
    }
    
    // Format to addresses
    let toStr = ''
    if (message.toRecipients?.length) {
      toStr = message.toRecipients.map(r => r.emailAddress?.name || r.emailAddress?.address || '').join(', ')
    }
    
    // Handle date parsing
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
    
    // Check if flagged (Outlook equivalent of starred)
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
      labels: [], // Outlook uses folders, not labels
      isDraft,
      provider: 'outlook',
      isStarred
    }
  }, [selectedLabelId])

  // Load labels from Gmail API
  const loadLabels = useCallback(async () => {
    setLabelsLoading(true)
    try {
      const labelsResult = await fetchLabels()
      setLabels(labelsResult)
    } finally {
      setLabelsLoading(false)
    }
  }, [])

  // Load folders from Outlook API
  const loadOutlookFolders = useCallback(async () => {
    setLabelsLoading(true)
    try {
      const response = await ApiService.Emails.listOutlookFolders()
      setOutlookFolders(response.folders || [])
    } catch (err) {
      console.error('Failed to load Outlook folders:', err)
    } finally {
      setLabelsLoading(false)
    }
  }, [])

  // Load Outlook messages
  const loadOutlookMessages = useCallback(async (pageToken?: string, query?: string) => {
    if (pageToken) {
      setIsLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const response = await ApiService.Emails.listOutlookMessages({
        folderId: selectedLabelId,
        maxResults: 20,
        pageToken,
        q: query
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
          
          if (pageToken) {
            setOutlookMessages(prev => [...prev, ...fullMessages])
          } else {
            setOutlookMessages(fullMessages)
          }
          setOutlookNextPageToken(response.nextPageToken)
        } catch (batchError) {
          console.error('Failed to load Outlook messages in batch:', batchError)
          // Use the list response directly
          if (pageToken) {
            setOutlookMessages(prev => [...prev, ...response.messages])
          } else {
            setOutlookMessages(response.messages)
          }
          setOutlookNextPageToken(response.nextPageToken)
        }
      } else {
        if (!pageToken) {
          setOutlookMessages([])
        }
        setOutlookNextPageToken(undefined)
      }
    } catch (err) {
      console.error('Failed to load Outlook messages:', err)
      setError('Failed to load Outlook emails. Please check your connection.')
    } finally {
      if (pageToken) {
        setIsLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }, [selectedLabelId])

  // Load messages
  const loadMessages = useCallback(async (pageToken?: string, query?: string) => {
    if (pageToken) {
      setIsLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const response = await ApiService.Emails.listMessages({
        maxResults: 20,
        labelIds: [selectedLabelId],
        pageToken,
        q: query
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
  }, [selectedLabelId])

  // Load full message details
  const loadMessageDetails = useCallback(async (messageId: string, provider: EmailProvider = 'gmail') => {
    try {
      if (provider === 'outlook') {
        const message = await ApiService.Emails.getOutlookMessage(messageId)
        
        // Mark as read if unread
        if (!message.isRead) {
          await ApiService.Emails.modifyOutlookMessage(messageId, { isRead: true })
        }
        
        if (onMessageSelect) {
          onMessageSelect(message, 'outlook')
        } else {
          setSelectedMessage(message)
        }
      } else {
        const message = await ApiService.Emails.getMessage(messageId)
        
        // Mark as read if unread
        if (message.labelIds?.includes('UNREAD')) {
          await ApiService.Emails.modifyMessage(messageId, {
            removeLabelIds: ['UNREAD']
          })
        }
        
        if (onMessageSelect) {
          onMessageSelect(message, 'gmail')
        } else {
          setSelectedMessage(message)
        }
      }
    } catch (error) {
      console.error('Failed to load message details:', error)
    }
  }, [onMessageSelect])

  // Send email
  const sendEmail = useCallback(async () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) return
    
    try {
      await ApiService.Emails.sendMessage({
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
  const handleMessageAction = useCallback(async (messageId: string, action: string, provider: EmailProvider = 'gmail') => {
    try {
      if (provider === 'outlook') {
        switch (action) {
          case 'archive':
            await ApiService.Emails.modifyOutlookMessage(messageId, {
              action: 'move',
              destinationFolderId: 'archive'
            })
            break
          case 'delete':
            await ApiService.Emails.modifyOutlookMessage(messageId, {
              action: 'delete'
            })
            break
          case 'star':
            await ApiService.Emails.modifyOutlookMessage(messageId, {
              flag: 'flagged'
            })
            break
          case 'unstar':
            await ApiService.Emails.modifyOutlookMessage(messageId, {
              flag: 'notFlagged'
            })
            break
        }
        loadOutlookMessages()
      } else {
        switch (action) {
          case 'archive':
            await ApiService.Emails.modifyMessage(messageId, {
              removeLabelIds: ['INBOX']
            })
            break
          case 'delete':
            await ApiService.Emails.modifyMessage(messageId, {
              addLabelIds: ['TRASH']
            })
            break
          case 'star':
            await ApiService.Emails.modifyMessage(messageId, {
              addLabelIds: ['STARRED']
            })
            break
          case 'unstar':
            await ApiService.Emails.modifyMessage(messageId, {
              removeLabelIds: ['STARRED']
            })
            break
          case 'edit':
            // TODO: Implement draft editing - open in composer
            break
          case 'send':
            // TODO: Implement draft sending
            break
        }
        loadMessages()
      }
    } catch (error) {
      console.error('Failed to perform message action:', error)
    }
  }, [loadMessages, loadOutlookMessages])

  // Check Gmail access
  const checkGmailAccess = useCallback(async () => {
    try {
      setCheckingGmailAccess(true)
      const isAvailable = await ApiService.Scopes.isFeatureAvailable('gmail')
      setGmailAvailable(isAvailable)
    } catch (error) {
      console.error('Error checking Gmail access:', error)
      setGmailAvailable(false)
    } finally {
      setCheckingGmailAccess(false)
    }
  }, [])

  // Check Outlook access
  const checkOutlookAccess = useCallback(async () => {
    try {
      setCheckingOutlookAccess(true)
      const status = await checkOutlookConnectionStatus()
      setOutlookAvailable(status.connected)
    } catch (error) {
      console.error('Error checking Outlook access:', error)
      setOutlookAvailable(false)
    } finally {
      setCheckingOutlookAccess(false)
    }
  }, [])

  // Request Gmail access
  const requestGmailAccess = useCallback(async () => {
    try {
      await ApiService.Scopes.requestFeatureAccess(['gmail'])
    } catch (error) {
      console.error('Error requesting Gmail access:', error)
    }
  }, [])

  // Parse messages when messages state changes
  useEffect(() => {
    if (selectedProvider === 'outlook') {
      if (outlookMessages.length > 0) {
        const parsed = outlookMessages.map(msg => parseOutlookMessage(msg))
        setParsedMessages(parsed)
      } else {
        setParsedMessages([])
      }
    } else {
      if (messages.messages) {
        const parsed = messages.messages.map(msg => parseGmailMessage(msg))
        setParsedMessages(parsed)
      } else {
        setParsedMessages([])
      }
    }
  }, [messages, outlookMessages, selectedProvider, parseGmailMessage, parseOutlookMessage])

  // Calculate thread counts for each email
  const threadCounts = useMemo(() => {
    const counts = new Map<string, number>()
    parsedMessages.forEach(email => {
      if (email.threadId) {
        counts.set(email.threadId, (counts.get(email.threadId) || 0) + 1)
      }
    })
    return counts
  }, [parsedMessages])

  // Check email access on component mount (skip in demo mode)
  useEffect(() => {
    if (demoMode) return
    checkGmailAccess()
    checkOutlookAccess()
  }, [checkGmailAccess, checkOutlookAccess, demoMode])

  // Load labels/folders when provider is available
  useEffect(() => {
    if (selectedProvider === 'outlook' && outlookAvailable) {
      loadOutlookFolders()
    } else if (selectedProvider === 'gmail' && gmailAvailable) {
      loadLabels()
    }
  }, [selectedProvider, gmailAvailable, outlookAvailable, loadLabels, loadOutlookFolders])

  // Load initial messages when label/folder changes
  useEffect(() => {
    if (selectedProvider === 'outlook' && outlookAvailable) {
      loadOutlookMessages()
    } else if (selectedProvider === 'gmail' && gmailAvailable) {
      loadMessages()
    }
  }, [loadMessages, loadOutlookMessages, selectedLabelId, selectedProvider, gmailAvailable, outlookAvailable])

  // Reset selected label when provider changes
  useEffect(() => {
    if (selectedProvider === 'outlook') {
      setSelectedLabelId('inbox')
    } else {
      setSelectedLabelId('INBOX')
    }
    setSelectedMessage(null)
    setParsedMessages([])
  }, [selectedProvider])

  // Listen for label refresh events (when a label is created in the viewer)
  useEffect(() => {
    const handler = () => {
      loadLabels()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('gmail-labels-refresh', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gmail-labels-refresh', handler)
      }
    }
  }, [loadLabels])

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

  // Handle label selection change
  const handleLabelChange = useCallback((labelId: string) => {
    setSelectedLabelId(labelId)
    setSelectedMessage(null)
    if (selectedProvider === 'outlook') {
      setOutlookMessages([])
    } else {
      setMessages({})
    }
    setParsedMessages([])
  }, [selectedProvider])

  // Handle provider change
  const handleProviderChange = useCallback((provider: EmailProvider) => {
    setSelectedProvider(provider)
  }, [])

  // Handle search
  const handleSearch = useCallback(() => {
    loadMessages(undefined, searchQuery)
  }, [searchQuery, loadMessages])

  // Load more messages for infinite scroll
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore) return
    
    if (selectedProvider === 'outlook' && outlookNextPageToken) {
      loadOutlookMessages(outlookNextPageToken)
    } else if (selectedProvider === 'gmail' && messages.nextPageToken) {
      loadMessages(messages.nextPageToken)
    }
  }, [selectedProvider, messages.nextPageToken, outlookNextPageToken, isLoadingMore, loadMessages, loadOutlookMessages])

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100) { // Load when 100px from bottom
      loadMoreMessages()
    }
  }, [loadMoreMessages])

  // Get display name for Outlook folders
  const getOutlookFolderDisplayName = (folder: OutlookFolder): string => {
    const nameMap: Record<string, string> = {
      'inbox': 'Inbox',
      'sentitems': 'Sent Items',
      'drafts': 'Drafts',
      'deleteditems': 'Deleted Items',
      'junkemail': 'Junk Email',
      'archive': 'Archive',
      'outbox': 'Outbox',
    }
    return nameMap[folder.name.toLowerCase()] || folder.name
  }

  // Get icon for Outlook folders
  const getOutlookFolderIcon = (folderId: string) => {
    const lowerName = folderId.toLowerCase()
    if (lowerName.includes('inbox')) return Inbox
    if (lowerName.includes('sent')) return Send
    if (lowerName.includes('draft')) return FileText
    if (lowerName.includes('deleted') || lowerName.includes('trash')) return Trash2
    if (lowerName.includes('junk') || lowerName.includes('spam')) return AlertTriangle
    return Tag
  }

  // Determine which folders/labels to show based on provider
  const { displayedSystemFolders, displayedUserFolders } = useMemo(() => {
    if (selectedProvider === 'outlook') {
      const systemFolders = outlookFolders.filter(f => f.type === 'system')
      const userFolders = outlookFolders.filter(f => f.type === 'user')
      return { displayedSystemFolders: systemFolders, displayedUserFolders: userFolders }
    } else {
      return { displayedSystemFolders: systemLabels, displayedUserFolders: userLabels }
    }
  }, [selectedProvider, outlookFolders, systemLabels, userLabels])

  // Check if any provider is available
  const anyProviderAvailable = gmailAvailable || outlookAvailable
  const isCheckingAccess = checkingGmailAccess || checkingOutlookAccess
  const currentProviderAvailable = selectedProvider === 'gmail' ? gmailAvailable : outlookAvailable

  return (
    <div className="h-full flex flex-col">
      {/* Email Tab Header */}
      <div className="flex flex-col bg-card flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 @container">
            {/* Provider Selector */}
            <Select value={selectedProvider} onValueChange={(v) => handleProviderChange(v as EmailProvider)}>
              <SelectTrigger size="xs" className="min-w-0 w-auto">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedProvider === 'gmail' ? (
                      <GmailIcon size={14} className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <OutlookIcon size={14} className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline">
                      {selectedProvider === 'gmail' ? 'Gmail' : 'Outlook'}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail" disabled={!gmailAvailable}>
                  <div className="flex items-center gap-2">
                    <GmailIcon size={14} className="h-3.5 w-3.5" />
                    <Typography variant="xs" className="font-medium">Gmail</Typography>
                  </div>
                </SelectItem>
                <SelectItem value="outlook" disabled={!outlookAvailable}>
                  <div className="flex items-center gap-2">
                    <OutlookIcon size={14} className="h-3.5 w-3.5" />
                    <Typography variant="xs" className="font-medium">Outlook</Typography>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Label/Folder Navigation */}
            <Select value={selectedLabelId} onValueChange={handleLabelChange}>
              <SelectTrigger size="xs" className="min-w-0 w-auto">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      if (selectedProvider === 'outlook') {
                        const Icon = getOutlookFolderIcon(selectedLabelId)
                        return <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                      }
                      const Icon = getLabelIcon(selectedLabelId)
                      return <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                    })()}
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline">
                      {selectedProvider === 'outlook' 
                        ? (outlookFolders.find(f => f.id === selectedLabelId)?.name || selectedLabelId)
                        : getLabelDisplayName(selectedLabel)}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {labelsLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <RefreshCw className="h-3 w-3 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
                    <Typography variant="xs" className="text-muted-foreground">Loading...</Typography>
                  </div>
                ) : selectedProvider === 'outlook' ? (
                  <>
                    {/* Outlook Folders */}
                    <SelectGroup>
                      <SelectLabel>Folders</SelectLabel>
                      {displayedSystemFolders.map((folder) => {
                        const outlookFolder = folder as OutlookFolder
                        const Icon = getOutlookFolderIcon(outlookFolder.id)
                        return (
                          <SelectItem key={outlookFolder.id} value={outlookFolder.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                              <Typography variant="xs" className="font-medium">{getOutlookFolderDisplayName(outlookFolder)}</Typography>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectGroup>
                    {displayedUserFolders.length > 0 && (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Custom Folders</SelectLabel>
                          {displayedUserFolders.map((folder) => {
                            const outlookFolder = folder as OutlookFolder
                            return (
                              <SelectItem key={outlookFolder.id} value={outlookFolder.id}>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                                  <Typography variant="xs" className="font-medium">{outlookFolder.name}</Typography>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Gmail Labels */}
                    <SelectGroup>
                      <SelectLabel>Mailbox</SelectLabel>
                      {systemLabels.map((label) => {
                        const Icon = getLabelIcon(label.id)
                        return (
                          <SelectItem key={label.id} value={label.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                              <Typography variant="xs" className="font-medium">{getLabelDisplayName(label)}</Typography>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectGroup>
                    
                    {/* User Labels */}
                    {userLabels.length > 0 && (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Labels</SelectLabel>
                          {userLabels.map((label) => (
                            <SelectItem key={label.id} value={label.id}>
                              <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                                <Typography variant="xs" className="font-medium">{label.name}</Typography>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => selectedProvider === 'outlook' ? loadOutlookMessages() : loadMessages()}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} strokeWidth={1} />
            </Button>
            <Button
              variant="default"
              size="xs"
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
        {isCheckingAccess ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin mr-2 text-gray-400 dark:text-gray-400" strokeWidth={1} />
            <Typography variant="muted">Checking email access...</Typography>
          </div>
        ) : !currentProviderAvailable ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Mail className="h-12 w-12 mb-4 opacity-50 text-gray-400 dark:text-gray-400" strokeWidth={1} />
            <Typography variant="h3" className="mb-2">
              {selectedProvider === 'outlook' ? 'Outlook' : 'Gmail'} Access Required
            </Typography>
            <Typography variant="small" className="text-center mb-4 max-w-md text-gray-500 dark:text-gray-400">
              {selectedProvider === 'outlook' 
                ? 'To use Outlook email features, connect your Microsoft account in Settings → Connections.'
                : 'To use the email features, you need to grant Gmail access to your Google account.'
              }
            </Typography>
            {selectedProvider === 'gmail' && (
              <Button
                onClick={requestGmailAccess}
                variant="default"
              >
                <Settings className="h-4 w-4 mr-2" strokeWidth={1} />
                Activate Gmail Access
              </Button>
            )}
            {selectedProvider === 'outlook' && (
              <Typography variant="muted" className="text-xs">
                Go to Settings → Connections to connect Outlook
              </Typography>
            )}
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
                        No emails in {getLabelDisplayName(selectedLabel)}
                      </Typography>
                      <Typography variant="muted" className="text-xs text-gray-400 dark:text-gray-500">
                        {selectedLabelId === 'INBOX' ? 'Your inbox is empty or try refreshing' :
                         selectedLabelId === 'SENT' ? 'You haven\'t sent any emails yet' :
                         selectedLabelId === 'DRAFT' ? 'You don\'t have any saved drafts' :
                         selectedLabelId === 'STARRED' ? 'You haven\'t starred any emails yet' :
                         selectedLabelId === 'TRASH' ? 'Your trash is empty' :
                         selectedLabelId === 'SPAM' ? 'No spam messages' :
                         'No emails with this label'}
                      </Typography>
                    </div>
                  ) : (
                    <>
                      {parsedMessages.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => loadMessageDetails(email.id, email.provider)}
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
                                {email.threadId && threadCounts.get(email.threadId) && threadCounts.get(email.threadId)! > 1 && (
                                  <Typography variant="xs" className="flex-shrink-0 px-1.5 py-0.5 font-medium bg-accent rounded-full">
                                    {threadCounts.get(email.threadId)}
                                  </Typography>
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
                              <Typography variant="muted" className="text-xs line-clamp-1">
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
                                     const isStarred = email.provider === 'gmail' 
                                       ? email.labels.includes('STARRED')
                                       : email.isStarred
                                     handleMessageAction(email.id, isStarred ? 'unstar' : 'star', email.provider)
                                   }}
                                   className="h-6 w-6 p-0 text-gray-400 dark:text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-400"
                                 >
                                   {(email.provider === 'gmail' ? email.labels.includes('STARRED') : email.isStarred) ? (
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
                                     handleMessageAction(email.id, 'delete', email.provider)
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
