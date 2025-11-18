import type { Meta, StoryObj } from "@storybook/react"
import { DocumentAITool } from "frontend/components/RightPanel/composer/components/DocumentAITool"

const meta: Meta<typeof DocumentAITool> = {
  title: "AI Tools/DocumentAITool",
  component: DocumentAITool,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof DocumentAITool>

export const SetContent: Story = {
  args: {
    args: {
      action: "Set document content",
      htmlContent: "<h1>Welcome to Our Platform</h1><p>This is a comprehensive guide to getting started with our services.</p><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul>",
      note: "Setting initial document content"
    }
  }
}

export const ReplaceText: Story = {
  args: {
    args: {
      action: "Replace text",
      operations: [
        { type: "replaceText", target: "old text", replacement: "new improved text", all: true, caseSensitive: false },
        { type: "replaceText", target: "Company Name", replacement: "Acme Corporation", all: true }
      ],
      note: "Updating company references throughout document"
    }
  }
}

export const InsertContent: Story = {
  args: {
    args: {
      action: "Insert sections",
      operations: [
        { type: "insertAfterText", target: "Introduction", html: "<h2>Background</h2><p>This section provides context...</p>", occurrence: 1 },
        { type: "insertBeforeText", target: "Conclusion", html: "<h2>Summary</h2><p>Key takeaways include...</p>" }
      ],
      note: "Adding new sections to document"
    }
  }
}

export const ReplaceRange: Story = {
  args: {
    args: {
      action: "Replace content range",
      operations: [
        { type: "replaceBetween", from: 100, to: 500, html: "<p>This new content replaces the specified range with updated information.</p>" }
      ],
      note: "Replacing specific content range"
    }
  }
}

export const DeleteText: Story = {
  args: {
    args: {
      action: "Remove content",
      operations: [
        { type: "deleteText", target: "outdated information", all: true },
        { type: "deleteText", target: "confidential", all: true, caseSensitive: true }
      ],
      note: "Removing outdated and confidential information"
    }
  }
}

export const ComplexOperations: Story = {
  args: {
    args: {
      action: "Update document structure",
      operations: [
        { type: "replaceText", target: "2023", replacement: "2024", all: true },
        { type: "insertAfterText", target: "Executive Summary", html: "<p><em>Updated: January 2024</em></p>" },
        { type: "deleteText", target: "draft", all: true, caseSensitive: false },
        { type: "replaceBetween", from: 0, to: 50, html: "<h1>Annual Report 2024</h1>" }
      ],
      note: "Performing multiple document updates"
    }
  }
}

export const WithHTMLContent: Story = {
  args: {
    args: {
      action: "Insert rich content",
      htmlContent: "<div class='section'><h2>Product Features</h2><table><tr><th>Feature</th><th>Description</th></tr><tr><td>AI Integration</td><td>Advanced AI capabilities</td></tr><tr><td>Real-time Sync</td><td>Instant data synchronization</td></tr></table></div>",
      note: "Adding formatted table content"
    }
  }
}

export const EmptyOperations: Story = {
  args: {
    args: {
      action: "Empty operation",
      operations: []
    }
  }
}

