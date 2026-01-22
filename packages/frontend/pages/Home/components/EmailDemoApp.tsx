import React, { useState, useEffect } from 'react'
import { EmailTab } from '../../../components/LeftPanel/components/EmailTab/EmailTab'
import { EmailViewer } from '../../../components/MiddlePanel/EmailViewer/EmailViewer'
import { ApiService } from '../../../../backend/api/apiService'
import { GmailMessage, GmailLabel } from '../../../../backend/api/emails/emails'

// Mock Email Messages (matching GmailMessage structure)
const mockEmailMessages: GmailMessage[] = [
  {
    id: 'email-1',
    threadId: 'thread-1',
    labelIds: ['INBOX', 'IMPORTANT'],
    snippet: 'Here is the latest update on the project. We are making great progress on the Q3 initiatives...',
    payload: {
      headers: [
        { name: 'From', value: 'Sarah Chen <sarah@company.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'Project Update - Q3 Initiative' },
        { name: 'Date', value: 'Tue, 22 Oct 2025 12:00:00 +0000' },
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from(`Hi Team,

Here is the latest update on the project. We are making great progress on the Q3 initiatives and I wanted to share some key milestones we've achieved this week.

Key Accomplishments:
• Completed the initial design phase for the new dashboard
• Finalized vendor negotiations with a 15% cost reduction
• Onboarded 3 new team members to support the initiative

Next Steps:
We'll be moving into the development phase starting Monday. Please review the attached timeline and let me know if you have any concerns.

Best regards,
Sarah`).toString('base64')
      }
    },
    internalDate: String(new Date('2025-10-22T12:00:00Z').getTime()),
  },
  {
    id: 'email-2',
    threadId: 'thread-2',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Team meeting scheduled for tomorrow at 2 PM. Please review the attached agenda...',
    payload: {
      headers: [
        { name: 'From', value: 'John Smith <john@company.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'Team Meeting Tomorrow' },
        { name: 'Date', value: 'Tue, 22 Oct 2025 09:30:00 +0000' },
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from(`Hello everyone,

Team meeting scheduled for tomorrow at 2 PM. Please review the attached agenda before the meeting.

Agenda:
1. Q3 progress review (15 min)
2. Resource allocation discussion (20 min)
3. Client feedback summary (15 min)
4. Open Q&A (10 min)

Location: Conference Room B or join via Zoom (link in calendar invite)

Please come prepared with your weekly updates.

Thanks,
John`).toString('base64')
      }
    },
    internalDate: String(new Date('2025-10-22T09:30:00Z').getTime()),
  },
  {
    id: 'email-3',
    threadId: 'thread-3',
    labelIds: ['INBOX', 'STARRED'],
    snippet: 'The code review for PR #245 is complete. Found a few minor issues that need addressing...',
    payload: {
      headers: [
        { name: 'From', value: 'Emily Johnson <emily@company.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'Code Review Complete - PR #245' },
        { name: 'Date', value: 'Mon, 21 Oct 2025 16:45:00 +0000' },
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from(`Hi,

The code review for PR #245 is complete. Found a few minor issues that need addressing before merge:

1. Line 142: Consider using a more descriptive variable name
2. Line 203: Missing error handling for edge case
3. Line 287: This could be refactored for better readability

Overall, great work on the implementation! The architecture looks solid and the tests are comprehensive. Once these minor items are addressed, we should be good to merge.

Let me know if you have any questions.

Emily`).toString('base64')
      }
    },
    internalDate: String(new Date('2025-10-21T16:45:00Z').getTime()),
  },
  {
    id: 'email-4',
    threadId: 'thread-4',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Excited to announce our new marketing campaign launching next week. Please review the materials...',
    payload: {
      headers: [
        { name: 'From', value: 'Marketing Team <marketing@company.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'New Campaign Launch Details' },
        { name: 'Date', value: 'Mon, 21 Oct 2025 14:15:00 +0000' },
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from(`Team,

Excited to announce our new marketing campaign launching next week!

Campaign Highlights:
• Multi-channel approach across social, email, and paid ads
• Target audience: Enterprise decision makers
• Duration: 4 weeks with phased rollout

Key Dates:
- Oct 28: Social media campaign begins
- Oct 30: Email sequence starts
- Nov 4: Paid advertising launch

Please review the attached materials and provide feedback by Friday.

Best,
Marketing Team`).toString('base64')
      }
    },
    internalDate: String(new Date('2025-10-21T14:15:00Z').getTime()),
  },
]

// Mock Gmail Labels
const mockLabels: GmailLabel[] = [
  { id: 'INBOX', name: 'INBOX', type: 'system' },
  { id: 'SENT', name: 'SENT', type: 'system' },
  { id: 'DRAFT', name: 'DRAFT', type: 'system' },
  { id: 'STARRED', name: 'STARRED', type: 'system' },
  { id: 'IMPORTANT', name: 'IMPORTANT', type: 'system' },
  { id: 'TRASH', name: 'TRASH', type: 'system' },
  { id: 'SPAM', name: 'SPAM', type: 'system' },
]

// Store original service methods
let originalIsFeatureAvailable: typeof ApiService.Scopes.isFeatureAvailable | null = null
let originalListMessages: typeof ApiService.Emails.listMessages | null = null
let originalGetMessagesBatch: typeof ApiService.Emails.getMessagesBatch | null = null
let originalGetMessage: typeof ApiService.Emails.getMessage | null = null
let originalListLabels: typeof ApiService.Emails.listLabels | null = null
let originalGetThread: typeof ApiService.Emails.getThread | null = null
let originalModifyMessage: typeof ApiService.Emails.modifyMessage | null = null

// Setup mocks
function setupEmailDemoMocks() {
  // Save originals only if not already saved
  if (originalIsFeatureAvailable === null) {
    originalIsFeatureAvailable = ApiService.Scopes.isFeatureAvailable
  }
  if (originalListMessages === null) {
    originalListMessages = ApiService.Emails.listMessages
  }
  if (originalGetMessagesBatch === null) {
    originalGetMessagesBatch = ApiService.Emails.getMessagesBatch
  }
  if (originalGetMessage === null) {
    originalGetMessage = ApiService.Emails.getMessage
  }
  if (originalListLabels === null) {
    originalListLabels = ApiService.Emails.listLabels
  }
  if (originalGetThread === null) {
    originalGetThread = ApiService.Emails.getThread
  }
  if (originalModifyMessage === null) {
    originalModifyMessage = ApiService.Emails.modifyMessage
  }

  // Mock ScopeService - make gmail available
  ApiService.Scopes.isFeatureAvailable = async (feature: string) => {
    return feature === 'gmail'
  }

  // Mock list messages
  ApiService.Emails.listMessages = async (params?: { labelIds?: string[] }) => {
    const labelId = params?.labelIds?.[0] || 'INBOX'
    const filtered = mockEmailMessages.filter(msg =>
      msg.labelIds?.includes(labelId) || labelId === 'INBOX'
    )
    return {
      messages: filtered.map(msg => ({ id: msg.id, threadId: msg.threadId })),
      nextPageToken: undefined,
      resultSizeEstimate: filtered.length,
    }
  }

  // Mock get messages batch
  ApiService.Emails.getMessagesBatch = async (messageIds: string[]) => {
    const messages: Record<string, GmailMessage> = {}
    for (const id of messageIds) {
      const msg = mockEmailMessages.find(m => m.id === id)
      if (msg) {
        messages[id] = msg
      }
    }
    return { messages }
  }

  // Mock get single message
  ApiService.Emails.getMessage = async (messageId: string) => {
    return mockEmailMessages.find(m => m.id === messageId) || mockEmailMessages[0]
  }

  // Mock list labels
  ApiService.Emails.listLabels = async () => {
    return { labels: mockLabels }
  }

  // Mock get thread
  ApiService.Emails.getThread = async (threadId: string) => {
    const messages = mockEmailMessages.filter(m => m.threadId === threadId)
    return {
      id: threadId,
      messages: messages.length > 0 ? messages : [mockEmailMessages[0]]
    }
  }

  // Mock modify message (for marking as read, etc.)
  ApiService.Emails.modifyMessage = async (messageId: string, modifications: any) => {
    const msg = mockEmailMessages.find(m => m.id === messageId)
    return msg || mockEmailMessages[0]
  }
}

// Cleanup mocks
function cleanupEmailDemoMocks() {
  if (originalIsFeatureAvailable !== null) {
    ApiService.Scopes.isFeatureAvailable = originalIsFeatureAvailable
  }
  if (originalListMessages !== null) {
    ApiService.Emails.listMessages = originalListMessages
  }
  if (originalGetMessagesBatch !== null) {
    ApiService.Emails.getMessagesBatch = originalGetMessagesBatch
  }
  if (originalGetMessage !== null) {
    ApiService.Emails.getMessage = originalGetMessage
  }
  if (originalListLabels !== null) {
    ApiService.Emails.listLabels = originalListLabels
  }
  if (originalGetThread !== null) {
    ApiService.Emails.getThread = originalGetThread
  }
  if (originalModifyMessage !== null) {
    ApiService.Emails.modifyMessage = originalModifyMessage
  }
}

// Track if mocks are currently active (module level to survive remounts)
let mocksActive = false

export default function EmailDemoApp() {
  // Start with the first email selected by default
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(mockEmailMessages[0])
  const [, forceUpdate] = useState({})

  // Setup mocks on mount - use useLayoutEffect for synchronous setup before paint
  useEffect(() => {
    if (!mocksActive) {
      setupEmailDemoMocks()
      mocksActive = true
      forceUpdate({}) // Trigger re-render now that mocks are ready
    }

    return () => {
      cleanupEmailDemoMocks()
      mocksActive = false
    }
  }, [])

  const handleMessageSelect = (message: GmailMessage) => {
    setSelectedEmail(message)
  }

  const handleBack = () => {
    setSelectedEmail(null)
  }

  // Don't render EmailTab until mocks are ready
  if (!mocksActive) {
    return (
      <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900">
      {/* Email List Panel - using actual EmailTab */}
      <div className="w-[40%] h-full border-r border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <EmailTab
          onMessageSelect={handleMessageSelect}
          onComposeEmail={() => {}}
          demoMode={true}
        />
      </div>

      {/* Email Preview Panel - using actual EmailViewer */}
      <div className="flex-1 h-full overflow-hidden">
        {selectedEmail ? (
          <EmailViewer
            email={selectedEmail}
            provider="gmail"
            onBack={handleBack}
            onReply={() => {}}
            onForward={() => {}}
            onArchive={() => {}}
            onDelete={() => {}}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/30">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">Select an email to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
