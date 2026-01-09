import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SubagentTool } from "frontend/components/RightPanel/composer/components/SubagentTool"
import { TooltipProvider } from "frontend/components/ui/tooltip"

// Wrapper for stories
function SubagentToolWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto p-4 bg-background">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof SubagentTool> = {
  title: "Components/RightPanel/SubagentTool",
  component: SubagentTool,
  decorators: [
    (Story) => (
      <SubagentToolWrapper>
        <Story />
      </SubagentToolWrapper>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# SubagentTool Component

The SubagentTool component displays the spawn_subagents tool call card, which orchestrates multiple AI subagents running in parallel. Each subagent has a specific role and goal, and their streaming content is displayed in nested SubagentStreamCard components.

## Key Features

- **Multi-Agent Orchestration**: Manages multiple subagents with different roles
- **Real-Time Status**: Shows progress (X/N running, X/N completed)
- **Collapsible Interface**: Expandable/collapsible to save space
- **Live Streaming**: Each subagent's output streams in real-time
- **Role-Based Organization**: Groups subagents by their specialized roles
- **Summary View**: Shows aggregated results when complete

## Subagent Roles

The tool supports five specialized subagent roles:

- **🔍 Researcher** (Purple): Web search, summarization, citations (read-only)
- **📁 Codebase** (Blue): File/memory search, code analysis (read-only)
- **📋 Planner** (Amber): Research and planning (read-only)
- **💻 Coder** (Green): Full tool access for implementation (write-capable)
- **👀 Reviewer** (Rose): Analysis, critique, risk assessment (read-only)

## States

- **Running**: Shows active subagent count, streaming updates
- **Completed**: Shows completion summary with durations
- **Failed**: Displays error information for failed subagents
- **Mixed**: Some completed, some running, some failed

## Usage

Part of the LangGraph-based multi-agent workflow where the main agent spawns specialized subagents to work in parallel on complex tasks.
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof SubagentTool>

// Sample args with 3 researcher subagents
const threeResearchersArgs = {
  subagents: [
    {
      id: "auth-research",
      role: "researcher",
      goal: "Research React authentication best practices and security patterns",
    },
    {
      id: "state-research",
      role: "researcher",
      goal: "Research state management solutions (Redux Toolkit, Zustand, Jotai)",
    },
    {
      id: "testing-research",
      role: "researcher",
      goal: "Research testing strategies for React applications",
    },
  ],
}

// Sample args for complete workflow
const completeWorkflowArgs = {
  subagents: [
    {
      id: "research-1",
      role: "researcher",
      goal: "Research authentication best practices",
    },
    {
      id: "codebase-1",
      role: "codebase",
      goal: "Analyze current authentication implementation",
    },
    {
      id: "planner-1",
      role: "planner",
      goal: "Create implementation plan for auth upgrade",
    },
    {
      id: "coder-1",
      role: "coder",
      goal: "Implement token refresh mechanism",
    },
    {
      id: "reviewer-1",
      role: "reviewer",
      goal: "Review implementation for security issues",
    },
  ],
}

// Sample result for completed subagents
const completedResult = JSON.stringify({
  results: [
    {
      id: "auth-research",
      role: "researcher",
      status: "completed",
      summary: "Found JWT storage best practices: use memory for access tokens, httpOnly cookies for refresh tokens. Implement CSRF protection and token rotation.",
      citations: [
        "https://auth0.com/blog/secure-browser-storage",
        "https://developer.mozilla.org/en-US/docs/Web/Security",
      ],
      durationMs: 2340,
      toolsUsed: ["web_search"],
    },
    {
      id: "state-research",
      role: "researcher",
      status: "completed",
      summary: "Redux Toolkit best for large apps with complex state. Zustand great for small-medium apps. Jotai offers atomic state with excellent TypeScript support.",
      citations: [
        "https://redux-toolkit.js.org/",
        "https://github.com/pmndrs/zustand",
      ],
      durationMs: 1890,
      toolsUsed: ["web_search"],
    },
    {
      id: "testing-research",
      role: "researcher",
      status: "completed",
      summary: "Recommended stack: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E. Use MSW for API mocking.",
      citations: [
        "https://vitest.dev/",
        "https://testing-library.com/react",
      ],
      durationMs: 2150,
      toolsUsed: ["web_search"],
    },
  ],
  completedCount: 3,
  failedCount: 0,
  totalDurationMs: 6380,
})

const mixedResultsWithFailure = JSON.stringify({
  results: [
    {
      id: "research-1",
      role: "researcher",
      status: "completed",
      summary: "JWT storage best practices documented.",
      durationMs: 2100,
      toolsUsed: ["web_search"],
    },
    {
      id: "codebase-1",
      role: "codebase",
      status: "completed",
      summary: "Current auth implementation uses localStorage (insecure). No refresh token mechanism.",
      durationMs: 1800,
      toolsUsed: ["search_files", "search_memory"],
    },
    {
      id: "planner-1",
      role: "planner",
      status: "completed",
      summary: "Created 3-phase implementation plan: token storage migration, security enhancements, testing.",
      durationMs: 3200,
      toolsUsed: ["search_files", "web_search"],
    },
    {
      id: "coder-1",
      role: "coder",
      status: "failed",
      error: "Failed to write file: Permission denied for /src/auth/tokenManager.ts",
      durationMs: 1500,
      toolsUsed: ["search_files", "write_workspace_file"],
    },
    {
      id: "reviewer-1",
      role: "reviewer",
      status: "completed",
      summary: "Code review complete. Critical issues: token storage vulnerability, missing CSRF protection. Recommend addressing before production.",
      durationMs: 2700,
      toolsUsed: ["search_files", "web_search"],
    },
  ],
  completedCount: 4,
  failedCount: 1,
  totalDurationMs: 11300,
})

export const InitialPending: Story = {
  name: "Initial State (Pending)",
  args: {
    args: threeResearchersArgs,
  },
}

export const RunningThreeSubagents: Story = {
  name: "Running - 3 Researchers",
  args: {
    args: threeResearchersArgs,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows three researcher subagents actively running in parallel. Click to expand and see individual progress.",
      },
    },
  },
}

export const CompletedThreeSubagents: Story = {
  name: "Completed - 3 Researchers",
  args: {
    args: threeResearchersArgs,
    result: completedResult,
  },
  parameters: {
    docs: {
      description: {
        story: "All three researcher subagents have completed successfully. Expand to see summaries and citations.",
      },
    },
  },
}

export const CompleteWorkflowRunning: Story = {
  name: "Complete Workflow - Running",
  args: {
    args: completeWorkflowArgs,
  },
  parameters: {
    docs: {
      description: {
        story: "Full multi-agent workflow with all 5 role types: researcher, codebase, planner, coder, and reviewer.",
      },
    },
  },
}

export const CompleteWorkflowWithFailure: Story = {
  name: "Complete Workflow - Mixed Results",
  args: {
    args: completeWorkflowArgs,
    result: mixedResultsWithFailure,
  },
  parameters: {
    docs: {
      description: {
        story: "Complete workflow where 4 subagents succeeded and 1 (coder) failed. Shows error handling.",
      },
    },
  },
}

export const SixResearchers: Story = {
  name: "6 Researchers - Parallel Execution",
  args: {
    args: {
      subagents: [
        {
          id: "nfl-breaking",
          role: "researcher",
          goal: "Find latest breaking NFL news from the past 24-48 hours",
        },
        {
          id: "nfl-playoffs",
          role: "researcher",
          goal: "Research current NFL playoff picture and standings",
        },
        {
          id: "nfl-players",
          role: "researcher",
          goal: "Research top player performances and stats leaders",
        },
        {
          id: "nfl-teams",
          role: "researcher",
          goal: "Analyze team trends and coaching changes",
        },
        {
          id: "nfl-injuries",
          role: "researcher",
          goal: "Compile injury reports and their playoff implications",
        },
        {
          id: "nfl-predictions",
          role: "researcher",
          goal: "Research expert predictions and betting odds for playoffs",
        },
      ],
      options: {
        maxConcurrency: 4,
        timeoutMs: 120000,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Large-scale parallel execution with 6 researchers gathering NFL news from multiple angles. Uses concurrency limit of 4.",
      },
    },
  },
}

export const WithTimeout: Story = {
  name: "Subagent Timeout",
  args: {
    args: {
      subagents: [
        {
          id: "research-1",
          role: "researcher",
          goal: "Comprehensive enterprise auth solution comparison",
        },
        {
          id: "research-2",
          role: "researcher",
          goal: "Quick state management research",
        },
      ],
    },
    result: JSON.stringify({
      results: [
        {
          id: "research-1",
          role: "researcher",
          status: "timeout",
          error: "Subagent timed out after 120000ms",
          summary: "",
          durationMs: 120000,
          toolsUsed: ["web_search"],
        },
        {
          id: "research-2",
          role: "researcher",
          status: "completed",
          summary: "Zustand recommended for this use case.",
          durationMs: 1200,
          toolsUsed: ["web_search"],
        },
      ],
      completedCount: 1,
      failedCount: 1,
      totalDurationMs: 121200,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows timeout handling when a subagent exceeds the configured timeout limit (default 120s).",
      },
    },
  },
}

export const SingleSubagent: Story = {
  name: "Single Subagent",
  args: {
    args: {
      subagents: [
        {
          id: "quick-research",
          role: "researcher",
          goal: "Quick search for React 18 concurrent features",
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Minimal case with just one subagent. Useful for simple research tasks.",
      },
    },
  },
}

export const CollapsedState: Story = {
  name: "Collapsed State",
  args: {
    args: completeWorkflowArgs,
    result: mixedResultsWithFailure,
  },
  render: (args) => {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Click the header to expand/collapse the subagent list. The header shows summary stats even when collapsed.
        </p>
        <SubagentTool {...args} />
      </div>
    )
  },
}

export const CustomConcurrencyLimit: Story = {
  name: "Custom Concurrency (2 max)",
  args: {
    args: {
      subagents: [
        { id: "sub-1", role: "researcher", goal: "Research topic 1" },
        { id: "sub-2", role: "researcher", goal: "Research topic 2" },
        { id: "sub-3", role: "researcher", goal: "Research topic 3" },
        { id: "sub-4", role: "researcher", goal: "Research topic 4" },
      ],
      options: {
        maxConcurrency: 2,
        timeoutMs: 60000,
        recursionLimit: 15,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Custom options: only 2 subagents run concurrently, 60s timeout, 15 recursion limit. Useful for rate-limited APIs.",
      },
    },
  },
}

export const AllRoleTypes: Story = {
  name: "All Role Types Showcase",
  args: {
    args: {
      subagents: [
        {
          id: "researcher-demo",
          role: "researcher",
          goal: "Demonstrate researcher role with web search capabilities",
        },
        {
          id: "codebase-demo",
          role: "codebase",
          goal: "Demonstrate codebase role with file and memory search",
        },
        {
          id: "planner-demo",
          role: "planner",
          goal: "Demonstrate planner role creating implementation plans",
        },
        {
          id: "coder-demo",
          role: "coder",
          goal: "Demonstrate coder role with full write capabilities",
        },
        {
          id: "reviewer-demo",
          role: "reviewer",
          goal: "Demonstrate reviewer role analyzing code quality",
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows all five subagent role types with their distinct visual styling and icons. Each role has specific tool permissions and system prompts.",
      },
    },
  },
}

export const WithLiveEventSimulation: Story = {
  name: "Live Event Simulation",
  render: () => {
    const [eventLog, setEventLog] = React.useState<string[]>([])

    React.useEffect(() => {
      const events = [
        { type: "subagent-spawn-start", subagentCount: 3, roles: ["researcher", "researcher", "researcher"] },
        { type: "subagent-start", subagentId: "sub-1", role: "researcher", goal: "Research auth" },
        { type: "subagent-content", subagentId: "sub-1", text: "Searching for authentication..." },
        { type: "subagent-tool-call-start", subagentId: "sub-1", toolCallId: "tc-1", toolName: "web_search", args: {} },
        { type: "subagent-start", subagentId: "sub-2", role: "researcher", goal: "Research state" },
        { type: "subagent-tool-result", subagentId: "sub-1", toolCallId: "tc-1" },
        { type: "subagent-content", subagentId: "sub-1", text: " Found best practices." },
        { type: "subagent-end", subagentId: "sub-1", status: "completed", durationMs: 2100 },
        { type: "subagent-spawn-complete", completedCount: 3, failedCount: 0, totalDurationMs: 5000 },
      ]

      let index = 0
      const interval = setInterval(() => {
        if (index < events.length) {
          const evt = events[index]
          window.dispatchEvent(new CustomEvent("assistant-subagent-event", { detail: evt }))
          setEventLog(prev => [...prev, `${evt.type} (${(evt as any).subagentId || "global"})`])
          index++
        } else {
          clearInterval(interval)
        }
      }, 800)

      return () => clearInterval(interval)
    }, [])

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Event Stream (simulated):</p>
          <div className="bg-muted/30 rounded p-2 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
            {eventLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
        <SubagentTool
          args={{
            subagents: [
              { id: "sub-1", role: "researcher", goal: "Research auth" },
              { id: "sub-2", role: "researcher", goal: "Research state" },
              { id: "sub-3", role: "researcher", goal: "Research testing" },
            ],
          }}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates live event handling by simulating the CustomEvent stream that drives the SubagentTool updates.",
      },
    },
  },
}
