import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { FileAttachmentDisplay } from "frontend/components/RightPanel/composer/components/file-attachment-display"
import { TooltipProvider } from "frontend/components/ui/tooltip"
import type { FileSystemItem } from "frontend/utils/fileTreeUtils"

// Wrapper for stories
function FileAttachmentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-md mx-auto bg-background border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof FileAttachmentDisplay> = {
  title: "Components/RightPanel/FileAttachmentDisplay",
  component: FileAttachmentDisplay,
  decorators: [
    (Story) => (
      <FileAttachmentWrapper>
        <Story />
      </FileAttachmentWrapper>
    ),
  ],
  args: {
    onFileClick: fn(),
    onEmailClick: fn(),
    onFileView: fn(),
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# FileAttachmentDisplay Component

The FileAttachmentDisplay component shows a collapsible list of files and emails that are attached to the current conversation context.

## Key Features

- **Collapsible Design**: Header can be clicked to expand/collapse the attachment list
- **Mixed Content**: Supports both file attachments and email attachments
- **File Type Icons**: Different icons for different file types (diagrams, canvas, documents)
- **View Action**: Quick view button for diagram and canvas files
- **Remove Action**: Remove button for each attachment
- **Count Display**: Shows total count with breakdown for files vs emails

## Supported File Types

- **Diagrams**: .drawio files with network icon
- **Canvas**: .tldraw files with paintbrush icon  
- **Other Files**: Generic file icon

## Email Attachments

- Shows email subject
- Displays sender information on hover
- Remove button to detach email from context

## Use Cases

1. **Document Analysis**: Attach multiple documents for AI to analyze together
2. **Email Context**: Include relevant emails in the conversation
3. **Multi-file Operations**: Work with multiple files at once
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof FileAttachmentDisplay>

// Helper to create mock files
const createMockFile = (
  id: string,
  name: string,
  path: string,
  size: number = 1024
): FileSystemItem => ({
  id,
  name,
  path,
  type: "file",
  file_id: id,
  size,
})

// Helper to create mock emails
const createMockEmail = (
  id: string,
  subject: string,
  from: string
) => ({
  id,
  payload: {
    headers: [
      { name: "subject", value: subject },
      { name: "from", value: from },
    ],
  },
})

export const Default: Story = {
  name: "Default View (Files Only)",
  args: {
    files: [
      createMockFile("1", "quarterly-report.pdf", "/documents/quarterly-report.pdf", 2048000),
      createMockFile("2", "budget-2025.xlsx", "/spreadsheets/budget-2025.xlsx", 1024000),
      createMockFile("3", "meeting-notes.docx", "/documents/meeting-notes.docx", 512000),
    ],
    emails: [],
  },
}

export const SingleFile: Story = {
  name: "Single File",
  args: {
    files: [createMockFile("1", "presentation.pptx", "/documents/presentation.pptx", 5120000)],
    emails: [],
  },
}

export const WithDrawioFile: Story = {
  name: "With Drawio Diagram",
  args: {
    files: [
      createMockFile("1", "architecture.drawio", "/diagrams/architecture.drawio", 102400),
      createMockFile("2", "requirements.docx", "/documents/requirements.docx", 256000),
    ],
    emails: [],
  },
}

export const WithTldrawFile: Story = {
  name: "With Tldraw Canvas",
  args: {
    files: [
      createMockFile("1", "ui-mockup.tldraw", "/designs/ui-mockup.tldraw", 204800),
      createMockFile("2", "wireframes.tldraw", "/designs/wireframes.tldraw", 153600),
    ],
    emails: [],
  },
}

export const MixedDiagramsAndDocs: Story = {
  name: "Mixed Diagrams and Documents",
  args: {
    files: [
      createMockFile("1", "system-design.drawio", "/diagrams/system-design.drawio", 102400),
      createMockFile("2", "database-schema.drawio", "/diagrams/database-schema.drawio", 76800),
      createMockFile("3", "user-flow.tldraw", "/designs/user-flow.tldraw", 204800),
      createMockFile("4", "technical-spec.docx", "/documents/technical-spec.docx", 512000),
      createMockFile("5", "api-reference.pdf", "/documents/api-reference.pdf", 1024000),
    ],
    emails: [],
  },
}

export const EmailsOnly: Story = {
  name: "Emails Only",
  args: {
    files: [],
    emails: [
      createMockEmail("email-1", "Q4 Planning Discussion", "manager@company.com"),
      createMockEmail("email-2", "Budget Approval Request", "finance@company.com"),
      createMockEmail("email-3", "Project Timeline Update", "pm@company.com"),
    ],
  },
}

export const SingleEmail: Story = {
  name: "Single Email",
  args: {
    files: [],
    emails: [createMockEmail("email-1", "Important: Action Required", "ceo@company.com")],
  },
}

export const FilesAndEmails: Story = {
  name: "Files and Emails Combined",
  args: {
    files: [
      createMockFile("1", "proposal.docx", "/documents/proposal.docx", 1024000),
      createMockFile("2", "budget.xlsx", "/spreadsheets/budget.xlsx", 512000),
    ],
    emails: [
      createMockEmail("email-1", "RE: Proposal Feedback", "client@external.com"),
      createMockEmail("email-2", "Approved: Budget Increase", "finance@company.com"),
    ],
  },
}

export const ManyAttachments: Story = {
  name: "Many Attachments",
  args: {
    files: [
      createMockFile("1", "report-jan.pdf", "/reports/report-jan.pdf"),
      createMockFile("2", "report-feb.pdf", "/reports/report-feb.pdf"),
      createMockFile("3", "report-mar.pdf", "/reports/report-mar.pdf"),
      createMockFile("4", "report-apr.pdf", "/reports/report-apr.pdf"),
      createMockFile("5", "summary.docx", "/reports/summary.docx"),
      createMockFile("6", "charts.xlsx", "/reports/charts.xlsx"),
    ],
    emails: [
      createMockEmail("email-1", "Monthly Report Review", "team@company.com"),
      createMockEmail("email-2", "Feedback on Reports", "manager@company.com"),
      createMockEmail("email-3", "Action Items", "pm@company.com"),
    ],
  },
}

export const LongFileNames: Story = {
  name: "Long File Names (Truncated)",
  args: {
    files: [
      createMockFile(
        "1",
        "Q4-2024-Comprehensive-Financial-Analysis-Report-Final-Version-3.pdf",
        "/documents/Q4-2024-Comprehensive-Financial-Analysis-Report-Final-Version-3.pdf"
      ),
      createMockFile(
        "2",
        "Marketing-Campaign-Performance-Metrics-Dashboard-Export-December.xlsx",
        "/spreadsheets/Marketing-Campaign-Performance-Metrics-Dashboard-Export-December.xlsx"
      ),
    ],
    emails: [
      createMockEmail(
        "email-1",
        "RE: FWD: RE: Important Discussion About the Upcoming Quarterly Review Meeting",
        "very.long.email.address@subdomain.company.com"
      ),
    ],
  },
}

export const ImageFiles: Story = {
  name: "Image Files",
  args: {
    files: [
      createMockFile("1", "screenshot.png", "/images/screenshot.png", 512000),
      createMockFile("2", "logo.svg", "/assets/logo.svg", 24576),
      createMockFile("3", "photo.jpg", "/images/photo.jpg", 2048000),
      createMockFile("4", "icon.gif", "/assets/icon.gif", 10240),
    ],
    emails: [],
  },
}

export const CodeFiles: Story = {
  name: "Code Files",
  args: {
    files: [
      createMockFile("1", "main.ts", "/src/main.ts", 8192),
      createMockFile("2", "utils.ts", "/src/utils.ts", 4096),
      createMockFile("3", "config.json", "/config.json", 1024),
      createMockFile("4", "styles.css", "/src/styles.css", 2048),
    ],
    emails: [],
  },
}

export const EmptyAttachments: Story = {
  name: "Empty (Hidden)",
  args: {
    files: [],
    emails: [],
  },
  parameters: {
    docs: {
      description: {
        story: "When there are no files or emails, the component renders nothing.",
      },
    },
  },
}

export const NotebookFiles: Story = {
  name: "Jupyter Notebooks",
  args: {
    files: [
      createMockFile("1", "data-analysis.ipynb", "/notebooks/data-analysis.ipynb", 1048576),
      createMockFile("2", "ml-model.ipynb", "/notebooks/ml-model.ipynb", 2097152),
      createMockFile("3", "visualization.ipynb", "/notebooks/visualization.ipynb", 524288),
    ],
    emails: [],
  },
}

export const MixedMediaFiles: Story = {
  name: "Mixed Media Files",
  args: {
    files: [
      createMockFile("1", "presentation.pptx", "/presentations/presentation.pptx", 10485760),
      createMockFile("2", "audio-notes.mp3", "/media/audio-notes.mp3", 5242880),
      createMockFile("3", "demo-video.mp4", "/media/demo-video.mp4", 52428800),
      createMockFile("4", "transcript.txt", "/documents/transcript.txt", 8192),
    ],
    emails: [],
  },
}

export const ArchiveFiles: Story = {
  name: "Archive Files",
  args: {
    files: [
      createMockFile("1", "project-backup.zip", "/archives/project-backup.zip", 104857600),
      createMockFile("2", "assets.tar.gz", "/archives/assets.tar.gz", 52428800),
      createMockFile("3", "documents.rar", "/archives/documents.rar", 26214400),
    ],
    emails: [],
  },
}
