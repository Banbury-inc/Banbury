import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PlanViewer } from '../../../frontend/components/MiddlePanel/PlanViewer/PlanViewer'
import { TooltipProvider } from '../../../frontend/components/common/ui/tooltip'
import { ApiService } from '../../../backend/api/apiService'
import { FileSystemItem } from '../../../frontend/utils/fileTreeUtils'

// Mock plan markdown content
const BASIC_PLAN_MARKDOWN = `# Website Redesign Project

## Overview

This plan outlines the complete redesign of our company website to improve user experience and modernize our online presence. The project will involve multiple phases including design, development, content creation, and testing.

## Todos

- [ ] id:todo-1 | Create wireframes and mockups
- [ ] id:todo-2 | Set up development environment
- [ ] id:todo-3 | Implement responsive design (depends: todo-1)
- [ ] id:todo-4 | Create new content pages
- [ ] id:todo-5 | Integrate analytics and tracking
- [ ] id:todo-6 | Perform cross-browser testing (depends: todo-3, todo-4)

## Notes

- Budget: $50,000
- Timeline: 8 weeks
- Key stakeholders: Marketing, Engineering, Design teams
`

const PLAN_WITH_COMPLETED_TASKS = `# Product Launch Plan

## Overview

Comprehensive plan for launching our new product line. Includes marketing, logistics, and customer support preparation.

## Todos

- [x] id:todo-1 | Finalize product specifications
- [x] id:todo-2 | Create marketing materials
- [ ] id:todo-3 | Set up distribution channels
- [ ] id:todo-4 | Train customer support team (depends: todo-3)
- [ ] id:todo-5 | Launch press release

## Notes

- Launch date: Q2 2024
- Target markets: North America, Europe
`

const PLAN_WITH_AGENT_ASSIGNMENTS = `# Data Migration Project

## Overview

Migrate legacy database systems to cloud infrastructure with zero downtime.

## Todos

- [ ] id:todo-1 | Backup existing databases (agent: Chat 1)
- [ ] id:todo-2 | Set up cloud infrastructure (agent: Chat 2)
- [ ] id:todo-3 | Migrate user data (depends: todo-1, todo-2) (agent: Chat 1)
- [ ] id:todo-4 | Migrate product data (depends: todo-1, todo-2) (agent: Chat 2)
- [ ] id:todo-5 | Verify data integrity (depends: todo-3, todo-4)
- [ ] id:todo-6 | Update application connections (depends: todo-5)

## Notes

- Critical: Zero downtime requirement
- Rollback plan must be ready
`

const EMPTY_PLAN_MARKDOWN = `# New Plan

## Overview


## Todos


## Notes

`

// Mock file objects
const MOCK_PLAN_FILE: FileSystemItem = {
  id: 'plan-1',
  file_id: 'plan-1',
  name: 'Website_Redesign.plan.md',
  type: 'file',
  path: '/plans/Website_Redesign.plan.md',
  size: 1200,
  modified: new Date('2024-01-15')
}

const MOCK_PLAN_FILE_COMPLETED: FileSystemItem = {
  id: 'plan-2',
  file_id: 'plan-2',
  name: 'Product_Launch.plan.md',
  type: 'file',
  path: '/plans/Product_Launch.plan.md',
  size: 800,
  modified: new Date('2024-01-20')
}

const MOCK_PLAN_FILE_AGENTS: FileSystemItem = {
  id: 'plan-3',
  file_id: 'plan-3',
  name: 'Data_Migration.plan.md',
  type: 'file',
  path: '/plans/Data_Migration.plan.md',
  size: 1500,
  modified: new Date('2024-01-25')
}

const MOCK_PLAN_FILE_EMPTY: FileSystemItem = {
  id: 'plan-empty',
  file_id: 'plan-empty',
  name: 'New_Plan.plan.md',
  type: 'file',
  path: '/plans/New_Plan.plan.md',
  size: 100,
  modified: new Date('2024-01-30')
}

const MOCK_PLAN_FILE_JSON: FileSystemItem = {
  id: 'plan-json',
  file_id: 'plan-json',
  name: 'Project_Plan.json',
  type: 'file',
  path: '/plans/Project_Plan.json',
  size: 2000,
  modified: new Date('2024-02-01')
}

// Plan states mapping
const planStates: Record<string, string> = {
  'plan-1': BASIC_PLAN_MARKDOWN,
  'plan-2': PLAN_WITH_COMPLETED_TASKS,
  'plan-3': PLAN_WITH_AGENT_ASSIGNMENTS,
  'plan-empty': EMPTY_PLAN_MARKDOWN,
  'plan-json': JSON.stringify({
    id: 'plan-json',
    title: 'API Integration Project',
    overview: 'Integrate third-party APIs for payment processing and shipping.',
    todos: [
      { id: 'todo-1', description: 'Research payment APIs', status: 'completed' },
      { id: 'todo-2', description: 'Set up API credentials', status: 'in_progress' },
      { id: 'todo-3', description: 'Implement payment flow', status: 'pending', depends: ['todo-2'] },
      { id: 'todo-4', description: 'Test integration', status: 'pending', depends: ['todo-3'] }
    ],
    notes: 'Priority: High\nTimeline: 2 weeks',
    status: 'executing',
    createdAt: new Date().toISOString(),
    fileId: 'plan-json'
  }, null, 2)
}

/**
 * Mock implementation of ApiService.downloadFromS3 for plan files
 */
async function mockDownloadPlanFile(
  fileId: string,
  fileName: string
): Promise<{ success: boolean; blob: Blob; url: string; fileName: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Ensure we have valid inputs
  if (!fileId || !fileName) {
    throw new Error('fileId and fileName are required')
  }

  const content = planStates[fileId] || BASIC_PLAN_MARKDOWN
  const mimeType = fileName.endsWith('.json') ? 'application/json' : 'text/markdown'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  return {
    success: true,
    blob,
    url,
    fileName
  }
}

/**
 * Mock implementation of ApiService.Files.updateS3File
 */
async function mockUpdatePlanFile(
  fileId: string,
  blob: Blob,
  fileName: string,
  options?: { file_type?: string }
): Promise<{ success: boolean; message?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // Update the plan state for future loads
  const text = await blob.text()
  if (fileName.endsWith('.json')) {
    planStates[fileId] = text
  } else {
    planStates[fileId] = text
  }

  return { success: true }
}

function PlanViewerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="h-screen w-full bg-background">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof PlanViewer> = {
  title: 'MiddlePanel/PlanViewer',
  component: PlanViewer,
  decorators: [
    (Story: React.ComponentType) => {
      // Mock API services before component renders
      useEffect(() => {
        const originalDownloadFromS3 = ApiService.downloadFromS3
        const originalUpdateS3File = ApiService.Files.updateS3File

        // Override with mocks
        ApiService.downloadFromS3 = mockDownloadPlanFile as any
        ApiService.Files.updateS3File = mockUpdatePlanFile as any

        // Mock window.__banburyAiTabs for agent functionality
        if (typeof window !== 'undefined') {
          ;(window as any).__banburyAiTabs = [
            { id: 'tab-1', label: 'Chat 1', threadId: 'thread-1' },
            { id: 'tab-2', label: 'Chat 2', threadId: 'thread-2' }
          ]
        }

        return () => {
          // Restore originals on cleanup
          ApiService.downloadFromS3 = originalDownloadFromS3
          ApiService.Files.updateS3File = originalUpdateS3File
        }
      }, [])

      return (
        <PlanViewerWrapper>
          <Story />
        </PlanViewerWrapper>
      )
    }
  ],
  args: {
    file: MOCK_PLAN_FILE,
    userInfo: {
      username: 'testuser',
      email: 'test@example.com'
    },
    onSaveComplete: () => {
      // Plan saved callback
    }
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The PlanViewer component displays and manages plan files in markdown or JSON format. Plans consist of a title, overview, todos (tasks), and notes. Features include markdown editing, todo management with status tracking, agent assignment, dependency management, progress tracking, and plan execution.'
      }
    }
  },
  tags: ['autodocs']
}

export default meta

type Story = StoryObj<typeof PlanViewer>

export const BasicPlan: Story = {
  name: '📋 Basic Plan',
  args: {
    file: MOCK_PLAN_FILE
  }
}

export const PlanWithCompletedTasks: Story = {
  name: '✅ Plan With Completed Tasks',
  args: {
    file: MOCK_PLAN_FILE_COMPLETED
  }
}

export const PlanWithAgentAssignments: Story = {
  name: '🤖 Plan With Agent Assignments',
  args: {
    file: MOCK_PLAN_FILE_AGENTS
  }
}

export const EmptyPlan: Story = {
  name: '📝 Empty Plan',
  args: {
    file: MOCK_PLAN_FILE_EMPTY
  }
}

export const JsonPlan: Story = {
  name: '📦 JSON Format Plan',
  args: {
    file: MOCK_PLAN_FILE_JSON
  }
}

export const PlanWithoutUserInfo: Story = {
  name: '👤 Plan Without User Info',
  args: {
    file: MOCK_PLAN_FILE,
    userInfo: null
  }
}
