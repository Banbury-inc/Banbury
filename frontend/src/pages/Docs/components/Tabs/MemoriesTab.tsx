import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function MemoriesTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Memories
      </Typography>

      <Typography variant="p" className="mb-4">
        Banbury agents are conceptualized with memories, a feedback system that collects and remembers historical conversations to optimize their responses and behavior.
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">
          Why it matters
        </Typography>
        <Typography variant="muted">
          This systematic approach to gathering and using conversation history allows the agent to continuously evolve, making real-time adjustments to better serve your needs while maintaining a historical record of improvements and trends.
        </Typography>
      </Paper>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">
          Defaults and control
        </Typography>
        <Typography variant="muted">
          By default, Banbury agents do not store conversation history, giving you the choice to enable memory features for your agent.
        </Typography>
      </Paper>

      <Paper
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">
          Architecture
        </Typography>
        <Typography variant="muted" className="mb-2">
          Banbury leverages an advanced knowledge graph structure to organize and interconnect memories, enabling more intelligent retrieval and contextual understanding.
        </Typography>
        <Typography variant="muted">
          Learn more about Agents in Banbury!
        </Typography>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
