import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { PendingChangesBar } from "frontend/components/RightPanel/composer/components/pending-changes-bar"
import { TooltipProvider } from "frontend/components/ui/tooltip"

// Wrapper for stories
function PendingChangesWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-lg mx-auto bg-background border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof PendingChangesBar> = {
  title: "Components/RightPanel/PendingChangesBar",
  component: PendingChangesBar,
  decorators: [
    (Story) => (
      <PendingChangesWrapper>
        <Story />
      </PendingChangesWrapper>
    ),
  ],
  args: {
    onAcceptAll: fn(),
    onRejectAll: fn(),
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# PendingChangesBar Component

The PendingChangesBar component displays a collapsible list of pending file changes that the AI has proposed. Users can accept or reject all changes at once.

## Key Features

- **Collapsible Design**: Header can be clicked to expand/collapse the changes list
- **File Count**: Shows the number of files with pending changes
- **File Type Icons**: Different icons for documents, spreadsheets, and canvas files
- **Accept All**: Button to accept all pending changes
- **Reject All**: Button to reject all pending changes
- **Change Descriptions**: Each change shows a description of what will be modified

## File Types

- **document**: Document files (blue icon) - .docx, .pdf, etc.
- **spreadsheet**: Spreadsheet files (green icon) - .xlsx, .csv, etc.
- **canvas**: Drawing/canvas files (purple icon) - .tldraw, .drawio, etc.
- **default**: Other file types (gray icon)

## Use Cases

1. **Document Editing**: AI suggests edits to a document
2. **Spreadsheet Updates**: AI proposes formula or data changes
3. **Canvas Modifications**: AI adds shapes or annotations to drawings
4. **Multi-file Changes**: AI modifies multiple files at once

## Behavior

- Changes are shown in a list below the header when expanded
- Accepting applies all changes to the files
- Rejecting discards all changes without modifying files
- The component is hidden when there are no pending changes
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof PendingChangesBar>

// Helper to create mock pending changes
interface PendingChange {
  id: string
  type: string
  description: string
}

const createPendingChange = (
  id: string,
  type: "document" | "spreadsheet" | "canvas" | "file",
  description: string
): PendingChange => ({
  id,
  type,
  description,
})

export const Default: Story = {
  name: "Default View",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Updated quarterly-report.docx"),
      createPendingChange("2", "spreadsheet", "Modified budget-2025.xlsx"),
      createPendingChange("3", "canvas", "Added shapes to architecture.tldraw"),
    ],
  },
}

export const SingleChange: Story = {
  name: "Single Change",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Updated meeting-notes.docx"),
    ],
  },
}

export const DocumentsOnly: Story = {
  name: "Documents Only",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Updated introduction in report.docx"),
      createPendingChange("2", "document", "Fixed typos in proposal.docx"),
      createPendingChange("3", "document", "Added conclusion to article.docx"),
    ],
  },
}

export const SpreadsheetsOnly: Story = {
  name: "Spreadsheets Only",
  args: {
    pendingChanges: [
      createPendingChange("1", "spreadsheet", "Added formulas to budget.xlsx"),
      createPendingChange("2", "spreadsheet", "Updated chart data in sales.xlsx"),
      createPendingChange("3", "spreadsheet", "Created pivot table in analytics.xlsx"),
    ],
  },
}

export const CanvasOnly: Story = {
  name: "Canvas/Drawing Only",
  args: {
    pendingChanges: [
      createPendingChange("1", "canvas", "Added annotations to diagram.tldraw"),
      createPendingChange("2", "canvas", "Created flowchart in process.drawio"),
    ],
  },
}

export const MixedFileTypes: Story = {
  name: "Mixed File Types",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Updated executive summary in report.docx"),
      createPendingChange("2", "spreadsheet", "Recalculated totals in budget.xlsx"),
      createPendingChange("3", "canvas", "Added new component to wireframe.tldraw"),
      createPendingChange("4", "file", "Modified config.json"),
    ],
  },
}

export const ManyChanges: Story = {
  name: "Many Changes",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Updated section 1 in chapter1.docx"),
      createPendingChange("2", "document", "Fixed formatting in chapter2.docx"),
      createPendingChange("3", "spreadsheet", "Added new rows to data.xlsx"),
      createPendingChange("4", "spreadsheet", "Updated formulas in calculations.xlsx"),
      createPendingChange("5", "canvas", "Added labels to diagram.tldraw"),
      createPendingChange("6", "canvas", "Created new layer in mockup.tldraw"),
      createPendingChange("7", "file", "Updated styles.css"),
      createPendingChange("8", "file", "Modified index.html"),
    ],
  },
}

export const LongDescriptions: Story = {
  name: "Long Descriptions",
  args: {
    pendingChanges: [
      createPendingChange(
        "1",
        "document",
        "Updated the comprehensive quarterly financial analysis report with new projections for Q2 2025"
      ),
      createPendingChange(
        "2",
        "spreadsheet",
        "Recalculated all formulas in the marketing campaign performance dashboard including ROI metrics"
      ),
      createPendingChange(
        "3",
        "canvas",
        "Added detailed annotations and callouts to the system architecture diagram highlighting key components"
      ),
    ],
  },
}

export const EmptyChanges: Story = {
  name: "Empty (Hidden)",
  args: {
    pendingChanges: [],
  },
  parameters: {
    docs: {
      description: {
        story: "When there are no pending changes, the component renders nothing.",
      },
    },
  },
}

export const TwoChanges: Story = {
  name: "Two Changes",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Improved introduction paragraph"),
      createPendingChange("2", "document", "Fixed grammar issues throughout"),
    ],
  },
}

export const CodeFileChanges: Story = {
  name: "Code File Changes",
  args: {
    pendingChanges: [
      createPendingChange("1", "file", "Updated main.ts with new API endpoints"),
      createPendingChange("2", "file", "Added error handling to utils.ts"),
      createPendingChange("3", "file", "Modified database schema in schema.sql"),
    ],
  },
}

export const DocumentRevisions: Story = {
  name: "Document Revisions",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Revised executive summary"),
      createPendingChange("2", "document", "Updated market analysis section"),
      createPendingChange("3", "document", "Added new recommendations"),
      createPendingChange("4", "document", "Fixed citations and references"),
      createPendingChange("5", "document", "Improved conclusion"),
    ],
  },
}

export const SpreadsheetCalculations: Story = {
  name: "Spreadsheet Calculations",
  args: {
    pendingChanges: [
      createPendingChange("1", "spreadsheet", "Added profit margin formulas"),
      createPendingChange("2", "spreadsheet", "Created monthly summary table"),
      createPendingChange("3", "spreadsheet", "Applied conditional formatting"),
      createPendingChange("4", "spreadsheet", "Generated year-over-year comparison"),
    ],
  },
}

export const DiagramUpdates: Story = {
  name: "Diagram Updates",
  args: {
    pendingChanges: [
      createPendingChange("1", "canvas", "Added new service components"),
      createPendingChange("2", "canvas", "Updated connection arrows"),
      createPendingChange("3", "canvas", "Created legend and annotations"),
    ],
  },
}

export const SingleDocumentChange: Story = {
  name: "Single Document Change",
  args: {
    pendingChanges: [
      createPendingChange("1", "document", "Minor grammar corrections in report.docx"),
    ],
  },
}

export const SingleSpreadsheetChange: Story = {
  name: "Single Spreadsheet Change",
  args: {
    pendingChanges: [
      createPendingChange("1", "spreadsheet", "Added SUM formula in budget.xlsx"),
    ],
  },
}

export const SingleCanvasChange: Story = {
  name: "Single Canvas Change",
  args: {
    pendingChanges: [
      createPendingChange("1", "canvas", "Added annotation to wireframe.tldraw"),
    ],
  },
}
