import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { LeftPanel } from "frontend/components/LeftPanel/LeftPanel"
import { fn } from "@storybook/test"
import { TooltipProvider } from "frontend/components/ui/tooltip"

function LeftPanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="h-screen w-80 bg-background">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof LeftPanel> = {
  title: "Components/LeftPanel",
  component: LeftPanel,
  decorators: [
    (Story: React.ComponentType) => (
      <LeftPanelWrapper>
        <Story />
      </LeftPanelWrapper>
    ),
  ],
  args: {
    currentView: "workspaces",
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    onFileSelect: fn(),
    selectedFile: null,
    onRefreshComplete: fn(),
    refreshTrigger: 0,
    onFileDeleted: fn(),
    onFileRenamed: fn(),
    onFileMoved: fn(),
    onFolderCreated: fn(),
    onFolderRenamed: fn(),
    onFolderDeleted: fn(),
    triggerRootFolderCreation: false,
    onEmailSelect: fn(),
    onComposeEmail: fn(),
    onCreateDocument: fn(),
    onCreateSpreadsheet: fn(),
    onCreateNotebook: fn(),
    onCreateDrawio: fn(),
    onCreateTldraw: fn(),
    onCreateFolder: fn(),
    onGenerateImage: fn(),
    onEventSelect: fn(),
    onOpenCalendar: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof LeftPanel>

export const Default: Story = {}

export const DashboardView: Story = {
  args: {
    currentView: "dashboard",
  },
}

export const WithSelectedFile: Story = {
  args: {
    selectedFile: {
      id: "file-1",
      name: "document.pdf",
      path: "/documents/document.pdf",
      type: "file",
      file_id: "file-1",
      size: 1024000,
    },
  },
}

export const NoUserInfo: Story = {
  args: {
    userInfo: null,
  },
}

export const WithRefreshTrigger: Story = {
  args: {
    refreshTrigger: 1,
  },
}

export const WithRootFolderCreationTrigger: Story = {
  args: {
    triggerRootFolderCreation: true,
  },
}

export const MinimalProps: Story = {
  args: {
    currentView: "workspaces",
    userInfo: null,
    onFileSelect: undefined,
    selectedFile: undefined,
    onRefreshComplete: undefined,
    refreshTrigger: undefined,
    onFileDeleted: undefined,
    onFileRenamed: undefined,
    onFileMoved: undefined,
    onFolderCreated: undefined,
    onFolderRenamed: undefined,
    onFolderDeleted: undefined,
    triggerRootFolderCreation: undefined,
    onEmailSelect: undefined,
    onComposeEmail: undefined,
    onCreateDocument: undefined,
    onCreateSpreadsheet: undefined,
    onCreateNotebook: undefined,
    onCreateDrawio: undefined,
    onCreateTldraw: undefined,
    onCreateFolder: undefined,
    onGenerateImage: undefined,
    onEventSelect: undefined,
    onOpenCalendar: undefined,
  },
}

export const WithAllCallbacks: Story = {
  args: {
    onFileSelect: fn((file) => {}),
    onEmailSelect: fn((email) => {}),
    onEventSelect: fn((event) => {}),
    onComposeEmail: fn(() => {}),
    onCreateDocument: fn((name) => {}),
    onCreateSpreadsheet: fn((name) => {}),
    onCreateNotebook: fn((name) => {}),
    onCreateDrawio: fn((name) => {}),
    onCreateTldraw: fn((name) => {}),
    onCreateFolder: fn(() => {}),
    onGenerateImage: fn(() => {}),
    onOpenCalendar: fn(() => {}),
    onFileDeleted: fn((fileId) => {}),
    onFileRenamed: fn((oldPath, newPath) => {}),
    onFileMoved: fn((fileId, oldPath, newPath) => {}),
    onFolderCreated: fn((folderPath) => {}),
    onFolderRenamed: fn((oldPath, newPath) => {}),
    onFolderDeleted: fn((folderPath) => {}),
    onRefreshComplete: fn(() => {}),
  },
}

// =============================================================================
// Integration State Stories
// =============================================================================

export const AllIntegrationsDisabled: Story = {
  name: "🔴 All Integrations Disabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: false,
          calendar: false,
          drive: false,
        }
      }
      return <Story />
    }
  ],
}

export const OnlyLocalFiles: Story = {
  name: "📁 Only Local Files (No Cloud)",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: false,
          calendar: false,
          drive: false,
        }
      }
      return <Story />
    }
  ],
}

export const GmailEnabled: Story = {
  name: "📧 Gmail Integration Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: true,
          calendar: false,
          drive: false,
        }
      }
      return <Story />
    }
  ],
}

export const CalendarEnabled: Story = {
  name: "📅 Calendar Integration Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: false,
          calendar: true,
          drive: false,
        }
      }
      return <Story />
    }
  ],
}

export const GoogleDriveEnabled: Story = {
  name: "☁️ Google Drive Integration Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: false,
          calendar: false,
          drive: true,
        }
      }
      return <Story />
    }
  ],
}

export const GmailAndCalendar: Story = {
  name: "📧📅 Gmail + Calendar Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: true,
          calendar: true,
          drive: false,
        }
      }
      return <Story />
    }
  ],
}

export const GmailAndDrive: Story = {
  name: "📧☁️ Gmail + Drive Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: true,
          calendar: false,
          drive: true,
        }
      }
      return <Story />
    }
  ],
}

export const CalendarAndDrive: Story = {
  name: "📅☁️ Calendar + Drive Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: false,
          calendar: true,
          drive: true,
        }
      }
      return <Story />
    }
  ],
}

export const AllIntegrationsEnabled: Story = {
  name: "🟢 All Integrations Enabled",
  args: {},
  decorators: [
    (Story: React.ComponentType) => {
      if (typeof window !== 'undefined') {
        (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
          gmail: true,
          calendar: true,
          drive: true,
        }
      }
      return <Story />
    }
  ],
}

