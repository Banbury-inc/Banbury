import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Composer } from "frontend/components/RightPanel/composer/Composer"
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { useLocalRuntime } from "@assistant-ui/react"
import { fn } from "@storybook/test"
import { TooltipProvider } from "frontend/components/ui/tooltip"

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
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="w-full max-w-4xl mx-auto p-4">
          {children}
        </div>
      </AssistantRuntimeProvider>
    </TooltipProvider>
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
    isWebSearchEnabled: false,
    onToggleWebSearch: fn(),
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: false,
      langgraph_mode: false,
      browser: false,
      x_api: false,
    },
    onUpdateToolPreferences: fn(),
    attachmentPayloads: {},
    onAttachmentPayload: fn(),
    onSend: fn(),
    onFileView: fn(),
    pendingChanges: [],
    onAcceptAll: fn(),
    onRejectAll: fn(),
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Composer>

export const Default: Story = {}

export const WithWebSearchEnabled: Story = {
  args: {
    isWebSearchEnabled: true,
  },
}

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
    isWebSearchEnabled: true,
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: true,
      langgraph_mode: true,
      browser: true,
      x_api: true,
    },
  },
}

export const NoUserInfo: Story = {
  args: {
    userInfo: null,
  },
}

