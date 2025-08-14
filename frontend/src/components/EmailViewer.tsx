import { useMemo, useState } from "react"
import { Button } from "./ui/button"
import { ArrowLeft, Reply, Forward, Trash2, Archive, Star, Clock, User, Mail, Paperclip, Download } from "lucide-react"
import { extractEmailContent, hasAttachments, formatFileSize, cleanHtmlContent } from "../utils/emailUtils"
import { EmailService } from "../services/emailService"

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
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>Select an email to view</p>
      </div>
    )
  }

  const getHeader = (name: string) => {
    return email.payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || 'Unknown'
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

  // Extract full email content
  const emailContent = extractEmailContent(email.payload)
  const hasAttachmentsFlag = hasAttachments(emailContent)

  const [labels, setLabels] = useState<string[]>(email?.labelIds || [])
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  const isStarred = useMemo(() => labels.includes('STARRED'), [labels])

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const response = await EmailService.getAttachment(email.id, attachmentId)
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-600 hover:text-black p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-black text-lg font-semibold truncate">
              {getHeader('Subject') || '(No Subject)'}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
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
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black p-1 h-8 w-8" onClick={handleReply} disabled={actionLoading}>
            <Reply className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black p-1 h-8 w-8" onClick={handleForward} disabled={actionLoading}>
            <Forward className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black p-1 h-8 w-8" onClick={handleArchive} disabled={actionLoading}>
            <Archive className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={isStarred ? "text-yellow-500 p-1 h-8 w-8" : "text-gray-600 hover:text-black p-1 h-8 w-8"}
            onClick={handleToggleStar}
            disabled={actionLoading}
          >
            <Star className="h-3 w-3" fill={isStarred ? 'currentColor' : 'none'} />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black p-1 h-8 w-8" onClick={handleDelete} disabled={actionLoading}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
        <div className="w-full">
          {/* Email Metadata - Compact */}
          <div className="px-6 py-4 border-b border-zinc-800/30 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400 w-12">From:</span>
                <span className="text-black font-medium truncate">{getHeader('From')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400 w-12">To:</span>
                <span className="text-black font-medium truncate">{getHeader('To')}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="w-full">
            <div className="bg-white overflow-hidden">
              {emailContent.html ? (
                <div 
                  className="text-gray-900 leading-relaxed p-6 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(emailContent.html) }}
                />
              ) : (
                <div className="text-gray-900 leading-relaxed whitespace-pre-wrap p-6 font-sans">
                  {emailContent.text || email.snippet || 'No content available'}
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {hasAttachmentsFlag && emailContent.attachments && (
            <div className="px-6 pb-6 bg-white">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Attachments</span>
                  <span className="text-xs text-gray-500">({emailContent.attachments.length})</span>
                </div>
                <div className="space-y-2">
                  {emailContent.attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-gray-600">
                            {attachment.mimeType} • {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-black p-1 h-8 w-8 flex-shrink-0"
                        title="Download attachment"
                        onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
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
      </div>
    </div>
  )
}
