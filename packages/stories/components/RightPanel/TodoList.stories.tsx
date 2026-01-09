import React, { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { TooltipProvider } from "frontend/components/ui/tooltip"
import type { TodoItem, ThreadTodoState } from "frontend/types/todo-types"

// Create a standalone TodoList display component for storybook (no external store dependencies)
function StatusIcon({ status }: { status: string }) {
  const iconClasses = {
    completed: "h-4 w-4 text-emerald-500",
    in_progress: "h-4 w-4 text-blue-500 animate-spin",
    failed: "h-4 w-4 text-red-500",
    pending: "h-4 w-4 text-muted-foreground",
  }

  const icons = {
    completed: (
      <svg className={iconClasses.completed} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    in_progress: (
      <svg className={iconClasses.in_progress} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    failed: (
      <svg className={iconClasses.failed} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    pending: (
      <svg className={iconClasses.pending} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  }

  return icons[status as keyof typeof icons] || icons.pending
}

interface TodoItemRowProps {
  todo: TodoItem
  isActive: boolean
}

function TodoItemRow({ todo, isActive }: TodoItemRowProps) {
  return (
    <div
      className={`flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors ${
        isActive ? "bg-blue-500/10 border border-blue-500/20" : ""
      } ${todo.status === "completed" ? "opacity-60" : ""} ${
        todo.status === "failed" ? "bg-red-500/5" : ""
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        <StatusIcon status={todo.status} />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-xs leading-tight ${
            todo.status === "completed" ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.description}
        </span>
        {todo.source === "agent" && (
          <span className="text-[10px] text-muted-foreground ml-1">(agent)</span>
        )}
      </div>
    </div>
  )
}

interface MockTodoListProps {
  todos: TodoItem[]
  activeTodoId: string | null
  isExpanded?: boolean
  onClearCompleted?: () => void
}

function MockTodoList({ todos, activeTodoId, isExpanded = true, onClearCompleted }: MockTodoListProps) {
  const [expanded, setExpanded] = React.useState(isExpanded)

  if (todos.length === 0) return null

  const completedCount = todos.filter((t) => t.status === "completed").length
  const totalCount = todos.length
  const hasCompleted = completedCount > 0

  const planTodos = todos.filter((t) => t.source === "plan")
  const agentTodos = todos.filter((t) => t.source === "agent")

  return (
    <div className="border-b border-border bg-background/50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="text-xs font-medium">Todos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
          {/* Progress bar */}
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </button>

      {/* Todo list */}
      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {/* Plan todos */}
          {planTodos.length > 0 && (
            <div className="space-y-0.5">
              {agentTodos.length > 0 && (
                <span className="text-[10px] text-muted-foreground px-2 pt-1">Plan Tasks</span>
              )}
              {planTodos.map((todo) => (
                <TodoItemRow key={todo.id} todo={todo} isActive={activeTodoId === todo.id} />
              ))}
            </div>
          )}

          {/* Agent todos */}
          {agentTodos.length > 0 && (
            <div className="space-y-0.5">
              {planTodos.length > 0 && (
                <span className="text-[10px] text-muted-foreground px-2 pt-2">Agent Tasks</span>
              )}
              {agentTodos.map((todo) => (
                <TodoItemRow key={todo.id} todo={todo} isActive={activeTodoId === todo.id} />
              ))}
            </div>
          )}

          {/* Clear completed button */}
          {hasCompleted && onClearCompleted && (
            <div className="pt-1 px-1">
              <button
                onClick={onClearCompleted}
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground w-full flex items-center justify-start gap-1 px-2 rounded hover:bg-accent"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Clear completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Wrapper for stories
function TodoListWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full max-w-md mx-auto bg-background border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof MockTodoList> = {
  title: "Components/RightPanel/TodoList",
  component: MockTodoList,
  decorators: [
    (Story) => (
      <TodoListWrapper>
        <Story />
      </TodoListWrapper>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
# TodoList Component

The TodoList component displays a collapsible list of tasks/todos in the right panel, typically shown at the top above the conversation thread.

## Key Features

- **Collapsible Design**: Header can be clicked to expand/collapse the todo list
- **Progress Tracking**: Shows completion progress with count and visual progress bar
- **Status Icons**: Different icons for pending, in_progress, completed, and failed states
- **Source Separation**: Groups todos by source (plan vs agent generated)
- **Clear Completed**: Button to remove all completed todos
- **Active Task Highlight**: Currently executing task is visually highlighted

## Todo Statuses

- **pending**: Task not yet started (empty circle)
- **in_progress**: Task currently being executed (spinning loader)
- **completed**: Task finished successfully (green checkmark)
- **failed**: Task encountered an error (red X)

## Todo Sources

- **plan**: Tasks created from user's plan/instructions
- **agent**: Tasks created by the AI agent during execution
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof MockTodoList>

// Helper to create mock todos
const createMockTodo = (
  id: string,
  description: string,
  status: "pending" | "in_progress" | "completed" | "failed",
  source: "plan" | "agent" = "plan"
): TodoItem => ({
  id,
  description,
  status,
  source,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const Default: Story = {
  name: "Default View",
  args: {
    todos: [
      createMockTodo("1", "Review the quarterly report", "completed"),
      createMockTodo("2", "Update financial projections", "completed"),
      createMockTodo("3", "Create executive summary", "in_progress"),
      createMockTodo("4", "Add charts and visualizations", "pending"),
      createMockTodo("5", "Final review and formatting", "pending"),
    ],
    activeTodoId: "3",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const AllPending: Story = {
  name: "All Pending",
  args: {
    todos: [
      createMockTodo("1", "Analyze document structure", "pending"),
      createMockTodo("2", "Extract key data points", "pending"),
      createMockTodo("3", "Generate summary report", "pending"),
      createMockTodo("4", "Create visualizations", "pending"),
    ],
    activeTodoId: null,
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const AllCompleted: Story = {
  name: "All Completed",
  args: {
    todos: [
      createMockTodo("1", "Parse input file", "completed"),
      createMockTodo("2", "Process data", "completed"),
      createMockTodo("3", "Generate output", "completed"),
      createMockTodo("4", "Save results", "completed"),
    ],
    activeTodoId: null,
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const WithFailedTask: Story = {
  name: "With Failed Task",
  args: {
    todos: [
      createMockTodo("1", "Connect to database", "completed"),
      createMockTodo("2", "Fetch user data", "failed"),
      createMockTodo("3", "Process records", "pending"),
      createMockTodo("4", "Update dashboard", "pending"),
    ],
    activeTodoId: null,
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const MixedSources: Story = {
  name: "Mixed Sources (Plan + Agent)",
  args: {
    todos: [
      createMockTodo("1", "Analyze the spreadsheet", "completed", "plan"),
      createMockTodo("2", "Calculate totals for Q4", "completed", "plan"),
      createMockTodo("3", "Fix formula errors in row 15", "completed", "agent"),
      createMockTodo("4", "Add missing data validation", "in_progress", "agent"),
      createMockTodo("5", "Create pivot table summary", "pending", "plan"),
      createMockTodo("6", "Optimize cell references", "pending", "agent"),
    ],
    activeTodoId: "4",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const SingleTask: Story = {
  name: "Single Task",
  args: {
    todos: [createMockTodo("1", "Quick document review", "in_progress")],
    activeTodoId: "1",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const LongDescriptions: Story = {
  name: "Long Task Descriptions",
  args: {
    todos: [
      createMockTodo(
        "1",
        "Analyze the comprehensive quarterly financial report including all subsidiary data and reconciliation notes",
        "completed"
      ),
      createMockTodo(
        "2",
        "Cross-reference the budget allocations with actual spending across all departments and cost centers",
        "in_progress"
      ),
      createMockTodo(
        "3",
        "Prepare executive summary with key insights, recommendations, and action items for the board meeting",
        "pending"
      ),
    ],
    activeTodoId: "2",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const ManyTasks: Story = {
  name: "Many Tasks",
  args: {
    todos: [
      createMockTodo("1", "Initialize project structure", "completed"),
      createMockTodo("2", "Set up dependencies", "completed"),
      createMockTodo("3", "Create database schema", "completed"),
      createMockTodo("4", "Implement user authentication", "completed"),
      createMockTodo("5", "Build API endpoints", "completed"),
      createMockTodo("6", "Add input validation", "in_progress"),
      createMockTodo("7", "Write unit tests", "pending"),
      createMockTodo("8", "Set up CI/CD pipeline", "pending"),
      createMockTodo("9", "Configure monitoring", "pending"),
      createMockTodo("10", "Deploy to staging", "pending"),
      createMockTodo("11", "Performance testing", "pending"),
      createMockTodo("12", "Security audit", "pending"),
    ],
    activeTodoId: "6",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const Collapsed: Story = {
  name: "Collapsed View",
  args: {
    todos: [
      createMockTodo("1", "Task one", "completed"),
      createMockTodo("2", "Task two", "completed"),
      createMockTodo("3", "Task three", "in_progress"),
      createMockTodo("4", "Task four", "pending"),
    ],
    activeTodoId: "3",
    isExpanded: false,
    onClearCompleted: fn(),
  },
}

export const AgentOnlyTasks: Story = {
  name: "Agent-Only Tasks",
  args: {
    todos: [
      createMockTodo("1", "Detected formatting issues - fixing", "completed", "agent"),
      createMockTodo("2", "Found broken links - updating", "in_progress", "agent"),
      createMockTodo("3", "Optimize image sizes", "pending", "agent"),
    ],
    activeTodoId: "2",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const NoCompletedTasks: Story = {
  name: "No Completed Tasks (No Clear Button)",
  args: {
    todos: [
      createMockTodo("1", "Start analysis", "in_progress"),
      createMockTodo("2", "Process data", "pending"),
      createMockTodo("3", "Generate report", "pending"),
    ],
    activeTodoId: "1",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const MultipleInProgress: Story = {
  name: "Multiple In Progress (Edge Case)",
  args: {
    todos: [
      createMockTodo("1", "Parallel task A", "in_progress"),
      createMockTodo("2", "Parallel task B", "in_progress"),
      createMockTodo("3", "Waiting task", "pending"),
    ],
    activeTodoId: "1",
    isExpanded: true,
    onClearCompleted: fn(),
  },
}

export const AllFailed: Story = {
  name: "All Failed",
  args: {
    todos: [
      createMockTodo("1", "Connect to API", "failed"),
      createMockTodo("2", "Authenticate user", "failed"),
      createMockTodo("3", "Fetch data", "failed"),
    ],
    activeTodoId: null,
    isExpanded: true,
    onClearCompleted: fn(),
  },
}
