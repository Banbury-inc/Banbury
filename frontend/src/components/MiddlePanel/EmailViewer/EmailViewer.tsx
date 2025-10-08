import { ArrowLeft, Reply, Forward, Trash2, Archive, Star, Clock, User, Mail, Paperclip, Download, Send, X, Save } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"

import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { EmailService } from "../../../services/emailService"
import { extractEmailContent, hasAttachments, formatFileSize, cleanHtmlContent } from "../../../utils/emailUtils"
import { useToast } from "../../ui/use-toast"
import { Typography } from "@/components/ui/typography"

interface EmailViewerProps {
  email: any
  onBack?: () => void
  onReply?: (email: any) => void
  onForward?: (email: any) => void
  onArchive?: (email: any) => void
  onDelete?: (email: any) => void
  onStarToggled?: (email: any, isStarred: boolean) => void
  onRefresh?: () => void
}

export function EmailViewer({ email, onBack, onReply, onForward, onArchive, onDelete, onStarToggled, onRefresh }: EmailViewerProps) {

  const getHeader = (name: string) => {
    return email?.payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || 'Unknown'
  }

  const formatDate = (internalDate: string) => {
    if (!internalDate) return 'Unknown'
    try {
      const date = new Date(parseInt(internalDate))
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

  const isStarred = useMemo(() => labels.includes('STARRED'), [labels])
  const { toast } = useToast()

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
    setLabels(email?.labelIds || [])
  }, [email])

  // Extract full email content (handle no email gracefully)
  const emailContent = email ? extractEmailContent(email.payload) : { text: '', html: '', attachments: [] as any[] }
  const hasAttachmentsFlag = hasAttachments(emailContent)

  const handleDownloadAttachment = async (attachmentId: string, filename: string, messageId?: string) => {
    try {
      const response = await EmailService.getAttachment(messageId || email.id, attachmentId)
      if (response.data) {
        // Decode base64url data
        const base64 = response.data.replace(/-/g, '+').replace(/_/g, '/')
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
      const fromHeader = getHeader('From')
      const subjectHeader = getHeader('Subject')
      setReplyForm({
        to: fromHeader,
        subject: subjectHeader.startsWith('Re: ') ? subjectHeader : `Re: ${subjectHeader}`,
        body: ''
      })
    }
  }, [email])

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
      const attachmentsPayload = await Promise.all(replyAttachments.map(async (file) => ({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        content: await file.arrayBuffer().then((buf) => arrayBufferToBase64(buf))
      })))

      await EmailService.sendReply({
        original_message_id: email.id,
        to: replyForm.to,
        subject: replyForm.subject,
        body: replyForm.body,
        attachments: attachmentsPayload
      })

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
  }, [replyForm, email.id, toast, onRefresh, replyAttachments])

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
      await EmailService.sendMessage({
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
      await EmailService.modifyMessage(email.id, { removeLabelIds: ['INBOX'] })
      setLabels((prev) => prev.filter((l) => l !== 'INBOX'))
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
    const currentlyStarred = labels.includes('STARRED')
    try {
      setActionLoading(true)
      if (currentlyStarred) {
        await EmailService.modifyMessage(email.id, { removeLabelIds: ['STARRED'] })
        setLabels((prev) => prev.filter((l) => l !== 'STARRED'))
        if (onStarToggled) onStarToggled(email, false)
        if (onRefresh) onRefresh()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('email-refresh'))
        }
      } else {
        await EmailService.modifyMessage(email.id, { addLabelIds: ['STARRED'] })
        setLabels((prev) => (prev.includes('STARRED') ? prev : [...prev, 'STARRED']))
        if (onStarToggled) onStarToggled(email, true)
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
      await EmailService.modifyMessage(email.id, { addLabelIds: ['TRASH'] })
      setLabels((prev) => (prev.includes('TRASH') ? prev : [...prev, 'TRASH']))
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

  // Load full thread messages when a new email is selected
  useEffect(() => {
    const loadThread = async () => {
      if (!email) {
        setThreadMessages([])
        return
      }

      console.log('EmailViewer: Loading email:', {
        id: email.id,
        threadId: email.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From')
      })

      // If no threadId, try to find related messages by subject or just show single email
      if (!email.threadId) {
        console.log('No threadId found, attempting to find related emails by subject')
        
        // Try to find related emails by subject
        try {
          const subject = getHeader('Subject')
          if (subject && subject !== 'Unknown') {
            // Remove "Re:" prefix for search
            const cleanSubject = subject.replace(/^Re:\s*/i, '')
            console.log('Searching for related emails with subject:', cleanSubject)
            
            const searchResult = await EmailService.listMessages({
              q: `subject:"${cleanSubject}"`,
              maxResults: 10
            })
            
            if (searchResult.messages && searchResult.messages.length > 1) {
              console.log('Found related emails by subject:', searchResult.messages.length)
              // Load full messages for the related emails
              const messageIds = searchResult.messages.map(m => m.id)
              const batch = await EmailService.getMessagesBatch(messageIds)
              const fullMessages: any[] = messageIds
                .map((id) => batch?.messages?.[id])
                .filter((m) => m && !m.error)
                .sort((a: any, b: any) => Number(a.internalDate || 0) - Number(b.internalDate || 0))
              
              if (fullMessages.length > 1) {
                console.log('Loaded related emails:', fullMessages.length)
                setThreadMessages(fullMessages)
                return
              }
            }
          }
        } catch (error) {
          console.error('Error searching for related emails:', error)
        }
        
        console.log('No related emails found, showing single email')
        setThreadMessages([email])
        return
      }
      
      try {
        setThreadLoading(true)
        console.log('Loading thread for threadId:', email.threadId)
        
        // Get thread metadata (ids in the thread)
        const thread: any = await EmailService.getThread(email.threadId)
        console.log('Thread response:', thread)
        
        const ids: string[] = (thread?.messages || thread?.thread?.messages || [])
          .map((m: any) => (m.id ? m.id : m.messageId ? m.messageId : m))
          .filter(Boolean)

        console.log('Found message IDs in thread:', ids)

        if (ids && ids.length > 1) {
          // Fetch full messages in batch for rendering contents
          const batch = await EmailService.getMessagesBatch(ids)
          console.log('Batch response:', batch)
          
          const fullMessages: any[] = ids
            .map((id) => batch?.messages?.[id])
            .filter((m) => m && !m.error)
            // Sort by internalDate ascending (oldest first)
            .sort((a: any, b: any) => Number(a.internalDate || 0) - Number(b.internalDate || 0))
          
          console.log('Full messages loaded:', fullMessages.length)
          setThreadMessages(fullMessages.length > 0 ? fullMessages : [email])
        } else {
          console.log('Single message in thread or no message IDs found, showing single email')
          setThreadMessages([email])
        }
      } catch (e) {
        console.error('Error loading thread via threadId, falling back to subject search:', e)
        
        // Fallback: Try to find related emails by subject when thread API fails
        try {
          const subject = getHeader('Subject')
          if (subject && subject !== 'Unknown') {
            // Remove "Re:" prefix for search
            const cleanSubject = subject.replace(/^Re:\s*/i, '')
            console.log('Fallback: Searching for related emails with subject:', cleanSubject)
            
            const searchResult = await EmailService.listMessages({
              q: `subject:"${cleanSubject}"`,
              maxResults: 10
            })
            
            if (searchResult.messages && searchResult.messages.length > 1) {
              console.log('Fallback: Found related emails by subject:', searchResult.messages.length)
              // Load full messages for the related emails
              const messageIds = searchResult.messages.map(m => m.id)
              const batch = await EmailService.getMessagesBatch(messageIds)
              const fullMessages: any[] = messageIds
                .map((id) => batch?.messages?.[id])
                .filter((m) => m && !m.error)
                .sort((a: any, b: any) => Number(a.internalDate || 0) - Number(b.internalDate || 0))
              
              if (fullMessages.length > 1) {
                console.log('Fallback: Loaded related emails:', fullMessages.length)
                setThreadMessages(fullMessages)
                return
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError)
        }
        
        console.log('All thread loading methods failed, showing single email')
        setThreadMessages([email])
      } finally {
        setThreadLoading(false)
      }
    }
    loadThread()
  }, [email])

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-800">
      {/* Compact Header */}
      {!email ? (
        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-400">
          <p>Select an email to view</p>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between px-3 py-3 bg-zinc-200 border-b border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="primary"
              size="xsm"
              onClick={onBack}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <Typography variant="h3" className="truncate">
              {getHeader('Subject') || '(No Subject)'}
            </Typography>
          </div>
        </div>
        
        {/* Compact Actions */}
        <div className="flex items-center gap-1">
          <Button variant="primary" size="xsm" onClick={handleReply} disabled={actionLoading}>
            <Reply className="h-3 w-3" />
          </Button>
          <Button variant="primary" size="xsm" onClick={handleForward} disabled={actionLoading}>
            <Forward className="h-3 w-3" />
          </Button>
          <Button variant="primary" size="xsm" onClick={handleArchive} disabled={actionLoading}>
            <Archive className="h-3 w-3" />
          </Button>
          <Button 
            variant="primary" 
            size="xsm" 
            className={`${isStarred ? 'text-yellow-400 hover:text-yellow-500' : ''}`}
            onClick={handleToggleStar}
            disabled={actionLoading}
          >
            <Star className="h-3 w-3" fill={isStarred ? 'currentColor' : 'none'} />
          </Button>
          <Button variant="primary" size="xsm" className="h-8 w-8" onClick={handleDelete} disabled={actionLoading}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-zinc-100 hover:scrollbar-thumb-zinc-500">
        <div className="w-full">
          <div className="w-full">
            {threadLoading && (
              <div className="p-6 text-sm text-zinc-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-400"></div>
                Loading email thread...
              </div>
            )}
            {!threadLoading && (threadMessages.length > 0 ? (
              <div className="bg-white">
                {threadMessages.map((msg, index) => {
                  const content = extractEmailContent(msg?.payload)
                  const header = (n: string) => msg?.payload?.headers?.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value || 'Unknown'
                  const msgHasAttachments = hasAttachments(content)
                  const fromHeader = header('From')
                  const senderName = extractSenderName(fromHeader)
                  const senderEmail = fromHeader.includes('<') ? fromHeader.match(/<(.+)>/)?.[1] || fromHeader : fromHeader
                  
                  return (
                    <div key={msg.id} className={`border-b border-gray-200 ${index === threadMessages.length - 1 ? 'border-b-2' : ''} ${index > 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      {/* Email Header */}
                      <div className="px-6 py-4">
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
                                    size="xsm"
                                    title="Star email"
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="primaryonWhite"
                                    size="xsm"
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
                                    size="xsm"
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
                      <div className="px-6 pb-4">
                        <div className="ml-13">
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
                        <div className="px-6 pb-4">
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
            <div className="bg-white border-t border-zinc-200 shadow-lg w-full" data-reply-composer>
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
                  size="xsm"
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
                  className="w-full min-h-32 border-0 shadow-none text-gray-900 resize-none focus:ring-0 focus:outline-none focus:border-0 p-0"
                  placeholder="Compose email..."
                  disabled={sendingReply}
                />
              </div>

              {/* Footer with Actions - matching EmailComposer style */}
              <div className="px-2 py-2 border-t border-zinc-200">
                <div className="flex items-center flex-wrap gap-3">
                  <Button
                    variant="primary"
                    size="xsm"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyForm.body.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 w-auto px-2"
                  >
                    <Send className="h-4 w-10" />
                    {sendingReply ? 'Sending...' : 'Send'}
                  </Button>
                  <Button
                    variant="primaryonWhite"
                    size="xsm"
                    onClick={handleSaveReplyDraft}
                    disabled={sendingReply}
                  >
                    <Save className="h-4 w-10" />
                  </Button>
                  <Button
                    variant="primaryonWhite"
                    size="xsm"
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

