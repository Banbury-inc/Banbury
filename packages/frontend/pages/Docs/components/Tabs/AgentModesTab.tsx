import { Box } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function AgentModesTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          Agent Modes
        </Typography>

        <Typography variant="p" className="mb-4">
          Banbury offers three distinct interaction modes to optimize how the AI assistant works with you. Each mode provides different capabilities and tool access based on your needs.
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Agent Mode (Default)</Typography>
          <Typography variant="p" className="mb-3">
            Agent Mode is the default and most powerful mode. In this mode, Banbury has full access to all enabled tools and can perform comprehensive tasks including reading, writing, and executing actions across your connected services.
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1"><strong>Capabilities:</strong></Typography>
            <Typography variant="list">
              <li>Search the web for information and research</li>
              <li>Read and write documents, spreadsheets, and presentations</li>
              <li>Send emails and manage calendar events</li>
              <li>Create and organize files and folders</li>
              <li>Generate images and videos</li>
              <li>Browse websites and extract information</li>
              <li>Access memory and knowledge graph for context</li>
            </Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            <strong>Best for:</strong> Complex tasks that require multiple actions, content creation, workflow automation, and any work that involves modifying files or sending communications.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Ask Mode (Read-Only)</Typography>
          <Typography variant="p" className="mb-3">
            Ask Mode is a read-only exploration mode designed for research and information gathering. In this mode, Banbury can search and analyze information but cannot make any modifications to your files or systems.
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1"><strong>Available Tools:</strong></Typography>
            <Typography variant="list">
              <li>Web search for current information, news, and documentation</li>
              <li>File search to find relevant documents in your cloud storage</li>
              <li>Memory search for past conversations and stored knowledge</li>
              <li>Analysis and explanation of found information</li>
            </Typography>
          </Box>
          <Box sx={{ pl: 2, mt: 2 }}>
            <Typography variant="p" className="mb-1"><strong>What Ask Mode Cannot Do:</strong></Typography>
            <Typography variant="list">
              <li>Create, edit, or delete files</li>
              <li>Execute code or scripts</li>
              <li>Send emails or messages</li>
              <li>Modify any data or systems</li>
            </Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            <strong>Best for:</strong> Research tasks, exploring topics, finding information across your data, and when you want to understand something without making changes.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Planning Mode</Typography>
          <Typography variant="p" className="mb-3">
            Planning Mode helps you create comprehensive implementation plans before taking action. When enabled, Banbury focuses on understanding your goal and creating a structured plan that can be executed later.
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1"><strong>How It Works:</strong></Typography>
            <Typography variant="p" className="mb-1">1. Describe what you want to accomplish</Typography>
            <Typography variant="p" className="mb-1">2. Banbury researches and analyzes the task</Typography>
            <Typography variant="p" className="mb-1">3. A detailed plan is created with 4-6 actionable todos</Typography>
            <Typography variant="p">4. Review the plan and click "Run" to execute it</Typography>
          </Box>
          <Box sx={{ pl: 2, mt: 2 }}>
            <Typography variant="p" className="mb-1"><strong>Plan Structure:</strong></Typography>
            <Typography variant="list">
              <li><strong>Overview:</strong> Problem statement, goals, success criteria</li>
              <li><strong>Technical Approach:</strong> Architecture, key decisions, technologies</li>
              <li><strong>Implementation Strategy:</strong> Phased approach with clear milestones</li>
              <li><strong>Risk Assessment:</strong> Potential challenges and mitigation strategies</li>
              <li><strong>Todos:</strong> 4-6 specific, actionable tasks with dependencies</li>
            </Typography>
          </Box>
          <Box sx={{ pl: 2, mt: 2 }}>
            <Typography variant="p" className="mb-1"><strong>Available Tools:</strong></Typography>
            <Typography variant="list">
              <li>Web search for research and best practices</li>
              <li>File search to understand existing context</li>
              <li>Memory search for relevant past work</li>
              <li>Plan creation (saves as .plan.md files)</li>
            </Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            <strong>Best for:</strong> Complex projects, multi-step implementations, when you want to review and approve before execution, and collaborative planning with team members.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Switching Between Modes</Typography>
          <Typography variant="p" className="mb-3">
            You can switch between modes using the mode selector in the composer toolbar:
          </Typography>
          <Typography variant="list">
            <li>Click the mode dropdown near the send button</li>
            <li>Select your desired mode (Agent, Ask, or Plan)</li>
            <li>Your selection persists until you change it again</li>
          </Typography>
          <Typography variant="p" className="mt-3">
            <strong>Note:</strong> Plan Mode and Ask Mode cannot be used together. If you enable Plan Mode, it takes precedence and Ask Mode is automatically disabled.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Choosing the Right Mode</Typography>
          <Typography variant="list">
            <li><strong>Use Agent Mode</strong> when you need to complete tasks that involve creating or modifying content</li>
            <li><strong>Use Ask Mode</strong> when researching or exploring without risk of accidental changes</li>
            <li><strong>Use Planning Mode</strong> for complex projects where you want to review the approach before execution</li>
          </Typography>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
