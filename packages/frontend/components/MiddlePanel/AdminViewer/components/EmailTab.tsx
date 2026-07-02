import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../common/ui/card'
import { Input } from '../../../common/ui/input'
import { Textarea } from '../../../common/ui/textarea'
import { Checkbox } from '../../../common/ui/checkbox'
import type { User } from '../types/adminTypes'
import {
  handleSendMarketingEmail,
  isUserSelectable,
  toggleSelectAll,
  toggleUserSelection,
  type SendEmailSummary
} from './handlers/emailTabHandlers'

interface EmailTabProps {
  users: User[]
}

export function EmailTab({ users }: EmailTabProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSummary, setSendSummary] = useState<SendEmailSummary | null>(null)

  const selectableUsers = users.filter(isUserSelectable)
  const allSelected = selectableUsers.length > 0 && selectableUsers.every(user => selectedUserIds.includes(user._id))
  const canSend = !isSending && subject.trim().length > 0 && body.trim().length > 0 && selectedUserIds.length > 0

  return (
    <div className="space-y-6">
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Compose Marketing Email</CardTitle>
          <CardDescription>
            Sent from banbury@banbury.io with the Banbury branded template. Opted-out users are excluded automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            disabled={isSending}
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your marketing email... Each line becomes a paragraph."
            rows={8}
            disabled={isSending}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedUserIds.length} of {selectableUsers.length} eligible {selectableUsers.length === 1 ? 'user' : 'users'} selected
            </div>
            <Button
              onClick={() => handleSendMarketingEmail({
                subject,
                body,
                selectedUserIds,
                setIsSending,
                setSendError,
                setSendSummary,
                setSelectedUserIds
              })}
              disabled={!canSend}
            >
              {isSending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedUserIds.length} {selectedUserIds.length === 1 ? 'user' : 'users'}
                </>
              )}
            </Button>
          </div>
          {sendError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {sendError}
            </div>
          )}
          {sendSummary && (
            <div className="rounded-lg border border-zinc-200 bg-muted/50 px-4 py-3 text-sm text-foreground dark:border-white/[0.06]">
              Sent {sendSummary.sent} {sendSummary.sent === 1 ? 'email' : 'emails'}
              {sendSummary.skippedOptedOut > 0 && `, skipped ${sendSummary.skippedOptedOut} opted-out`}
              {sendSummary.missingEmail > 0 && `, ${sendSummary.missingEmail} missing an email address`}
              {sendSummary.notFound > 0 && `, ${sendSummary.notFound} not found`}
              {sendSummary.failed > 0 && `, ${sendSummary.failed} failed`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground">Recipients</CardTitle>
          <CardDescription>
            Users who opted out of marketing emails or have no email address cannot be selected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/[0.06]">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                  <th className="w-12 px-4 py-3 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectAll(users, selectedUserIds, setSelectedUserIds)}
                      disabled={isSending || selectableUsers.length === 0}
                      aria-label="Select all eligible users"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Marketing Opt-Out</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const selectable = isUserSelectable(user)
                  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

                  return (
                    <tr
                      key={user._id}
                      className={`border-b border-zinc-200 transition-colors last:border-b-0 dark:border-white/[0.04] ${
                        selectable ? 'hover:bg-accent/50' : 'opacity-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedUserIds.includes(user._id)}
                          onCheckedChange={() => toggleUserSelection(user._id, setSelectedUserIds)}
                          disabled={isSending || !selectable}
                          aria-label={`Select ${user.username}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{fullName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {user.marketingEmailsOptOut ? (
                          <span className="text-destructive">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
