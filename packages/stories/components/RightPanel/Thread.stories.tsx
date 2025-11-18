import React, { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Thread } from "frontend/components/RightPanel/composer/thread/thread"
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react"
import { fn } from "@storybook/test"
import { TooltipProvider } from "frontend/components/ui/tooltip"
import { Toaster } from "frontend/components/ui/toaster"

// Mock runtime for AssistantUI with pre-populated messages
// Using the event-based message loading approach that the Thread component supports
function ThreadWrapper({ children, initialMessages = [] }: { children: React.ReactNode; initialMessages?: any[] }) {
  // Create a basic adapter that doesn't actually run anything
  const runtime = useLocalRuntime({
    async *run({ messages }) {
      // Just return a dummy response - we're using pre-loaded messages instead
      yield { 
        content: [{ type: "text", text: "" }],
        status: { type: "complete", reason: "stop" }
      }
    },
  })

  // Use the Thread component's built-in conversation loading mechanism
  useEffect(() => {
    if (initialMessages.length > 0) {
      // Dispatch the custom event that the Thread component listens for
      const event = new CustomEvent('assistant-load-conversation', {
        detail: { messages: initialMessages }
      })
      window.dispatchEvent(event)
    }
  }, [initialMessages])

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="h-screen w-full bg-background flex flex-col">
          {children}
        </div>
        <Toaster />
      </AssistantRuntimeProvider>
    </TooltipProvider>
  )
}

const meta: Meta<typeof Thread> = {
  title: "Components/RightPanel/Thread",
  component: Thread,
  decorators: [
    (Story) => (
      <ThreadWrapper>
        <Story />
      </ThreadWrapper>
    ),
  ],
  args: {
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    selectedFile: null,
    selectedEmail: null,
    onEmailSelect: fn(),
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# Right Panel Thread Component

The Thread component is the main AI-powered assistant interface that provides intelligent interaction with files, emails, and documents.

## Key Features

- **AI-Powered Conversations**: Full conversation interface using Assistant UI framework
- **File Context Management**: Attach and reference multiple files in conversations
- **Email Integration**: View and reference emails in AI conversations
- **Multi-Format Support**: Documents (DOCX, PDF), Spreadsheets (XLSX), Drawings (Tldraw), Diagrams (Drawio), Notebooks (IPYNB)
- **Tool Preferences**: Configure which AI tools are enabled (web search, document editing, browser automation, etc.)
- **Conversation History**: Save, load, and manage conversation threads
- **Pending Changes**: Track and apply AI-suggested changes to files

## AI Tool Integration

The Thread supports various AI-powered tools:

- **Web Search**: Internet search for research and fact-checking
- **Document Editing**: AI assistance for document manipulation (DOCX, PDF)
- **Spreadsheet Tools**: Data analysis and spreadsheet editing
- **Drawing Tools**: Tldraw and Drawio integration for diagrams
- **Browser Automation**: Web scraping and automation via Browserbase
- **Gmail Integration**: Email reading, composition, and management
- **X/Twitter API**: Social media integration

## Common Use Cases

1. **Document Analysis**: Select a document and get AI-powered summaries, edits, and insights
2. **Email Management**: Process emails with AI assistance for drafting responses and extracting information
3. **Data Analysis**: Work with spreadsheets to analyze trends and generate reports
4. **Design Collaboration**: Create and iterate on diagrams and drawings
5. **Research Tasks**: Use web search to gather information and fact-check content
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Thread>

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

export const WithSelectedDocument: Story = {
  name: "With Selected Document (.docx)",
  args: {
    selectedFile: {
      id: "file-2",
      name: "meeting-notes.docx",
      path: "/documents/meeting-notes.docx",
      type: "file",
      file_id: "file-2",
      size: 524288,
    },
  },
}

export const WithSelectedSpreadsheet: Story = {
  name: "With Selected Spreadsheet",
  args: {
    selectedFile: {
      id: "file-3",
      name: "budget-2025.xlsx",
      path: "/spreadsheets/budget-2025.xlsx",
      type: "file",
      file_id: "file-3",
      size: 1048576,
    },
  },
}

export const WithSelectedImage: Story = {
  name: "With Selected Image",
  args: {
    selectedFile: {
      id: "file-4",
      name: "diagram.png",
      path: "/images/diagram.png",
      type: "file",
      file_id: "file-4",
      size: 307200,
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
          { name: "date", value: "Mon, 18 Oct 2021 14:30:00 -0700" },
        ],
        body: {
          data: "VGhpcyBpcyB0aGUgZW1haWwgYm9keS4gSXQgY29udGFpbnMgaW1wb3J0YW50IGluZm9ybWF0aW9uIGFib3V0IHRoZSBxdWFydGVybHkgcGxhbm5pbmcu",
        },
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

export const WithDrawioFile: Story = {
  name: "With Drawio Diagram File",
  args: {
    selectedFile: {
      id: "file-6",
      name: "architecture.drawio",
      path: "/diagrams/architecture.drawio",
      type: "file",
      file_id: "file-6",
      size: 102400,
    },
  },
}

export const WithTldrawFile: Story = {
  name: "With Tldraw Drawing File",
  args: {
    selectedFile: {
      id: "file-7",
      name: "sketch.tldraw",
      path: "/drawings/sketch.tldraw",
      type: "file",
      file_id: "file-7",
      size: 51200,
    },
  },
}

export const WithNotebookFile: Story = {
  name: "With Jupyter Notebook",
  args: {
    selectedFile: {
      id: "file-8",
      name: "analysis.ipynb",
      path: "/notebooks/analysis.ipynb",
      type: "file",
      file_id: "file-8",
      size: 256000,
    },
  },
}

export const MultipleFilesContext: Story = {
  name: "Multiple File Types Context",
  args: {
    userInfo: {
      username: "dataanalyst",
      email: "analyst@company.com",
    },
    selectedFile: {
      id: "file-9",
      name: "data-report.xlsx",
      path: "/reports/data-report.xlsx",
      type: "file",
      file_id: "file-9",
      size: 2097152,
    },
  },
}

export const LargeFile: Story = {
  name: "With Large File Selected",
  args: {
    selectedFile: {
      id: "file-10",
      name: "presentation.pptx",
      path: "/presentations/presentation.pptx",
      type: "file",
      file_id: "file-10",
      size: 52428800, // 50MB
    },
  },
}

export const EmailConversationContext: Story = {
  name: "Email Conversation Thread Context",
  args: {
    userInfo: {
      username: "emailuser",
      email: "user@example.com",
    },
    selectedEmail: {
      id: "email-3",
      threadId: "thread-3",
      snippet: "RE: RE: RE: Project update - We need to discuss the timeline...",
      internalDate: "1634567890000",
      payload: {
        headers: [
          { name: "subject", value: "RE: RE: RE: Project update" },
          { name: "from", value: "team@company.com" },
          { name: "to", value: "user@example.com" },
        ],
      },
    },
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
  },
}

// =============================================================================
// Tool Preference Stories
// =============================================================================

export const AllToolsDisabled: Story = {
  name: "🔴 All AI Tools Disabled",
  args: {
    userInfo: {
      username: "restricteduser",
      email: "restricted@example.com",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Scenario where all AI tools and integrations are disabled in the composer.",
      },
    },
  },
}

export const WebSearchOnly: Story = {
  name: "🌐 Web Search Only",
  args: {
    userInfo: {
      username: "researcher",
      email: "researcher@example.com",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Scenario with only web search enabled for research tasks.",
      },
    },
  },
}

export const DocumentEditingTools: Story = {
  name: "📝 Document Editing Tools Enabled",
  args: {
    userInfo: {
      username: "writer",
      email: "writer@example.com",
    },
    selectedFile: {
      id: "file-doc",
      name: "article.docx",
      path: "/documents/article.docx",
      type: "file",
      file_id: "file-doc",
      size: 409600,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Scenario focused on document editing with AI assistance.",
      },
    },
  },
}

export const GmailIntegration: Story = {
  name: "📧 Gmail Integration Active",
  args: {
    userInfo: {
      username: "emailpro",
      email: "emailpro@example.com",
    },
    selectedEmail: {
      id: "email-gmail",
      threadId: "thread-gmail",
      snippet: "Email processing with AI assistance...",
      internalDate: "1634567890000",
      payload: {
        headers: [
          { name: "subject", value: "AI-Powered Email Management" },
          { name: "from", value: "contact@gmail.com" },
        ],
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Scenario with Gmail integration for email management with AI.",
      },
    },
  },
}

export const BrowserToolEnabled: Story = {
  name: "🌍 Browser Tool Enabled",
  args: {
    userInfo: {
      username: "webdev",
      email: "webdev@example.com",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Scenario with browser automation tool enabled for web tasks.",
      },
    },
  },
}

export const FullFeaturedWorkspace: Story = {
  name: "🟢 Full-Featured AI Workspace",
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
  },
  parameters: {
    docs: {
      description: {
        story: "Scenario with all AI features, tools, and integrations enabled.",
      },
    },
  },
}

// =============================================================================
// Workflow Stories
// =============================================================================

export const CodeReviewWorkflow: Story = {
  name: "💻 Code Review Workflow",
  args: {
    userInfo: {
      username: "developer",
      email: "dev@company.com",
    },
    selectedFile: {
      id: "file-code",
      name: "main.py",
      path: "/projects/app/main.py",
      type: "file",
      file_id: "file-code",
      size: 15360,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "AI assistant helping with code review and suggestions.",
      },
    },
  },
}

export const ContentCreationWorkflow: Story = {
  name: "✍️ Content Creation Workflow",
  args: {
    userInfo: {
      username: "contentcreator",
      email: "creator@media.com",
    },
    selectedFile: {
      id: "file-content",
      name: "blog-post.docx",
      path: "/content/blog-post.docx",
      type: "file",
      file_id: "file-content",
      size: 204800,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "AI assistant helping with content creation and editing.",
      },
    },
  },
}

export const DataAnalysisWorkflow: Story = {
  name: "📊 Data Analysis Workflow",
  args: {
    userInfo: {
      username: "dataanalyst",
      email: "analyst@data.com",
    },
    selectedFile: {
      id: "file-data",
      name: "sales-data.xlsx",
      path: "/analytics/sales-data.xlsx",
      type: "file",
      file_id: "file-data",
      size: 4194304,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "AI assistant helping with data analysis and visualization.",
      },
    },
  },
}

export const DesignWorkflow: Story = {
  name: "🎨 Design Workflow",
  args: {
    userInfo: {
      username: "designer",
      email: "design@creative.com",
    },
    selectedFile: {
      id: "file-design",
      name: "ui-mockup.tldraw",
      path: "/designs/ui-mockup.tldraw",
      type: "file",
      file_id: "file-design",
      size: 512000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "AI assistant helping with design creation and feedback.",
      },
    },
  },
}

// =============================================================================
// AI Response States
// =============================================================================

export const WithAIResponse: Story = {
  name: "💬 With AI Response",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Can you help me analyze this document?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "I'd be happy to help you analyze the document! Based on the file you've selected, I can provide insights on its content, structure, and key points. What specific aspects would you like me to focus on?\n\nHere are some things I can do:\n- Summarize the main points\n- Extract key data or statistics\n- Identify action items or recommendations\n- Analyze the writing style or tone\n- Compare it with other documents\n\nWhat would be most helpful for you?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    selectedFile: {
      id: "file-1",
      name: "quarterly-report.pdf",
      path: "/documents/quarterly-report.pdf",
      type: "file",
      file_id: "file-1",
      size: 2048000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing a completed AI response to a user query.",
      },
    },
  },
}

export const WithMultipleExchanges: Story = {
  name: "💬💬 Multiple Message Exchanges",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "What's in this spreadsheet?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "I can see this is a budget spreadsheet for 2025. It contains:\n\n- Monthly expense tracking\n- Revenue projections\n- Department-wise budget allocation\n- Year-over-year comparison charts\n\nWould you like me to analyze any specific section?",
            },
          ],
        },
        {
          id: "msg-3",
          role: "user",
          content: [{ type: "text", text: "Can you identify the top 3 expense categories?" }],
        },
        {
          id: "msg-4",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Based on the spreadsheet data, the top 3 expense categories are:\n\n1. **Personnel Costs** - $450,000 (45% of total budget)\n2. **Technology & Infrastructure** - $180,000 (18% of total budget)\n3. **Marketing & Sales** - $120,000 (12% of total budget)\n\nWould you like me to create a visualization or deeper analysis of these categories?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "analyst",
      email: "analyst@company.com",
    },
    selectedFile: {
      id: "file-budget",
      name: "budget-2025.xlsx",
      path: "/spreadsheets/budget-2025.xlsx",
      type: "file",
      file_id: "file-budget",
      size: 1048576,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread with multiple back-and-forth exchanges between user and AI.",
      },
    },
  },
}

export const WithLongAIResponse: Story = {
  name: "📜 Long AI Response",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Can you provide a detailed summary of this document?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: `# Comprehensive Document Summary

## Executive Overview
This quarterly report provides an in-depth analysis of the company's performance over Q4 2024. The document spans multiple sections covering financial metrics, operational achievements, market analysis, and strategic recommendations.

## Key Findings

### Financial Performance
- **Revenue Growth**: 23% year-over-year increase, reaching $15.2M
- **Profit Margins**: Improved from 12% to 18% through operational efficiency
- **Cash Flow**: Positive cash flow of $2.3M, strongest quarter to date
- **Customer Acquisition Cost**: Reduced by 15% through optimized marketing spend

### Operational Highlights
1. Successfully launched three new product features
2. Expanded team by 12 new hires across engineering and sales
3. Achieved 99.8% uptime for all services
4. Reduced customer support response time from 4 hours to 45 minutes

### Market Analysis
The market conditions remained favorable with increasing demand in our target segments. Competitor analysis shows we've gained 3% market share, moving from position #4 to #3 in our category.

### Strategic Recommendations
Based on the analysis, the following recommendations are proposed:
- Increase R&D investment by 20% to accelerate product innovation
- Expand into two new geographic markets (APAC and LATAM)
- Launch customer success program to improve retention
- Invest in AI/ML capabilities for product enhancement

## Risk Factors
- Economic uncertainty in Q1 2025
- Potential supply chain disruptions
- Increased competition from emerging players
- Regulatory changes in key markets

## Conclusion
The quarter demonstrated strong performance across all key metrics. With continued execution and strategic investments, the company is well-positioned for sustained growth in 2025.`,
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "executive",
      email: "exec@company.com",
    },
    selectedFile: {
      id: "file-report",
      name: "q4-report.pdf",
      path: "/reports/q4-report.pdf",
      type: "file",
      file_id: "file-report",
      size: 3145728,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread with a long, detailed AI response showcasing scrolling behavior.",
      },
    },
  },
}

// =============================================================================
// AI Tool Call States
// =============================================================================

export const WithWebSearchToolCall: Story = {
  name: "🔍 Web Search Tool Call",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "What are the latest developments in AI technology?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "web_search",
              args: {
                query: "latest AI technology developments 2025",
              },
              result: {
                results: [
                  {
                    title: "Major AI Breakthroughs in 2025",
                    url: "https://example.com/ai-breakthroughs",
                    snippet: "Recent advances in multimodal AI systems have enabled unprecedented capabilities in understanding and generating content across text, images, and video...",
                  },
                  {
                    title: "OpenAI Announces GPT-5",
                    url: "https://example.com/gpt5-announcement",
                    snippet: "OpenAI has revealed GPT-5, featuring enhanced reasoning capabilities and improved context understanding...",
                  },
                  {
                    title: "AI Regulation Updates",
                    url: "https://example.com/ai-regulation",
                    snippet: "New AI regulations have been implemented across major markets, focusing on transparency and safety...",
                  },
                ],
              },
            },
            {
              type: "text",
              text: "Based on the latest search results, here are the key developments in AI technology:\n\n1. **Multimodal AI Systems**: Significant advances in AI models that can seamlessly work across text, images, and video\n2. **GPT-5 Release**: OpenAI's latest model with enhanced reasoning and context understanding\n3. **AI Regulation**: New regulations focusing on transparency and safety across major markets\n\nWould you like me to dive deeper into any of these topics?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "researcher",
      email: "research@company.com",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing a web search tool call with results.",
      },
    },
  },
}

export const WithDocumentEditToolCall: Story = {
  name: "📝 Document Edit Tool Call",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Can you fix the grammar in this document and improve the executive summary?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "edit_document",
              args: {
                file_id: "file-doc",
                file_name: "proposal.docx",
                changes: "Grammar corrections and executive summary improvements",
              },
              result: {
                success: true,
                changes_made: [
                  "Corrected 12 grammar issues",
                  "Improved executive summary clarity",
                  "Enhanced transition sentences",
                ],
              },
            },
            {
              type: "text",
              text: "I've successfully updated your document with the following changes:\n\n✅ **Grammar Corrections**: Fixed 12 grammar issues throughout the document\n✅ **Executive Summary**: Improved clarity and impact of the opening section\n✅ **Flow**: Enhanced transition sentences between sections\n\nThe changes are pending your review. Would you like me to make any additional modifications?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "writer",
      email: "writer@company.com",
    },
    selectedFile: {
      id: "file-doc",
      name: "proposal.docx",
      path: "/documents/proposal.docx",
      type: "file",
      file_id: "file-doc",
      size: 524288,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing a document editing tool call with pending changes.",
      },
    },
  },
}

export const WithMultipleToolCalls: Story = {
  name: "🔧 Multiple Tool Calls",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Research current market trends and update our spreadsheet with the data" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "web_search",
              args: {
                query: "current market trends Q1 2025",
              },
              result: {
                results: [
                  {
                    title: "Q1 2025 Market Analysis",
                    snippet: "Market showing 15% growth in tech sector...",
                  },
                ],
              },
            },
            {
              type: "tool-call",
              toolName: "edit_spreadsheet",
              args: {
                file_id: "file-sheet",
                updates: "Added Q1 market trend data",
              },
              result: {
                success: true,
                rows_updated: 24,
              },
            },
            {
              type: "text",
              text: "I've completed both tasks:\n\n1. ✅ **Market Research**: Found current Q1 2025 trends showing 15% growth in tech sector\n2. ✅ **Spreadsheet Update**: Added the market data to 24 rows in your spreadsheet\n\nThe changes are ready for your review!",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "analyst",
      email: "analyst@company.com",
    },
    selectedFile: {
      id: "file-sheet",
      name: "market-data.xlsx",
      path: "/data/market-data.xlsx",
      type: "file",
      file_id: "file-sheet",
      size: 819200,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing multiple tool calls executed in sequence.",
      },
    },
  },
}

// =============================================================================
// Error and Limit States
// =============================================================================

export const UsageLimitReached: Story = {
  name: "⚠️ Usage Limit Reached",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Can you analyze this large dataset?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "⚠️ **Usage Limit Reached**\n\nYou've reached your daily usage limit for AI analysis. Your limits will reset in 6 hours.\n\n**Current Usage:**\n- API Calls: 100/100 (Daily limit)\n- Tokens Used: 50,000/50,000\n- File Uploads: 25/25\n\n**Options:**\n- Wait for reset at 12:00 AM UTC\n- Upgrade to Pro plan for unlimited usage\n- Contact support for assistance\n\nWould you like to upgrade your plan?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "freeuser",
      email: "free@example.com",
    },
    selectedFile: {
      id: "file-large",
      name: "large-dataset.xlsx",
      path: "/data/large-dataset.xlsx",
      type: "file",
      file_id: "file-large",
      size: 10485760,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing usage limit reached error state.",
      },
    },
  },
}

export const APIError: Story = {
  name: "❌ API Error",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Analyze this document for me" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "❌ **Error: Unable to Process Request**\n\nAn error occurred while processing your request:\n\n```\nError Code: 500\nMessage: Internal server error\nTimestamp: 2025-01-20T14:23:45Z\n```\n\n**Possible causes:**\n- Temporary service disruption\n- File format compatibility issue\n- Network connectivity problem\n\n**What to try:**\n1. Refresh the page and try again\n2. Check your internet connection\n3. Try with a different file\n4. Contact support if the issue persists\n\nWould you like to try again?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    selectedFile: {
      id: "file-error",
      name: "corrupted.pdf",
      path: "/documents/corrupted.pdf",
      type: "file",
      file_id: "file-error",
      size: 2048000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing an API error state.",
      },
    },
  },
}

export const FileTooBigError: Story = {
  name: "📦 File Too Large Error",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Can you process this video file?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "⚠️ **File Too Large**\n\nThe selected file exceeds the maximum size limit:\n\n**File Details:**\n- Name: presentation-video.mp4\n- Size: 250 MB\n- Maximum allowed: 100 MB\n\n**Suggestions:**\n1. Compress the file using a video compression tool\n2. Split the file into smaller segments\n3. Upload to cloud storage and share the link instead\n4. Upgrade to Pro plan (supports up to 500 MB files)\n\nWould you like help with any of these options?",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
    selectedFile: {
      id: "file-huge",
      name: "presentation-video.mp4",
      path: "/videos/presentation-video.mp4",
      type: "file",
      file_id: "file-huge",
      size: 262144000, // 250 MB
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing file size limit error.",
      },
    },
  },
}

export const NetworkError: Story = {
  name: "🌐 Network Error",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Search for recent news articles" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "🌐 **Network Connection Error**\n\nUnable to reach the server. Please check your connection:\n\n**Status:** Offline\n**Last successful connection:** 2 minutes ago\n\n**Troubleshooting:**\n- ✓ Check your internet connection\n- ✓ Verify firewall settings aren't blocking the connection\n- ✓ Try refreshing the page\n- ✓ Check if the service is experiencing downtime\n\n**Offline Mode:**\nYou can continue working with cached data. Your changes will sync automatically once the connection is restored.\n\n**Need immediate help?** Contact support via phone at 1-800-SUPPORT",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "testuser",
      email: "test@example.com",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing network connectivity error.",
      },
    },
  },
}

export const RateLimitWarning: Story = {
  name: "⏱️ Rate Limit Warning",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Generate 10 different document summaries" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "⏱️ **Rate Limit Warning**\n\nYou're approaching your rate limit:\n\n**Current Status:**\n- Requests: 45/50 per hour\n- Remaining: 5 requests\n- Resets in: 23 minutes\n\n**Recommendation:**\nConsider spacing out your requests or upgrading to a higher tier plan for increased limits.\n\n**Your Plan:**\n- Free Tier: 50 requests/hour\n- Pro Tier: 500 requests/hour (Upgrade available)\n- Enterprise: Unlimited\n\nWould you like me to proceed with your request? This will use 1 of your remaining 5 requests.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "activeuser",
      email: "active@example.com",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing rate limit warning before reaching the limit.",
      },
    },
  },
}

// =============================================================================
// Loading and Processing States
// =============================================================================

export const ProcessingLargeFile: Story = {
  name: "⏳ Processing Large File",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Analyze this 500-page document" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "⏳ **Processing Large Document**\n\nI'm analyzing your document. This may take a few moments...\n\n**Progress:**\n```\n████████████████░░░░ 75%\n```\n\n**Processing Steps:**\n- ✅ File uploaded\n- ✅ Content extraction\n- ✅ Text analysis\n- 🔄 Generating insights\n- ⏳ Creating summary\n\n**Estimated time remaining:** 45 seconds\n\nYou can continue working on other tasks. I'll notify you when the analysis is complete.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "researcher",
      email: "researcher@example.com",
    },
    selectedFile: {
      id: "file-large-doc",
      name: "comprehensive-report.pdf",
      path: "/documents/comprehensive-report.pdf",
      type: "file",
      file_id: "file-large-doc",
      size: 52428800,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing processing state for a large file.",
      },
    },
  },
}

// =============================================================================
// Pending Changes / Accept-Deny States
// =============================================================================

export const WithPendingDocumentEdit: Story = {
  name: "✏️ Pending Document Edit",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Can you improve the introduction section of this document?" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "docx_ai",
              args: {
                file_id: "file-doc",
                file_name: "report.docx",
                operations: [
                  {
                    type: "replaceText",
                    target: "Introduction",
                    replacement: "Executive Summary",
                  },
                ],
              },
              result: {
                success: true,
                message: "Document changes prepared",
              },
            },
            {
              type: "text",
              text: "I've prepared improvements to your introduction section:\n\n**Proposed Changes:**\n- Enhanced opening paragraph for better engagement\n- Added key statistics upfront\n- Improved flow and readability\n- Strengthened call-to-action\n\n**Please review the changes** using the pending changes bar below. You can accept or reject these modifications.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "writer",
      email: "writer@example.com",
    },
    selectedFile: {
      id: "file-doc",
      name: "report.docx",
      path: "/documents/report.docx",
      type: "file",
      file_id: "file-doc",
      size: 524288,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing AI-suggested document edits awaiting user approval.",
      },
    },
  },
}

export const WithMultiplePendingChanges: Story = {
  name: "✏️✏️ Multiple Pending Changes",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Update the document formatting and add charts to the spreadsheet" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "docx_ai",
              args: {
                file_id: "file-doc",
                operations: ["formatting updates"],
              },
              result: { success: true },
            },
            {
              type: "tool-call",
              toolName: "sheet_ai",
              args: {
                file_id: "file-sheet",
                operations: ["add charts"],
              },
              result: { success: true },
            },
            {
              type: "text",
              text: "I've prepared changes for both files:\n\n**Document Changes:**\n- Applied consistent heading styles\n- Updated font formatting\n- Adjusted margins and spacing\n\n**Spreadsheet Changes:**\n- Added revenue trend chart\n- Created expense breakdown pie chart\n- Inserted quarterly comparison graph\n\n**Review and approve** each change using the pending changes bar below.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "analyst",
      email: "analyst@example.com",
    },
    selectedFile: {
      id: "file-doc",
      name: "report.docx",
      path: "/documents/report.docx",
      type: "file",
      file_id: "file-doc",
      size: 524288,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing multiple AI tool suggestions across different file types.",
      },
    },
  },
}

export const WithCanvasChanges: Story = {
  name: "🎨 Pending Canvas Changes",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Add annotations to highlight the key components in this diagram" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "tldraw_ai",
              args: {
                canvas_id: "canvas-1",
                operations: [
                  { type: "addShape", shapeType: "annotation" },
                  { type: "addShape", shapeType: "arrow" },
                ],
              },
              result: {
                success: true,
                shapes_added: 5,
              },
            },
            {
              type: "text",
              text: "I've created annotations for your diagram:\n\n**Added Elements:**\n- ✅ 3 text annotations highlighting key areas\n- ✅ 2 arrow indicators pointing to important components\n- ✅ Color-coded sections for better organization\n\n**Preview the changes** in your canvas and approve when ready.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "designer",
      email: "designer@example.com",
    },
    selectedFile: {
      id: "file-canvas",
      name: "system-architecture.tldraw",
      path: "/diagrams/system-architecture.tldraw",
      type: "file",
      file_id: "file-canvas",
      size: 204800,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing AI-suggested canvas/drawing modifications.",
      },
    },
  },
}

export const WithSpreadsheetSuggestions: Story = {
  name: "📊 Pending Spreadsheet Changes",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Calculate the profit margins for each product and add conditional formatting" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "sheet_ai",
              args: {
                file_id: "file-spreadsheet",
                operations: [
                  { type: "addFormula", formula: "=(Revenue - Cost) / Revenue" },
                  { type: "addFormatting", range: "E2:E50" },
                ],
              },
              result: {
                success: true,
                rows_updated: 48,
                formulas_added: 48,
              },
            },
            {
              type: "text",
              text: "I've prepared spreadsheet updates:\n\n**Calculations Added:**\n- Profit margin formula applied to all products (48 rows)\n- Average margin: 23.4%\n- Top performer: Product A (38% margin)\n- Lowest: Product F (12% margin)\n\n**Formatting Applied:**\n- Green highlights for margins > 25%\n- Yellow for 15-25%\n- Red for < 15%\n\n**Review the changes** before applying them to your spreadsheet.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "analyst",
      email: "analyst@data.com",
    },
    selectedFile: {
      id: "file-spreadsheet",
      name: "product-analysis.xlsx",
      path: "/data/product-analysis.xlsx",
      type: "file",
      file_id: "file-spreadsheet",
      size: 1048576,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing AI-suggested spreadsheet calculations and formatting.",
      },
    },
  },
}

export const WithComplexDocumentRevisions: Story = {
  name: "📝 Complex Document Revisions",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Restructure this document to follow a more logical flow and add section summaries" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "docx_ai",
              args: {
                file_id: "file-complex-doc",
                operations: [
                  { type: "reorder", sections: ["intro", "methodology", "results", "discussion"] },
                  { type: "insertText", location: "end_of_section", text: "Summary text..." },
                ],
              },
              result: {
                success: true,
                sections_reordered: 4,
                summaries_added: 4,
              },
            },
            {
              type: "text",
              text: "I've restructured your document with major improvements:\n\n**Structure Changes:**\n- ✅ Reordered sections for better logical flow\n- ✅ Moved methodology before results\n- ✅ Added executive summary at the beginning\n- ✅ Reorganized discussion section\n\n**Content Additions:**\n- ✅ Section summaries for each major part\n- ✅ Transition paragraphs between sections\n- ✅ Key takeaways highlighted\n\n**This is a significant revision** - please review carefully before accepting.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "editor",
      email: "editor@publishing.com",
    },
    selectedFile: {
      id: "file-complex-doc",
      name: "research-paper.docx",
      path: "/documents/research-paper.docx",
      type: "file",
      file_id: "file-complex-doc",
      size: 2097152,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing complex, multi-step document revisions awaiting approval.",
      },
    },
  },
}

export const AfterAcceptingChanges: Story = {
  name: "✅ After Accepting Changes",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Fix the grammar in this document" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "docx_ai",
              args: {
                file_id: "file-grammar",
                operations: [{ type: "grammarCheck" }],
              },
              result: { success: true, corrections: 15 },
            },
            {
              type: "text",
              text: "I've corrected 15 grammar issues in your document. The changes have been applied!\n\n**Corrections Made:**\n- Subject-verb agreement (5 instances)\n- Punctuation (6 instances)\n- Sentence structure (3 instances)\n- Word usage (1 instance)\n\n✅ **Changes successfully applied** to your document.",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "writer",
      email: "writer@example.com",
    },
    selectedFile: {
      id: "file-grammar",
      name: "draft.docx",
      path: "/documents/draft.docx",
      type: "file",
      file_id: "file-grammar",
      size: 307200,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing the state after user has accepted AI suggestions.",
      },
    },
  },
}

export const AfterRejectingChanges: Story = {
  name: "❌ After Rejecting Changes",
  decorators: [
    (Story) => {
      const initialMessages = [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "Make this document more formal" }],
        },
        {
          id: "msg-2",
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolName: "docx_ai",
              args: {
                file_id: "file-formal",
                operations: [{ type: "changeStyle", style: "formal" }],
              },
              result: { success: true },
            },
            {
              type: "text",
              text: "I prepared formal style changes, but you rejected them.\n\n❌ **Changes discarded** - your document remains unchanged.\n\nWould you like me to try a different approach or make specific adjustments instead?",
            },
          ],
        },
        {
          id: "msg-3",
          role: "user",
          content: [{ type: "text", text: "Can you make it slightly more formal but keep the friendly tone?" }],
        },
        {
          id: "msg-4",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Good idea! I'll balance professionalism with approachability. Let me prepare revised changes that maintain warmth while elevating the tone...",
            },
          ],
        },
      ]

      return (
        <ThreadWrapper initialMessages={initialMessages}>
          <Story />
        </ThreadWrapper>
      )
    },
  ],
  args: {
    userInfo: {
      username: "writer",
      email: "writer@example.com",
    },
    selectedFile: {
      id: "file-formal",
      name: "blog-post.docx",
      path: "/documents/blog-post.docx",
      type: "file",
      file_id: "file-formal",
      size: 409600,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Thread showing the state after user has rejected AI suggestions with follow-up.",
      },
    },
  },
}

