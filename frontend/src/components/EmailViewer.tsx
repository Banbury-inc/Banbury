import { ArrowLeft, Reply, Forward, Trash2, Archive, Star, Clock, User, Mail, Paperclip, Download } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "./ui/button"
import { EmailService } from "../services/emailService"
import { extractEmailContent, hasAttachments, formatFileSize, cleanHtmlContent } from "../utils/emailUtils"

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
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      }
    } catch {
      return 'Unknown'
    }
  }

  const [labels, setLabels] = useState<string[]>(email?.labelIds || [])
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [threadLoading, setThreadLoading] = useState<boolean>(false)
  const [threadMessages, setThreadMessages] = useState<any[]>([])

  const isStarred = useMemo(() => labels.includes('STARRED'), [labels])

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

  const handleReply = () => {
    if (onReply) {
      onReply(email)
    }
  }

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
      if (!email?.threadId) {
        setThreadMessages(email ? [email] : [])
        return
      }
      try {
        setThreadLoading(true)
        // Get thread metadata (ids in the thread)
        const thread: any = await EmailService.getThread(email.threadId)
        const ids: string[] = (thread?.messages || thread?.thread?.messages || [])
          .map((m: any) => (m.id ? m.id : m.messageId ? m.messageId : m))
          .filter(Boolean)

        if (ids && ids.length > 0) {
          // Fetch full messages in batch for rendering contents
          const batch = await EmailService.getMessagesBatch(ids)
          const fullMessages: any[] = ids
            .map((id) => batch?.messages?.[id])
            .filter((m) => m && !m.error)
            // Sort by internalDate ascending (oldest first)
            .sort((a: any, b: any) => Number(a.internalDate || 0) - Number(b.internalDate || 0))
          setThreadMessages(fullMessages.length > 0 ? fullMessages : [email])
        } else {
          setThreadMessages([email])
        }
      } catch (e) {
        setThreadMessages([email])
      } finally {
        setThreadLoading(false)
      }
    }
    loadThread()
  }, [email])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Compact Header */}
      {!email ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          <p>Select an email to view</p>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-black text-lg font-semibold truncate">
              {getHeader('Subject') || '(No Subject)'}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{getHeader('From')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(email.internalDate)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200" onClick={handleReply} disabled={actionLoading}>
            <Reply className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200" onClick={handleForward} disabled={actionLoading}>
            <Forward className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200" onClick={handleArchive} disabled={actionLoading}>
            <Archive className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={isStarred ? "text-yellow-500 hover:bg-yellow-50 p-1 h-8 w-8 rounded-md transition-colors duration-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200"}
            onClick={handleToggleStar}
            disabled={actionLoading}
          >
            <Star className="h-3 w-3" fill={isStarred ? 'currentColor' : 'none'} />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200" onClick={handleDelete} disabled={actionLoading}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
        <div className="w-full">
          {/* Threaded conversation header */}
          <div className="px-6 py-4 border-b border-zinc-800/30 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400 w-12">From:</span>
                <span className="text-slate-900 font-medium truncate">{getHeader('From')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400 w-12">To:</span>
                <span className="text-slate-900 font-medium truncate">{getHeader('To')}</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            {threadLoading && (
              <div className="p-6 text-sm text-slate-500">Loading thread…</div>
            )}
            {!threadLoading && (threadMessages.length > 0 ? (
              <div className="bg-white">
                {threadMessages.map((msg) => {
                  const content = extractEmailContent(msg?.payload)
                  const header = (n: string) => msg?.payload?.headers?.find((h: any) => h.name.toLowerCase() === n.toLowerCase())?.value || 'Unknown'
                  const msgHasAttachments = hasAttachments(content)
                  return (
                    <div key={msg.id} className="border-b border-gray-200">
                      <div className="px-6 pt-4 pb-2 text-xs text-slate-600 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{header('From')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(msg.internalDate)}</span>
                        </div>
                      </div>
                      {content?.html ? (
                        <div className="text-gray-900 leading-relaxed p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(content.html) }} />
                      ) : (
                        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap p-6 font-sans">
                          {content?.text || msg?.snippet || 'No content available'}
                        </div>
                      )}
                      {msgHasAttachments && content.attachments && (
                        <div className="px-6 pb-6 bg-white">
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
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">No messages in this thread</div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

