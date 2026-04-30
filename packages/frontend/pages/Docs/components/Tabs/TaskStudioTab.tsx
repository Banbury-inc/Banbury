import Image from 'next/image'
import TaskStudioImg from '../../../../assets/images/Task_Studio.png'
import DocPageLayout from '../DocPageLayout'
import { Badge } from '../../../../components/common/ui/badge'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'

export default function TaskStudioTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Task Studio
        </Typography>

        <Typography variant="p" className="mb-4">
          Task Studio is Banbury's comprehensive task management interface that allows you to create, schedule, monitor, and manage tasks within your workspace. It provides powerful features for both individual and recurring task management.
        </Typography>

        <div className="mb-4">
          <Image
            src={TaskStudioImg}
            alt="Knowledge graph visualization"
            className="h-auto w-full rounded-xl border border-border bg-muted"
            priority
          />
        </div>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-3">
            Getting Started
          </Typography>

          <Typography variant="p" className="mb-3">
            To access Task Studio, you need to be logged into your Banbury account. Once authenticated, you can navigate to Task Studio through the sidebar navigation.
          </Typography>

          <div className="mb-3">
            <Typography variant="h4" className="mb-2">
              Access Requirements:
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              <li>
                <Typography variant="p" className="text-sm text-muted-foreground">
                  • Valid Banbury account with authentication
                </Typography>
              </li>
              <li>
                <Typography variant="p" className="text-sm text-muted-foreground">
                  • Active session with proper permissions
                </Typography>
              </li>
            </ul>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-3">
            Core Features
          </Typography>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Task Creation &amp; Scheduling
            </Typography>
            <Typography variant="p" className="mb-2">
              Create tasks with detailed information including titles, descriptions, scheduled dates and times, priority levels, and estimated duration. The task scheduler supports both one-time and recurring tasks.
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              {[
                '• Task title and description',
                '• Date and time scheduling with datetime picker',
                '• Priority levels: Urgent, High, Medium, Low',
                '• Estimated duration tracking',
                '• Tag system for organization',
              ].map((text) => (
                <li key={text}>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Recurring Tasks
            </Typography>
            <Typography variant="p" className="mb-2">
              Set up recurring tasks with flexible patterns and end dates. Perfect for routine activities and regular workflows.
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              {[
                '• Daily, Weekly, and Monthly recurring patterns',
                '• Configurable end dates for recurring series',
                '• Automatic task generation based on patterns',
                '• Safety limits to prevent excessive task creation',
              ].map((text) => (
                <li key={text}>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Task Management &amp; Monitoring
            </Typography>
            <Typography variant="p" className="mb-2">
              Monitor and manage your tasks through a comprehensive table interface with filtering, status management, and batch operations.
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              {[
                '• Real-time task status tracking (Scheduled, Running, Completed, Cancelled)',
                '• Filter tasks by status for focused views',
                '• Batch selection and bulk delete operations',
                '• Individual task actions (Start, Complete, Cancel, Delete)',
                '• Task results and error tracking',
              ].map((text) => (
                <li key={text}>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-3">
            Interface Overview
          </Typography>

          <div className="mb-3">
            <Typography variant="h4" className="mb-2">
              Navigation Sidebar
            </Typography>
            <Typography variant="p" className="mb-2">
              The left sidebar provides quick access to all major sections including Dashboard, Workspaces, Task Studio, Knowledge, and Settings. The Task Studio icon (workflow symbol) is prominently displayed for easy navigation.
            </Typography>
          </div>

          <div className="mb-3">
            <Typography variant="h4" className="mb-2">
              Main Task Table
            </Typography>
            <Typography variant="p" className="mb-2">
              The central area displays all your tasks in a comprehensive table format with columns for selection, title, status, priority, scheduled time, duration, results, and actions. Filter buttons allow you to view tasks by status.
            </Typography>
          </div>

          <div className="mb-3">
            <Typography variant="h4" className="mb-2">
              Task Creation Panel
            </Typography>
            <Typography variant="p" className="mb-2">
              Click the "Create Task" button to open the slide-out task creation panel on the right side. This panel contains all the forms and options needed to create new tasks, including recurring task settings.
            </Typography>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-3">
            How to Use Task Studio
          </Typography>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Creating a New Task
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              {[
                "1. Click the 'Create Task' button in the top-right corner",
                '2. Fill in the task title (required) and description',
                '3. Set the scheduled date and time using the datetime picker',
                '4. Choose priority level and estimated duration',
                '5. Add tags for organization (comma-separated)',
                '6. Optionally enable recurring tasks and set pattern',
                "7. Click 'Schedule Task' or 'Create Recurring Tasks'",
              ].map((text) => (
                <li key={text}>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Managing Existing Tasks
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              {[
                '• Use filter buttons to view tasks by status (All, Scheduled, Running, Completed)',
                "• Click 'Start' to begin a scheduled task",
                "• Click 'Complete' to mark a running task as finished",
                "• Use 'Cancel' to stop a task before completion",
                '• Select multiple tasks using checkboxes for batch operations',
                "• Use 'Delete Selected' for bulk removal of tasks",
              ].map((text) => (
                <li key={text}>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Setting Up Recurring Tasks
            </Typography>
            <ul className="list-none space-y-1 ps-4">
              {[
                "1. Check the 'Create recurring tasks' checkbox in the task creation form",
                '2. Select a repeat pattern: Daily, Weekly, or Monthly',
                '3. Set an end date for the recurring series',
                '4. The system will automatically generate all tasks in the series',
              ].map((text) => (
                <li key={text}>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-3">
            Understanding Status and Priority Badges
          </Typography>

          <div className="mb-3">
            <Typography variant="h4" className="mb-2">
              Task Status Indicators
            </Typography>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="outline">Scheduled</Badge>
              <Badge variant="default">Running</Badge>
              <Badge variant="secondary">Completed</Badge>
              <Badge variant="destructive">Cancelled</Badge>
            </div>
          </div>

          <div className="mb-3">
            <Typography variant="h4" className="mb-2">
              Priority Levels
            </Typography>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="destructive">Urgent</Badge>
              <Badge variant="default">High</Badge>
              <Badge variant="outline">Medium</Badge>
              <Badge variant="secondary">Low</Badge>
            </div>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-3">
            Best Practices
          </Typography>

          <ul className="list-none space-y-1 ps-4">
            {[
              '• Use descriptive task titles that clearly indicate the work to be done',
              '• Set realistic estimated durations to help with planning',
              '• Use tags consistently to organize related tasks',
              '• Regularly review and update task statuses to maintain accuracy',
              '• Use recurring tasks for routine activities to save time',
              '• Set appropriate end dates for recurring tasks to avoid clutter',
              '• Use batch operations to efficiently manage multiple tasks',
            ].map((text) => (
              <li key={text}>
                <Typography variant="p" className="text-sm text-muted-foreground">
                  {text}
                </Typography>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DocPageLayout>
  )
}
