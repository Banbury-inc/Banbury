import React, { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { TooltipProvider } from "frontend/components/ui/tooltip"
import { TodoList } from "frontend/components/RightPanel/TodoList"
import { subscribeTodoEventListener } from "frontend/components/RightPanel/handlers/todoStoreHandlers"
import type { TodoItem, TodoStatus, TodoSource } from "frontend/types/todo-types"
import { createTodoItem } from "frontend/types/todo-types"

// Wrapper component that sets up the todo store and initializes todos
interface TodoListStoryWrapperProps {
  todos: TodoItem[]
  activeTodoId: string | null
  threadId: string
}

function TodoListStoryWrapper({ todos, activeTodoId, threadId }: TodoListStoryWrapperProps) {
  // Subscribe to todo events (same as RightPanel does)
  useEffect(() => {
    const unsubscribe = subscribeTodoEventListener()
    return unsubscribe
  }, [])

  // Initialize todos when component mounts or todos change
  useEffect(() => {
    // Dispatch the todo-list-init event (same as plan execution does)
    const event = new CustomEvent('assistant-todo-event', {
      detail: {
        type: 'todo-list-init',
        threadId,
        todos,
        activeTodoId,
      },
    })
    window.dispatchEvent(event)
  }, [todos, activeTodoId, threadId])

  return <TodoList threadId={threadId} />
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

const meta: Meta<typeof TodoListStoryWrapper> = {
  title: "Components/RightPanel/TodoList",
  component: TodoListStoryWrapper,
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

The TodoList component displays a collapsible list of tasks/todos in the right panel, typically shown at the top above the conversation thread. This is the actual component used in the RightPanel when running a plan.

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

type Story = StoryObj<typeof TodoListStoryWrapper>

// Helper to create mock todos
const createMockTodo = (
  id: string,
  description: string,
  status: TodoStatus,
  source: TodoSource = "plan"
): TodoItem => {
  return createTodoItem({
    id,
    description,
    status,
    source,
  })
}

export const Default: Story = {
  name: "Default View",
  args: {
    threadId: "story-thread-1",
    todos: [
      createMockTodo("1", "Review the quarterly report", "completed"),
      createMockTodo("2", "Update financial projections", "completed"),
      createMockTodo("3", "Create executive summary", "in_progress"),
      createMockTodo("4", "Add charts and visualizations", "pending"),
      createMockTodo("5", "Final review and formatting", "pending"),
    ],
    activeTodoId: "3",
  },
}

export const AllPending: Story = {
  name: "All Pending",
  args: {
    threadId: "story-thread-2",
    todos: [
      createMockTodo("1", "Analyze document structure", "pending"),
      createMockTodo("2", "Extract key data points", "pending"),
      createMockTodo("3", "Generate summary report", "pending"),
      createMockTodo("4", "Create visualizations", "pending"),
    ],
    activeTodoId: null,
  },
}

export const AllCompleted: Story = {
  name: "All Completed",
  args: {
    threadId: "story-thread-3",
    todos: [
      createMockTodo("1", "Parse input file", "completed"),
      createMockTodo("2", "Process data", "completed"),
      createMockTodo("3", "Generate output", "completed"),
      createMockTodo("4", "Save results", "completed"),
    ],
    activeTodoId: null,
  },
}

export const WithFailedTask: Story = {
  name: "With Failed Task",
  args: {
    threadId: "story-thread-4",
    todos: [
      createMockTodo("1", "Connect to database", "completed"),
      createMockTodo("2", "Fetch user data", "failed"),
      createMockTodo("3", "Process records", "pending"),
      createMockTodo("4", "Update dashboard", "pending"),
    ],
    activeTodoId: null,
  },
}

export const MixedSources: Story = {
  name: "Mixed Sources (Plan + Agent)",
  args: {
    threadId: "story-thread-5",
    todos: [
      createMockTodo("1", "Analyze the spreadsheet", "completed", "plan"),
      createMockTodo("2", "Calculate totals for Q4", "completed", "plan"),
      createMockTodo("3", "Fix formula errors in row 15", "completed", "agent"),
      createMockTodo("4", "Add missing data validation", "in_progress", "agent"),
      createMockTodo("5", "Create pivot table summary", "pending", "plan"),
      createMockTodo("6", "Optimize cell references", "pending", "agent"),
    ],
    activeTodoId: "4",
  },
}

export const SingleTask: Story = {
  name: "Single Task",
  args: {
    threadId: "story-thread-6",
    todos: [createMockTodo("1", "Quick document review", "in_progress")],
    activeTodoId: "1",
  },
}

export const LongDescriptions: Story = {
  name: "Long Task Descriptions",
  args: {
    threadId: "story-thread-7",
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
  },
}

export const ManyTasks: Story = {
  name: "Many Tasks",
  args: {
    threadId: "story-thread-8",
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
  },
}

export const Collapsed: Story = {
  name: "Collapsed View",
  args: {
    threadId: "story-thread-9",
    todos: [
      createMockTodo("1", "Task one", "completed"),
      createMockTodo("2", "Task two", "completed"),
      createMockTodo("3", "Task three", "in_progress"),
      createMockTodo("4", "Task four", "pending"),
    ],
    activeTodoId: "3",
  },
}

export const AgentOnlyTasks: Story = {
  name: "Agent-Only Tasks",
  args: {
    threadId: "story-thread-10",
    todos: [
      createMockTodo("1", "Detected formatting issues - fixing", "completed", "agent"),
      createMockTodo("2", "Found broken links - updating", "in_progress", "agent"),
      createMockTodo("3", "Optimize image sizes", "pending", "agent"),
    ],
    activeTodoId: "2",
  },
}

export const NoCompletedTasks: Story = {
  name: "No Completed Tasks (No Clear Button)",
  args: {
    threadId: "story-thread-11",
    todos: [
      createMockTodo("1", "Start analysis", "in_progress"),
      createMockTodo("2", "Process data", "pending"),
      createMockTodo("3", "Generate report", "pending"),
    ],
    activeTodoId: "1",
  },
}

export const MultipleInProgress: Story = {
  name: "Multiple In Progress (Edge Case)",
  args: {
    threadId: "story-thread-12",
    todos: [
      createMockTodo("1", "Parallel task A", "in_progress"),
      createMockTodo("2", "Parallel task B", "in_progress"),
      createMockTodo("3", "Waiting task", "pending"),
    ],
    activeTodoId: "1",
  },
}

export const AllFailed: Story = {
  name: "All Failed",
  args: {
    threadId: "story-thread-13",
    todos: [
      createMockTodo("1", "Connect to API", "failed"),
      createMockTodo("2", "Authenticate user", "failed"),
      createMockTodo("3", "Fetch data", "failed"),
    ],
    activeTodoId: null,
  },
}
