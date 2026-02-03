import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { QueuedMessagesDisplay, type QueuedMessage } from "frontend/components/RightPanel/composer/components/queued-messages-display"
import { TooltipProvider } from "@/components/common/ui/tooltip"

// Wrapper for stories
function QueuedMessagesWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-md mx-auto bg-background border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof QueuedMessagesDisplay> = {
  title: "Components/RightPanel/QueuedMessagesDisplay",
  component: QueuedMessagesDisplay,
  decorators: [
    (Story) => (
      <QueuedMessagesWrapper>
        <Story />
      </QueuedMessagesWrapper>
    ),
  ],
  args: {
    onRemove: fn(),
    onMoveToFront: fn(),
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# QueuedMessagesDisplay Component

The QueuedMessagesDisplay component shows a list of messages that are queued to be sent after the current AI task completes.

## Key Features

- **Collapsible Design**: Header can be clicked to expand/collapse the message list
- **Message Count**: Shows the number of queued messages
- **Queue Position**: Each message shows its position in the queue (#1, #2, etc.)
- **Move to Front**: Ability to move any message to the front of the queue
- **Remove Messages**: Delete messages from the queue
- **Truncation**: Long messages are truncated with ellipsis
- **Hover Actions**: Action buttons appear on hover for each message

## Use Cases

1. **Sequential Tasks**: When users want to queue up multiple instructions while the AI is busy
2. **Batch Operations**: Queue multiple related requests to be processed in order
3. **Follow-up Questions**: Queue clarifying questions while waiting for initial response

## Behavior

- Messages are sent automatically in order after the current task completes
- The queue persists until messages are sent or manually removed
- Moving a message to front reorders the queue without removing other messages
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof QueuedMessagesDisplay>

// Helper to create mock queued messages
const createMockMessage = (id: string, text: string, minutesAgo: number = 0): QueuedMessage => ({
  id,
  text,
  timestamp: Date.now() - minutesAgo * 60 * 1000,
})

export const Default: Story = {
  name: "Default View",
  args: {
    messages: [
      createMockMessage("1", "Can you also analyze the trends in this data?"),
      createMockMessage("2", "Create a summary for the executive team"),
      createMockMessage("3", "Export the results to a PDF"),
    ],
  },
}

export const SingleMessage: Story = {
  name: "Single Message",
  args: {
    messages: [createMockMessage("1", "Please also check the spelling in the document")],
  },
}

export const ManyMessages: Story = {
  name: "Many Messages",
  args: {
    messages: [
      createMockMessage("1", "First, update the header section"),
      createMockMessage("2", "Then fix the table formatting"),
      createMockMessage("3", "Add page numbers to the footer"),
      createMockMessage("4", "Update the table of contents"),
      createMockMessage("5", "Check all hyperlinks are working"),
      createMockMessage("6", "Verify image alt text is present"),
      createMockMessage("7", "Run final spell check"),
    ],
  },
}

export const LongMessages: Story = {
  name: "Long Messages (Truncated)",
  args: {
    messages: [
      createMockMessage(
        "1",
        "Can you please review the entire document and make sure all the formatting is consistent, including headers, fonts, and spacing throughout all sections?"
      ),
      createMockMessage(
        "2",
        "After that, please create a comprehensive summary that covers all the key points from each chapter and includes specific recommendations for improvement"
      ),
      createMockMessage(
        "3",
        "Finally, export everything to PDF format with proper bookmarks and a clickable table of contents for easy navigation"
      ),
    ],
  },
}

export const ShortMessages: Story = {
  name: "Short Messages",
  args: {
    messages: [
      createMockMessage("1", "Fix typos"),
      createMockMessage("2", "Add charts"),
      createMockMessage("3", "Save file"),
    ],
  },
}

export const TwoMessages: Story = {
  name: "Two Messages",
  args: {
    messages: [
      createMockMessage("1", "Calculate the quarterly totals"),
      createMockMessage("2", "Generate a trend analysis graph"),
    ],
  },
}

export const EmptyQueue: Story = {
  name: "Empty Queue (Hidden)",
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: "When there are no queued messages, the component renders nothing.",
      },
    },
  },
}

export const CodeInMessage: Story = {
  name: "Message with Code",
  args: {
    messages: [
      createMockMessage("1", "Update the function calculateTotal() to include tax"),
      createMockMessage("2", "Add error handling to the try/catch block in main.ts"),
      createMockMessage("3", "Refactor the UserService class to use dependency injection"),
    ],
  },
}

export const QuestionsQueue: Story = {
  name: "Queued Questions",
  args: {
    messages: [
      createMockMessage("1", "What is the total revenue for Q4?"),
      createMockMessage("2", "How does this compare to last year?"),
      createMockMessage("3", "Which product line performed best?"),
    ],
  },
}

export const MixedContent: Story = {
  name: "Mixed Content Types",
  args: {
    messages: [
      createMockMessage("1", "Analyze the sales data"),
      createMockMessage("2", "Create a bar chart showing monthly trends"),
      createMockMessage("3", "What are the top 3 recommendations?"),
      createMockMessage("4", "Email the report to team@company.com"),
      createMockMessage("5", "Schedule a meeting to discuss findings"),
    ],
  },
}

export const SpecialCharacters: Story = {
  name: "Special Characters",
  args: {
    messages: [
      createMockMessage("1", "Update the formula: =SUM(A1:A10) * 1.15"),
      createMockMessage("2", 'Search for "important" & replace with "critical"'),
      createMockMessage("3", "Add symbols: © ™ ® to the footer"),
    ],
  },
}

export const UrgentMessages: Story = {
  name: "Urgent/Priority Messages",
  args: {
    messages: [
      createMockMessage("1", "🚨 URGENT: Fix the broken API endpoint"),
      createMockMessage("2", "⚠️ Update security credentials before deployment"),
      createMockMessage("3", "📌 Review and approve the PR"),
    ],
  },
}

export const NumberedSteps: Story = {
  name: "Numbered Step Instructions",
  args: {
    messages: [
      createMockMessage("1", "Step 1: Backup the current database"),
      createMockMessage("2", "Step 2: Run the migration scripts"),
      createMockMessage("3", "Step 3: Verify data integrity"),
      createMockMessage("4", "Step 4: Update the application config"),
      createMockMessage("5", "Step 5: Restart all services"),
    ],
  },
}
