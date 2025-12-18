import { ArrowLeft, Reply, Trash2, Archive, Star, Paperclip, Download, Send, X, Save, Tag, Check, Plus } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/old-input"
import { extractEmailContent, hasAttachments, formatFileSize, cleanHtmlContent } from "../../../utils/emailUtils"
import { useToast } from "../../ui/use-toast"
import { Typography } from "frontend/components/ui/typography"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { ApiService } from "../../../../backend/api/apiService"
import { GmailLabel, OutlookMessage } from "../../../../backend/api/emails/emails"
import { loadThreadMessages } from "./handlers/loadThreadMessages"
import { loadAvailableLabels, toggleLabel, createAndApplyLabel, dispatchLabelRefreshEvents } from "./handlers/labelActions"

type EmailProvider = 'gmail' | 'outlook'

interface EmailViewerProps {
  email: any
  provider?: EmailProvider
  onBack?: () => void
  onReply?: (email: any) => void
  onForward?: (email: any) => void
  onArchive?: (email: any) => void
  onDelete?: (email: any) => void
  onStarToggled?: (email: any, isStarred: boolean) => void
  onRefresh?: () => void
}

export function EmailViewer({ email, provider = 'gmail', onBack, onReply, onForward, onArchive, onDelete, onStarToggled, onRefresh }: EmailViewerProps) {

  // Helper to determine if this is an Outlook email
  const isOutlook = provider === 'outlook'

  // Get header value - works for both Gmail and Outlook
  const getHeader = (name: string) => {
    if (isOutlook) {
      // Outlook uses different structure
      const outlookEmail = email as OutlookMessage
      switch (name.toLowerCase()) {
        case 'from':
          return outlookEmail?.from?.emailAddress?.name || outlookEmail?.from?.emailAddress?.address || 'Unknown'
        case 'to':
          return outlookEmail?.toRecipients?.map(r => r.emailAddress?.name || r.emailAddress?.address).join(', ') || 'Unknown'
        case 'subject':
          return outlookEmail?.subject || '(No Subject)'
        case 'date':
          return outlookEmail?.receivedDateTime || outlookEmail?.sentDateTime || 'Unknown'
        default:
          return 'Unknown'
      }
    }
    return email?.payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || 'Unknown'
  }

  // Get the sender email address
  const getSenderEmail = () => {
    if (isOutlook) {
      const outlookEmail = email as OutlookMessage
      return outlookEmail?.from?.emailAddress?.address || 'Unknown'
    }
    const fromHeader = getHeader('From')
    const match = fromHeader.match(/<(.+)>$/)
    return match ? match[1] : fromHeader
  }

  const formatDate = (internalDate: string) => {
    if (!internalDate) return 'Unknown'
    try {
      // For Outlook, the date is already an ISO string
      const date = isOutlook ? new Date(internalDate) : new Date(parseInt(internalDate))
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      }
    } catch {
      return 'Unknown'
    }
  }

  // Get email body content based on provider
  const getEmailBodyContent = () => {
    if (isOutlook) {
      const outlookEmail = email as OutlookMessage
      return {
        text: outlookEmail?.body?.contentType === 'Text' ? outlookEmail?.body?.content || '' : '',
        html: outlookEmail?.body?.contentType === 'HTML' ? outlookEmail?.body?.content || '' : '',
        attachments: outlookEmail?.attachments || []
      }
    }
    return extractEmailContent(email.payload)
  }

  // Generate avatar for email sender
  const generateAvatar = (name: string, email: string) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    // Generate a consistent color based on the email
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    
    return (
      <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-medium text-sm`}>
        {initials}
      </div>
    )
  }

  // Extract sender name from email header
  const extractSenderName = (fromHeader: string) => {
    const match = fromHeader.match(/^(.+?)\s*<(.+)>$/)
    if (match) {
      return match[1].replace(/"/g, '').trim()
    }
    return fromHeader.split('@')[0]
  }

  const [labels, setLabels] = useState<string[]>(email?.labelIds || [])
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [threadLoading, setThreadLoading] = useState<boolean>(false)
  const [threadMessages, setThreadMessages] = useState<any[]>([])
  const [showReplyComposer, setShowReplyComposer] = useState<boolean>(false)
  const [replyForm, setReplyForm] = useState({
    to: '',
    subject: '',
    body: ''
  })
  const [sendingReply, setSendingReply] = useState<boolean>(false)
  const [replyAttachments, setReplyAttachments] = useState<File[]>([])
  
  // Labels popover state
  const [labelsPopoverOpen, setLabelsPopoverOpen] = useState(false)
  const [availableLabels, setAvailableLabels] = useState<GmailLabel[]>([])
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [creatingLabel, setCreatingLabel] = useState(false)

  // Outlook-specific starred state
  const [outlookStarred, setOutlookStarred] = useState<boolean>(false)

  // Determine if starred based on provider
  const isStarred = useMemo(() => {
    if (isOutlook) {
      const outlookEmail = email as OutlookMessage
      return outlookEmail?.flag?.flagStatus === 'flagged' || outlookStarred
    }
    return labels.includes('STARRED')
  }, [labels, isOutlook, email, outlookStarred])
  const { toast } = useToast()
  
  // Separate available labels into user labels only (system labels are handled separately)
  const userLabels = useMemo(() => {
    return availableLabels
      .filter(l => l.type === 'user')
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [availableLabels])

  // Auto-scroll to reply composer when it appears
  useEffect(() => {
    if (showReplyComposer) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const replyComposer = document.querySelector('[data-reply-composer]')
        if (replyComposer) {
          replyComposer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }
      }, 100)
    }
  }, [showReplyComposer])

  useEffect(() => {
    if (isOutlook) {
      setLabels([])
      const outlookEmail = email as OutlookMessage
      setOutlookStarred(outlookEmail?.flag?.flagStatus === 'flagged')
    } else {
      setLabels(email?.labelIds || [])
    }
  }, [email, isOutlook])

  // Extract full email content (handle no email gracefully)
  const emailContent = email ? getEmailBodyContent() : { text: '', html: '', attachments: [] as any[] }
  const hasAttachmentsFlag = hasAttachments(emailContent)

  const handleDownloadAttachment = async (attachmentId: string, filename: string, messageId?: string) => {
    try {
      let response
      if (isOutlook) {
        response = await ApiService.Emails.getOutlookAttachment(messageId || email.id, attachmentId)
      } else {
        response = await ApiService.Emails.getAttachment(messageId || email.id, attachmentId)
      }
      
      if (response.data) {
        // Decode base64url data (Gmail uses base64url, Outlook uses base64)
        const base64 = isOutlook ? response.data : response.data.replace(/-/g, '+').replace(/_/g, '/')
        const binaryString = atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        // Create and download file
        const blob = new Blob([bytes])
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      alert('Failed to download attachment')
    }
  }

  // Initialize reply form when email changes
  useEffect(() => {
    if (email) {
      let toAddr: string
      let subjectHeader: string
      
      if (isOutlook) {
        const outlookEmail = email as OutlookMessage
        toAddr = outlookEmail?.from?.emailAddress?.address || ''
        subjectHeader = outlookEmail?.subject || ''
      } else {
        toAddr = getHeader('From')
        subjectHeader = getHeader('Subject')
      }
      
      setReplyForm({
        to: toAddr,
        subject: subjectHeader.startsWith('Re: ') ? subjectHeader : `Re: ${subjectHeader}`,
        body: ''
      })
    }
  }, [email, isOutlook])

  const handleReply = () => {
    setShowReplyComposer(true)
  }

  const handleCancelReply = () => {
    setShowReplyComposer(false)
    setReplyForm(prev => ({ ...prev, body: '' }))
    setReplyAttachments([])
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const handleReplyAttachmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setReplyAttachments(prev => [...prev, ...files])
  }, [])

  const removeReplyAttachment = useCallback((index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSendReply = useCallback(async () => {
    if (!replyForm.to || !replyForm.subject || !replyForm.body.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (To, Subject, and Message).",
        variant: "destructive",
      })
      return
    }

    setSendingReply(true)
    try {
      if (isOutlook) {
        // Outlook reply - simpler structure, no attachments in basic reply
        await ApiService.Emails.sendOutlookReply({
          original_message_id: email.id,
          body: replyForm.body
        })
      } else {
        // Gmail reply with attachments
        const attachmentsPayload = await Promise.all(replyAttachments.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: await file.arrayBuffer().then((buf) => arrayBufferToBase64(buf))
        })))

        await ApiService.Emails.sendReply({
          original_message_id: email.id,
          to: replyForm.to,
          subject: replyForm.subject,
          body: replyForm.body,
          attachments: attachmentsPayload
        })
      }

      toast({
        title: "Reply sent successfully",
        description: "",
        variant: "default",
      })

      setShowReplyComposer(false)
      setReplyForm(prev => ({ ...prev, body: '' }))
      setReplyAttachments([])
      
      // Refresh the thread to show the new reply
      if (onRefresh) onRefresh()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('email-refresh'))
      }
    } catch (error) {
      toast({
        title: "Failed to send reply",
        description: "There was an error sending your reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingReply(false)
    }
  }, [replyForm, email.id, toast, onRefresh, replyAttachments, isOutlook])

  const handleSaveReplyDraft = useCallback(async () => {
    if (!replyForm.body.trim()) {
      toast({
        title: "No content to save",
        description: "Please add some content before saving as draft.",
        variant: "destructive",
      })
      return
    }

    try {
      await ApiService.Emails.sendMessage({
        to: replyForm.to,
        subject: replyForm.subject,
        body: replyForm.body,
        isDraft: true
      })

      toast({
        title: "Draft saved",
        description: "Your draft has been saved.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Failed to save draft",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive",
      })
    }
  }, [replyForm, toast])

  const handleForward = () => {
    if (onForward) {
      onForward(email)
    }
  }

  const handleArchive = async () => {
    try {
      setActionLoading(true)
      if (isOutlook) {
        await ApiService.Emails.modifyOutlookMessage(email.id, {
          action: 'move',
          destinationFolderId: 'archive'
        })
      } else {
        await ApiService.Emails.modifyMessage(email.id, { removeLabelIds: ['INBOX'] })
        setLabels((prev) => prev.filter((l) => l !== 'INBOX'))
      }
      if (onArchive) onArchive(email)
      if (onRefresh) onRefresh()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('email-refresh'))
      }
    } catch (error) {
      alert('Failed to archive email')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStar = async () => {
    try {
      setActionLoading(true)
      if (isOutlook) {
        // Outlook uses flag instead of label
        const newFlag = isStarred ? 'notFlagged' : 'flagged'
        await ApiService.Emails.modifyOutlookMessage(email.id, { flag: newFlag })
        setOutlookStarred(!isStarred)
        if (onStarToggled) onStarToggled(email, !isStarred)
      } else {
        const currentlyStarred = labels.includes('STARRED')
        if (currentlyStarred) {
          await ApiService.Emails.modifyMessage(email.id, { removeLabelIds: ['STARRED'] })
          setLabels((prev) => prev.filter((l) => l !== 'STARRED'))
          if (onStarToggled) onStarToggled(email, false)
        } else {
          await ApiService.Emails.modifyMessage(email.id, { addLabelIds: ['STARRED'] })
          setLabels((prev) => (prev.includes('STARRED') ? prev : [...prev, 'STARRED']))
          if (onStarToggled) onStarToggled(email, true)
        }
      }
      if (onRefresh) onRefresh()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('email-refresh'))
      }
    } catch (error) {
      alert('Failed to toggle star')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStarForMessage = async (msg: any) => {
    const msgLabels = msg?.labelIds || []
    const currentlyStarred = msgLabels.includes('STARRED')
    try {
      setActionLoading(true)
      if (currentlyStarred) {
        await ApiService.Emails.modifyMessage(msg.id, { removeLabelIds: ['STARRED'] })
        // Update the message in threadMessages
        setThreadMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, labelIds: (m.labelIds || []).filter((l: string) => l !== 'STARRED') }
              : m
          )
        )
        // If this is the main email, also update labels state
        if (msg.id === email.id) {
          setLabels((prev) => prev.filter((l) => l !== 'STARRED'))
          if (onStarToggled) onStarToggled(email, false)
        }
        if (onRefresh) onRefresh()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('email-refresh'))
        }
      } else {
        await ApiService.Emails.modifyMessage(msg.id, { addLabelIds: ['STARRED'] })
        // Update the message in threadMessages
        setThreadMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, labelIds: (m.labelIds || []).includes('STARRED') ? m.labelIds : [...(m.labelIds || []), 'STARRED'] }
              : m
          )
        )
        // If this is the main email, also update labels state
        if (msg.id === email.id) {
          setLabels((prev) => (prev.includes('STARRED') ? prev : [...prev, 'STARRED']))
          if (onStarToggled) onStarToggled(email, true)
        }
        if (onRefresh) onRefresh()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('email-refresh'))
        }
      }
    } catch (error) {
      alert('Failed to toggle star')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      if (isOutlook) {
        await ApiService.Emails.modifyOutlookMessage(email.id, { action: 'delete' })
      } else {
        await ApiService.Emails.modifyMessage(email.id, { addLabelIds: ['TRASH'] })
        setLabels((prev) => (prev.includes('TRASH') ? prev : [...prev, 'TRASH']))
      }
      if (onDelete) onDelete(email)
      if (onRefresh) onRefresh()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('email-refresh'))
      }
      if (onBack) onBack()
    } catch (error) {
      alert('Failed to delete email')
    } finally {
      setActionLoading(false)
    }
  }

  // Load available labels from Gmail API
  const fetchAvailableLabels = useCallback(async () => {
    setLabelsLoading(true)
    try {
      const labelsResult = await loadAvailableLabels()
      setAvailableLabels(labelsResult)
    } finally {
      setLabelsLoading(false)
    }
  }, [])

  // Load labels when popover opens
  useEffect(() => {
    if (labelsPopoverOpen && availableLabels.length === 0) {
      fetchAvailableLabels()
    }
  }, [labelsPopoverOpen, availableLabels.length, fetchAvailableLabels])

  // Toggle a label on the email
  const handleToggleLabel = useCallback(async (labelId: string) => {
    const hasLabel = labels.includes(labelId)
    
    // Optimistic update
    if (hasLabel) {
      setLabels(prev => prev.filter(l => l !== labelId))
    } else {
      setLabels(prev => [...prev, labelId])
    }
    
    try {
      await toggleLabel(email.id, labelId, hasLabel)
      
      if (onRefresh) onRefresh()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('email-refresh'))
      }
    } catch {
      // Revert optimistic update on error
      if (hasLabel) {
        setLabels(prev => [...prev, labelId])
      } else {
        setLabels(prev => prev.filter(l => l !== labelId))
      }
      toast({
        title: "Failed to update label",
        description: "There was an error updating the label.",
        variant: "destructive",
      })
    }
  }, [labels, email?.id, onRefresh, toast])

  // Create a new label and apply it to the email
  const handleCreateLabel = useCallback(async () => {
    if (!newLabelName.trim()) return
    
    setCreatingLabel(true)
    try {
      const newLabel = await createAndApplyLabel(email.id, newLabelName.trim())
      
      // Add to available labels and apply locally
      setAvailableLabels(prev => [...prev, newLabel])
      setLabels(prev => [...prev, newLabel.id])
      
      // Clear input
      setNewLabelName('')
      
      // Notify other components to refresh labels
      dispatchLabelRefreshEvents()
      
      toast({
        title: "Label created",
        description: `Label "${newLabel.name}" created and applied.`,
        variant: "default",
      })
    } catch {
      toast({
        title: "Failed to create label",
        description: "There was an error creating the label.",
        variant: "destructive",
      })
    } finally {
      setCreatingLabel(false)
    }
  }, [newLabelName, email?.id, toast])

  // Load full thread messages when a new email is selected
  // Threads are loaded ONLY via Gmail threadId - no subject-based heuristics
  useEffect(() => {
    const loadThread = async () => {
      // Early return for no email
      if (!email) {
        setThreadMessages([])
        return
      }

      // Only show loading indicator when we have a threadId to fetch
      if (email.threadId) setThreadLoading(true)

      try {
        const result = await loadThreadMessages(email)
        setThreadMessages(result.messages)
      } finally {
        setThreadLoading(false)
      }
    }
    loadThread()
  }, [email])

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Compact Header */}
      {!email ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p>Select an email to view</p>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between px-3 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="primary"
              size="icon-sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Compact Actions */}
        <div className="flex items-center gap-1">
          {/* Labels Popover */}
          <Popover open={labelsPopoverOpen} onOpenChange={setLabelsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="primary" size="icon-sm" title="Manage labels">
                <Tag className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="p-3 border-b border-border">
                <Typography variant="small" className="font-medium">Labels</Typography>
              </div>
              
              {labelsLoading ? (
                <div className="p-4 text-center">
                  <Typography variant="muted" className="text-xs">Loading labels...</Typography>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {userLabels.length === 0 ? (
                    <div className="p-4 text-center">
                      <Typography variant="muted" className="text-xs">No labels yet</Typography>
                    </div>
                  ) : (
                    <div className="py-1">
                      {userLabels.map((label) => {
                        const isApplied = labels.includes(label.id)
                        return (
                          <button
                            key={label.id}
                            onClick={() => handleToggleLabel(label.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isApplied ? 'bg-primary border-primary' : 'border-border'}`}>
                              {isApplied && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <Typography variant="xs">{label.name}</Typography>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Create new label */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="New label..."
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                    variant="primary"
                    className="flex-1 h-8 text-xs"
                    disabled={creatingLabel}
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCreateLabel}
                    disabled={creatingLabel || !newLabelName.trim()}
                    className="h-8 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="primary" size="icon-sm" onClick={handleArchive} disabled={actionLoading}>
            <Archive className="h-3 w-3" />
          </Button>
          <Button 
            variant="primary" 
            size="icon-sm" 
            className={`${isStarred ? 'text-yellow-400 hover:text-yellow-500' : ''}`}
            onClick={handleToggleStar}
            disabled={actionLoading}
          >
            <Star className="h-3 w-3" fill={isStarred ? 'currentColor' : 'none'} />
          </Button>
          <Button variant="primary" size="icon-sm" className="h-8 w-8" onClick={handleDelete} disabled={actionLoading}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-zinc-100 hover:scrollbar-thumb-zinc-500 flex flex-col">
        <div className="w-full flex-1 flex flex-col">
          <div className="w-full flex-1 flex flex-col">
            {threadLoading && (
              <div className="p-6 text-sm text-zinc-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-400"></div>
                Loading email thread...
              </div>
            )}
            {!threadLoading && (threadMessages.length > 0 ? (
              <div className="bg-white flex-1 flex flex-col">
                {threadMessages.map((msg, index) => {
                  const content = extractEmailContent(msg?.payload)
                  const header = (n: string) => msg?.payload?.headers?.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value || 'Unknown'
                  const msgHasAttachments = hasAttachments(content)
                  const fromHeader = header('From')
                  const senderName = extractSenderName(fromHeader)
                  const senderEmail = fromHeader.includes('<') ? fromHeader.match(/<(.+)>/)?.[1] || fromHeader : fromHeader
                  const isLastMessage = index === threadMessages.length - 1
                  
                  return (
                    <div key={msg.id} className={`border-b border-gray-200 ${isLastMessage ? 'border-b-2 flex-1 flex flex-col' : ''} ${index > 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      {/* Email Header */}
                      <div className="px-6 py-4 flex-shrink-0">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {generateAvatar(senderName, senderEmail)}
                          </div>
                          
                          {/* Email Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{senderName}</span>
                                <span className="text-xs text-gray-500">to me</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{formatDate(msg.internalDate)}</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="primaryonWhite"
                                    size="icon-sm"
                                    title="Star email"
                                    className={`${(msg?.labelIds || []).includes('STARRED') ? 'text-yellow-400 hover:text-yellow-500' : ''}`}
                                    onClick={() => handleToggleStarForMessage(msg)}
                                    disabled={actionLoading}
                                  >
                                    <Star className="h-3 w-3" fill={(msg?.labelIds || []).includes('STARRED') ? 'currentColor' : 'none'} />
                                  </Button>
                                  <Button
                                    variant="primaryonWhite"
                                    size="icon-sm"
                                    title="Reply"
                                    onClick={() => {
                                      setReplyForm({
                                        to: fromHeader,
                                        subject: header('Subject').startsWith('Re: ') ? header('Subject') : `Re: ${header('Subject')}`,
                                        body: ''
                                      })
                                      setShowReplyComposer(true)
                                    }}
                                  >
                                    <Reply className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="primaryonWhite"
                                    size="icon-sm"
                                    title="More options"
                                  >
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Email Content */}
                      <div className={`px-6 pb-4 ${isLastMessage ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                        <div className={`ml-13 ${isLastMessage ? 'flex-1 min-h-0' : ''}`}>
                          {content?.html ? (
                            <div className="text-gray-900 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(content.html) }} />
                          ) : (
                            <div className="text-gray-900 leading-relaxed whitespace-pre-wrap font-sans">
                              {content?.text || msg?.snippet || 'No content available'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Attachments */}
                      {msgHasAttachments && content.attachments && (
                        <div className={`px-6 pb-4 ${isLastMessage ? 'flex-shrink-0' : ''}`}>
                          <div className="ml-13">
                            <div className="border-t border-gray-200 pt-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Paperclip className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Attachments</span>
                                <span className="text-xs text-slate-500">({content.attachments.length})</span>
                              </div>
                              <div className="space-y-2">
                                {content.attachments.map((attachment: any) => (
                                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <Paperclip className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900 truncate">{attachment.filename}</p>
                                        <p className="text-xs text-slate-600">{attachment.mimeType} • {formatFileSize(attachment.size)}</p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 flex-shrink-0 rounded-md transition-colors duration-200"
                                      title="Download attachment"
                                      onClick={() => handleDownloadAttachment(attachment.id, attachment.filename, msg.id)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">No messages in this thread</div>
            ))}
          </div>

          {/* Inline Reply Composer */}
          {showReplyComposer && (
            <div className="bg-white border-t border-zinc-200 shadow-lg w-full flex-shrink-0" data-reply-composer>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  {/* Profile Picture */}
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                    M
                  </div>
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-600">to</span>
                    <span className="text-sm font-medium text-zinc-900">{extractSenderName(getHeader('From'))}</span>
                  </div>
                </div>
                <Button
                  variant="primaryonWhite"
                  size="icon-sm"
                  onClick={handleCancelReply}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Attachments */}
              {replyAttachments.length > 0 && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-semibold text-gray-900">Attachments</span>
                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                      {replyAttachments.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {replyAttachments.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Paperclip className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReplyAttachment(index)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div className="px-4 py-4">
                <textarea
                  value={replyForm.body}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full min-h-32 border-0 shadow-none bg-transparent text-gray-900 resize-none focus:ring-0 focus:outline-none focus:border-0 p-0"
                  placeholder="Compose email..."
                  disabled={sendingReply}
                />
              </div>

              {/* Footer with Actions - matching EmailComposer style */}
              <div className="px-2 py-2 border-t border-zinc-200">
                <div className="flex items-center flex-wrap gap-3">
                  <Button
                    variant="primary"
                    size="icon-sm"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyForm.body.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 w-auto px-2"
                  >
                    <Send className="h-4 w-10" />
                    {sendingReply ? 'Sending...' : 'Send'}
                  </Button>
                  <Button
                    variant="primaryonWhite"
                    size="icon-sm"
                    onClick={handleSaveReplyDraft}
                    disabled={sendingReply}
                  >
                    <Save className="h-4 w-10" />
                  </Button>
                  <Button
                    variant="primaryonWhite"
                    size="icon-sm"
                    onClick={() => document.getElementById('reply-attachment-input')?.click()}
                    disabled={sendingReply}
                  >
                    <Paperclip className="h-4 w-10" />
                  </Button>
                  <input
                    id="reply-attachment-input"
                    type="file"
                    multiple
                    onChange={handleReplyAttachmentChange}
                    className="hidden"
                  />
                  {replyAttachments.length > 0 && (
                    <span className="text-xs text-zinc-400 bg-zinc-700/50 px-3 py-1.5 rounded-md flex-shrink-0">
                      {replyAttachments.length} file{replyAttachments.length !== 1 ? 's' : ''} attached
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}

