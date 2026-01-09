import React, { useState, useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { RightPanel } from "frontend/components/RightPanel/RightPanel"
import { fn } from "@storybook/test"
import { TooltipProvider } from "frontend/components/ui/tooltip"
import { Toaster } from "frontend/components/ui/toaster"

// Mock runtime provider wrapper for AssistantUI
function RightPanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="h-screen w-full bg-background flex">
        <div className="flex-1" />
        <div className="w-80 h-full flex-shrink-0">
          {children}
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}

const meta: Meta<typeof RightPanel> = {
  title: "Components/RightPanel",
  component: RightPanel,
  decorators: [
    (Story) => (
      <RightPanelWrapper>
        <Story />
      </RightPanelWrapper>
    ),
  ],
  args: {
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    selectedFile: null,
    selectedEmail: null,
    conversations: [],
    isLoadingConversations: false,
    onToggleCollapse: fn(),
    onLoadConversation: fn(),
    onDeleteConversation: fn(),
    onClearConversation: fn(),
    onEmailSelect: fn(),
    hasCalendarOpen: false,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# Right Panel Component

The Right Panel is the main AI assistant interface that provides intelligent interaction with files, emails, and documents. It includes:

- **Tab Management**: Multiple conversation tabs with drag-and-drop reordering
- **Todo List**: Task tracking for the active conversation thread
- **AI Conversation Interface**: Full-featured chat interface with file attachments, tool preferences, and message queuing
- **Conversation History**: Save, load, and manage conversation threads

## Key Features

- Multi-tab conversation management
- File and email context integration
- AI tool preferences configuration
- Pending changes tracking
- Message queuing during active conversations
- Conversation persistence and history
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof RightPanel>

export const Default: Story = {
  name: "Default View",
}

export const WithUserInfo: Story = {
  name: "With User Information",
  args: {
    userInfo: {
      username: "johndoe",
      email: "john.doe@example.com",
    },
  },
}

export const NoUserInfo: Story = {
  name: "No User Info (Anonymous)",
  args: {
    userInfo: null,
  },
}

export const WithSelectedFile: Story = {
  name: "With Selected File",
  args: {
    selectedFile: {
      id: "file-1",
      name: "quarterly-report.pdf",
      path: "/documents/quarterly-report.pdf",
      type: "file",
      file_id: "file-1",
      size: 2048000,
    },
  },
}

export const WithSelectedEmail: Story = {
  name: "With Selected Email",
  args: {
    selectedEmail: {
      id: "email-1",
      threadId: "thread-1",
      snippet: "This is an important email about the quarterly planning...",
      internalDate: "1634567890000",
      payload: {
        headers: [
          { name: "subject", value: "Q4 Planning Discussion" },
          { name: "from", value: "manager@company.com" },
          { name: "to", value: "test@example.com" },
        ],
      },
    },
  },
}

export const WithFileAndEmail: Story = {
  name: "With Both File and Email Selected",
  args: {
    selectedFile: {
      id: "file-5",
      name: "project-plan.pdf",
      path: "/documents/project-plan.pdf",
      type: "file",
      file_id: "file-5",
      size: 1536000,
    },
    selectedEmail: {
      id: "email-2",
      threadId: "thread-2",
      snippet: "Here's the project plan we discussed...",
      internalDate: "1634567890000",
      payload: {
        headers: [
          { name: "subject", value: "Project Plan Attachment" },
          { name: "from", value: "colleague@company.com" },
        ],
      },
    },
  },
}

export const WithSavedConversations: Story = {
  name: "With Saved Conversations",
  args: {
    conversations: [
      {
        _id: "conv-1",
        title: "Q4 Planning Discussion",
        created_at: "2024-01-15T10:30:00Z",
      },
      {
        _id: "conv-2",
        title: "Document Analysis Session",
        created_at: "2024-01-14T14:20:00Z",
      },
      {
        _id: "conv-3",
        title: "Email Draft Assistance",
        created_at: "2024-01-13T09:15:00Z",
      },
      {
        _id: "conv-4",
        title: "Spreadsheet Analysis",
        created_at: "2024-01-12T16:45:00Z",
      },
    ],
  },
}

export const LoadingConversations: Story = {
  name: "Loading Conversations",
  args: {
    isLoadingConversations: true,
  },
}

export const EmptyConversations: Story = {
  name: "No Saved Conversations",
  args: {
    conversations: [],
    isLoadingConversations: false,
  },
}

export const WithCalendarOpen: Story = {
  name: "With Calendar Open",
  args: {
    hasCalendarOpen: true,
  },
}

export const WithDocumentFile: Story = {
  name: "With Document File (.docx)",
  args: {
    selectedFile: {
      id: "file-doc",
      name: "meeting-notes.docx",
      path: "/documents/meeting-notes.docx",
      type: "file",
      file_id: "file-doc",
      size: 524288,
    },
  },
}

export const WithSpreadsheetFile: Story = {
  name: "With Spreadsheet File (.xlsx)",
  args: {
    selectedFile: {
      id: "file-sheet",
      name: "budget-2025.xlsx",
      path: "/spreadsheets/budget-2025.xlsx",
      type: "file",
      file_id: "file-sheet",
      size: 1048576,
    },
  },
}

export const WithImageFile: Story = {
  name: "With Image File",
  args: {
    selectedFile: {
      id: "file-image",
      name: "diagram.png",
      path: "/images/diagram.png",
      type: "file",
      file_id: "file-image",
      size: 307200,
    },
  },
}

export const WithDrawioFile: Story = {
  name: "With Drawio Diagram File",
  args: {
    selectedFile: {
      id: "file-drawio",
      name: "architecture.drawio",
      path: "/diagrams/architecture.drawio",
      type: "file",
      file_id: "file-drawio",
      size: 102400,
    },
  },
}

export const WithTldrawFile: Story = {
  name: "With Tldraw Drawing File",
  args: {
    selectedFile: {
      id: "file-tldraw",
      name: "sketch.tldraw",
      path: "/drawings/sketch.tldraw",
      type: "file",
      file_id: "file-tldraw",
      size: 51200,
    },
  },
}

export const WithNotebookFile: Story = {
  name: "With Jupyter Notebook",
  args: {
    selectedFile: {
      id: "file-notebook",
      name: "analysis.ipynb",
      path: "/notebooks/analysis.ipynb",
      type: "file",
      file_id: "file-notebook",
      size: 256000,
    },
  },
}

export const WithLargeFile: Story = {
  name: "With Large File",
  args: {
    selectedFile: {
      id: "file-large",
      name: "presentation.pptx",
      path: "/presentations/presentation.pptx",
      type: "file",
      file_id: "file-large",
      size: 52428800, // 50MB
    },
  },
}

export const WithManyConversations: Story = {
  name: "With Many Saved Conversations",
  args: {
    conversations: Array.from({ length: 20 }, (_, i) => ({
      _id: `conv-${i + 1}`,
      title: `Conversation ${i + 1}: ${["Planning", "Analysis", "Draft", "Review", "Discussion"][i % 5]}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    })),
  },
}

export const FullFeatured: Story = {
  name: "Full Featured Panel",
  args: {
    userInfo: {
      username: "poweruser",
      email: "poweruser@example.com",
    },
    selectedFile: {
      id: "file-full",
      name: "comprehensive-report.docx",
      path: "/workspace/comprehensive-report.docx",
      type: "file",
      file_id: "file-full",
      size: 3145728,
    },
    selectedEmail: {
      id: "email-full",
      threadId: "thread-full",
      snippet: "Important discussion about the comprehensive report...",
      internalDate: "1634567890000",
      payload: {
        headers: [
          { name: "subject", value: "Comprehensive Report Review" },
          { name: "from", value: "team@company.com" },
        ],
      },
    },
    conversations: [
      {
        _id: "conv-full-1",
        title: "Report Analysis Session",
        created_at: "2024-01-15T10:30:00Z",
      },
      {
        _id: "conv-full-2",
        title: "Email Draft Assistance",
        created_at: "2024-01-14T14:20:00Z",
      },
    ],
  },
}

export const EmptyState: Story = {
  name: "Empty State (No Selections)",
  args: {
    userInfo: {
      username: "newuser",
      email: "newuser@example.com",
    },
    selectedFile: null,
    selectedEmail: null,
    conversations: [],
  },
}
