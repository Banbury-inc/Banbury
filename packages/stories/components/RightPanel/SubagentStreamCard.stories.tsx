import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SubagentStreamCard } from "frontend/components/RightPanel/composer/components/SubagentStreamCard"
import { TooltipProvider } from "frontend/components/ui/tooltip"

// Wrapper for stories
function SubagentStreamCardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-3xl mx-auto p-4 bg-background">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof SubagentStreamCard> = {
  title: "Components/RightPanel/SubagentStreamCard",
  component: SubagentStreamCard,
  decorators: [
    (Story) => (
      <SubagentStreamCardWrapper>
        <Story />
      </SubagentStreamCardWrapper>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# SubagentStreamCard Component

The SubagentStreamCard displays the real-time streaming output from a specialized AI subagent during multi-agent execution. Each subagent has a specific role (researcher, codebase, planner, coder, reviewer) and runs with sandboxed tools and role-specific prompts.

## Key Features

- **Live Streaming**: Shows subagent output as it generates in real-time
- **Role-Based Styling**: Each role has unique colors, emojis, and visual identity
- **Tool Call Tracking**: Displays which tools the subagent is using with live status
- **Expandable/Collapsible**: Open by default but can be collapsed to save space
- **Status Indicators**: Visual feedback for running/completed/failed states
- **Error Display**: Shows error messages if subagent fails or times out
- **Markdown Support**: Renders subagent output as formatted markdown

## Subagent Roles

- **🔍 Researcher** (Purple): Web search, summarization, citations
- **📁 Codebase** (Blue): File/memory search, code analysis
- **📋 Planner** (Amber): Research and create implementation plans
- **💻 Coder** (Green): Full tool access for implementation
- **👀 Reviewer** (Rose): Read-only analysis, critique, risk assessment

## States

- **Running**: Animated spinner, live content streaming
- **Completed**: Green checkmark, final content displayed
- **Failed/Timeout**: Red X, error message shown

## Usage

Part of the multi-agent workflow system where a main agent spawns specialized subagents to work in parallel on complex tasks.
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof SubagentStreamCard>

// Sample content for different scenarios
const researchContentParts = [
  {
    type: "tool-call" as const,
    toolCallId: "tc-1",
    toolName: "web_search",
    args: { query: "React authentication best practices" },
    argsText: '{"query":"React authentication best practices"}',
    result: { results: ["NextAuth.js docs", "Auth0 blog", "MDN Web Security"] },
  },
  {
    type: "text" as const,
    text: `I found several best practices for React authentication:

## Key Findings

1. **JWT Storage**: Store access tokens in memory (not localStorage) to prevent XSS attacks
2. **Refresh Tokens**: Use httpOnly cookies for refresh tokens
3. **Token Rotation**: Implement automatic token refresh before expiration
4. **CSRF Protection**: Use CSRF tokens with state-changing operations

## Recommended Libraries

- **NextAuth.js** (most popular, 15k+ stars)
- **Auth0** (enterprise-grade)
- **Supabase Auth** (open-source, includes database)

## Security Best Practices

- Always use HTTPS in production
- Implement rate limiting on auth endpoints
- Use strong password requirements (min 12 chars, mixed case, numbers, symbols)
- Enable 2FA for sensitive accounts`,
  },
]

const codebaseContentParts = [
  {
    type: "tool-call" as const,
    toolCallId: "tc-1",
    toolName: "search_files",
    args: { query: "authentication" },
    argsText: '{"query":"authentication"}',
    result: { files: ["AuthProvider.tsx", "authService.ts", "useAuth.ts"] },
  },
  {
    type: "text" as const,
    text: `Analyzing the current authentication implementation:

## Current Structure

Found authentication-related files:
- \`/src/auth/AuthProvider.tsx\` - Main auth context
- \`/src/api/authService.ts\` - API calls
- \`/src/hooks/useAuth.ts\` - Auth hook`,
  },
  {
    type: "tool-call" as const,
    toolCallId: "tc-2",
    toolName: "search_memory",
    args: { query: "auth implementation" },
    argsText: '{"query":"auth implementation"}',
    result: { memories: [] },
  },
  {
    type: "text" as const,
    text: `## Key Observations

✅ **Good practices found:**
- Using JWT tokens
- Auth context properly implemented
- Protected route wrapper exists

⚠️ **Issues identified:**
1. Tokens stored in localStorage (XSS risk)
2. No refresh token mechanism
3. No CSRF protection
4. Password validation is weak (min 6 chars)

## Current Flow

\`\`\`
User Login → API call → Store token → Redirect
         ↓
   localStorage (insecure)
\`\`\``,
  },
]

const plannerContentParts = [
  {
    type: "tool-call" as const,
    toolCallId: "tc-1",
    toolName: "search_files",
    args: { query: "auth" },
    argsText: '{"query":"auth"}',
    result: { files: [] },
  },
  {
    type: "tool-call" as const,
    toolCallId: "tc-2",
    toolName: "web_search",
    args: { query: "authentication upgrade best practices" },
    argsText: '{"query":"authentication upgrade best practices"}',
    result: { results: [] },
  },
  {
    type: "text" as const,
    text: `# Authentication Upgrade Implementation Plan

## Phase 1: Token Storage Migration (2-3 days)
1. Move access tokens from localStorage to memory
2. Implement httpOnly cookies for refresh tokens
3. Create token refresh mechanism
4. Update API service to handle token refresh

## Phase 2: Security Enhancements (1-2 days)
1. Add CSRF protection middleware
2. Strengthen password validation (12+ chars)
3. Implement rate limiting
4. Add password strength indicator UI

## Phase 3: Testing & Migration (1 day)
1. Write unit tests for auth flows
2. Test token refresh scenarios
3. Add error handling for expired tokens
4. Create migration guide for existing users`,
  },
]

const coderContentParts = [
  {
    type: "tool-call" as const,
    toolCallId: "tc-1",
    toolName: "search_files",
    args: { query: "auth" },
    argsText: '{"query":"auth"}',
    result: { files: [] },
  },
  {
    type: "tool-call" as const,
    toolCallId: "tc-2",
    toolName: "write_workspace_file",
    args: { path: "auth/tokenManager.ts" },
    argsText: '{"path":"auth/tokenManager.ts"}',
    result: { success: true },
  },
  {
    type: "text" as const,
    text: `Implementing the token refresh mechanism:

\`\`\`typescript
// auth/tokenManager.ts
class TokenManager {
  private accessToken: string | null = null
  private refreshPromise: Promise<string> | null = null

  async getAccessToken(): Promise<string> {
    if (this.accessToken && !this.isExpired(this.accessToken)) {
      return this.accessToken
    }
    
    return this.refreshAccessToken()
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Send httpOnly cookie
    })
      .then(res => res.json())
      .then(data => {
        this.accessToken = data.accessToken
        return data.accessToken
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }
}
\`\`\``,
  },
  {
    type: "tool-call" as const,
    toolCallId: "tc-3",
    toolName: "write_workspace_file",
    args: { path: "auth/AuthProvider.tsx" },
    argsText: '{"path":"auth/AuthProvider.tsx"}',
    result: { success: true },
  },
  {
    type: "text" as const,
    text: "Updated AuthProvider to use memory storage instead of localStorage.",
  },
]

const reviewerContentParts = [
  {
    type: "tool-call" as const,
    toolCallId: "tc-1",
    toolName: "search_files",
    args: { query: "auth" },
    argsText: '{"query":"auth"}',
    result: { files: [] },
  },
  {
    type: "tool-call" as const,
    toolCallId: "tc-2",
    toolName: "web_search",
    args: { query: "authentication security audit checklist" },
    argsText: '{"query":"authentication security audit checklist"}',
    result: { results: [] },
  },
  {
    type: "text" as const,
    text: `## Code Review: Authentication Implementation

### Overall Assessment: **Needs Work** ⚠️

The implementation is on the right track but has several critical issues that need addressing before production deployment.

### Critical Issues 🔴

1. **Token Storage Vulnerability**
   - Severity: High
   - Current: localStorage
   - Impact: Vulnerable to XSS attacks
   - Fix: Move to memory + httpOnly cookies

2. **Missing CSRF Protection**
   - Severity: High
   - Impact: Vulnerable to cross-site request forgery
   - Fix: Add CSRF token validation

### Major Issues 🟡

3. **Weak Password Requirements**
   - Current: Min 6 characters
   - Recommended: Min 12 characters + complexity
   
4. **No Rate Limiting**
   - Could enable brute force attacks
   - Add rate limiting on auth endpoints

### Positive Observations ✅

- Clean code structure
- Good separation of concerns
- Proper TypeScript usage
- Context API well implemented

### Recommendations

1. Address critical issues before production
2. Add comprehensive error handling
3. Implement logging for security events
4. Consider adding 2FA support`,
  },
]

export const ResearcherRunning: Story = {
  name: "Researcher - Running",
  args: {
    subagentId: "research-1",
    role: "researcher",
    goal: "Find best practices for React authentication and security",
    status: "running",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "web_search",
        args: { query: "React authentication best practices" },
        argsText: '{"query":"React authentication best practices"}',
        result: undefined, // Still running
      },
      {
        type: "text",
        text: "Searching for React authentication best practices...\n\nI found several authoritative sources:",
      },
    ],
  },
}

export const ResearcherCompleted: Story = {
  name: "Researcher - Completed",
  args: {
    subagentId: "research-1",
    role: "researcher",
    goal: "Find best practices for React authentication and security",
    status: "completed",
    contentParts: researchContentParts,
    durationMs: 2340,
  },
}

export const CodebaseRunning: Story = {
  name: "Codebase - Running",
  args: {
    subagentId: "codebase-1",
    role: "codebase",
    goal: "Analyze current authentication implementation in the project",
    status: "running",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "search_files",
        args: { query: "authentication" },
        argsText: '{"query":"authentication"}',
        result: { files: ["AuthProvider.tsx", "authService.ts", "useAuth.ts"] },
      },
      {
        type: "text",
        text: "Searching for authentication-related files...\n\nFound 3 files:\n- AuthProvider.tsx\n- authService.ts\n- useAuth.ts",
      },
      {
        type: "tool-call",
        toolCallId: "tc-2",
        toolName: "search_memory",
        args: { query: "auth" },
        argsText: '{"query":"auth"}',
        result: undefined, // Still running
      },
    ],
  },
}

export const CodebaseCompleted: Story = {
  name: "Codebase - Completed",
  args: {
    subagentId: "codebase-1",
    role: "codebase",
    goal: "Analyze current authentication implementation in the project",
    status: "completed",
    contentParts: codebaseContentParts,
    durationMs: 1820,
  },
}

export const PlannerCompleted: Story = {
  name: "Planner - Completed",
  args: {
    subagentId: "planner-1",
    role: "planner",
    goal: "Create a detailed implementation plan for upgrading authentication",
    status: "completed",
    contentParts: plannerContentParts,
    durationMs: 3150,
  },
}

export const CoderRunning: Story = {
  name: "Coder - Running",
  args: {
    subagentId: "coder-1",
    role: "coder",
    goal: "Implement token refresh mechanism and migrate from localStorage",
    status: "running",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "search_files",
        args: { query: "auth" },
        argsText: '{"query":"auth"}',
        result: { files: [] },
      },
      {
        type: "tool-call",
        toolCallId: "tc-2",
        toolName: "write_workspace_file",
        args: { path: "auth/tokenManager.ts" },
        argsText: '{"path":"auth/tokenManager.ts"}',
        result: undefined, // Still running
      },
      {
        type: "text",
        text: "Creating TokenManager class...\n\n```typescript\nclass TokenManager {\n  private accessToken: string | null = null\n```",
      },
    ],
  },
}

export const CoderCompleted: Story = {
  name: "Coder - Completed",
  args: {
    subagentId: "coder-1",
    role: "coder",
    goal: "Implement token refresh mechanism and migrate from localStorage",
    status: "completed",
    contentParts: coderContentParts,
    durationMs: 4560,
  },
}

export const ReviewerCompleted: Story = {
  name: "Reviewer - Completed",
  args: {
    subagentId: "reviewer-1",
    role: "reviewer",
    goal: "Review the authentication implementation for security issues and best practices",
    status: "completed",
    contentParts: reviewerContentParts,
    durationMs: 2780,
  },
}

export const SubagentFailed: Story = {
  name: "Failed Subagent",
  args: {
    subagentId: "coder-1",
    role: "coder",
    goal: "Implement authentication changes",
    status: "failed",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "search_files",
        args: { query: "auth" },
        argsText: '{"query":"auth"}',
        result: { files: [] },
      },
      {
        type: "tool-call",
        toolCallId: "tc-2",
        toolName: "write_workspace_file",
        args: { path: "auth/tokenManager.ts" },
        argsText: '{"path":"auth/tokenManager.ts"}',
        result: { success: true },
      },
      {
        type: "text",
        text: "Started implementing changes...\n\nCreated TokenManager class and updated API service.",
      },
    ],
    error: "Failed to write file: Permission denied for /src/auth/tokenManager.ts",
    durationMs: 1230,
  },
}

export const SubagentTimeout: Story = {
  name: "Timeout Subagent",
  args: {
    subagentId: "researcher-1",
    role: "researcher",
    goal: "Research enterprise-grade authentication solutions with extensive comparisons",
    status: "timeout",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "web_search",
        args: { query: "Auth0 vs Okta" },
        argsText: '{"query":"Auth0 vs Okta"}',
        result: { results: [] },
      },
      {
        type: "text",
        text: "Searching for authentication solutions...\n\nFound multiple options:\n1. Auth0\n2. Okta\n3. Firebase Auth",
      },
      {
        type: "tool-call",
        toolCallId: "tc-2",
        toolName: "web_search",
        args: { query: "Firebase Auth features" },
        argsText: '{"query":"Firebase Auth features"}',
        result: { results: [] },
      },
      {
        type: "tool-call",
        toolCallId: "tc-3",
        toolName: "web_search",
        args: { query: "Enterprise SSO comparison" },
        argsText: '{"query":"Enterprise SSO comparison"}',
        result: undefined, // Was running when timeout occurred
      },
    ],
    error: "Subagent timed out after 120000ms",
    durationMs: 120000,
  },
}

export const MinimalContent: Story = {
  name: "Minimal Content",
  args: {
    subagentId: "research-1",
    role: "researcher",
    goal: "Quick search for authentication best practices",
    status: "completed",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "web_search",
        args: { query: "auth best practices" },
        argsText: '{"query":"auth best practices"}',
        result: { results: [] },
      },
      {
        type: "text",
        text: "Store tokens securely. Use httpOnly cookies for refresh tokens. Implement CSRF protection.",
      },
    ],
    durationMs: 890,
  },
}

export const NoToolCalls: Story = {
  name: "No Tool Calls",
  args: {
    subagentId: "reviewer-1",
    role: "reviewer",
    goal: "Review previous findings",
    status: "completed",
    contentParts: [
      {
        type: "text",
        text: "Based on the research and codebase analysis, the authentication approach looks solid. The main concerns are token storage and CSRF protection.",
      },
    ],
    durationMs: 650,
  },
}

export const EmptyRunning: Story = {
  name: "Empty (Just Started)",
  args: {
    subagentId: "research-1",
    role: "researcher",
    goal: "Find React authentication best practices",
    status: "running",
    contentParts: [],
  },
}

export const MultipleParallelSubagents: Story = {
  name: "Multiple Subagents (Parallel Execution)",
  render: () => (
    <div className="space-y-3">
      <SubagentStreamCard
        subagentId="research-1"
        role="researcher"
        goal="Find best practices for state management"
        status="completed"
        contentParts={[
          {
            type: "tool-call",
            toolCallId: "tc-1",
            toolName: "web_search",
            args: { query: "Redux Toolkit vs Zustand" },
            argsText: '{"query":"Redux Toolkit vs Zustand"}',
            result: { results: [] },
          },
          {
            type: "text",
            text: "## Redux Toolkit\n\nModern Redux with less boilerplate. Includes RTK Query for data fetching.\n\n## Zustand\n\nMinimal API, no boilerplate. Great for small to medium apps.",
          },
        ]}
        durationMs={2100}
      />
      <SubagentStreamCard
        subagentId="research-2"
        role="researcher"
        goal="Research Jotai state management"
        status="completed"
        contentParts={[
          {
            type: "tool-call",
            toolCallId: "tc-2",
            toolName: "web_search",
            args: { query: "Jotai state management" },
            argsText: '{"query":"Jotai state management"}',
            result: { results: [] },
          },
          {
            type: "text",
            text: "## Jotai\n\nAtomic state management inspired by Recoil. Bottom-up approach with atoms. Great TypeScript support.",
          },
        ]}
        durationMs={1950}
      />
      <SubagentStreamCard
        subagentId="reviewer-1"
        role="reviewer"
        goal="Compare and recommend the best option"
        status="running"
        contentParts={[
          {
            type: "text",
            text: "Reviewing findings...\n\n**Redux Toolkit**: Best for large apps with complex state\n**Zustand**: Best",
          },
        ]}
      />
    </div>
  ),
}

export const LongRunningWithManyTools: Story = {
  name: "Long Running with Many Tools",
  args: {
    subagentId: "coder-1",
    role: "coder",
    goal: "Implement complete authentication system with tests",
    status: "running",
    contentParts: [
      {
        type: "tool-call",
        toolCallId: "tc-1",
        toolName: "search_files",
        args: { query: "auth" },
        argsText: '{"query":"auth"}',
        result: { files: [] },
      },
      {
        type: "tool-call",
        toolCallId: "tc-2",
        toolName: "web_search",
        args: { query: "authentication system architecture" },
        argsText: '{"query":"authentication system architecture"}',
        result: { results: [] },
      },
      {
        type: "tool-call",
        toolCallId: "tc-3",
        toolName: "write_workspace_file",
        args: { path: "auth/TokenManager.ts" },
        argsText: '{"path":"auth/TokenManager.ts"}',
        result: { success: true },
      },
      {
        type: "text",
        text: "Creating authentication system...\n\n## Created Files\n\n1. `TokenManager.ts` - Token management",
      },
      {
        type: "tool-call",
        toolCallId: "tc-4",
        toolName: "write_workspace_file",
        args: { path: "auth/AuthProvider.tsx" },
        argsText: '{"path":"auth/AuthProvider.tsx"}',
        result: { success: true },
      },
      {
        type: "text",
        text: "2. `AuthProvider.tsx` - Auth context",
      },
      {
        type: "tool-call",
        toolCallId: "tc-5",
        toolName: "write_workspace_file",
        args: { path: "api/authService.ts" },
        argsText: '{"path":"api/authService.ts"}',
        result: { success: true },
      },
      {
        type: "text",
        text: "3. `authService.ts` - API calls",
      },
      {
        type: "tool-call",
        toolCallId: "tc-6",
        toolName: "execute_script",
        args: { command: "npm test" },
        argsText: '{"command":"npm test"}',
        result: undefined, // Still running
      },
    ],
  },
}

const CollapsedByDefaultComponent = (args: any) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true)
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">
        Click the card header to toggle collapse/expand
      </p>
      <SubagentStreamCard {...args} />
    </div>
  )
}

export const CollapsedByDefault: Story = {
  name: "Collapsed State",
  args: {
    subagentId: "research-1",
    role: "researcher",
    goal: "Find React authentication best practices",
    status: "completed",
    contentParts: researchContentParts,
    durationMs: 2340,
  },
  render: CollapsedByDefaultComponent,
}
