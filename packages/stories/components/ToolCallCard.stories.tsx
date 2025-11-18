import type { Meta, StoryObj } from "@storybook/react"
import { ToolCallCard } from "frontend/components/RightPanel/composer/components/ToolCallCard"

const meta: Meta<typeof ToolCallCard> = {
  title: "AI Tools/ToolCallCard",
  component: ToolCallCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof ToolCallCard>

export const Running: Story = {
  args: {
    toolName: "web_search",
    argsText: JSON.stringify({
      query: "latest TypeScript features",
      filters: ["documentation", "tutorials"]
    }),
    label: "Web Search"
  }
}

export const Completed: Story = {
  args: {
    toolName: "web_search",
    argsText: JSON.stringify({
      query: "React best practices",
      filters: ["documentation"]
    }),
    result: JSON.stringify({
      results: [
        {
          title: "React Documentation",
          url: "https://react.dev",
          snippet: "The official React documentation with guides and API reference."
        },
        {
          title: "React Best Practices 2024",
          url: "https://example.com/react-best-practices",
          snippet: "A comprehensive guide to React best practices."
        }
      ],
      count: 2
    }),
    label: "Web Search",
    initialCollapsed: false
  }
}

export const WithCustomLabel: Story = {
  args: {
    toolName: "code_search",
    argsText: JSON.stringify({
      query: "authentication logic",
      path: "src/auth/"
    }),
    result: {
      files: ["auth.ts", "middleware.ts"],
      matches: 5
    },
    label: "Code Search",
    initialCollapsed: false
  }
}

export const ShowingResult: Story = {
  args: {
    toolName: "file_read",
    argsText: JSON.stringify({
      path: "src/components/Button.tsx"
    }),
    result: {
      content: "export function Button() { return <button>Click me</button> }",
      lines: 1,
      size: "2.4 KB"
    },
    label: "Read File",
    initialCollapsed: false,
    initialTab: "result"
  }
}

export const InitiallyExpanded: Story = {
  args: {
    toolName: "database_query",
    argsText: JSON.stringify({
      table: "users",
      filters: { active: true },
      limit: 10
    }),
    result: {
      rows: [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" }
      ],
      count: 2
    },
    label: "Database Query",
    initialCollapsed: false,
    initialTab: "args"
  }
}

export const LongOutput: Story = {
  args: {
    toolName: "api_call",
    argsText: JSON.stringify({
      endpoint: "/api/v1/users",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer token123"
      },
      params: {
        page: 1,
        limit: 50,
        sort: "created_at",
        order: "desc"
      }
    }),
    result: {
      status: 200,
      data: {
        users: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: i % 2 === 0 ? "admin" : "user",
          createdAt: new Date(2024, 0, i + 1).toISOString()
        })),
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          hasNext: true
        }
      }
    },
    label: "API Call",
    initialCollapsed: false,
    initialTab: "result"
  }
}

export const ErrorResult: Story = {
  args: {
    toolName: "file_write",
    argsText: JSON.stringify({
      path: "/protected/file.txt",
      content: "sensitive data"
    }),
    result: {
      error: "Permission denied",
      code: "EACCES",
      message: "You do not have permission to write to this file"
    },
    label: "File Write",
    initialCollapsed: false,
    initialTab: "result"
  }
}

export const CollapsedByDefault: Story = {
  args: {
    toolName: "file_write",
    argsText: JSON.stringify({
      path: "src/components/NewComponent.tsx",
      content: "export function NewComponent() { return <div>Hello</div> }"
    }),
    result: {
      success: true,
      message: "File written successfully"
    },
    label: "File Write",
    initialCollapsed: true
  }
}

