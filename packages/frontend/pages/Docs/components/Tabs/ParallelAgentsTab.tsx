import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function ParallelAgentsTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Parallel Agents
        </Typography>

        <Typography variant="p" className="mb-4">
          Banbury supports parallel agent execution, allowing multiple AI agents to work on different tasks simultaneously. This dramatically speeds up complex workflows by distributing work across multiple agents.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">How Parallel Agents Work</Typography>
          <Typography variant="p" className="mb-3">
            When you create a plan with multiple todos, you can assign different tasks to different agents. Each agent works independently on their assigned tasks, but the system respects task dependencies to ensure correct execution order.
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• <strong>Independent Tasks:</strong> Tasks without dependencies can run in parallel across agents</Typography>
            <Typography variant="p" className="mb-1">• <strong>Sequential Within Agent:</strong> Each agent processes their assigned tasks sequentially</Typography>
            <Typography variant="p" className="mb-1">• <strong>Dependency Respect:</strong> Tasks with dependencies wait until prerequisites are completed</Typography>
            <Typography variant="p">• <strong>Automatic Coordination:</strong> The system tracks progress and coordinates between agents</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Setting Up Multiple Agents</Typography>
          <Typography variant="p" className="mb-3">
            To use parallel agents, you need to create multiple AI tabs in your workspace:
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">1. Create additional AI tabs using the "+" button in the tab bar</Typography>
            <Typography variant="p" className="mb-1">2. Give each tab a descriptive label (e.g., "Research Agent", "Writer Agent")</Typography>
            <Typography variant="p" className="mb-1">3. In your plan, assign todos to specific agents by label</Typography>
            <Typography variant="p">4. Click "Run" or "Delegate" to start parallel execution</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Task Assignment</Typography>
          <Typography variant="p" className="mb-3">
            In a plan file, you can assign tasks to specific agents using the assignee syntax:
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Each todo can have an assignee label that matches an agent tab</Typography>
            <Typography variant="p" className="mb-1">• Unassigned todos will be handled by the first available agent</Typography>
            <Typography variant="p">• Dependencies ensure tasks complete in the correct order regardless of assignment</Typography>
          </div>
          <Typography variant="p" className="mt-3">
            <strong>Example:</strong> If you have a plan with research, writing, and review tasks, you could assign research to "Research Agent" and writing to "Writer Agent" to work in parallel.
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Execution Progress Tracking</Typography>
          <Typography variant="p" className="mb-3">
            During parallel execution, you can monitor progress in real-time:
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• <strong>Progress Bar:</strong> Shows overall completion percentage</Typography>
            <Typography variant="p" className="mb-1">• <strong>Active Agents:</strong> See which agents are currently working</Typography>
            <Typography variant="p" className="mb-1">• <strong>Task Status:</strong> Each todo shows pending, in-progress, completed, or failed</Typography>
            <Typography variant="p">• <strong>Real-time Updates:</strong> Status updates as agents complete their work</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Agent Briefings</Typography>
          <Typography variant="p" className="mb-3">
            When parallel execution starts, each assigned agent receives a briefing that includes:
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• The plan title and overview</Typography>
            <Typography variant="p" className="mb-1">• Context about the overall goals</Typography>
            <Typography variant="p" className="mb-1">• Their assigned tasks and dependencies</Typography>
            <Typography variant="p">• Progress updates as other agents complete work</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Stopping Parallel Execution</Typography>
          <Typography variant="p" className="mb-3">
            You can stop parallel execution at any time:
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Click the "Stop" button in the plan viewer</Typography>
            <Typography variant="p" className="mb-1">• All agents will gracefully stop after completing their current task</Typography>
            <Typography variant="p">• Completed todos remain marked as complete; pending todos can be resumed later</Typography>
          </div>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">Best Practices</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• <strong>Keep tasks focused:</strong> Each todo should represent a meaningful unit of work</Typography>
            <Typography variant="p" className="mb-1">• <strong>Use clear dependencies:</strong> Mark dependencies explicitly to avoid conflicts</Typography>
            <Typography variant="p" className="mb-1">• <strong>Balance workload:</strong> Distribute tasks evenly across agents when possible</Typography>
            <Typography variant="p" className="mb-1">• <strong>Monitor progress:</strong> Watch the execution to catch issues early</Typography>
            <Typography variant="p">• <strong>Use descriptive labels:</strong> Name agents based on their role for clarity</Typography>
          </div>
        </div>
      </div>
    </DocPageLayout>
  )
}
