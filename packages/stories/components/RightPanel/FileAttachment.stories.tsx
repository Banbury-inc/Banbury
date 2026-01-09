import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { FileAttachment } from "frontend/components/RightPanel/composer/components/file-attachment"
import { TooltipProvider } from "frontend/components/ui/tooltip"
import type { FileSystemItem } from "frontend/utils/fileTreeUtils"

// Wrapper for stories
function FileAttachmentPickerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-md mx-auto p-4 bg-background border border-border rounded-lg">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof FileAttachment> = {
  title: "Components/RightPanel/FileAttachment",
  component: FileAttachment,
  decorators: [
    (Story) => (
      <FileAttachmentPickerWrapper>
        <Story />
      </FileAttachmentPickerWrapper>
    ),
  ],
  args: {
    onFileAttach: fn(),
    onFileRemove: fn(),
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# FileAttachment Component

The FileAttachment component provides a button to attach files to the conversation and displays a list of currently attached files.

## Key Features

- **Attach Button**: Opens a file picker dropdown to select files
- **Attached Files List**: Shows all currently attached files with type-specific icons
- **Remove Files**: Each attached file has a remove button
- **File Type Icons**: Different icons based on file extension
- **User Context**: Uses user info to fetch available files

## File Icon Types

The component uses different icons based on file extensions:
- Documents (.pdf, .docx, .txt)
- Spreadsheets (.xlsx, .csv)
- Images (.png, .jpg, .gif)
- Code files (.ts, .js, .py)
- And more...

## Behavior

1. Click the paperclip button to open the file picker
2. Select a file from the dropdown
3. File appears in the attached files list
4. Click X to remove a file from the list
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof FileAttachment>

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

export const Default: Story = {
  name: "Default (No Files)",
  args: {
    attachedFiles: [],
  },
}

export const WithAttachedFiles: Story = {
  name: "With Attached Files",
  args: {
    attachedFiles: [
      createMockFile("1", "report.pdf", "/documents/report.pdf", 2048000),
      createMockFile("2", "data.xlsx", "/spreadsheets/data.xlsx", 1024000),
    ],
  },
}

export const SingleFile: Story = {
  name: "Single Attached File",
  args: {
    attachedFiles: [
      createMockFile("1", "quarterly-results.pdf", "/documents/quarterly-results.pdf", 3145728),
    ],
  },
}

export const ManyFiles: Story = {
  name: "Many Attached Files",
  args: {
    attachedFiles: [
      createMockFile("1", "document.docx", "/docs/document.docx", 512000),
      createMockFile("2", "spreadsheet.xlsx", "/sheets/spreadsheet.xlsx", 1024000),
      createMockFile("3", "presentation.pptx", "/slides/presentation.pptx", 5120000),
      createMockFile("4", "image.png", "/images/image.png", 2048000),
      createMockFile("5", "script.py", "/code/script.py", 8192),
    ],
  },
}

export const DocumentFiles: Story = {
  name: "Document Files",
  args: {
    attachedFiles: [
      createMockFile("1", "contract.pdf", "/legal/contract.pdf", 1048576),
      createMockFile("2", "proposal.docx", "/docs/proposal.docx", 524288),
      createMockFile("3", "notes.txt", "/notes/notes.txt", 4096),
      createMockFile("4", "readme.md", "/readme.md", 2048),
    ],
  },
}

export const SpreadsheetFiles: Story = {
  name: "Spreadsheet Files",
  args: {
    attachedFiles: [
      createMockFile("1", "budget.xlsx", "/finance/budget.xlsx", 2097152),
      createMockFile("2", "sales-data.csv", "/data/sales-data.csv", 524288),
      createMockFile("3", "inventory.xlsx", "/inventory/inventory.xlsx", 1048576),
    ],
  },
}

export const ImageFiles: Story = {
  name: "Image Files",
  args: {
    attachedFiles: [
      createMockFile("1", "screenshot.png", "/images/screenshot.png", 512000),
      createMockFile("2", "photo.jpg", "/images/photo.jpg", 2048000),
      createMockFile("3", "logo.svg", "/assets/logo.svg", 24576),
      createMockFile("4", "diagram.gif", "/images/diagram.gif", 102400),
    ],
  },
}

export const CodeFiles: Story = {
  name: "Code Files",
  args: {
    attachedFiles: [
      createMockFile("1", "app.ts", "/src/app.ts", 8192),
      createMockFile("2", "utils.js", "/lib/utils.js", 4096),
      createMockFile("3", "styles.css", "/styles/styles.css", 2048),
      createMockFile("4", "config.json", "/config.json", 1024),
      createMockFile("5", "schema.sql", "/db/schema.sql", 16384),
    ],
  },
}

export const DiagramFiles: Story = {
  name: "Diagram Files",
  args: {
    attachedFiles: [
      createMockFile("1", "architecture.drawio", "/diagrams/architecture.drawio", 102400),
      createMockFile("2", "wireframe.tldraw", "/designs/wireframe.tldraw", 204800),
      createMockFile("3", "flowchart.drawio", "/diagrams/flowchart.drawio", 76800),
    ],
  },
}

export const MixedFileTypes: Story = {
  name: "Mixed File Types",
  args: {
    attachedFiles: [
      createMockFile("1", "report.pdf", "/docs/report.pdf", 2048000),
      createMockFile("2", "data.xlsx", "/sheets/data.xlsx", 1024000),
      createMockFile("3", "screenshot.png", "/images/screenshot.png", 512000),
      createMockFile("4", "main.ts", "/src/main.ts", 8192),
      createMockFile("5", "architecture.drawio", "/diagrams/architecture.drawio", 102400),
    ],
  },
}

export const LongFileNames: Story = {
  name: "Long File Names",
  args: {
    attachedFiles: [
      createMockFile(
        "1",
        "Q4-2024-Comprehensive-Financial-Analysis-Report-Final-Version.pdf",
        "/documents/Q4-2024-Comprehensive-Financial-Analysis-Report-Final-Version.pdf",
        5242880
      ),
      createMockFile(
        "2",
        "Marketing-Campaign-Performance-Dashboard-December-2024.xlsx",
        "/spreadsheets/Marketing-Campaign-Performance-Dashboard-December-2024.xlsx",
        2097152
      ),
    ],
  },
}

export const NoUserInfo: Story = {
  name: "No User Info",
  args: {
    attachedFiles: [createMockFile("1", "document.pdf", "/document.pdf", 1024000)],
    userInfo: null,
  },
}

export const LargeFiles: Story = {
  name: "Large Files",
  args: {
    attachedFiles: [
      createMockFile("1", "video.mp4", "/media/video.mp4", 104857600), // 100MB
      createMockFile("2", "archive.zip", "/archives/archive.zip", 52428800), // 50MB
      createMockFile("3", "dataset.csv", "/data/dataset.csv", 26214400), // 25MB
    ],
  },
}

export const NotebookFiles: Story = {
  name: "Notebook Files",
  args: {
    attachedFiles: [
      createMockFile("1", "analysis.ipynb", "/notebooks/analysis.ipynb", 1048576),
      createMockFile("2", "ml-training.ipynb", "/notebooks/ml-training.ipynb", 2097152),
    ],
  },
}
