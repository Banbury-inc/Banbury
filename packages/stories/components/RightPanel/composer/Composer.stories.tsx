import React, { useState, useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Composer } from "frontend/components/RightPanel/composer/Composer"
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { useLocalRuntime } from "@assistant-ui/react"
import { fn } from "@storybook/test"
import { TooltipProvider } from "@/components/common/ui/tooltip"
import { UserFilesProvider } from "frontend/contexts/UserFilesContext"
import type { QueuedMessage } from "frontend/components/RightPanel/composer/components/queued-messages-display"

// Mock runtime for AssistantUI
function ComposerWrapper({ children }: { children: React.ReactNode }) {
  const runtime = useLocalRuntime({
    async run() {
      return { 
        content: [{ type: "text", text: "Mock response" }],
        status: { type: "complete" }
      }
    },
  })

  return (
    <UserFilesProvider username="testuser">
      <TooltipProvider>
        <AssistantRuntimeProvider runtime={runtime}>
          <div className="w-full max-w-4xl mx-auto p-4">
            {children}
          </div>
        </AssistantRuntimeProvider>
      </TooltipProvider>
    </UserFilesProvider>
  )
}

const meta: Meta<typeof Composer> = {
  title: "Components/Composer",
  component: Composer,
  decorators: [
    (Story) => (
      <ComposerWrapper>
        <Story />
      </ComposerWrapper>
    ),
  ],
  args: {
    attachedFiles: [],
    attachedEmails: [],
    onFileAttach: fn(),
    onFileRemove: fn(),
    onEmailAttach: fn(),
    onEmailRemove: fn(),
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: false,
      langgraph_mode: false,
      browser: false,
      x_api: false,
      slack: false,
      sheet_ai: false,
      docx_ai: false,
      pptx_ai: false,
      tldraw_ai: false,
      document_ai: false,
      create_file: false,
      create_folder: false,
      download_from_url: false,
      search_files: false,
      calendar: false,
      msCalendar: false,
      github: false,
      generate_image: false,
      generate_video: false,
      memory: false,
      plan_mode: false,
      ask_mode: false,
      model_provider: "anthropic" as const,
    },
    onUpdateToolPreferences: fn(),
    attachmentPayloads: {},
    onAttachmentPayload: fn(),
    onSend: fn(),
    onFileView: fn(),
    pendingChanges: [],
    onAcceptAll: fn(),
    onRejectAll: fn(),
    queuedMessages: [],
    onQueueMessage: fn(),
    onRemoveQueuedMessage: fn(),
    onMoveQueuedMessageToFront: fn(),
    onSendNextQueued: fn(),
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Composer>

export const Default: Story = {}

export const WithWebSearchEnabled: Story = {}

export const WithAttachedFiles: Story = {
  args: {
    attachedFiles: [
      {
        id: "file-1",
        name: "document.pdf",
        path: "/documents/document.pdf",
        type: "file",
        file_id: "file-1",
        size: 1024000,
      },
      {
        id: "file-2",
        name: "image.png",
        path: "/images/image.png",
        type: "file",
        file_id: "file-2",
        size: 512000,
      },
    ],
  },
}

export const WithAttachedEmails: Story = {
  args: {
    attachedEmails: [
      {
        id: "email-1",
        threadId: "thread-1",
        snippet: "This is a test email snippet...",
        internalDate: "1634567890000",
        payload: {
          headers: [
            { name: "subject", value: "Test Email Subject" },
            { name: "from", value: "sender@example.com" },
          ],
        },
      },
    ],
  },
}

export const WithPendingChanges: Story = {
  args: {
    pendingChanges: [
      {
        id: "change-1",
        type: "document",
        description: "Updated quarterly report.docx",
      },
      {
        id: "change-2",
        type: "spreadsheet",
        description: "Modified budget spreadsheet.xlsx",
      },
      {
        id: "change-3",
        type: "canvas",
        description: "Created new design mockup.fig",
      },
    ],
  },
}

export const WithAllAttachments: Story = {
  args: {
    attachedFiles: [
      {
        id: "file-1",
        name: "report.pdf",
        path: "/documents/report.pdf",
        type: "file",
        file_id: "file-1",
        size: 2048000,
      },
    ],
    attachedEmails: [
      {
        id: "email-1",
        threadId: "thread-1",
        snippet: "Important meeting notes...",
        internalDate: "1634567890000",
        payload: {
          headers: [
            { name: "subject", value: "Meeting Notes - Q4 Planning" },
            { name: "from", value: "manager@company.com" },
          ],
        },
      },
    ],
    pendingChanges: [
      {
        id: "change-1",
        type: "document",
        description: "meeting-notes.docx",
      },
    ],
  },
}

export const WithAllToolsEnabled: Story = {
  args: {
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: true,
      langgraph_mode: true,
      browser: true,
      x_api: true,
      slack: true,
      sheet_ai: true,
      docx_ai: true,
      pptx_ai: true,
      tldraw_ai: true,
      document_ai: true,
      create_file: true,
      create_folder: true,
      download_from_url: true,
      search_files: true,
      calendar: true,
      msCalendar: true,
      github: true,
      generate_image: true,
      generate_video: true,
      memory: true,
      plan_mode: false,
      ask_mode: false,
      model_provider: "anthropic" as const,
    },
  },
}

export const NoUserInfo: Story = {
  args: {
    userInfo: null,
  },
}

// Helper to create mock queued messages
const createMockQueuedMessage = (id: string, text: string, minutesAgo: number = 0): QueuedMessage => ({
  id,
  text,
  timestamp: Date.now() - minutesAgo * 60 * 1000,
})

export const WithQueuedMessages: Story = {
  args: {
    queuedMessages: [
      createMockQueuedMessage("1", "Can you also analyze the trends in this data?"),
      createMockQueuedMessage("2", "Create a summary for the executive team"),
      createMockQueuedMessage("3", "Export the results to a PDF"),
    ],
  },
}

export const WithQueuedMessagesAndAttachments: Story = {
  args: {
    queuedMessages: [
      createMockQueuedMessage("1", "Analyze the attached document"),
      createMockQueuedMessage("2", "Create a summary"),
    ],
    attachedFiles: [
      {
        id: "file-1",
        name: "report.pdf",
        path: "/documents/report.pdf",
        type: "file",
        file_id: "file-1",
        size: 2048000,
      },
    ],
  },
}

// Wrapper component to simulate editing queued message state
function EditingQueuedMessageWrapper({ 
  initialQueuedMessages, 
  editingMessageId,
  onRemoveQueuedMessage,
  ...props 
}: React.ComponentProps<typeof Composer> & { 
  initialQueuedMessages: QueuedMessage[]
  editingMessageId?: string
}) {
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>(initialQueuedMessages)
  const editingMessage = editingMessageId ? initialQueuedMessages.find(m => m.id === editingMessageId) : null

  // Simulate editing by removing the message from queue and setting it in the input
  useEffect(() => {
    if (editingMessageId && editingMessage) {
      // Remove from queue to simulate editing state
      setQueuedMessages(prev => prev.filter(m => m.id !== editingMessageId))
      if (onRemoveQueuedMessage) {
        onRemoveQueuedMessage(editingMessageId)
      }
      
      // Set the text in the composer input after a short delay to simulate the edit action
      setTimeout(() => {
        const input = document.querySelector('textarea[placeholder="Send a message..."]') as HTMLTextAreaElement
        if (input) {
          input.value = editingMessage.text
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          window.dispatchEvent(new CustomEvent('composer-set-text', { detail: { text: editingMessage.text } }))
        }
      }, 100)
    }
  }, [editingMessageId, editingMessage, onRemoveQueuedMessage])

  const handleRemoveQueuedMessage = (id: string) => {
    setQueuedMessages(prev => prev.filter(m => m.id !== id))
    if (onRemoveQueuedMessage) {
      onRemoveQueuedMessage(id)
    }
  }

  return (
    <Composer
      {...props}
      queuedMessages={queuedMessages}
      onRemoveQueuedMessage={handleRemoveQueuedMessage}
    />
  )
}

export const EditingQueuedMessage: Story = {
  render: (args) => (
    <EditingQueuedMessageWrapper
      {...args}
      initialQueuedMessages={[
        createMockQueuedMessage("1", "Can you analyze the quarterly data?"),
        createMockQueuedMessage("2", "Create a summary report"),
        createMockQueuedMessage("3", "Export to PDF format"),
      ]}
      editingMessageId="2"
    />
  ),
  args: {
    attachedFiles: [],
    attachedEmails: [],
    onFileAttach: fn(),
    onFileRemove: fn(),
    onEmailAttach: fn(),
    onEmailRemove: fn(),
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: false,
      langgraph_mode: false,
      browser: false,
      x_api: false,
      slack: false,
      sheet_ai: false,
      docx_ai: false,
      pptx_ai: false,
      tldraw_ai: false,
      document_ai: false,
      create_file: false,
      create_folder: false,
      download_from_url: false,
      search_files: false,
      calendar: false,
      msCalendar: false,
      github: false,
      generate_image: false,
      generate_video: false,
      memory: false,
      plan_mode: false,
      ask_mode: false,
      model_provider: "anthropic" as const,
    },
    onUpdateToolPreferences: fn(),
    attachmentPayloads: {},
    onAttachmentPayload: fn(),
    onSend: fn(),
    onFileView: fn(),
    pendingChanges: [],
    onAcceptAll: fn(),
    onRejectAll: fn(),
    onQueueMessage: fn(),
    onRemoveQueuedMessage: fn(),
    onMoveQueuedMessageToFront: fn(),
    onSendNextQueued: fn(),
  },
}

export const WithPendingChangesAndQueuedMessages: Story = {
  args: {
    queuedMessages: [
      createMockQueuedMessage("1", "Review the pending changes"),
      createMockQueuedMessage("2", "Apply the modifications"),
    ],
    pendingChanges: [
      {
        id: "change-1",
        type: "document",
        description: "Updated project proposal.docx",
      },
      {
        id: "change-2",
        type: "spreadsheet",
        description: "Modified financial forecast.xlsx",
      },
    ],
  },
}

export const EditingQueuedMessageWithPendingChanges: Story = {
  render: (args) => (
    <EditingQueuedMessageWrapper
      {...args}
      initialQueuedMessages={[
        createMockQueuedMessage("1", "Review the pending changes"),
        createMockQueuedMessage("2", "Apply the modifications"),
        createMockQueuedMessage("3", "Send confirmation email"),
      ]}
      editingMessageId="2"
    />
  ),
  args: {
    attachedFiles: [],
    attachedEmails: [],
    onFileAttach: fn(),
    onFileRemove: fn(),
    onEmailAttach: fn(),
    onEmailRemove: fn(),
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: false,
      langgraph_mode: false,
      browser: false,
      x_api: false,
      slack: false,
      sheet_ai: false,
      docx_ai: false,
      pptx_ai: false,
      tldraw_ai: false,
      document_ai: false,
      create_file: false,
      create_folder: false,
      download_from_url: false,
      search_files: false,
      calendar: false,
      msCalendar: false,
      github: false,
      generate_image: false,
      generate_video: false,
      memory: false,
      plan_mode: false,
      ask_mode: false,
      model_provider: "anthropic" as const,
    },
    onUpdateToolPreferences: fn(),
    attachmentPayloads: {},
    onAttachmentPayload: fn(),
    onSend: fn(),
    onFileView: fn(),
    pendingChanges: [
      {
        id: "change-1",
        type: "document",
        description: "Updated project proposal.docx",
      },
      {
        id: "change-2",
        type: "spreadsheet",
        description: "Modified financial forecast.xlsx",
      },
      {
        id: "change-3",
        type: "canvas",
        description: "Created new wireframe.fig",
      },
    ],
    onAcceptAll: fn(),
    onRejectAll: fn(),
    onQueueMessage: fn(),
    onRemoveQueuedMessage: fn(),
    onMoveQueuedMessageToFront: fn(),
    onSendNextQueued: fn(),
  },
}
